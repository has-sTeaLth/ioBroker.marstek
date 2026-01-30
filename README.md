![Logo](admin/marstek.png)

# ioBroker.marstek

ioBroker adapter for **Marstek Venus** devices using the **Open API (UDP JSON-RPC)**.

The adapter polls the device periodically, automatically creates all available data points, and structures them based on the API responses.

Supported components include:
- Marstek (device info)
- WiFi
- BLE
- Battery
- ES
- EM  
- PV (only for Venus D models)

---

## Configuration

Configure the adapter instance in the ioBroker admin interface.

### Device settings
- **Device IP**  
  IP address of the Marstek Venus device in your local network.

- **UDP Port**  
  Default: `30000`

- **Model group**
  - **Auto** (default, recommended)  
    Automatically detects *Venus D*, otherwise uses *Venus C / E*.
  - **Venus C / E**  
    Without PV component.
  - **Venus D**  
    Includes PV component.

### Polling settings
- **Poll interval (sec)**  
  Interval for polling the device (e.g. `30`).

- **UDP timeout (ms)**  
  Timeout per request (e.g. `8000`).

- **Inter-call delay (ms)**  
  Delay between individual API calls (e.g. `200`).  
  Increasing this value can improve stability on some firmware versions.

---

## Notes

- All available data points are created automatically.
- Objects are read-only.
- If `Bat.GetStatus` occasionally times out, increase **Inter-call delay** to `220–250 ms`.

## Changelog

<!--
  Placeholder for the next version (at the beginning of the line):
  ### **WORK IN PROGRESS**
-->
### 0.0.1-alpha (2026-01-30) Initial release

## License

The MIT License (MIT)


Copyright (c) 2026 iobroker-community-adapters <iobroker-community-adapters@gmx.de>  
Copyright (c) 2018-2025 Thorsten Stueben <thorsten@stueben.de>,
                        Apollon77 <iobroker@fischer-ka.de> and
                        Matthias Kleine <info@haus-automatisierung.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
