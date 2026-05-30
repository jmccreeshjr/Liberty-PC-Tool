import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'
import Inbox from './pages/Inbox'

function App() {
  const [user, setUser] = useState(null)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"     element={<Login onLogin={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard   user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
        <Route path="/project/:id" element={user ? <ProjectDetail user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
        <Route path="/inbox"     element={user ? <Inbox       user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
        <Route path="*"          element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
