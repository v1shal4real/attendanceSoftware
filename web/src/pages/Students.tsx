import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { attendanceScore } from '../lib/attendance'
import { Card, ScoreBar } from '../components/ui'

export default function Students() {
  const { students, classes, sessions, events } = useStore()
  const [q, setQ] = useState('')
  const rows = students
    .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))
    .map((s) => ({ s, score: attendanceScore(s, sessions, events) }))
    .sort((a, b) => a.score.pct - b.score.pct)

  return (
    <Card
      title="Students · overall attendance"
      action={<input className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} />}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr><th className="py-2">ID</th><th>Name</th><th>Classes</th><th>Attended</th><th>Score</th></tr>
          </thead>
          <tbody>
            {rows.map(({ s, score }) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="py-2 text-slate-500">{s.id}</td>
                <td><Link className="font-medium hover:underline" to={`/students/${s.id}`}>{s.name}</Link></td>
                <td className="text-slate-600">{s.classIds.map((id) => classes.find((c) => c.id === id)?.name.split(' ')[0]).join(', ')}</td>
                <td className="tabular-nums">{score.attended}/{score.total}</td>
                <td><ScoreBar pct={score.pct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">Sorted lowest score first, so students needing follow-up are at the top.</p>
    </Card>
  )
}
