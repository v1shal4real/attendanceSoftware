import { kioskCheckin, kioskHello, setKioskConnected, type KioskCheckin } from '../data/store'

/** Live feed from kiosk_bridge.py. Override with VITE_KIOSK_URL if the bridge runs elsewhere. */
const KIOSK_URL = import.meta.env.VITE_KIOSK_URL ?? 'http://localhost:8765/events'

interface RawCheckin { name: string; timestamp: string; score: number }

// The bridge writes local time without a zone ("2026-11-19T09:02:11"), which the browser reads as local too.
const parse = (c: RawCheckin): KioskCheckin => ({ name: c.name, timestamp: new Date(c.timestamp).getTime(), score: c.score })

export function connectKiosk() {
  const es = new EventSource(KIOSK_URL) // EventSource reconnects by itself if the bridge restarts
  es.addEventListener('hello', (m) => {
    const d = JSON.parse((m as MessageEvent).data) as { students: string[]; checkins: RawCheckin[] }
    setKioskConnected(true)
    kioskHello(d.students, d.checkins.map(parse))
  })
  es.addEventListener('checkin', (m) => kioskCheckin(parse(JSON.parse((m as MessageEvent).data))))
  es.onerror = () => setKioskConnected(false)
  return es
}
