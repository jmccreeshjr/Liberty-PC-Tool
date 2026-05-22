import { useState } from 'react'

const PHASES = [
  { num: 1, name: 'Business Development', color: '#64748b' },
  { num: 2, name: 'Estimating', color: '#3b82f6' },
  { num: 3, name: 'Contract & Award', color: '#8b5cf6' },
  { num: 4, name: 'Preconstruction', color: '#f97316' },
  { num: 5, name: 'Project Execution', color: '#10b981' },
  { num: 6, name: 'Safety & QA/QC', color: '#ef4444' },
  { num: 7, name: 'Financial & Billing', color: '#22c55e' },
  { num: 8, name: 'Closeout', color: '#f59e0b' },
  { num: 9, name: 'Post-Project Review', color: '#6b7280' },
]

const MOCK_PROJECTS = [
  {
    id: 1, number: '25-0142', name: 'Penn Medicine Cardiac Wing',
    customer: 'Turner Construction', pm: "Jim O'Driscoll", sector: 'Healthcare',
    phase: 5, status: 'on-track', contractValue: '$2,450,000', daysInPhase: 23,
    billingPct: 45, sopComplete: 78, union: 'Local 98', openActionItems: 3, openRFIs: 2, openCOs: 1,
  },
  {
    id: 2, number: '25-0187', name: 'Temple University STEM Building',
    customer: 'Gilbane Building Co.', pm: 'Damion Covelens', sector: 'Education',
    phase: 3, status: 'at-risk', contractValue: '$1,820,000', daysInPhase: 8,
    billingPct: 0, sopComplete: 55, union: 'Local 98', openActionItems: 7, openRFIs: 0, openCOs: 0,
  },
  {
    id: 3, number: '25-0093', name: 'Reading Terminal Market Renovation',
    customer: 'Reading Terminal Authority', pm: 'Ray Reichenbach', sector: 'Commercial',
    phase: 7, status: 'overdue', contractValue: '$890,000', daysInPhase: 41,
    billingPct: 82, sopComplete: 91, union: 'Local 98', openActionItems: 5, openRFIs: 4, openCOs: 2,
  },
  {
    id: 4, number: '26-0011', name: 'Amazon Data Center — Phase 2',
    customer: 'Amazon Web Services', pm: 'Brian Fischer', sector: 'Data Center',
    phase: 2, status: 'on-track', contractValue: '$4,100,000', daysInPhase: 5,
    billingPct: 0, sopComplete: 30, union: 'Local 654', openActionItems: 2, openRFIs: 0, openCOs: 0,
  },
  {
    id: 5, number: '25-0201', name: 'Philadelphia Gov Center Electrical Upgrade',
    customer: 'City of Philadelphia', pm: "Jim O'Driscoll", sector: 'Government',
    phase: 4, status: 'on-track', contractValue: '$3,250,000', daysInPhase: 14,
    billingPct: 12, sopComplete: 62, union: 'Local 98', openActionItems: 4, openRFIs: 1, openCOs: 0,
  },
  {
    id: 6, number: '25-0155', name: 'Rhoads Navy Yard Industrial',
    customer: 'Rhoads Industries', pm: 'Damion Covelens', sector: 'Industrial',
    phase: 8, status: 'on-track', contractValue: '$680,000', daysInPhase: 12,
    billingPct: 95, sopComplete: 88, union: 'Local 126', openActionItems: 1, openRFIs: 0, openCOs: 0,
  },
]

const STATUS_CONFIG = {
  'on-track': { label: 'On Track', bg: '#dcfce7', text: '#16a34a', dot: '#16a34a' },
  'at-risk':  { label: 'At Risk',  bg: '#fef9c3', text: '#ca8a04', dot: '#ca8a04' },
  'overdue':  { label: 'Overdue',  bg: '#fee2e2', text: '#dc2626', dot: '#dc2626' },
}

const PM_COLORS = {
  "Jim O'Driscoll": '#ef4444',
  'Damion Covelens': '#22c55e',
  'Ray Reichenbach': '#3b82f6',
  'Brian Fischer': '#f59e0b',
}

const FILTERS = ['All', 'On Track', 'At Risk', 'Overdue', 'Phase 1–3', 'Phase 4–6', 'Phase 7–9']

export default function Dashboard({ user, onLogout }) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = MOCK_PROJECTS.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.number.includes(search) ||
      p.customer.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'All') return true
    if (filter === 'On Track') return p.status === 'on-track'
    if (filter === 'At Risk') return p.status === 'at-risk'
    if (filter === 'Overdue') return p.status === 'overdue'
    if (filter === 'Phase 1–3') return p.phase <= 3
    if (filter === 'Phase 4–6') return p.phase >= 4 && p.phase <= 6
    if (filter === 'Phase 7–9') return p.phase >= 7
    return true
  })

  const totalActive = MOCK_PROJECTS.filter(p => p.phase >= 4 && p.phase <= 7).length
  const totalAtRisk = MOCK_PROJECTS.filter(p => p.status !== 'on-track').length
  const totalActions = MOCK_PROJECTS.reduce((sum, p) => sum + p.openActionItems, 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>

      {/* Header */}
      <header style={{ backgroundColor: '#1a2b4a' }} className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-white rounded w-8 h-8 flex items-center justify-center">
              <span className="font-black text-sm" style={{ color: '#1a2b4a' }}>L</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">LIBERTY</div>
              <div className="text-blue-300 text-xs leading-none">INTEGRATED SOLUTIONS</div>
            </div>
          </div>
          <div className="w-px h-8 bg-white opacity-20" />
          <span className="text-white font-semibold text-base">PC Lifecycle Board</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <span className="text-blue-300 text-xs font-medium">PM:</span>
            {Object.entries(PM_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-white text-xs">{name.split(' ').slice(0, 2).join(' ')}</span>
              </div>
            ))}
          </div>
          <span className="text-blue-200 text-sm">{user.name}</span>
          <button onClick={onLogout} className="bg-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-blue-50" style={{ color: '#1a2b4a' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Live bar */}
      <div style={{ backgroundColor: '#1e3a5f' }} className="px-6 py-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-400 text-xs font-medium">Live — updates sync automatically across all users</span>
        <span className="text-blue-300 text-xs ml-4">{MOCK_PROJECTS.length} active projects</span>
      </div>

      {/* Summary Cards */}
      <div className="px-6 pt-5 pb-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects',       value: MOCK_PROJECTS.length, color: '#1a2b4a' },
          { label: 'In Execution (Ph 4–7)', value: totalActive,          color: '#10b981' },
          { label: 'Need Attention',        value: totalAtRisk,           color: '#f59e0b' },
          { label: 'Open Action Items',     value: totalActions,          color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
            <div className="text-sm text-gray-500 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="px-6 py-3 flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition"
            style={{
              backgroundColor: filter === f ? '#1a2b4a' : 'white',
              color: filter === f ? 'white' : '#374151',
              border: `1px solid ${filter === f ? '#1a2b4a' : '#e5e7eb'}`,
            }}
          >
            {f}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto border border-gray-200 rounded-lg px-4 py-1.5 text-sm focus:outline-none bg-white"
          style={{ width: '220px' }}
        />
      </div>

      {/* Project Cards */}
      <div className="px-6 pb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(project => {
          const phase  = PHASES[project.phase - 1]
          const status = STATUS_CONFIG[project.status]
          const pmColor = PM_COLORS[project.pm] || '#64748b'

          return (
            <div key={project.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">

              {/* Card Header */}
              <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{project.number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: phase.color }}>
                      Phase {project.phase}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{project.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{project.customer}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shrink-0"
                  style={{ backgroundColor: status.bg, color: status.text }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                  {status.label}
                </span>
              </div>

              {/* Phase Progress Bar */}
              <div className="px-5 pb-3">
                <div className="flex gap-0.5">
                  {PHASES.map(p => (
                    <div key={p.num} className="h-1.5 flex-1 rounded-full"
                      style={{ backgroundColor: p.num <= project.phase ? phase.color : '#e5e7eb', opacity: p.num === project.phase ? 1 : p.num < project.phase ? 0.5 : 0.2 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs font-medium" style={{ color: phase.color }}>{phase.name}</span>
                  <span className="text-xs text-gray-400">{project.daysInPhase}d in phase</span>
                </div>
              </div>

              {/* Stats */}
              <div className="px-5 pb-3 grid grid-cols-3 gap-2">
                {[
                  { label: 'Contract',  value: project.contractValue },
                  { label: 'Billed',    value: `${project.billingPct}%` },
                  { label: 'SOP Done',  value: `${project.sopComplete}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-gray-50 rounded-lg py-2">
                    <div className="text-sm font-bold text-gray-800">{value}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pmColor }} />
                  <span className="text-xs text-gray-600">{project.pm}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {project.openActionItems > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" />{project.openActionItems} actions</span>}
                  {project.openRFIs > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{project.openRFIs} RFIs</span>}
                  {project.openCOs > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" />{project.openCOs} COs</span>}
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}