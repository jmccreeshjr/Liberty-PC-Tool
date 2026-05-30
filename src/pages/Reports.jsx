// src/pages/Reports.jsx
// Phase 6 — In-browser reports with print-to-PDF and CSV download.
// Accessible to PC and Executive roles only.

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../api'

const PHASE_LABELS = {
  1: 'Lead/Inquiry',
  2: 'Estimating',
  3: 'Pre-Award',
  4: 'Pre-Construction',
  5: 'Construction',
  6: 'Safety & Compliance',
  7: 'Billing',
  8: 'Closeout',
  9: 'Archived',
}

const STATUS_COLORS = {
  'On Track': '#16a34a',
  'At Risk':  '#d97706',
  'Overdue':  '#dc2626',
}

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function csvEscape(val) {
  const s = val == null ? '' : String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')]
  for (const row of rows) lines.push(row.map(csvEscape).join(','))
  return lines.join('\n')
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Report components ────────────────────────────────────────────────────────

function JobStatusReport({ projects }) {
  const rows = [...projects].sort((a, b) => a.number?.localeCompare(b.number || '') || 0)

  function exportCsv() {
    const headers = ['Project #', 'Project Name', 'Customer', 'PM', 'Phase', 'Phase Name', 'Status', 'Contract Value', 'Billing %', 'SOP %', 'Days in Phase', 'Completion Date']
    const data = rows.map(p => [
      p.number,
      p.name,
      p.customer,
      p.pm,
      p.phase,
      PHASE_LABELS[p.phase] || '',
      p.status,
      p.contractValue ? `$${Number(p.contractValue).toLocaleString()}` : '',
      p.billingPercent != null ? `${p.billingPercent}%` : '',
      p.sopComplete    != null ? `${p.sopComplete}%`    : '',
      p.daysInPhase ?? '',
      p.completionDate || '',
    ])
    downloadCsv('job-status-report.csv', buildCsv(headers, data))
  }

  return (
    <div className="report-section">
      <div className="report-section-header">
        <h2>Job Status Summary</h2>
        <button className="btn-csv" onClick={exportCsv}>⬇ CSV</button>
      </div>
      <p className="report-subtitle">All active projects — phase, status, billing, and SOP completion as of today.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project #</th>
              <th>Project Name</th>
              <th>Customer</th>
              <th>PM</th>
              <th>Phase</th>
              <th>Status</th>
              <th>Contract</th>
              <th>Billed</th>
              <th>SOP</th>
              <th>Days</th>
              <th>Completion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p._id}>
                <td className="mono">{p.number}</td>
                <td className="bold">{p.name}</td>
                <td>{p.customer}</td>
                <td>{p.pm}</td>
                <td>
                  <span className="phase-badge">
                    {p.phase} – {PHASE_LABELS[p.phase]}
                  </span>
                </td>
                <td>
                  <span className="status-dot" style={{ color: STATUS_COLORS[p.status] || '#64748b' }}>
                    ● {p.status || '—'}
                  </span>
                </td>
                <td className="num">
                  {p.contractValue ? `$${Number(p.contractValue).toLocaleString()}` : '—'}
                </td>
                <td className="num">{p.billingPercent != null ? `${p.billingPercent}%` : '—'}</td>
                <td className="num">{p.sopComplete != null ? `${p.sopComplete}%` : '—'}</td>
                <td className="num">{p.daysInPhase ?? '—'}</td>
                <td className="num">{p.completionDate || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SopComplianceReport({ projects }) {
  const phases = [1,2,3,4,5,6,7,8,9]

  function phaseStats(project, phase) {
    const tasks    = (project.sopTasks || []).filter(t => t.phase === phase)
    const required = tasks.filter(t => t.required)
    const done     = tasks.filter(t => t.done)
    const reqDone  = required.filter(t => t.done)
    if (tasks.length === 0) return null
    return { total: tasks.length, done: done.length, required: required.length, reqDone: reqDone.length }
  }

  function exportCsv() {
    const headers = ['Project #', 'Project Name', 'Current Phase', ...phases.map(ph => `Phase ${ph} (req done/req total)`)]
    const data = projects.map(p => [
      p.number,
      p.name,
      p.phase,
      ...phases.map(ph => {
        const s = phaseStats(p, ph)
        return s ? `${s.reqDone}/${s.required}` : 'N/A'
      }),
    ])
    downloadCsv('sop-compliance-report.csv', buildCsv(headers, data))
  }

  return (
    <div className="report-section">
      <div className="report-section-header">
        <h2>SOP Compliance Report</h2>
        <button className="btn-csv" onClick={exportCsv}>⬇ CSV</button>
      </div>
      <p className="report-subtitle">Required task completion by project and phase. ✓ = all required done, — = not yet reached.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project #</th>
              <th>Project Name</th>
              <th>Phase</th>
              {phases.map(ph => <th key={ph} className="phase-col">Ph {ph}</th>)}
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p._id}>
                <td className="mono">{p.number}</td>
                <td className="bold">{p.name}</td>
                <td className="num">{p.phase}</td>
                {phases.map(ph => {
                  const s = phaseStats(p, ph)
                  if (!s) return <td key={ph} className="cell-na">—</td>
                  const complete  = s.reqDone === s.required
                  const isCurrent = ph === p.phase
                  const cls = complete
                    ? 'cell-done'
                    : isCurrent
                      ? 'cell-active'
                      : ph < p.phase
                        ? 'cell-miss'
                        : 'cell-future'
                  return (
                    <td key={ph} className={cls} title={`${s.reqDone}/${s.required} required done (${s.done}/${s.total} total)`}>
                      {complete ? '✓' : `${s.reqDone}/${s.required}`}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend">
        <span className="cell-done">✓ Complete</span>
        <span className="cell-active">Active phase</span>
        <span className="cell-miss">Incomplete (past)</span>
        <span className="cell-future">Not reached</span>
      </div>
    </div>
  )
}

function FinancialReport({ projects }) {
  const rows = [...projects]
    .filter(p => p.phase >= 3)
    .sort((a, b) => (b.contractValue || 0) - (a.contractValue || 0))

  const totalContract = rows.reduce((sum, p) => sum + (p.contractValue || 0), 0)
  const totalBilled   = rows.reduce((sum, p) => sum + ((p.contractValue || 0) * ((p.billingPercent || 0) / 100)), 0)
  const totalOpenCOs  = rows.reduce((sum, p) => sum + (p.openCOs || 0), 0)

  function exportCsv() {
    const headers = ['Project #', 'Project Name', 'PM', 'Phase', 'Contract Value', 'Billing %', 'Amount Billed', 'Remaining', 'Open COs', 'Open RFIs', 'Open Items']
    const data = rows.map(p => {
      const billed    = (p.contractValue || 0) * ((p.billingPercent || 0) / 100)
      const remaining = (p.contractValue || 0) - billed
      return [
        p.number, p.name, p.pm, p.phase,
        p.contractValue || 0,
        p.billingPercent != null ? `${p.billingPercent}%` : '',
        billed.toFixed(2),
        remaining.toFixed(2),
        p.openCOs   || 0,
        p.openRFIs  || 0,
        p.openItems || 0,
      ]
    })
    downloadCsv('financial-report.csv', buildCsv(headers, data))
  }

  function fmt(n) {
    return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  return (
    <div className="report-section">
      <div className="report-section-header">
        <h2>Financial Snapshot</h2>
        <button className="btn-csv" onClick={exportCsv}>⬇ CSV</button>
      </div>
      <p className="report-subtitle">Contract values, billing progress, and open items for Phase 3+ projects.</p>
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">Total Contract Value</div>
          <div className="summary-value">{fmt(totalContract)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Billed</div>
          <div className="summary-value">{fmt(totalBilled)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Remaining</div>
          <div className="summary-value">{fmt(totalContract - totalBilled)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Open Change Orders</div>
          <div className="summary-value">{totalOpenCOs}</div>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project #</th>
              <th>Project Name</th>
              <th>PM</th>
              <th>Phase</th>
              <th className="num">Contract</th>
              <th className="num">Billed %</th>
              <th className="num">Billed $</th>
              <th className="num">Remaining</th>
              <th className="num">Open COs</th>
              <th className="num">Open RFIs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const billed    = (p.contractValue || 0) * ((p.billingPercent || 0) / 100)
              const remaining = (p.contractValue || 0) - billed
              const pct       = p.billingPercent || 0
              return (
                <tr key={p._id}>
                  <td className="mono">{p.number}</td>
                  <td className="bold">{p.name}</td>
                  <td>{p.pm}</td>
                  <td className="num">{p.phase}</td>
                  <td className="num">{fmt(p.contractValue || 0)}</td>
                  <td className="num">
                    <div className="pct-bar-wrap">
                      <div className="pct-bar" style={{ width: `${Math.min(pct,100)}%` }} />
                      <span>{pct}%</span>
                    </div>
                  </td>
                  <td className="num">{fmt(billed)}</td>
                  <td className="num">{fmt(remaining)}</td>
                  <td className="num">{p.openCOs  || 0}</td>
                  <td className="num">{p.openRFIs || 0}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="bold">Totals</td>
              <td className="num bold">{fmt(totalContract)}</td>
              <td></td>
              <td className="num bold">{fmt(totalBilled)}</td>
              <td className="num bold">{fmt(totalContract - totalBilled)}</td>
              <td className="num bold">{totalOpenCOs}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Reports() {
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('user') || 'null')
  const [projects, setProjects]     = useState([])
  const [loading,  setLoading]      = useState(true)
  const [error,    setError]        = useState(null)
  const [activeTab, setActiveTab]   = useState('status')
  const printRef = useRef(null)

  // Role gate — PC and Executive only
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!['PC', 'Executive'].includes(user.role)) {
      navigate('/')
    }
  }, [])

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handlePrint() {
    window.print()
  }

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return <div className="page-loading">Loading reports…</div>
  if (error)   return <div className="page-error">Error: {error}</div>

  const TABS = [
    { id: 'status',    label: 'Job Status Summary'  },
    { id: 'sop',       label: 'SOP Compliance'       },
    { id: 'financial', label: 'Financial Snapshot'   },
  ]

  return (
    <>
      {/* ── Print-only styles injected into head at runtime ── */}
      <style>{`
        /* ── Screen styles ─────────────────────────────────── */
        .reports-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #1e293b;
        }
        .reports-header {
          background: #1e3a5f;
          color: white;
          padding: 20px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .reports-header-left { display: flex; align-items: center; gap: 16px; }
        .back-btn {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .back-btn:hover { background: rgba(255,255,255,0.25); }
        .reports-header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.01em; }
        .reports-header-meta { font-size: 12px; opacity: 0.75; margin-top: 2px; }
        .print-btn {
          background: white;
          color: #1e3a5f;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }
        .print-btn:hover { background: #e2e8f0; }
        .tab-bar {
          display: flex;
          gap: 0;
          background: white;
          border-bottom: 2px solid #e2e8f0;
          padding: 0 32px;
        }
        .tab-btn {
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
        }
        .tab-btn.active {
          color: #1e3a5f;
          border-bottom-color: #1e3a5f;
          font-weight: 700;
        }
        .tab-btn:hover:not(.active) { color: #334155; }
        .report-body { padding: 28px 32px; max-width: 1300px; }
        .report-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .report-section h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
        .report-subtitle { font-size: 13px; color: #64748b; margin: 0 0 16px; }
        .btn-csv {
          background: #e2e8f0;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #1e3a5f;
        }
        .btn-csv:hover { background: #cbd5e1; }
        .table-wrap { overflow-x: auto; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th {
          background: #f1f5f9;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        tr:hover td { background: #f8fafc; }
        tfoot td { background: #f1f5f9; font-weight: 600; border-top: 2px solid #e2e8f0; }
        .mono  { font-family: monospace; font-size: 12px; }
        .bold  { font-weight: 600; }
        .num   { text-align: right; }
        .phase-badge { font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 2px 7px; border-radius: 99px; white-space: nowrap; }
        .status-dot { font-weight: 600; font-size: 12px; white-space: nowrap; }
        /* SOP cell colors */
        .cell-done   { text-align: center; color: #16a34a; font-weight: 700; }
        .cell-active { text-align: center; background: #fffbeb; font-weight: 600; color: #92400e; }
        .cell-miss   { text-align: center; background: #fef2f2; color: #b91c1c; font-weight: 600; }
        .cell-future { text-align: center; color: #94a3b8; }
        .cell-na     { text-align: center; color: #cbd5e1; }
        .phase-col   { text-align: center; min-width: 48px; }
        .legend { display: flex; gap: 20px; margin-top: 12px; font-size: 12px; flex-wrap: wrap; }
        .legend span { padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0; }
        /* Financial summary cards */
        .summary-cards { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
        .summary-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; min-width: 170px; }
        .summary-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .summary-value { font-size: 22px; font-weight: 800; color: #1e293b; margin-top: 4px; }
        /* Billing progress bar */
        .pct-bar-wrap { position: relative; display: flex; align-items: center; gap: 6px; }
        .pct-bar { height: 6px; background: #3b82f6; border-radius: 3px; min-width: 2px; }
        .page-loading, .page-error { padding: 40px; text-align: center; font-size: 16px; color: #64748b; }

        /* ── Print styles ─────────────────────────────────── */
        @media print {
          .tab-bar, .back-btn, .print-btn, .btn-csv { display: none !important; }
          .reports-header { background: #1e3a5f !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-body { padding: 16px; }
          table { font-size: 11px; }
          th, td { padding: 5px 7px; }
          .summary-cards { break-inside: avoid; }
          .report-section { page-break-inside: avoid; }
          .table-wrap { overflow: visible; }
          .cell-done, .cell-active, .cell-miss, .cell-future { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="reports-page" ref={printRef}>
        {/* Header */}
        <div className="reports-header">
          <div className="reports-header-left">
            <button className="back-btn" onClick={() => navigate('/')}>← Dashboard</button>
            <div>
              <div className="reports-header h1" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 20 }}>Liberty Integrated Solutions</span>
                <span style={{ opacity: 0.5, fontWeight: 300 }}>|</span>
                <span style={{ fontWeight: 400, fontSize: 18 }}>Project Reports</span>
              </div>
              <div className="reports-header-meta">Generated {today} · {projects.length} project{projects.length !== 1 ? 's' : ''} loaded</div>
            </div>
          </div>
          <button className="print-btn" onClick={handlePrint}>🖨 Print / Save PDF</button>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Report body */}
        <div className="report-body">
          {activeTab === 'status'    && <JobStatusReport    projects={projects} />}
          {activeTab === 'sop'       && <SopComplianceReport projects={projects} />}
          {activeTab === 'financial' && <FinancialReport    projects={projects} />}
        </div>
      </div>
    </>
  )
}
