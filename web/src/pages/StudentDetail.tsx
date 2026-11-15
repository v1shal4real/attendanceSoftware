import { Link, useParams } from 'react-router-dom'
import { useStore } from '../data/store'
import { attendanceScore, fmtDate, fmtTime, summarise } from '../lib/attendance'
import { Card, Stat, StatusBadge } from '../components/ui'

export default function StudentDetail() {
  const { id } = useParams()
  const { students, classes, sessions, events, now } = useStore()
  const student = students.find((s) => s.id === id)
  if (!student) return <p>Student not found. <Link className="underline" to="/students">Back</Link></p>

  const score = attendanceScore(student, sessions, events)
  const history = sessions
    .filter((s) => student.classIds.includes(s.classId))
    .sort((a, b) => b.start - a.start)
    .map((s) => ({ s, sum: summarise(student, s, events, now) }))
  const ended = history.filter((h) => h.s.end !== null)
  const totalOut = ended.reduce((n, h) => n + h.sum.minutesOut, 0)
  const lates = ended.filter((h) => h.sum.status === 'late').length

  return (
    <div className="space-y-6">
      <div>
        <Link to="/students" className="text-sm text-slate-500 hover:underline">← Students</Link>
        <h1 className="text-xl font-bold">{student.name} <span className="text-base font-normal text-slate-500">{student.id}</span></h1>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Attendance score" value={`${score.pct}%`} tone={score.pct >= 80 ? 'green' : score.pct >= 60 ? 'amber' : 'red'} />
        <Stat label="Sessions attended" value={`${score.attended}/${score.total}`} />
        <Stat label="Late arrivals" value={lates} tone="amber" />
        <Stat label="Total time out" value={`${totalOut} min`} tone="blue" />
      </div>
      <Card title="Session history">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr><th className="py-2">Date</th><th>Class</th><th>Status</th><th>Arrived</th><th>Time out</th><th>Flags</th></tr>
            </thead>
            <tbody>
              {history.map(({ s, sum }) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-2"><Link className="hover:underline" to={s.end ? `/reports/${s.id}` : '/'}>{fmtDate(s.start)}</Link></td>
                  <td>{classes.find((c) => c.id === s.classId)?.name}{s.examMode && <span className="ml-1 text-xs text-rose-600">exam</span>}</td>
                  <td><StatusBadge status={sum.status} /></td>
                  <td className="tabular-nums">{fmtTime(sum.arrival)}</td>
                  <td className="tabular-nums">{sum.minutesOut ? `${sum.minutesOut} min` : '—'}</td>
                  <td>{sum.flags.length || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
