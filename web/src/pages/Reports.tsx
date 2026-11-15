import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { fmtDate, fmtTime, summarise } from '../lib/attendance'
import { Card, ScoreBar } from '../components/ui'

export default function Reports() {
  const { students, classes, sessions, events } = useStore()
  const ended = sessions.filter((s) => s.end !== null).sort((a, b) => b.start - a.start)

  return (
    <Card title="End-of-class reports">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr><th className="py-2">Date</th><th>Class</th><th>Time</th><th>Attendance</th><th></th></tr>
          </thead>
          <tbody>
            {ended.map((s) => {
              const roster = students.filter((st) => st.classIds.includes(s.classId))
              const present = roster.filter((st) => summarise(st, s, events, s.end!).status !== 'absent').length
              return (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-2">{fmtDate(s.start)}</td>
                  <td>{classes.find((c) => c.id === s.classId)?.name}{s.examMode && <span className="ml-1 text-xs text-rose-600">exam</span>}</td>
                  <td className="tabular-nums">{fmtTime(s.start)}–{fmtTime(s.end)}</td>
                  <td><ScoreBar pct={roster.length ? Math.round((present / roster.length) * 100) : 0} /></td>
                  <td><Link className="text-sky-700 hover:underline" to={`/reports/${s.id}`}>View</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
