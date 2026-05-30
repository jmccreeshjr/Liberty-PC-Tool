import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const USERS = [
  // Project Coordinator
  { username: 'jmccreesh',    password: 'liberty2026', name: 'Joe McCreesh',       role: 'Project Coordinator' },
  // Executive
  { username: 'admin',        password: 'admin',        name: 'Admin User',         role: 'Executive' },
  // Project Managers
  { username: 'jodriscoll',   password: 'liberty2026', name: "Jim O'Driscoll",     role: 'Project Manager' },
  { username: 'dcovelens',    password: 'liberty2026', name: 'Damion Covelens',    role: 'Project Manager' },
  { username: 'bfischer',     password: 'liberty2026', name: 'Brian Fischer',      role: 'Project Manager' },
  { username: 'rreichenbach', password: 'liberty2026', name: 'Ray Reichenbach',    role: 'Project Manager' },
  // Estimator
  { username: 'estimator1',   password: 'liberty2026', name: 'Lead Estimator',     role: 'Estimator' },
  // Foreman
  { username: 'foreman1',     password: 'liberty2026', name: 'Field Foreman',      role: 'Foreman' },
  // Accounting
  { username: 'accounting1',  password: 'liberty2026', name: 'Accounting Staff',   role: 'Accounting' },
  // Purchasing
  { username: 'purchasing1',  password: 'liberty2026', name: 'Purchasing Staff',   role: 'Purchasing' },
  // Safety
  { username: 'safety1',      password: 'liberty2026', name: 'Safety Manager',     role: 'Safety' },
]

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const user = USERS.find(u => u.username === username && u.password === password)
    if (user) {
      onLogin(user)
      navigate('/dashboard')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div style={{ backgroundColor: '#1a2b4a' }} className="w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <div>
              <div className="font-bold text-xl" style={{ color: '#1a2b4a' }}>LIBERTY</div>
              <div className="text-xs text-gray-500">INTEGRATED SOLUTIONS</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold mt-4" style={{ color: '#1a2b4a' }}>PC Lifecycle Board</h1>
          <p className="text-gray-500 text-sm mt-1">Project Coordinator Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
              placeholder="Enter your password"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white text-sm"
            style={{ backgroundColor: '#1a2b4a' }}
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">Liberty Integrated Solutions © 2026</p>
      </div>
    </div>
  )
}
