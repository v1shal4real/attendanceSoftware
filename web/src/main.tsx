import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import LiveClass from './pages/LiveClass'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Reports from './pages/Reports'
import SessionReport from './pages/SessionReport'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LiveClass />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<SessionReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
