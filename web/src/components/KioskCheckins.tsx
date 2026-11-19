import { useStore } from '../data/store'
import { fmtDate } from '../lib/attendance'
import { Card } from './ui'

const fmtClock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** Live list of face check-ins from the kiosk, newest first. */
export default function KioskCheckins() {
  const { kioskConnected, kioskCheckins } = useStore()
  const list = [...kioskCheckins].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <Card
      title="Kiosk check-ins today"
      action={
        <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${kioskConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${kioskConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {kioskConnected ? 'Kiosk connected' : 'Kiosk offline'}
        </span>
      }
    >
      {!kioskConnected && list.length === 0 ? (
        <p className="text-sm text-slate-500">Start <code>kiosk_bridge.py</code> on this laptop to see face check-ins here.</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-500">No one has checked in yet today.</p>
      ) : (
        <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
          {list.map((c) => (
            <li key={`${c.name}-${c.timestamp}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="font-medium">{c.name}</span>
              <span className="text-right tabular-nums text-slate-600">
                {fmtClock(c.timestamp)} · {fmtDate(c.timestamp)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
