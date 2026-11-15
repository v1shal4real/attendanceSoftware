import { Link, useParams } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../data/store'
import { behaviourLabel, fmtDate, fmtTime, summarise } from '../lib/attendance'
import { Card, Stat, StatusBadge } from '../components/ui'

export default function SessionReport() {
  const { id } = useParams()
  const { students, classes, sessions, events } = useStore()
  const session = sessions.find((s) => s.id === id)
  if (!session || session.end === null) return <p>Report not available. <Link className="underline" to="/reports">Back</Link></p>

  const cls = classes.find((c) => c.id === session.classId)!
  const rows = students
    .filter((s) => s.classIds.includes(session.classId))
    .map((s) => ({ s, sum: summarise(s, session, events, session.end!) }))
  const attended = rows.filter((r) => r.sum.status !== 'absent')
  const late = rows.filter((r) => r.sum.status === 'late')
  const absent = rows.filter((r) => r.sum.status === 'absent')
  const leftRoom = rows.filter((r) => r.sum.timesOut > 0).sort((a, b) => b.sum.minutesOut - a.sum.minutesOut)
  const flags = rows.flatMap((r) => r.sum.flags.map((f) => ({ f, name: r.s.name })))

  // arrivals per 5-minute bucket
  const buckets: Record<string, number> = {}
  for (const r of attended) {
    const m = Math.max(0, Math.floor((r.sum.arrival! - session.start) / 60_000 / 5) * 5)
    buckets[m] = (buckets[m] ?? 0) + 1
  }
  const chart = Object.entries(buckets).map(([m, n]) => ({ min: `+${m}m`, students: n })).sort((a, b) => parseInt(a.min.slice(1)) - parseInt(b.min.slice(1)))

  return (
    <div className="space-y-6">
      <div>
        <Link to="/reports" className="text-sm text-slate-500 hover:underline">← Reports</Link>
        <h1 className="text-xl font-bold">{cls.name}</h1>
        <p className="text-sm text-slate-500">{fmtDate(session.start)} · {fmtTime(session.start)}–{fmtTime(session.end)}{session.examMode && ' · Exam mode'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Attendance" value={`${Math.round((attended.length / rows.length) * 100)}%`} tone="green" />
        <Stat label="Attended" value={`${attended.length}/${rows.length}`} />
        <Stat label="Late" value={late.length} tone="amber" />
        <Stat label="Left the room" value={leftRoom.length} tone="blue" />
        <Stat label="Behaviour flags" value={session.examMode ? flags.length : '—'} tone="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Arrival times">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="min" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} width={24} />
                <Tooltip />
                <Bar dataKey="students" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Whereabouts: time out of class">
          {leftRoom.length === 0 ? <p className="text-sm text-slate-500">Nobody left the room.</p> : (
            <ul className="space-y-1 text-sm">
              {leftRoom.map(({ s, sum }) => (
                <li key={s.id} className="flex justify-between border-b border-slate-100 py-1">
                  <Link className="hover:underline" to={`/students/${s.id}`}>{s.name}</Link>
                  <span className="tabular-nums text-slate-600">{sum.minutesOut} min · {sum.timesOut}×</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Absent (${absent.length})`}>
          {absent.length === 0 ? <p className="text-sm text-slate-500">Full attendance.</p> : (
            <div className="flex flex-wrap gap-2">
              {absent.map(({ s }) => <Link key={s.id} to={`/students/${s.id}`} className="rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-700 hover:underline">{s.name}</Link>)}
            </div>
          )}
        </Card>
        {session.examMode && (
          <Card title="Exam behaviour flags">
            {flags.length === 0 ? <p className="text-sm text-slate-500">No flags.</p> : (
              <ul className="space-y-1 text-sm">
                {flags.map(({ f, name }) => (
                  <li key={f.id} className="flex justify-between border-b border-slate-100 py-1">
                    <span>{name}</span>
                    <span className="text-rose-700">{behaviourLabel[f.behaviour!]} · {fmtTime(f.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <Card title="Full roster">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr><th className="py-2">Student</th><th>Status</th><th>Arrived</th><th>Time out</th></tr>
            </thead>
            <tbody>
              {rows.map(({ s, sum }) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-2">{s.name}</td>
                  <td><StatusBadge status={sum.status} /></td>
                  <td className="tabular-nums">{fmtTime(sum.arrival)}</td>
                  <td className="tabular-nums">{sum.minutesOut ? `${sum.minutesOut} min` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
