'use strict';

/**
 * ioBroker.marstek
 *
 * Behavior:
 * - Polls all supported methods for the selected / auto-detected model group
 * - No overlapping polls
 * - Per-method error handling
 * - Inter-call delay between method calls
 *
 * Changes in this revision:
 * - Avoid double Marstek.GetDevice on startup (auto-detect + first poll)
 * - Default interCallDelayMs to 3000ms if not configured
 */

const utils = require('@iobroker/adapter-core');
const dgram = require('dgram');

class MarstekAdapter extends utils.Adapter {
  constructor(options = {}) {
    super({ ...options, name: 'marstek' });

    this.socket = null;
    this.reqId = 1;
    this.pending = new Map();
    this.pollTimer = null;
    this.pollRunning = false;

    // NEW: used to skip the first Marstek.GetDevice in the first poll cycle
    this.skipGetDeviceOnce = false;

    this.on('ready', this.onReady.bind(this));
    this.on('unload', this.onUnload.bind(this));
  }

  async onReady() {
    const ip = (this.config.ip || '').trim();
    const port = Number(this.config.port || 30000);

    const pollIntervalSec = Math.max(5, Number(this.config.pollIntervalSec || 30));
    const timeoutMs = Math.max(1000, Number(this.config.timeoutMs || 8000));

    // NEW: default to 3000ms if not configured
    const interCallDelayMs = Math.max(0, Number(this.config.interCallDelayMs ?? 3000));

    await this.setObjectNotExistsAsync('info.connection', {
      type: 'state',
      common: { name: 'Connection', type: 'boolean', role: 'indicator.connected', read: true, write: false },
      native: {},
    });

    await this.setObjectNotExistsAsync('device.model', {
      type: 'state',
      common: { name: 'Device model', type: 'string', role: 'text', read: true, write: false },
      native: {},
    });

    await this.setObjectNotExistsAsync('device.modelGroup', {
      type: 'state',
      common: { name: 'Model group (ce/d)', type: 'string', role: 'text', read: true, write: false },
      native: {},
    });

    if (!ip) {
      this.log.error('No IP configured. Please set the device IP in the instance settings.');
      await this.setStateAsync('info.connection', false, true);
      return;
    }

    // UDP Socket
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.socket.on('message', (msg) => {
      let data;
      try {
        data = JSON.parse(msg.toString('utf8'));
      } catch (e) {
        this.log.debug(`Non-JSON UDP message ignored: ${msg.toString('utf8')}`);
        return;
      }

      const id = data && data.id;
      if (!id || !this.pending.has(id)) return;

      const p = this.pending.get(id);
      clearTimeout(p.timer);
      this.pending.delete(id);

      if (data.error) p.reject(new Error(`${data.error.code}: ${data.error.message}`));
      else p.resolve(data);
    });

    this.socket.on('error', (err) => {
      this.log.warn(`UDP socket error: ${err.code || ''} ${err.message}`);
    });

    // bind random local port
    await new Promise((resolve) => {
      this.socket.once('listening', () => {
        const a = this.socket.address();
        this.log.info(`UDP bound to ${a.address}:${a.port}`);
        resolve();
      });
      this.socket.bind(0);
    });

    // Determine model group (auto)
    let modelGroup = this.config.modelGroup || 'auto';
    let deviceModel = '';

    if (modelGroup === 'auto') {
      try {
        const t0 = Date.now();
        const resp = await this.call(ip, port, 'Marstek.GetDevice', { ble_mac: '0' }, timeoutMs);
        const dt = Date.now() - t0;

        this.log.debug(`Marstek.GetDevice OK (${dt} ms)`);
        deviceModel = resp?.result?.device || '';
        await this.setStateAsync('device.model', deviceModel, true);

        if (deviceModel.toLowerCase().includes('venusd')) modelGroup = 'd';
        else modelGroup = 'ce';

        await this.setStateAsync('device.modelGroup', modelGroup, true);

        // NEW: we already called Marstek.GetDevice for auto-detection,
        // so skip it once in the first poll cycle to avoid double call at startup.
        this.skipGetDeviceOnce = true;
      } catch (e) {
        this.log.warn(`Model detection failed, falling back to "ce": ${e.message}`);
        modelGroup = 'ce';
        await this.setStateAsync('device.model', deviceModel, true);
        await this.setStateAsync('device.modelGroup', modelGroup, true);
      }
    } else {
      await this.setStateAsync('device.model', deviceModel, true);
      await this.setStateAsync('device.modelGroup', modelGroup, true);
    }

    const methods = this.getSupportedMethods(modelGroup);

    const poll = async () => {
      if (this.pollRunning) {
        this.log.debug('Poll skipped (previous poll still running)');
        return;
      }
      this.pollRunning = true;

      try {
        let okCount = 0;

        for (const m of methods) {
          // NEW: skip Marstek.GetDevice once on first poll cycle if already called during auto-detect
          if (this.skipGetDeviceOnce && m.method === 'Marstek.GetDevice') {
            this.skipGetDeviceOnce = false;
            continue;
          }

          const t0 = Date.now();
          try {
            const resp = await this.call(ip, port, m.method, m.params, timeoutMs);
            const dt = Date.now() - t0;

            this.log.debug(`${m.method} OK (${dt} ms)`);
            await this.ingestResult(m.channel, resp?.result ?? {});
            okCount++;
          } catch (e) {
            const dt = Date.now() - t0;
            this.log.debug(`${m.method} FAILED (${dt} ms): ${e.message}`);
          }

          if (interCallDelayMs > 0) await this.sleep(interCallDelayMs);
        }

        await this.setStateAsync('info.connection', okCount > 0, true);
      } finally {
        this.pollRunning = false;
      }
    };

    // first poll immediately
    await poll();
    this.pollTimer = setInterval(poll, pollIntervalSec * 1000);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getSupportedMethods(modelGroup) {
    const base = [
      { channel: 'marstek', method: 'Marstek.GetDevice', params: { ble_mac: '0' } },
      { channel: 'wifi', method: 'Wifi.GetStatus', params: { id: 0 } },
      { channel: 'ble', method: 'BLE.GetStatus', params: { id: 0 } },
      { channel: 'battery', method: 'Bat.GetStatus', params: { id: 0 } },
      { channel: 'es', method: 'ES.GetStatus', params: { id: 0 } },
      { channel: 'em', method: 'EM.GetStatus', params: { id: 0 } },
    ];

    // Venus D has PV
    if (modelGroup === 'd') {
      base.splice(4, 0, { channel: 'pv', method: 'PV.GetStatus', params: { id: 0 } });
    }

    return base;
  }

  async ingestResult(root, result) {
    await this.setObjectNotExistsAsync(root, { type: 'channel', common: { name: root }, native: {} });
    await this.walkAndUpsert(root, result);
  }

  async walkAndUpsert(path, value) {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      await this.setObjectNotExistsAsync(path, { type: 'channel', common: { name: this.leafName(path) }, native: {} });
      for (let i = 0; i < value.length; i++) {
        await this.walkAndUpsert(`${path}.${i}`, value[i]);
      }
      return;
    }

    if (typeof value === 'object') {
      await this.setObjectNotExistsAsync(path, { type: 'channel', common: { name: this.leafName(path) }, native: {} });
      for (const [k, v] of Object.entries(value)) {
        await this.walkAndUpsert(`${path}.${this.sanitizeId(k)}`, v);
      }
      return;
    }

    const common = this.deriveCommon(path, value);
    await this.setObjectNotExistsAsync(path, { type: 'state', common, native: {} });

    let stateVal = value;
    if (common.type === 'number') stateVal = Number(value);
    await this.setStateAsync(path, stateVal, true);
  }

  deriveCommon(path, value) {
    const key = this.leafName(path).toLowerCase();

    let type = typeof value;
    if (type === 'boolean') type = 'boolean';
    else if (type === 'number') type = 'number';
    else type = 'string';

    if (type === 'string' && this.looksNumeric(value)) type = 'number';

    const { role, unit } = this.deriveRoleUnit(key, type);
    return { name: this.leafName(path), type, role, unit, read: true, write: false };
  }

  deriveRoleUnit(key, type) {
    if (key.includes('soc')) return { role: 'value.battery', unit: '%' };
    if (key.includes('rssi')) return { role: 'value.signal', unit: 'dBm' };
    if (key.includes('temp')) return { role: 'value.temperature', unit: '°C' };
    if (key.includes('power')) return { role: 'value.power', unit: 'W' };
    if (key.includes('voltage')) return { role: 'value.voltage', unit: 'V' };
    if (key.includes('current')) return { role: 'value.current', unit: 'A' };
    if (key.includes('energy')) return { role: 'value.energy', unit: 'Wh' };

    if (type === 'boolean') return { role: 'indicator', unit: undefined };
    if (type === 'number') return { role: 'value', unit: undefined };
    return { role: 'text', unit: undefined };
  }

  looksNumeric(v) {
    if (typeof v !== 'string') return false;
    return /^-?\d+(\.\d+)?$/.test(v.trim());
  }

  sanitizeId(s) {
    return String(s).trim().replace(/[^\w\d]+/g, '_').replace(/^_+|_+$/g, '');
  }

  leafName(path) {
    const parts = String(path).split('.');
    return parts[parts.length - 1];
  }

  call(ip, port, method, params, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
      const id = this.reqId++;
      const payload = Buffer.from(JSON.stringify({ id, method, params }), 'utf8');

      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timeout calling ${method}`));
      }, timeoutMs);

      this.pending.set(id, { resolve: (data) => resolve(data), reject, timer });

      this.socket.send(payload, port, ip, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  onUnload(callback) {
    try {
      if (this.pollTimer) clearInterval(this.pollTimer);
      if (this.socket) this.socket.close();
      callback();
    } catch {
      callback();
    }
  }
}

if (module.parent) {
  module.exports = (options) => new MarstekAdapter(options);
} else {
  // eslint-disable-next-line no-new
  new MarstekAdapter();
}
