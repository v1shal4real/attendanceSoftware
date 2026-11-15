import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../data/store'

const links = [
  { to: '/', label: 'Live class' },
  { to: '/students', label: 'Students' },
  { to: '/reports', label: 'Reports' },
]

export default function Layout() {
  const { sessions } = useStore()
  const live = sessions.find((s) => s.end === null)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-bold">Attendance AI</span>
          <nav className="flex gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          {live && (
            <span className="ml-auto flex items-center gap-2 text-sm text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Class in session{live.examMode && ' · Exam mode'}
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
