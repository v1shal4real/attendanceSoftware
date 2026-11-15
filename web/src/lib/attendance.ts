import type { AttendanceEvent, Session, Student, StudentSessionSummary } from '../types'

export const LATE_AFTER_MIN = 10
const MIN = 60_000

/** Turn raw events into attendance for one student in one session. */
export function summarise(
  student: Student,
  session: Session,
  events: AttendanceEvent[],
  now: number,
): StudentSessionSummary {
  const mine = events
    .filter((e) => e.sessionId === session.id && e.studentId === student.id)
    .sort((a, b) => a.timestamp - b.timestamp)

  let arrival: number | null = null
  let inRoom = false
  let outSince: number | null = null
  let msOut = 0
  let timesOut = 0
  const flags: AttendanceEvent[] = []

  for (const e of mine) {
    if (e.type === 'enter' && !inRoom) {
      if (arrival === null) arrival = e.timestamp
      if (outSince !== null) msOut += e.timestamp - outSince
      outSince = null
      inRoom = true
    } else if (e.type === 'exit' && inRoom) {
      inRoom = false
      outSince = e.timestamp
      timesOut++
    } else if (e.type === 'flag') {
      flags.push(e)
    }
  }
  const endTime = session.end ?? now
  if (outSince !== null) msOut += endTime - outSince

  let status: StudentSessionSummary['status'] = 'absent'
  if (arrival !== null) {
    if (!inRoom && session.end === null) status = 'out'
    else if (arrival - session.start > LATE_AFTER_MIN * MIN) status = 'late'
    else status = 'present'
  }

  return { studentId: student.id, status, arrival, minutesOut: Math.round(msOut / MIN), timesOut, flags }
}

/** Overall attendance score: % of the student's ended sessions they attended. */
export function attendanceScore(
  student: Student,
  sessions: Session[],
  events: AttendanceEvent[],
): { attended: number; total: number; pct: number } {
  const relevant = sessions.filter((s) => s.end !== null && student.classIds.includes(s.classId))
  const attended = relevant.filter(
    (s) => summarise(student, s, events, s.end!).status !== 'absent',
  ).length
  const total = relevant.length
  return { attended, total, pct: total ? Math.round((attended / total) * 100) : 100 }
}

export const fmtTime = (ts: number | null) =>
  ts === null ? '—' : new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })

export const behaviourLabel: Record<string, string> = {
  looking_away: 'Looking away',
  talking: 'Talking',
  phone_detected: 'Phone detected',
  left_seat: 'Left seat',
}
