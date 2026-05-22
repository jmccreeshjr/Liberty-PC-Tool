import { useParams, useNavigate } from 'react-router-dom'

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

const SOP_TASKS = {
  1: [
    { id: 1, role: 'PC', task: 'Receive lead and create customer profile in Project HQ', done: true },
    { id: 2, role: 'PC', task: 'Create OneDrive project folder with correct naming convention', done: true },
    { id: 3, role: 'Sales Rep', task: 'Assign Sales Rep / Account Rep in Project HQ', done: true },
    { id: 4, role: 'PC', task: 'Log inquiry into Building Connected project pipeline', done: false },
    { id: 5, role: 'Lead Estimator', task: 'Complete Bid/No-Bid qualification summary', done: false },
    { id: 6, role: 'PC', task: 'Submit prequalification package if required', done: false },
  ],
  2: [
    { id: 1, role: 'PC', task: 'Download all bid documents and file in 01_Bid_Documents', done: true },
    { id: 2, role: 'PC', task: 'Build estimating schedule and add bid date to calendar', done: true },
    { id: 3, role: 'Estimator', task: 'Configure Accubid job file with labor rates and union local', done: true },
    { id: 4, role: 'Estimator', task: 'Complete quantity takeoff by cost code in Accubid', done: true },
    { id: 5, role: 'Estimator', task: 'Issue RFQs to subcontractors via Building Connected', done: false },
    { id: 6, role: 'Estimator', task: 'Complete estimate review and apply final markup', done: false },
    { id: 7, role: 'PC', task: 'Submit proposal and capture email trace in Project HQ', done: false },
  ],
  3: [
    { id: 1, role: 'PC', task: 'Receive award notification and update all systems', done: true },
    { id: 2, role: 'PC', task: 'Assign Project Manager and transfer estimate package', done: true },
    { id: 3, role: 'PC', task: 'Request Certificate of Insurance from EHD', done: false },
    { id: 4, role: 'PM', task: 'Review contract scope, schedule, and payment terms', done: false },
    { id: 5, role: 'Accounting', task: 'Set up job in Foundation once PM written approval received', done: false },
    { id: 6, role: 'PC', task: 'Execute contract and deliver W9 and COI to customer', done: false },
  ],
  4: [
    { id: 1, role: 'Estimator', task: 'Organize OneDrive folder and prepare Ops Budget workbook', done: true },
    { id: 2, role: 'PC', task: 'Schedule and conduct Estimating Turnover Meeting', done: true },
    { id: 3, role: 'PM', task: 'Fill in SOV/Budget table in PMIS from Ops Budget hours', done: true },
    { id: 4, role: 'PM', task: 'Transfer budget to Foundation by cost code', done: false },
    { id: 5, role: 'PM', task: 'Develop baseline schedule in Procore', done: false },
    { id: 6, role: 'Purchasing', task: 'Issue purchase orders from Ops Budget Export', done: false },
    { id: 7, role: 'Ops Manager', task: 'Contact union hall and confirm crew dispatch', done: false },
    { id: 8, role: 'Safety', task: 'Create Safety HQ job file and site safety plan', done: false },
  ],
  5: [
    { id: 1, role: 'Foreman', task: 'Conduct Day 1 site orientation and first toolbox talk', done: true },
    { id: 2, role: 'Foreman', task: 'Complete Procore daily log each working day', done: true },
    { id: 3, role: 'PM', task: 'Review and approve prior day daily log each morning', done: true },
    { id: 4, role: 'PM', task: 'Submit RFIs within 24 hours of identifying field questions', done: false },
    { id: 5, role: 'PM', task: 'Hold weekly project update meeting and update Procore schedule', done: false },
    { id: 6, role: 'PC', task: 'Chair monthly Financial Controls Meeting', done: false },
    { id: 7, role: 'PM', task: 'Document and submit all change orders through Procore', done: false },
  ],
  6: [
    { id: 1, role: 'Foreman', task: 'Conduct and log daily toolbox talk in Safety HQ and Procore', done: true },
    { id: 2, role: 'Safety', task: 'Verify all Remarcable worker clearances are current', done: true },
    { id: 3, role: 'Foreman', task: 'Conduct weekly site safety inspection', done: false },
    { id: 4, role: 'Accounting', task: 'Submit certified payroll on required schedule if prevailing wage', done: false },
    { id: 5, role: 'Safety', task: 'Document any incidents in Safety HQ within same shift', done: false },
  ],
  7: [
    { id: 1, role: 'PM', task: 'Identify projects to bill during weekly PM meeting', done: true },
    { id: 2, role: 'PM', task: 'Fill out pencil copy of billing and send to customer for approval', done: true },
    { id: 3, role: 'Accounting', task: 'Enter invoice in Foundation once PM written approval received', done: false },
    { id: 4, role: 'PM', task: 'Collect conditional lien waivers from subs with each payment', done: false },
    { id: 5, role: 'PC', task: 'Monitor open change orders through full approval cycle', done: false },
  ],
  8: [
    { id: 1, role: 'PM', task: 'Populate substantial completion date to trigger closeout tasks', done: true },
    { id: 2, role: 'PC', task: 'Compile closeout docs: as-builts, O&M manuals, warranties', done: false },
    { id: 3, role: 'PC', task: 'Submit closeout package to customer and obtain acceptance', done: false },
    { id: 4, role: 'Accounting', task: 'Confirm final billing released and retention collected', done: false },
    { id: 5, role: 'PC', task: 'Schedule and chair Closeout / Lessons Learned Meeting', done: false },
  ],
  9: [
    { id: 1, role: 'PC', task: 'Prepare Final Job Report', done: false },
    { id: 2, role: 'PC', task: 'Archive project in Foundation, Project HQ, Accubid, and OneDrive', done: false },
    { id: 3, role: 'PC', task: 'Log lessons learned to firm knowledge base', done: false },
    { id: 4, role: 'Sales Rep', task: 'Initiate BD follow-up for next opportunity with customer', done: false },
  ],
}

const MOCK_PROJECTS = [
  { id: 1, number: '25-0142', name: 'Penn Medicine Cardiac Wing', customer: 'Turner Construction', pm: "Jim O'Driscoll", sector: 'Healthcare', phase: 5, status: 'on-track', contractValue: '$2,450,000', daysInPhase: 23, billingPct: 45, sopComplete: 78, union: 'Local 98', startDate: 'Mar 3, 2025', completionDate: 'Nov 14, 2025', openActionItems: 3, openRFIs: 2, openCOs: 1 },
  { id: 2, number: '25-0187', name: 'Temple University STEM Building', customer: 'Gilbane Building Co.', pm: 'Damion Covelens', sector: 'Education', phase: 3, status: 'at-risk', contractValue: '$1,820,000', daysInPhase: 8, billingPct: 0, sopComplete: 55, union: 'Local 98', startDate: 'Jun 1, 2025', completionDate: 'Feb 28, 2026', openActionItems: 7, openRFIs: 0, openCOs: 0 },
  { id: 3, number: '25-0093', name: 'Reading Terminal Market Renovation', customer: 'Reading Terminal Authority', pm: 'Ray Reichenbach', sector: 'Commercial', phase: 7, status: 'overdue', contractValue: '$890,000', daysInPhase: 41, billingPct: 82, sopComplete: 91, union: 'Local 98', startDate: 'Oct 14, 2024', completionDate: 'Jun 30, 2025', openActionItems: 5, openRFIs: 4, openCOs: 2 },
  { id: 4, number: '26-0011', name: 'Amazon Data Center — Phase 2', customer: 'Amazon Web Services', pm: 'Brian Fischer', sector: 'Data Center', phase: 2, status: 'on-track', contractValue: '$4,100,000', daysInPhase: 5, billingPct: 0, sopComplete: 30, union: 'Local 654', startDate: 'TBD', completionDate: 'TBD', openActionItems: 2, openRFIs: 0, openCOs: 0 },
  { id: 5, number: '25-0201', name: 'Philadelphia Gov Center Electrical Upgrade', customer: 'City of Philadelphia', pm: "Jim O'Driscoll", sector: 'Government', phase: 4, status: 'on-track', contractValue: '$3,250,000', daysInPhase: 14, billingPct: 12, sopComplete: 62, union: 'Local 98', startDate: 'Jul 7, 2025', completionDate: 'Mar 31, 2026', openActionItems: 4, openRFIs: 1, openCOs: 0 },
  { id: 6, number: '25-0155', name: 'Rhoads Navy Yard Industrial', customer: 'Rhoads Industries', pm: 'Damion Covelens', sector: 'Industrial', phase: 8, status: 'on-track', contractValue: '$680,000', daysInPhase: 12, billingPct: 95, sopComplete: 88, union: 'Local 126', startDate: 'Aug 19, 2024', completionDate: 'May 30, 2025', openActionItems: 1, openRFIs: 0, openCOs: 0 },
]

const STATUS_CONFIG = {
  'on-track': { label: 'On Track', bg: '#dcfce7', text: '#16a34a', dot: '#16a34a' },
  'at-risk':  { label: 'At Risk',  bg: '#fef9c3', text: '#ca8a04', dot: '#ca8a04' },
  'overdue':  { label: 'Overdue',  bg: '#fee2e2', text: '#dc2626', dot: '#dc2626' },
}

const ROLE_COLORS = {
  'PC':            { bg: '#dbeafe', text: '#1d4ed8' },
  'PM':            { bg: '#f3e8ff', text: '#7c3aed' },
  'Estimator':     { bg: '#fef9c3', text: '#ca8a04' },
  'Accounting':    { bg: '#dcfce7', text: '#16a34a' },
  'Foreman':       { bg: '#fee2e2', text: '#dc2626' },
  'Safety':        { bg: '#ffedd5', text: '#ea580c' },
  'Purchasing':    { bg: '#e0f2fe', text: '#0369a1' },
  'Ops Manager':   { bg: '#f1f5f9', text: '#475569' },
  'Sales Rep':     { bg: '#fce7f3', text: '#be185d' },
  'Lead Estimator':{ bg: '#fef9c3', text: '#ca8a04' },
}

export default function ProjectDetail({ user, onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = MOCK_PROJECTS.find(p => p.id === parseInt(id))

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="text-center">
        <p className="text-gray-500 text-lg">Project not found.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: '#1a2b4a' }}>Back to Dashboard</button>
      </div>
    </div>
  )

  const phase = PHASES[project.phase - 1]
  const status = STATUS_CONFIG[project.status]
  const tasks = SOP_TASKS[project.phase] || []
  const doneTasks = tasks.filter(t => t.done).length

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
          <button onClick={() => navigate('/dashboard')} className="text-blue-300 text-sm hover:text-white transition">
            ← PC Lifecycle Board
          </button>
          <div className="w-px h-8 bg-white opacity-20" />
          <span className="text-white font-semibold text-sm">{project.number} — {project.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm">{user.name}</span>
          <button onClick={onLogout} className="bg-white text-sm font-medium px-4 py-1.5 rounded-full" style={{ color: '#1a2b4a' }}>Sign Out</button>
        </div>
      </header>

      <div className="px-6 py-6 max-w-6xl mx-auto">

        {/* Project Header Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono text-gray-400">{project.number}</span>
                <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: phase.color }}>Phase {project.phase} — {phase.name}</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: status.bg, color: status.text }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />{status.label}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-500 mt-1">{project.customer} · {project.sector} · {project.union}</p>
            </div>
            <div className="flex gap-3">
              {[
                { label: 'Contract Value', value: project.contractValue },
                { label: 'Billed', value: `${project.billingPct}%` },
                { label: 'Start Date', value: project.startDate },
                { label: 'Completion', value: project.completionDate },
              ].map(({ label, value }) => (
                <div key={label} className="text-center bg-gray-50 rounded-lg px-4 py-3">
                  <div className="text-sm font-bold text-gray-800">{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Progress Bar */}
          <div className="mt-5">
            <div className="flex gap-1">
              {PHASES.map(p => (
                <div key={p.num} className="flex-1">
                  <div className="h-2 rounded-full mb-1" style={{ backgroundColor: p.num <= project.phase ? phase.color : '#e5e7eb', opacity: p.num === project.phase ? 1 : p.num < project.phase ? 0.5 : 0.2 }} />
                  <div className="text-center" style={{ fontSize: '9px', color: p.num === project.phase ? phase.color : '#9ca3af', fontWeight: p.num === project.phase ? 700 : 400 }}>Ph {p.num}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* SOP Checklist */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Phase {project.phase} SOP Checklist</h2>
                <p className="text-sm text-gray-500">{phase.name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: phase.color }}>{doneTasks}/{tasks.length}</div>
                <div className="text-xs text-gray-400">steps complete</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
              <div className="h-2 rounded-full transition-all" style={{ width: `${(doneTasks / tasks.length) * 100}%`, backgroundColor: phase.color }} />
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {tasks.map(task => {
                const roleStyle = ROLE_COLORS[task.role] || { bg: '#f1f5f9', text: '#475569' }
                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: task.done ? '#f0fdf4' : '#fafafa', border: `1px solid ${task.done ? '#bbf7d0' : '#e5e7eb'}` }}>
                    <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: task.done ? '#16a34a' : '#e5e7eb' }}>
                      {task.done && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800" style={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#9ca3af' : '#1f2937' }}>{task.task}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: roleStyle.bg, color: roleStyle.text }}>{task.role}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">

            {/* PM Info */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Project Team</h3>
              {[
                { role: 'Project Manager', name: project.pm },
                { role: 'Union Local', name: project.union },
                { role: 'Sector', name: project.sector },
              ].map(({ role, name }) => (
                <div key={role} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500">{role}</span>
                  <span className="text-xs font-semibold text-gray-800">{name}</span>
                </div>
              ))}
            </div>

            {/* Open Items */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Open Items</h3>
              {[
                { label: 'Action Items', value: project.openActionItems, color: '#f97316' },
                { label: 'Open RFIs', value: project.openRFIs, color: '#3b82f6' },
                { label: 'Open Change Orders', value: project.openCOs, color: '#8b5cf6' },
                { label: 'Days in Phase', value: project.daysInPhase, color: '#64748b' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-bold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: '+ Create Action Item', color: '#1a2b4a' },
                  { label: '↗ Open OneDrive Folder', color: '#0369a1' },
                  { label: '↗ Open in Procore', color: '#ea580c' },
                ].map(({ label, color }) => (
                  <button key={label} className="w-full text-left text-xs font-medium px-3 py-2 rounded-lg border transition hover:opacity-80"
                    style={{ borderColor: color, color }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}