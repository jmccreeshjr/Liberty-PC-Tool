// src/pages/SopGovernance.jsx
// Phase 6 — SOP Task Governance page.
// PC and Admin roles only. Lets authorized users view, add, edit, and delete
// master SOP tasks. Changes propagate to all projects automatically.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getSopTemplate,
  addSopTemplateTask,
  updateSopTemplateTask,
  deleteSopTemplateTask,
  resyncAllFromTemplate,
} from '../api'

const PHASE_LABELS = {
  1: 'Lead/Inquiry',   2: 'Estimating',     3: 'Pre-Award',
  4: 'Pre-Construction', 5: 'Construction', 6: 'Safety & Compliance',
  7: 'Billing',        8: 'Closeout',        9: 'Archived',
}

const ROLES = [
  'PC', 'PM', 'Foreman', 'Estimator', 'Lead Estimator',
  'Purchasing', 'Accounting', 'Safety', 'Ops Manager', 'Sales Rep', 'Admin',
]

const EDIT_ROLES = ['PC', 'Project Coordinator', 'Admin', 'Executive']

// ─── Add Task Form ────────────────────────────────────────────────────────────

function AddTaskForm({ userRole, onAdded, onCancel }) {
  const [form, setForm] = useState({ phase: 1, role: 'PC', task: '', required: true })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.task.trim()) { setError('Task description is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const result = await addSopTemplateTask({ ...form, addedBy: userRole }, userRole)
      if (result.message) { setError(result.message); return }
      onAdded(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.addForm}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Add New SOP Task</h3>
      {error && <div style={styles.errorMsg}>{error}</div>}
      <div style={styles.formRow}>
        <label style={styles.label}>Phase</label>
        <select style={styles.select} value={form.phase}
          onChange={e => setForm(f => ({ ...f, phase: Number(e.target.value) }))}>
          {[1,2,3,4,5,6,7,8,9].map(ph => (
            <option key={ph} value={ph}>{ph} – {PHASE_LABELS[ph]}</option>
          ))}
        </select>
      </div>
      <div style={styles.formRow}>
        <label style={styles.label}>Role</label>
        <select style={styles.select} value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={styles.formRow}>
        <label style={styles.label}>Task Description</label>
        <textarea style={{ ...styles.input, height: 68, resize: 'vertical' }}
          value={form.task}
          onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
          placeholder="Describe the task…" />
      </div>
      <div style={{ ...styles.formRow, alignItems: 'center', gap: 8 }}>
        <input type="checkbox" id="req-check" checked={form.required}
          onChange={e => setForm(f => ({ ...f, required: e.target.checked }))} />
        <label htmlFor="req-check" style={{ fontSize: 13, color: '#475569', cursor: 'pointer' }}>
          Required (must be complete before phase advance)
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="submit" disabled={saving} style={styles.btnPrimary}>
          {saving ? 'Saving…' : '+ Add Task'}
        </button>
        <button type="button" onClick={onCancel} style={styles.btnGhost}>Cancel</button>
      </div>
    </form>
  )
}

// ─── Task Row (editable in-place) ─────────────────────────────────────────────

function TaskRow({ task, userRole, onUpdated, onDeleted }) {
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({ task: task.task, role: task.role, required: task.required })
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateSopTemplateTask(task.id, form, userRole)
      onUpdated(result)
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete task "${task.task}"?\n\nThis will also remove it from all projects.`)) return
    setDeleting(true)
    try {
      await deleteSopTemplateTask(task.id, userRole)
      onDeleted(task.id)
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <tr style={{ background: '#fffbeb' }}>
        <td style={styles.td}><span style={styles.taskId}>{task.id}</span></td>
        <td style={styles.td}>
          <select style={{ ...styles.select, fontSize: 12, padding: '3px 6px' }} value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </td>
        <td style={styles.td}>
          <textarea style={{ width: '100%', fontSize: 13, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4, resize: 'vertical', minHeight: 52 }}
            value={form.task}
            onChange={e => setForm(f => ({ ...f, task: e.target.value }))} />
        </td>
        <td style={{ ...styles.td, textAlign: 'center' }}>
          <input type="checkbox" checked={form.required}
            onChange={e => setForm(f => ({ ...f, required: e.target.checked }))} />
        </td>
        <td style={{ ...styles.td, textAlign: 'right' }}>
          <button onClick={handleSave} disabled={saving} style={{ ...styles.btnPrimary, padding: '4px 10px', fontSize: 12 }}>
            {saving ? '…' : '✓ Save'}
          </button>
          <button onClick={() => setEditing(false)} style={{ ...styles.btnGhost, padding: '4px 10px', fontSize: 12, marginLeft: 4 }}>
            Cancel
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr style={{ background: deleting ? '#fef2f2' : undefined }}>
      <td style={styles.td}><span style={styles.taskId}>{task.id}</span></td>
      <td style={styles.td}><span style={styles.roleBadge}>{task.role}</span></td>
      <td style={styles.td}>{task.task}</td>
      <td style={{ ...styles.td, textAlign: 'center' }}>
        {task.required
          ? <span style={styles.reqYes}>Required</span>
          : <span style={styles.reqNo}>Optional</span>}
      </td>
      <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
        <button onClick={() => setEditing(true)} style={{ ...styles.btnGhost, padding: '4px 10px', fontSize: 12 }}>
          ✏️ Edit
        </button>
        <button onClick={handleDelete} disabled={deleting} style={{ ...styles.btnDanger, padding: '4px 10px', fontSize: 12, marginLeft: 4 }}>
          {deleting ? '…' : '🗑 Delete'}
        </button>
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SopGovernance({ user }) {
  const navigate   = useNavigate()
  const userRole   = user?.role || ''

  const [tasks,       setTasks]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [resyncing,   setResyncing]   = useState(false)
  const [syncMsg,     setSyncMsg]     = useState(null)
  const [expandedPhase, setExpandedPhase] = useState(null)

  // Role gate
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!EDIT_ROLES.includes(userRole)) { navigate('/'); return }
    getSopTemplate(userRole)
      .then(data => { setTasks(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const tasksByPhase = tasks.reduce((acc, t) => {
    if (!acc[t.phase]) acc[t.phase] = []
    acc[t.phase].push(t)
    return acc
  }, {})

  function handleAdded(newTask) {
    setTasks(prev => [...prev, newTask].sort((a, b) => a.phase - b.phase || a.order - b.order))
    setShowAddForm(false)
    setExpandedPhase(newTask.phase)
  }

  function handleUpdated(updatedTask) {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
  }

  function handleDeleted(taskId) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  async function handleResyncAll() {
    if (!window.confirm('Push the full SOP template to all projects?\n\nThis will add missing tasks and update task text for all projects. Existing done states are preserved.')) return
    setResyncing(true)
    setSyncMsg(null)
    try {
      const result = await resyncAllFromTemplate(userRole)
      setSyncMsg(result.message || 'Resync complete.')
      setTimeout(() => setSyncMsg(null), 5000)
    } catch (err) {
      setSyncMsg(`Error: ${err.message}`)
    } finally {
      setResyncing(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading SOP template…</div>
  if (error)   return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>Error: {error}</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#1e3a5f', color: 'white', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            ← Dashboard
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>SOP Task Governance</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 1 }}>Manage the master SOP task library · Changes apply to all projects</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {syncMsg && <span style={{ fontSize: 12, color: '#86efac', background: 'rgba(22,163,74,0.2)', padding: '4px 10px', borderRadius: 6 }}>{syncMsg}</span>}
          <button onClick={handleResyncAll} disabled={resyncing}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {resyncing ? 'Syncing…' : '🔄 Push Template to All Projects'}
          </button>
          <button onClick={() => setShowAddForm(true)}
            style={{ background: '#2563eb', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            + Add Task
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, padding: '24px 28px' }}>

        {/* Notice banner */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#1e40af' }}>
          <strong>How this works:</strong> Adding a task here adds it to <em>all projects</em>.
          If the project has already passed that phase, the task is automatically marked complete.
          Editing a task updates all projects. Deleting removes it from all projects permanently.
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <AddTaskForm
            userRole={userRole}
            onAdded={handleAdded}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Phase sections */}
        {[1,2,3,4,5,6,7,8,9].map(ph => {
          const phaseTasks = tasksByPhase[ph] || []
          const isOpen     = expandedPhase === ph || expandedPhase === null
          return (
            <div key={ph} style={styles.phaseBlock}>
              <button
                onClick={() => setExpandedPhase(expandedPhase === ph ? null : ph)}
                style={styles.phaseHeader}
              >
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  Phase {ph} — {PHASE_LABELS[ph]}
                </span>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                  {' · '}
                  {phaseTasks.filter(t => t.required).length} required
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && phaseTasks.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, width: 70  }}>ID</th>
                        <th style={{ ...styles.th, width: 120 }}>Role</th>
                        <th style={{ ...styles.th            }}>Task Description</th>
                        <th style={{ ...styles.th, width: 100, textAlign: 'center' }}>Required</th>
                        <th style={{ ...styles.th, width: 150, textAlign: 'right'  }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phaseTasks.map(task => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          userRole={userRole}
                          onUpdated={handleUpdated}
                          onDeleted={handleDeleted}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {isOpen && phaseTasks.length === 0 && (
                <div style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                  No tasks defined for this phase.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  phaseBlock: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  phaseHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f8fafc',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    background: '#f1f5f9',
    padding: '7px 10px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#475569',
    fontSize: 12,
    borderBottom: '2px solid #e2e8f0',
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'top',
    fontSize: 13,
  },
  taskId: {
    fontFamily: 'monospace',
    fontSize: 11,
    background: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: 4,
    color: '#475569',
  },
  roleBadge: {
    fontSize: 11,
    background: '#e0e7ff',
    color: '#3730a3',
    padding: '2px 7px',
    borderRadius: 99,
    whiteSpace: 'nowrap',
  },
  reqYes: {
    fontSize: 11,
    fontWeight: 700,
    color: '#16a34a',
    background: '#dcfce7',
    padding: '2px 6px',
    borderRadius: 99,
  },
  reqNo: {
    fontSize: 11,
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: 99,
  },
  addForm: {
    background: 'white',
    border: '2px solid #2563eb',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 20,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
  },
  input: {
    padding: '7px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    padding: '7px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 13,
    background: 'white',
    width: '100%',
  },
  btnPrimary: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  btnGhost: {
    background: 'transparent',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '7px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  btnDanger: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '7px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  errorMsg: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
    marginBottom: 10,
  },
}
