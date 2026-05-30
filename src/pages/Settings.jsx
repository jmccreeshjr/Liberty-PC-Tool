import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAlertSettings, updateAlertSettings, getProjects, updateProjectAlertOverrides } from '../api'

const THRESHOLD_FIELDS = [
  { key: 'phaseStuckDays',        label: 'Phase Stuck',            description: 'Flag when a project has been in the same phase for this many days', unit: 'days' },
  { key: 'sopIncompleteDays',     label: 'SOP Tasks Incomplete',   description: 'Flag when required SOP tasks are still open after this many days in a phase', unit: 'days' },
  { key: 'billingLagDays',        label: 'Billing Lag (Phase 5+)', description: 'Flag when billing percent hasn\'t been updated in this many days', unit: 'days' },
  { key: 'openCODays',            label: 'Open Change Orders',     description: 'Flag when open change orders have been unresolved for this many days', unit: 'days' },
  { key: 'completionWarningDays', label: 'Completion Warning',     description: 'Show a warning banner when the completion date is within this many days', unit: 'days' },
  { key: 'statusUpdateDays',      label: 'Needs Status Update',    description: 'Flag when no status update note has been added in this many days', unit: 'days' },
]

export default function Settings({ user, onLogout }) {
  const navigate   = useNavigate()
  const isPC       = user?.role === 'Project Coordinator' || user?.role === 'Executive'

  const [activeTab,      setActiveTab]      = useState('global')
  const [globalSettings, setGlobalSettings] = useState(null)
  const [globalForm,     setGlobalForm]     = useState({})
  const [globalSaving,   setGlobalSaving]   = useState(false)
  const [globalSaved,    setGlobalSaved]    = useState(false)

  const [projects,         setProjects]         = useState([])
  const [expandedProject,  setExpandedProject]  = useState(null)
  const [overrideForm,     setOverrideForm]      = useState({})
  const [overrideSaving,   setOverrideSaving]    = useState(null)
  const [overrideSaved,    setOverrideSaved]     = useState(null)

  // Load global settings
  useEffect(() => {
    getAlertSettings().then(s => {
      setGlobalSettings(s)
      const form = {}
      THRESHOLD_FIELDS.forEach(f => { form[f.key] = s[f.key] ?? '' })
      setGlobalForm(form)
    }).catch(console.error)
  }, [])

  // Load projects for per-project tab
  useEffect(() => {
    if (activeTab === 'projects') {
      getProjects().then(data => setProjects(Array.isArray(data) ? data : [])).catch(console.error)
    }
  }, [activeTab])

  const handleGlobalSave = async (e) => {
    e.preventDefault()
    setGlobalSaving(true)
    try {
      const payload = {}
      THRESHOLD_FIELDS.forEach(f => {
        const v = parseInt(globalForm[f.key])
        if (!isNaN(v) && v > 0) payload[f.key] = v
      })
      const updated = await updateAlertSettings(payload)
      setGlobalSettings(updated)
      setGlobalSaved(true)
      setTimeout(() => setGlobalSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save global settings', err)
    } finally {
      setGlobalSaving(false)
    }
  }

  const openProjectOverride = (project) => {
    setExpandedProject(project._id)
    const form = {}
    THRESHOLD_FIELDS.forEach(f => {
      form[f.key] = project.alertOverrides?.[f.key] ?? ''
    })
    setOverrideForm(form)
  }

  const handleOverrideSave = async (projectId) => {
    setOverrideSaving(projectId)
    try {
      const payload = {}
      THRESHOLD_FIELDS.forEach(f => {
        const raw = overrideForm[f.key]
        if (raw === '' || raw === null || raw === undefined) {
          payload[f.key] = null // clear override → use global
        } else {
          const v = parseInt(raw)
          payload[f.key] = isNaN(v) ? null : v
        }
      })
      const updated = await updateProjectAlertOverrides(projectId, payload)
      setProjects(prev => prev.map(p => p._id === projectId ? updated : p))
      setOverrideSaved(projectId)
      setTimeout(() => setOverrideSaved(null), 3000)
    } catch (err) {
      console.error('Failed to save overrides', err)
    } finally {
      setOverrideSaving(null)
    }
  }

  if (!isPC) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
      <p style={{ color: '#6b7280' }}>Access restricted to Project Coordinator and Executive roles.</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>

      {/* Header */}
      <header style={{ backgroundColor: '#1a2b4a', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 900, fontSize: '14px', color: '#1a2b4a' }}>L</span>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', lineHeight: 1 }}>LIBERTY</div>
              <div style={{ color: '#93c5fd', fontSize: '11px', lineHeight: 1 }}>INTEGRATED SOLUTIONS</div>
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <button onClick={() => navigate('/dashboard')} style={{ color: '#93c5fd', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← PC Lifecycle Board
          </button>
          <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>⚙️ Alert Settings</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#93c5fd', fontSize: '13px' }}>{user.name} — {user.role}</span>
          <button onClick={onLogout} style={{ backgroundColor: 'white', color: '#1a2b4a', border: 'none', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Sign Out</button>
        </div>
      </header>

      <div style={{ padding: '32px', maxWidth: '860px', margin: '0 auto' }}>

        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '28px' }}>
          {[
            { key: 'global',   label: '🌐 Global Defaults'        },
            { key: 'projects', label: '📁 Per-Project Overrides'  },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 20px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '-1px',
                borderBottom: activeTab === tab.key ? '2px solid #1a2b4a' : '2px solid transparent',
                color: activeTab === tab.key ? '#1a2b4a' : '#6b7280',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Global Defaults Tab ── */}
        {activeTab === 'global' && (
          <div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
              These thresholds apply to all projects by default. Individual projects can override any setting in the Per-Project tab.
            </p>
            {globalSettings === null ? (
              <p style={{ color: '#6b7280' }}>Loading...</p>
            ) : (
              <form onSubmit={handleGlobalSave}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                  {THRESHOLD_FIELDS.map(field => (
                    <div key={field.key} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '3px' }}>{field.label}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{field.description}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <input
                          type="number"
                          min="1"
                          value={globalForm[field.key] ?? ''}
                          onChange={e => setGlobalForm(f => ({ ...f, [field.key]: e.target.value }))}
                          style={{ width: '72px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '14px', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>{field.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="submit" disabled={globalSaving}
                    style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#1a2b4a', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    {globalSaving ? 'Saving...' : 'Save Global Settings'}
                  </button>
                  {globalSaved && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>✓ Saved</span>}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Per-Project Overrides Tab ── */}
        {activeTab === 'projects' && (
          <div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
              Set custom thresholds for individual projects. Leave a field blank to use the global default.
            </p>
            {projects.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Loading projects...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {projects.map(project => {
                  const isExpanded = expandedProject === project._id
                  const hasOverrides = THRESHOLD_FIELDS.some(f => project.alertOverrides?.[f.key] != null)

                  return (
                    <div key={project._id} style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                      {/* Project row */}
                      <button
                        onClick={() => isExpanded ? setExpandedProject(null) : openProjectOverride(project)}
                        style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', minWidth: '80px' }}>{project.number}</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', flex: 1 }}>{project.name}</span>
                        {hasOverrides && (
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                            Custom
                          </span>
                        )}
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {/* Override form */}
                      {isExpanded && (
                        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f1f5f9' }}>
                          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '12px 0 16px' }}>
                            Leave blank to inherit the global default.
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            {THRESHOLD_FIELDS.map(field => (
                              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>{field.label}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder={`Global: ${globalSettings?.[field.key] ?? '—'}`}
                                    value={overrideForm[field.key] ?? ''}
                                    onChange={e => setOverrideForm(f => ({ ...f, [field.key]: e.target.value }))}
                                    style={{ width: '80px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 8px', fontSize: '13px', textAlign: 'center' }}
                                  />
                                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>days</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              onClick={() => handleOverrideSave(project._id)}
                              disabled={overrideSaving === project._id}
                              style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#1a2b4a', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                              {overrideSaving === project._id ? 'Saving...' : 'Save Overrides'}
                            </button>
                            <button onClick={() => setExpandedProject(null)}
                              style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', fontSize: '13px', cursor: 'pointer', color: '#374151' }}>
                              Cancel
                            </button>
                            {overrideSaved === project._id && (
                              <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>✓ Saved</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
