import { useState } from 'react'
import { updateProject } from '../api'

const SECTORS = ['Healthcare', 'Education', 'Commercial', 'Data Center', 'Government', 'Industrial', 'Institutional', 'Other']
const PHASES = [
  { num: 1, name: 'Business Development' },
  { num: 2, name: 'Estimating' },
  { num: 3, name: 'Contract & Award' },
  { num: 4, name: 'Preconstruction' },
  { num: 5, name: 'Project Execution' },
  { num: 6, name: 'Safety & QA/QC' },
  { num: 7, name: 'Financial & Billing' },
  { num: 8, name: 'Closeout' },
  { num: 9, name: 'Post-Project Review' },
]

const inputStyle = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '13px',
  color: '#1f2937',
  backgroundColor: 'white',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '4px',
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

// Convert a display date like "Mar 3, 2025" back to "2025-03-03" for the date input
function toInputDate(val) {
  if (!val || val === 'TBD') return ''
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
  // Try parsing display format
  const d = new Date(val)
  if (!isNaN(d)) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return ''
}

export default function EditProjectPanel({ project, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:           project.name || '',
    number:         project.number || '',
    customer:       project.customer || '',
    pm:             project.pm || '',
    sector:         project.sector || '',
    union:          project.union || '',
    phase:          String(project.phase || 1),
    status:         project.status || 'On Track',
    contractValue:  project.contractValue
                      ? String(project.contractValue).replace(/[^0-9.]/g, '')
                      : '',
    billingPercent: String(project.billingPct ?? project.billingPercent ?? 0),
    sopComplete:    String(project.sopComplete || 0),
    openItems:      String(project.openActionItems ?? project.openItems ?? 0),
    openRFIs:       String(project.openRFIs || 0),
    openCOs:        String(project.openCOs || 0),
    daysInPhase:    String(project.daysInPhase || 0),
    startDate:      toInputDate(project.startDate),
    completionDate: toInputDate(project.completionDate),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())   { setError('Project name is required.');   return }
    if (!form.number.trim()) { setError('Project number is required.'); return }

    setSaving(true)
    setError('')

    try {
      const payload = {
        ...form,
        phase:          parseInt(form.phase),
        contractValue:  form.contractValue ? parseFloat(form.contractValue) : 0,
        billingPercent: parseFloat(form.billingPercent) || 0,
        sopComplete:    parseFloat(form.sopComplete)    || 0,
        openItems:      parseInt(form.openItems)        || 0,
        openRFIs:       parseInt(form.openRFIs)         || 0,
        openCOs:        parseInt(form.openCOs)          || 0,
        daysInPhase:    parseInt(form.daysInPhase)      || 0,
      }
      await updateProject(project.id, payload)
      onSaved()
      onClose()
    } catch (err) {
      setError('Failed to save changes. Please try again.')
      setSaving(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '480px',
        backgroundColor: 'white',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      }}>

        {/* Panel Header */}
        <div style={{ backgroundColor: '#1a2b4a', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Edit Project</h2>
            <p style={{ color: '#93c5fd', fontSize: '12px', margin: 0 }}>{project.number} — {project.name}</p>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#93c5fd', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
          >×</button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Section: Project Identity */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            Project Identity
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Project Number" required>
              <input style={inputStyle} placeholder="e.g. 26-0042" value={form.number} onChange={e => set('number', e.target.value)} />
            </Field>
            <Field label="Phase" required>
              <select style={inputStyle} value={form.phase} onChange={e => set('phase', e.target.value)}>
                {PHASES.map(p => (
                  <option key={p.num} value={p.num}>Phase {p.num} — {p.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Project Name" required>
            <input style={inputStyle} placeholder="e.g. Penn Medicine Cardiac Wing" value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>

          <Field label="Customer / General Contractor">
            <input style={inputStyle} placeholder="e.g. Turner Construction" value={form.customer} onChange={e => set('customer', e.target.value)} />
          </Field>

          {/* Section: Team & Classification */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginTop: '4px' }}>
            Team & Classification
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Project Manager">
              <input style={inputStyle} placeholder="e.g. Jim O'Driscoll" value={form.pm} onChange={e => set('pm', e.target.value)} />
            </Field>
            <Field label="Union Local">
              <input style={inputStyle} placeholder="e.g. Local 98" value={form.union} onChange={e => set('union', e.target.value)} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Sector">
              <select style={inputStyle} value={form.sector} onChange={e => set('sector', e.target.value)}>
                <option value="">Select sector...</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Overdue">Overdue</option>
              </select>
            </Field>
          </div>

          {/* Section: Financials */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginTop: '4px' }}>
            Financials
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Contract Value ($)">
              <input style={inputStyle} type="number" min="0" placeholder="e.g. 2450000" value={form.contractValue} onChange={e => set('contractValue', e.target.value)} />
            </Field>
            <Field label="Billed (%)">
              <input style={inputStyle} type="number" min="0" max="100" placeholder="0" value={form.billingPercent} onChange={e => set('billingPercent', e.target.value)} />
            </Field>
          </div>

          {/* Section: Schedule */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginTop: '4px' }}>
            Schedule
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Start Date">
              <input style={inputStyle} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </Field>
            <Field label="Completion Date">
              <input style={inputStyle} type="date" value={form.completionDate} onChange={e => set('completionDate', e.target.value)} />
            </Field>
          </div>

          {/* Section: Status Counters */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginTop: '4px' }}>
            Status Counters
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="SOP Complete (%)">
              <input style={inputStyle} type="number" min="0" max="100" placeholder="0" value={form.sopComplete} onChange={e => set('sopComplete', e.target.value)} />
            </Field>
            <Field label="Open Action Items">
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.openItems} onChange={e => set('openItems', e.target.value)} />
            </Field>
            <Field label="Open RFIs">
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.openRFIs} onChange={e => set('openRFIs', e.target.value)} />
            </Field>
            <Field label="Open Change Orders">
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.openCOs} onChange={e => set('openCOs', e.target.value)} />
            </Field>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}>
              {error}
            </div>
          )}

        </form>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px', flexShrink: 0, backgroundColor: 'white' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 2, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: saving ? '#93c5fd' : '#1a2b4a', color: 'white', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </>
  )
}
