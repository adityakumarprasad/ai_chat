import React from 'react'
import { Link, Route, Routes, BrowserRouter, useLocation } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import UserAuth from '../auth/UserAuth'

const AppShell = ({ children }) => {
  const location = useLocation()
  const isWorkspacePage = location.pathname === '/project'

  if (isWorkspacePage) {
    return children
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(145deg,#04111d_0%,#0b1f33_45%,#050816_100%)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 shadow-[0_0_35px_rgba(34,211,238,0.3)] ring-1 ring-cyan-300/30">
              <i className="ri-bubble-chart-line text-2xl text-cyan-300 app-float"></i>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-200/70">Realtime Studio</p>
              <h1 className="text-2xl font-black tracking-[0.2em] text-white">Collab-Ai</h1>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
            <Link to="/" className="transition hover:text-cyan-300">Dashboard</Link>
            <Link to="/login" className="transition hover:text-cyan-300">Login</Link>
            <Link to="/register" className="rounded-full border border-cyan-300/30 px-4 py-2 transition hover:border-cyan-300 hover:bg-cyan-300/10 hover:text-cyan-200">
              Start Free
            </Link>
          </nav>
        </div>
      </header>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.12),transparent)] app-scan"></div>
        {children}
      </div>
      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-center text-sm text-slate-300 md:flex-row md:text-left">
          <div>
            <p className="text-base font-semibold tracking-[0.25em] text-cyan-200">Collab-Ai</p>
            <p className="text-slate-400">Build together, ship faster, stay synced.</p>
          </div>
          <p className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-2 text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.12)]">
            2026 rights reversed
          </p>
        </div>
      </footer>
    </div>
  )
}

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<UserAuth> <Home /> </UserAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/project" element={<UserAuth> <Project /> </UserAuth>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

export default AppRoutes
