![Logo](admin/marstek.png)

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
