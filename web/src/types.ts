// Core data model. The camera/AI pipeline only needs to produce `AttendanceEvent`s.

export interface Student {
  id: string
  name: string
  classIds: string[]
}

export interface ClassGroup {
  id: string
  name: string
}

export interface Session {
  id: string
  classId: string
  start: number // epoch ms
  end: number | null // null = still running
  examMode: boolean
}

export type EventType = 'enter' | 'exit' | 'flag'

export type Behaviour = 'looking_away' | 'talking' | 'phone_detected' | 'left_seat'

/** The contract between the camera system and this app. */
export interface AttendanceEvent {
  id: string
  type: EventType
  studentId: string
  sessionId: string
  timestamp: number // epoch ms
  confidence: number // 0..1 from the recognition model
  behaviour?: Behaviour // only for type === 'flag'
}

export type Status = 'present' | 'late' | 'out' | 'absent'

/** Derived per student per session. */
export interface StudentSessionSummary {
  studentId: string
  status: Status
  arrival: number | null
  minutesOut: number
  timesOut: number
  flags: AttendanceEvent[]
}
