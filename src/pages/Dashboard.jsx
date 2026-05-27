import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../api'
import AddProjectPanel from '../components/AddProjectPanel'

const PHASE_COLORS = {
  1: '#64748b', 2: '#3b82f6', 3: '#8b5cf6',
  4: '#f97316', 5: '#10b981', 6: '#ef4444',
  7: '#22c55e', 8: '#f59e0b', 9: '#6b7280'
}

const STATUS_COLORS = {
  'On Track': '#10b981',
  'At Risk': '#f59e0b',
  'Overdue': '#ef4444'
}

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddPanel, setShowAddPanel] = useState(false)

  const loadProjects = () => {
    setLoading(true)
    getProjects()
      .then(data => {
        setProjects(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [])

  const filters = ['All', 'On Track', 'At Risk', 'Overdue', 'Phase 1-3', 'Phase 4-6', 'Phase 7-9']

  const filtered = projects.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.number?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'All') return matchSearch
    if (filter === 'On Track' || filter === 'At Risk' || filter === 'Overdue')
      return matchSearch && p.status === filter
    if (filter === 'Phase 1-3') return matchSearch && p.phase >= 1 && p.phase <= 3
    if (filter === 'Phase 4-6') return matchSearch && p.phase >= 4 && p.phase <= 6
    if (filter === 'Phase 7-9') return matchSearch && p.phase >= 7 && p.phase <= 9
    return matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a2b4a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Liberty PC Lifecycle Board</h1>
          <p style={{ color: '#93c5fd', fontSize: '13px', margin: 0 }}>Liberty Integrated Solutions</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#93c5fd', fontSize: '14px' }}>{user?.name} — {user?.role}</span>
          <button
            onClick={() => setShowAddPanel(true)}
            style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            + Add Project
          </button>
          <button onClick={onLogout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* Live Bar */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '8px 24px', display: 'flex', gap: '32px' }}>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>Total Projects: <strong style={{ color: 'white' }}>{projects.length}</strong></span>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>On Track: <strong style={{ color: '#10b981' }}>{projects.filter(p => p.status === 'On Track').length}</strong></span>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>At Risk: <strong style={{ color: '#f59e0b' }}>{projects.filter(p => p.status === 'At Risk').length}</strong></span>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>Overdue: <strong style={{ color: '#ef4444' }}>{projects.filter(p => p.status === 'Overdue').length}</strong></span>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px' }}>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', width: '250px' }}
          />
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px',
                backgroundColor: filter === f ? '#1a2b4a' : 'white',
                color: filter === f ? 'white' : '#374151' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Project Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
            {projects.length === 0
              ? <div>
                  <p style={{ fontSize: '16px', marginBottom: '12px' }}>No projects yet.</p>
                  <button onClick={() => setShowAddPanel(true)} style={{ backgroundColor: '#1a2b4a', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' }}>
                    + Add Your First Project
                  </button>
                </div>
              : 'No projects match your search.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filtered.map(project => (
              <div key={project._id} onClick={() => navigate(`/project/${project._id}`)}
                style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${PHASE_COLORS[project.phase] || '#64748b'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{project.number}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: STATUS_COLORS[project.status] }}>{project.status}</span>
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#1a2b4a' }}>{project.name}</h3>
                {project.customer && (
                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#6b7280' }}>{project.customer}</p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ backgroundColor: PHASE_COLORS[project.phase], color: 'white', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>Phase {project.phase}</span>
                  {project.sector && (
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>{project.sector}</span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#374151' }}>
                  <div>Contract: <strong>${(project.contractValue || 0).toLocaleString()}</strong></div>
                  <div>Billed: <strong>{project.billingPercent || 0}%</strong></div>
                  <div>SOP: <strong>{project.sopComplete || 0}%</strong></div>
                  <div>Open Items: <strong>{project.openItems || 0}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Project Slide-Out Panel */}
      {showAddPanel && (
        <AddProjectPanel
          onClose={() => setShowAddPanel(false)}
          onSaved={loadProjects}
        />
      )}

    </div>
  )
}
