# ioBroker.marstek

ioBroker Adapter für Marstek **Venus** Geräte über die **Open API (UDP JSON-RPC)**.

Der Adapter fragt zyklisch Status-Komponenten ab (u.a. **Marstek**, **WiFi**, **BLE**, **Battery**, **ES**, **EM** – bei Modellgruppe *Venus D* zusätzlich **PV**) und erstellt die Datenpunkte automatisch und strukturiert anhand der API-Antworten.

## Konfiguration

In der Adapter-Instanz:

- **Device IP**: IP-Adresse des Venus-Geräts im LAN
- **UDP Port**: Standard `30000`
- **Model group**:
  - **Auto** (Default, empfohlen): erkennt *Venus D* automatisch, sonst *Venus C/E*
  - **Venus C / E**: ohne PV
  - **Venus D**: mit PV
- **Poll interval (sec)**: Abfrageintervall (z.B. `15`)
- **UDP timeout (ms)**: Timeout pro Request (z.B. `8000`)
- **Inter-call delay (ms)**: Pause zwischen einzelnen Requests (z.B. `150`) – erhöht die Stabilität bei manchen Firmwares

Tipp: Wenn `Bat.GetStatus` sporadisch Timeouts liefert, den **Inter-call delay** auf `180–220 ms` erhöhen.
