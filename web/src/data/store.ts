import { useSyncExternalStore } from 'react'
import type { AttendanceEvent, Behaviour, ClassGroup, Session, Student } from '../types'

/**
 * In-memory store + camera simulator.
 * Later, swap this for a real backend (e.g. Supabase): keep `ingestEvent` as the
 * single entry point the camera pipeline calls, and the UI won't need to change.
 */

interface State {
  students: Student[]
  classes: ClassGroup[]
  sessions: Session[]
  events: AttendanceEvent[]
  now: number // simulated clock
}

const MIN = 60_000
const NAMES = [
  'Aisha Rahman', 'Benjamin Tan', 'Chloe Lim', 'Daniel Ong', 'Elena Goh', 'Farhan Ismail',
  'Grace Chua', 'Harith Aziz', 'Isabel Koh', 'Jun Wei Lee', 'Kavya Nair', 'Lucas Teo',
  'Maya Sim', 'Nathan Yeo', 'Olivia Ng', 'Priya Menon', 'Qi Hui Low', 'Ryan Chen',
]
const BEHAVIOURS: Behaviour[] = ['looking_away', 'talking', 'phone_detected', 'left_seat']

let idCounter = 0
const uid = (p: string) => `${p}${++idCounter}`
const rand = (p: number) => Math.random() < p

function seed(): State {
  const classes: ClassGroup[] = [
    { id: 'C1', name: '10.020 Data Driven World' },
    { id: 'C2', name: '10.014 Computational Thinking' },
  ]
  const students: Student[] = NAMES.map((name, i) => ({
    id: `S${String(i + 1).padStart(3, '0')}`,
    name,
    // even → C1, odd → C2, every 3rd student takes both
    classIds: i % 3 === 0 ? ['C1', 'C2'] : [i % 2 === 0 ? 'C1' : 'C2'],
  }))

  // Generate past sessions so attendance scores have history.
  const sessions: Session[] = []
  const events: AttendanceEvent[] = []
  const today = new Date()
  today.setHours(9, 0, 0, 0)
  for (let d = 14; d >= 1; d--) {
    for (const c of classes) {
      if (rand(0.3)) continue
      const start = today.getTime() - d * 24 * 60 * MIN + (c.id === 'C2' ? 3 * 60 * MIN : 0)
      const s: Session = { id: uid('X'), classId: c.id, start, end: start + 90 * MIN, examMode: rand(0.15) }
      sessions.push(s)
      for (const st of students.filter((x) => x.classIds.includes(c.id))) {
        const reliability = 0.7 + (parseInt(st.id.slice(1)) % 4) * 0.08
        if (!rand(reliability)) continue
        const arrive = start + (rand(0.2) ? 10 + Math.random() * 20 : Math.random() * 8) * MIN
        events.push(ev('enter', st.id, s.id, arrive))
        if (rand(0.3)) {
          const out = arrive + (20 + Math.random() * 40) * MIN
          events.push(ev('exit', st.id, s.id, out))
          events.push(ev('enter', st.id, s.id, out + (3 + Math.random() * 12) * MIN))
        }
        if (s.examMode && rand(0.15)) {
          events.push(ev('flag', st.id, s.id, arrive + 30 * MIN, BEHAVIOURS[Math.floor(Math.random() * 4)]))
        }
      }
    }
  }
  return { students, classes, sessions, events, now: Date.now() }
}

function ev(type: AttendanceEvent['type'], studentId: string, sessionId: string, timestamp: number, behaviour?: Behaviour): AttendanceEvent {
  return { id: uid('E'), type, studentId, sessionId, timestamp, confidence: 0.85 + Math.random() * 0.15, behaviour }
}

// ---- store plumbing ----
let state = seed()
const listeners = new Set<() => void>()
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const useStore = () => useSyncExternalStore(subscribe, () => state)

// ---- actions ----

/** Entry point for the camera / AI pipeline. */
export function ingestEvent(e: Omit<AttendanceEvent, 'id'>) {
  set({ events: [...state.events, { ...e, id: uid('E') }] })
}

export const liveSession = () => state.sessions.find((s) => s.end === null) ?? null

export function startSession(classId: string, examMode = false) {
  if (liveSession()) return
  const now = Date.now()
  set({ now, sessions: [...state.sessions, { id: uid('L'), classId, start: now, end: null, examMode }] })
  startSimulator()
}

export function endSession() {
  const live = liveSession()
  if (!live) return
  stopSimulator()
  set({ sessions: state.sessions.map((s) => (s.id === live.id ? { ...s, end: state.now } : s)) })
  return live.id
}

export function toggleExamMode() {
  const live = liveSession()
  if (!live) return
  set({ sessions: state.sessions.map((s) => (s.id === live.id ? { ...s, examMode: !s.examMode } : s)) })
}

// ---- camera simulator: 1 real second = 1 simulated minute ----
let timer: ReturnType<typeof setInterval> | null = null

function startSimulator() {
  stopSimulator()
  timer = setInterval(tick, 1000)
}
function stopSimulator() {
  if (timer) clearInterval(timer)
  timer = null
}

function tick() {
  const live = liveSession()
  if (!live) return stopSimulator()
  const now = state.now + MIN
  set({ now })
  const elapsedMin = (now - live.start) / MIN
  const roster = state.students.filter((s) => s.classIds.includes(live.classId))

  for (const st of roster) {
    const mine = state.events.filter((e) => e.sessionId === live.id && e.studentId === st.id && e.type !== 'flag')
    const last = mine[mine.length - 1]
    const ts = now - Math.random() * MIN
    if (!last) {
      // not yet arrived: most arrive early, a few late, some never
      const p = elapsedMin < 8 ? 0.25 : elapsedMin < 25 ? 0.04 : 0
      if (rand(p)) ingestEvent({ type: 'enter', studentId: st.id, sessionId: live.id, timestamp: ts, confidence: 0.9 })
    } else if (last.type === 'enter') {
      if (rand(0.015)) ingestEvent({ type: 'exit', studentId: st.id, sessionId: live.id, timestamp: ts, confidence: 0.9 })
      else if (live.examMode && rand(0.01)) {
        const behaviour = BEHAVIOURS[Math.floor(Math.random() * BEHAVIOURS.length)]
        ingestEvent({ type: 'flag', studentId: st.id, sessionId: live.id, timestamp: ts, confidence: 0.7 + Math.random() * 0.3, behaviour })
      }
    } else if (last.type === 'exit' && rand(0.2)) {
      ingestEvent({ type: 'enter', studentId: st.id, sessionId: live.id, timestamp: ts, confidence: 0.9 })
    }
  }
}
