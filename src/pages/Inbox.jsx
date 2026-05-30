import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActionItems, updateActionItem, deleteActionItem } from '../api'

const PRIORITY_CONFIG = {
  'Low':      { bg: '#f1f5f9', text: '#64748b' },
  'Medium':   { bg: '#dbeafe', text: '#1d4ed8' },
  'High':     { bg: '#fef9c3', text: '#ca8a04' },
  'Critical': { bg: '#fee2e2', text: '#dc2626' },
}

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed']

const STATUS_CONFIG = {
  'Open':        { bg: '#fee2e2', text: '#dc2626' },
  'In Progress': { bg: '#fef9c3', text: '#ca8a04' },
  'Resolved':    { bg: '#dcfce7', text: '#16a34a' },
  'Closed':      { bg: '#f1f5f9', text: '#6b7280' },
}

function fmtDate(d) {
  if (!d) return null
  const dt = new Date(d)
  return isNaN(dt) ? null : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(dueDate) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date() && true
}

export default function Inbox({ user, onLogout }) {
  const navigate = useNavigate()
  const isManager = user?.role === 'Project Coordinator' || user?.role === 'Executive'

  const [items,        setItems]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('Active') // 'Active' | 'All' | specific status
  const [updatingId,   setUpdatingId]   = useState(null)
  const [deletingId,   setDeletingId]   = useState(null)

  const loadItems = () => {
    setLoading(true)
    // PC/Executive see all items; others see only items assigned to them
    const filters = isManager ? {} : { assignedTo: user.name }
    getActionItems(filters)
      .then(data => {
        setItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadItems() }, [])

  const handleStatusChange = async (item, newStatus) => {
    setUpdatingId(item._id)
    try {
      const updated = await updateActionItem(item._id, { status: newStatus })
      setItems(prev => prev.map(i => i._id === item._id ? updated : i))
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return
    setDeletingId(item._id)
    try {
      await deleteActionItem(item._id)
      setItems(prev => prev.filter(i => i._id !== item._id))
    } catch (err) {
      console.error('Failed to delete', err)
    } finally {
      setDeletingId(null)
    }
  }

  // Filter items
  const displayItems = items.filter(item => {
    if (statusFilter === 'Active') return item.status === 'Open' || item.status === 'In Progress'
    if (statusFilter === 'All') return true
    return item.status === statusFilter
  })

  // Group by project
  const grouped = displayItems.reduce((acc, item) => {
    const key = item.projectId
    const label = `${item.projectNumber ? item.projectNumber + ' — ' : ''}${item.projectName || 'Unknown Project'}`
    if (!acc[key]) acc[key] = { label, projectId: item.projectId, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  const openCount     = items.filter(i => i.status === 'Open').length
  const inProgressCount = items.filter(i => i.status === 'In Progress').length
  const overdueCount  = items.filter(i => isOverdue(i.dueDate) && i.status !== 'Resolved' && i.status !== 'Closed').length

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
          <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
            {isManager ? 'Action Item Inbox — All Projects' : `My Action Items — ${user.name}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#93c5fd', fontSize: '13px' }}>{user.name} — {user.role}</span>
          <button onClick={onLogout} style={{ backgroundColor: 'white', color: '#1a2b4a', border: 'none', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Sign Out</button>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '8px 24px', display: 'flex', gap: '32px' }}>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>Open: <strong style={{ color: '#ef4444' }}>{openCount}</strong></span>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>In Progress: <strong style={{ color: '#f59e0b' }}>{inProgressCount}</strong></span>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>Overdue: <strong style={{ color: '#f97316' }}>{overdueCount}</strong></span>
        <span style={{ color: '#93c5fd', fontSize: '13px' }}>Total: <strong style={{ color: 'white' }}>{items.length}</strong></span>
      </div>

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['Active', 'All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                backgroundColor: statusFilter === f ? '#1a2b4a' : 'white',
                color: statusFilter === f ? 'white' : '#374151',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading action items...</div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontSize: '16px' }}>{items.length === 0 ? 'No action items yet.' : 'No items match this filter.'}</p>
          </div>
        ) : (
          Object.values(grouped).map(group => (
            <div key={group.projectId} style={{ marginBottom: '24px' }}>
              {/* Project group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1a2b4a' }}>{group.label}</h2>
                <button
                  onClick={() => navigate(`/project/${group.projectId}`)}
                  style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  View Project →
                </button>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Action items for this project */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.items.map(item => {
                  const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG['Medium']
                  const statusCfg   = STATUS_CONFIG[item.status] || STATUS_CONFIG['Open']
                  const overdue     = isOverdue(item.dueDate) && item.status !== 'Resolved' && item.status !== 'Closed'
                  const isUpdating  = updatingId === item._id
                  const isDeleting  = deletingId === item._id

                  return (
                    <div key={item._id} style={{
                      backgroundColor: 'white', borderRadius: '8px', padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                      border: `1px solid ${overdue ? '#fca5a5' : '#e5e7eb'}`,
                      opacity: isDeleting ? 0.4 : 1,
                      transition: 'opacity 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

                        {/* Main content */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{item.title}</span>
                            <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: priorityCfg.bg, color: priorityCfg.text }}>
                              {item.priority}
                            </span>
                            {overdue && (
                              <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                OVERDUE
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px' }}>{item.description}</p>
                          )}
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af', flexWrap: 'wrap' }}>
                            {item.assignedTo && <span>👤 {item.assignedTo}</span>}
                            {item.dueDate    && <span style={{ color: overdue ? '#dc2626' : '#9ca3af' }}>📅 Due {fmtDate(item.dueDate)}</span>}
                            {item.createdBy  && <span>Created by {item.createdBy}</span>}
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {/* Status badge / dropdown */}
                          <select
                            value={item.status}
                            onChange={e => handleStatusChange(item, e.target.value)}
                            disabled={isUpdating}
                            style={{
                              fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                              backgroundColor: statusCfg.bg, color: statusCfg.text, appearance: 'none',
                            }}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>

                          {/* Delete (PC only) */}
                          {user?.role === 'Project Coordinator' && (
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={isDeleting}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '16px', lineHeight: 1 }}
                              title="Delete action item">
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
