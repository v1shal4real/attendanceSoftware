import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { endSession, startSession, toggleExamMode, useStore } from '../data/store'
import { behaviourLabel, fmtTime, summarise } from '../lib/attendance'
import KioskCheckins from '../components/KioskCheckins'
import { Card, Stat, StatusBadge, btnPrimary, btnSecondary } from '../components/ui'

export default function LiveClass() {
  const { students, classes, sessions, events, now, kioskConnected } = useStore()
  const navigate = useNavigate()
  const [classId, setClassId] = useState(classes[0].id)
  const [exam, setExam] = useState(false)
  const live = sessions.find((s) => s.end === null)

  if (!live) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <Card title="Start a class">
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-slate-600">Class</span>
              <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={exam} onChange={(e) => setExam(e.target.checked)} />
              Exam mode (track behaviour)
            </label>
            <button className={`${btnPrimary} w-full`} onClick={() => startSession(classId, exam)}>Start class</button>
            <p className="text-xs text-slate-500">
              {kioskConnected
                ? 'Kiosk connected: face check-ins from the last 30 minutes count toward this class.'
                : 'No kiosk connected, so a simulator generates events (1 second = 1 minute of class).'}
            </p>
          </div>
        </Card>
        <KioskCheckins />
      </div>
    )
  }

  const cls = classes.find((c) => c.id === live.classId)!
  const roster = students.filter((s) => s.classIds.includes(live.classId))
  const rows = roster.map((s) => ({ s, sum: summarise(s, live, events, now) }))
  const count = (st: string) => rows.filter((r) => r.sum.status === st).length
  const flags = events
    .filter((e) => e.sessionId === live.id && e.type === 'flag')
    .sort((a, b) => b.timestamp - a.timestamp)
  const elapsed = Math.round((now - live.start) / 60_000)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{cls.name}</h1>
          <p className="text-sm text-slate-500">Started {fmtTime(live.start)} · {elapsed} min elapsed</p>
        </div>
        <div className="flex gap-2">
          <button className={btnSecondary} onClick={toggleExamMode}>
            {live.examMode ? 'Disable exam mode' : 'Enable exam mode'}
          </button>
          <button className={btnPrimary} onClick={() => { const id = endSession(); if (id) navigate(`/reports/${id}`) }}>
            End class & view report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="In class" value={`${count('present') + count('late')}/${roster.length}`} tone="green" />
        <Stat label="Late" value={count('late')} tone="amber" />
        <Stat label="Out of class" value={count('out')} tone="blue" />
        <Stat label="Absent" value={count('absent')} tone="red" />
        <Stat label="Exam flags" value={live.examMode ? flags.length : '—'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Current attendance">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr><th className="py-2">Student</th><th>Status</th><th>Arrived</th><th>Time out</th></tr>
                </thead>
                <tbody>
                  {rows.map(({ s, sum }) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="py-2"><Link className="hover:underline" to={`/students/${s.id}`}>{s.name}</Link></td>
                      <td><StatusBadge status={sum.status} /></td>
                      <td className="tabular-nums">{fmtTime(sum.arrival)}</td>
                      <td className="tabular-nums">{sum.minutesOut ? `${sum.minutesOut} min (${sum.timesOut}×)` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
        <KioskCheckins />
        <Card title="Exam mode alerts">
          {!live.examMode ? (
            <p className="text-sm text-slate-500">Exam mode is off. Enable it to track student behaviour.</p>
          ) : flags.length === 0 ? (
            <p className="text-sm text-slate-500">No behaviour flagged yet.</p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {flags.map((f) => (
                <li key={f.id} className="rounded-lg bg-rose-50 px-3 py-2 text-sm">
                  <div className="font-medium">{students.find((s) => s.id === f.studentId)?.name}</div>
                  <div className="text-rose-700">{behaviourLabel[f.behaviour!]} · {Math.round(f.confidence * 100)}% conf · {fmtTime(f.timestamp)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>
      </div>
    </div>
  )
}
