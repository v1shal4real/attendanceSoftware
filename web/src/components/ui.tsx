import type { ReactNode } from 'react'
import type { Status } from '../types'

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-semibold text-slate-800">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, tone = 'slate' }: { label: string; value: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: 'text-slate-900', green: 'text-emerald-600', amber: 'text-amber-600',
    red: 'text-rose-600', blue: 'text-sky-600',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  )
}

const statusStyle: Record<Status, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  late: 'bg-amber-100 text-amber-700',
  out: 'bg-sky-100 text-sky-700',
  absent: 'bg-rose-100 text-rose-700',
}
export function StatusBadge({ status }: { status: Status }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyle[status]}`}>{status === 'out' ? 'Out of class' : status}</span>
}

export function ScoreBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-sm tabular-nums text-slate-700">{pct}%</span>
    </div>
  )
}

export const btn = 'rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50'
export const btnPrimary = `${btn} bg-slate-900 text-white hover:bg-slate-700`
export const btnSecondary = `${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`
