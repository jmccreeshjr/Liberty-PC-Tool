import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, getAlertSettings, getActionItems, dismissAlert, snoozeAlert } from '../api'
import { evaluateAlerts } from '../utils/evaluateAlerts'
import AddProjectPanel from '../components/AddProjectPanel'

const PHASE_COLORS = {
  1: '#64748b', 2: '#3b82f6', 3: '#8b5cf6',
  4: '#f97316', 5: '#10b981', 6: '#ef4444',
  7: '#22c55e', 8: '#f59e0b', 9: '#6b7280'
}

const STATUS_COLORS = {
  'On Track': '#10b981',
  'At Risk':  '#f59e0b',
  'Overdue':  '#ef4444'
}

const SNOOZE_OPTIONS = [
  { label: '1 day',  days: 1  },
  { label: '3 days', days: 3  },
  { label: '7 days', days: 7  },
]

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [filter,       setFilter]       = useState('All')
  const [search,       setSearch]       = useState('')
  const [projects,     setProjects]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showAddPanel, setShowAddPanel] = useState(false)

  // Alert strip
  const [alerts,          setAlerts]          = useState([])
  const [alertsOpen,      setAlertsOpen]       = useState(true)
  const [dismissingAlert, setDismissingAlert]  = useState(null)
  const [snoozingAlert,   setSnoozingAlert]    = useState(null)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      getProjects(),
      getAlertSettings().catch(() => ({})),
      getActionItems().catch(() => []),
    ]).then(([projectData, settings, actionItems]) => {
      const projs = Array.isArray(projectData) ? projectData : []
      setProjects(projs)

      // Build action items lookup by projectId
      const aiByProject = {}
      if (Array.isArray(actionItems)) {
        actionItems.forEach(item => {
          if (!aiByProject[item.projectId]) aiByProject[item.projectId] = []
          aiByProject[item.projectId].push(item)
        })
      }

      // Evaluate alerts
      const fired = evaluateAlerts(projs, settings, aiByProject)
      setAlerts(fired)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const handleDismiss = async (alert) => {
    setDismissingAlert(`${alert.projectId}-${alert.type}`)
    try {
      await dismissAlert(alert.projectId, alert.type, user.name)
      setAlerts(prev => prev.filter(a => !(a.projectId === alert.projectId && a.type === alert.type)))
    } catch (err) {
      console.error('Failed to dismiss alert', err)
    } finally {
      setDismissingAlert(null)
    }
  }

  const handleSnooze = async (alert, days) => {
    setSnoozingAlert(`${alert.projectId}-${alert.type}`)
    try {
      const snoozeUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      await snoozeAlert(alert.projectId, alert.type, user.name, snoozeUntil)
      setAlerts(prev => prev.filter(a => !(a.projectId === alert.projectId && a.type === alert.type)))
    } catch (err) {
      console.error('Failed to snooze alert', err)
    } finally {
      setSnoozingAlert(null)
    }
  }

  const filters = ['All', 'On Track', 'At Risk', 'Overdue', 'Phase 1-3', 'Phase 4-6', 'Phase 7-9']

  const filtered = projects.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.number?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'All') return matchSearch
    if (['On Track', 'At Risk', 'Overdue'].includes(filter)) return matchSearch && p.status === filter
    if (filter === 'Phase 1-3') return matchSearch && p.phase >= 1 && p.phase <= 3
    if (filter === 'Phase 4-6') return matchSearch && p.phase >= 4 && p.phase <= 6
    if (filter === 'Phase 7-9') return matchSearch && p.phase >= 7 && p.phase <= 9
    return matchSearch
  })

  const alertAlerts  = alerts.filter(a => a.severity === 'alert')
  const warnAlerts   = alerts.filter(a => a.severity === 'warning')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a2b4a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Liberty PC Lifecycle Board</h1>
          <p style={{ color: '#93c5fd', fontSize: '13px', margin: 0 }}>Liberty Integrated Solutions</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#93c5fd', fontSize: '14px' }}>{user?.name} — {user?.role}</span>
          <button onClick={() => navigate('/inbox')}
            style={{ backgroundColor: 'transparent', color: '#93c5fd', border: '1px solid rgba(147,197,253,0.4)', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            📋 Inbox
          </button>
          {(user?.role === 'Project Coordinator' || user?.role === 'Executive') && (
            <button onClick={() => navigate('/settings')}
              style={{ backgroundColor: 'transparent', color: '#93c5fd', border: '1px solid rgba(147,197,253,0.4)', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
              ⚙️ Settings
            </button>
          )}
          <button onClick={() => setShowAddPanel(true)}
            style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            + Add Project
          </button>
          <button onClick={onLogout}
            style={{ backgroundColor: 'white', color: '#1a2b4a', border: 'none', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Live Stats Bar */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '8px 24px', display: 'flex', gap: '32px' }}>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>Total: <strong style={{ color: 'white' }}>{projects.length}</strong></span>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>On Track: <strong style={{ color: '#10b981' }}>{projects.filter(p => p.status === 'On Track').length}</strong></span>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>At Risk: <strong style={{ color: '#f59e0b' }}>{projects.filter(p => p.status === 'At Risk').length}</strong></span>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>Overdue: <strong style={{ color: '#ef4444' }}>{projects.filter(p => p.status === 'Overdue').length}</strong></span>
        {alerts.length > 0 && (
          <span style={{ color: '#93c5fd', fontSize: '13px', marginLeft: 'auto' }}>
            🔔 <strong style={{ color: alertAlerts.length > 0 ? '#f87171' : '#fbbf24' }}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</strong>
          </span>
        )}
      </div>

      {/* Alert Strip */}
      {alerts.length > 0 && (
        <div style={{ margin: '16px 24px 0', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.09)', overflow: 'hidden' }}>
          {/* Strip header */}
          <button
            onClick={() => setAlertsOpen(v => !v)}
            style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: alertsOpen ? '1px solid #f1f5f9' : 'none' }}>
            <span style={{ fontSize: '15px' }}>🔔</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937' }}>
              Active Alerts
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
              {alertAlerts.length} alert{alertAlerts.length !== 1 ? 's' : ''}
            </span>
            {warnAlerts.length > 0 && (
              <span style={{ fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#fef9c3', color: '#ca8a04' }}>
                {warnAlerts.length} warning{warnAlerts.length !== 1 ? 's' : ''}
              </span>
            )}
            <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '12px' }}>{alertsOpen ? '▲ Collapse' : '▼ Expand'}</span>
          </button>

          {/* Alert rows */}
          {alertsOpen && (
            <div>
              {alerts.map((alert, i) => {
                const isAlert    = alert.severity === 'alert'
                const alertKey   = `${alert.projectId}-${alert.type}`
                const isActing   = dismissingAlert === alertKey || snoozingAlert === alertKey

                return (
                  <div key={alertKey} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                    borderBottom: i < alerts.length - 1 ? '1px solid #f8fafc' : 'none',
                    backgroundColor: isAlert ? '#fff9f9' : '#fffdf0',
                    opacity: isActing ? 0.5 : 1, transition: 'opacity 0.2s',
                  }}>
                    {/* Severity dot */}
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: isAlert ? '#ef4444' : '#f59e0b' }} />

                    {/* Label badge */}
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', flexShrink: 0, backgroundColor: isAlert ? '#fee2e2' : '#fef9c3', color: isAlert ? '#b91c1c' : '#92400e' }}>
                      {alert.label}
                    </span>

                    {/* Project name */}
                    <button
                      onClick={() => navigate(`/project/${alert.projectId}`)}
                      style={{ fontSize: '13px', fontWeight: '600', color: '#1a2b4a', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                      {alert.projectNumber} — {alert.projectName}
                    </button>

                    {/* Message */}
                    <span style={{ fontSize: '12px', color: '#6b7280', flex: 1 }}>{alert.message}</span>

                    {/* Snooze dropdown */}
                    <select
                      onChange={e => { if (e.target.value) handleSnooze(alert, parseInt(e.target.value)) }}
                      defaultValue=""
                      disabled={isActing}
                      style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', color: '#374151', backgroundColor: 'white' }}>
                      <option value="" disabled>Snooze…</option>
                      {SNOOZE_OPTIONS.map(o => (
                        <option key={o.days} value={o.days}>{o.label}</option>
                      ))}
                    </select>

                    {/* Dismiss */}
                    <button
                      onClick={() => handleDismiss(alert)}
                      disabled={isActing}
                      style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', color: '#6b7280', flexShrink: 0 }}>
                      Dismiss
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div style={{ padding: '20px 24px' }}>

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
            {filtered.map(project => {
              const projectAlerts = alerts.filter(a => a.projectId === project._id)
              const hasAlert      = projectAlerts.some(a => a.severity === 'alert')
              const hasWarning    = projectAlerts.some(a => a.severity === 'warning')

              return (
                <div key={project._id} onClick={() => navigate(`/project/${project._id}`)}
                  style={{
                    backgroundColor: 'white', borderRadius: '10px', padding: '20px', cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    borderLeft: `4px solid ${PHASE_COLORS[project.phase] || '#64748b'}`,
                    outline: hasAlert ? '1.5px solid #fca5a5' : hasWarning ? '1.5px solid #fde68a' : 'none',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{project.number}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {hasAlert   && <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626' }}>ALERT</span>}
                      {hasWarning && !hasAlert && <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#fef9c3', color: '#ca8a04' }}>WARNING</span>}
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: STATUS_COLORS[project.status] }}>{project.status}</span>
                    </div>
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
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#9ca3af' }}>
                    {(() => {
                      const days = project.phaseStartDate
                        ? Math.floor((Date.now() - new Date(project.phaseStartDate).getTime()) / (1000 * 60 * 60 * 24))
                        : (project.daysInPhase || 0)
                      return `${days} day${days !== 1 ? 's' : ''} in Phase ${project.phase}`
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Project Slide-Out Panel */}
      {showAddPanel && (
        <AddProjectPanel
          onClose={() => setShowAddPanel(false)}
          onSaved={loadAll}
        />
      )}

    </div>
  )
}
