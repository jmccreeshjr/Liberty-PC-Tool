import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, seedProjectTasks, updateTask, advancePhase, getProjectActionItems, createActionItem, updateActionItem, deleteActionItem } from '../api'
import EditProjectPanel from '../components/EditProjectPanel'

const PHASES = [
  { num: 1, name: 'Business Development', color: '#64748b' },
  { num: 2, name: 'Estimating',           color: '#3b82f6' },
  { num: 3, name: 'Contract & Award',     color: '#8b5cf6' },
  { num: 4, name: 'Preconstruction',      color: '#f97316' },
  { num: 5, name: 'Project Execution',    color: '#10b981' },
  { num: 6, name: 'Safety & QA/QC',      color: '#ef4444' },
  { num: 7, name: 'Financial & Billing',  color: '#22c55e' },
  { num: 8, name: 'Closeout',             color: '#f59e0b' },
  { num: 9, name: 'Post-Project Review',  color: '#6b7280' },
]

// Maps login role → which SOP roles they can check off
const ROLE_PERMISSIONS = {
  'Project Coordinator': ['PC', 'Sales Rep', 'Lead Estimator', 'Estimator', 'PM', 'Accounting', 'Foreman', 'Safety', 'Purchasing', 'Ops Manager'],
  'Executive':           [], // read-only
  'Project Manager':     ['PM'],
  'Estimator':           ['Estimator', 'Lead Estimator'],
  'Foreman':             ['Foreman'],
  'Accounting':          ['Accounting'],
  'Purchasing':          ['Purchasing'],
  'Safety':              ['Safety'],
}

const MOCK_PROJECTS = [
  { id: '1', number: '25-0142', name: 'Penn Medicine Cardiac Wing',            customer: 'Turner Construction',      pm: "Jim O'Driscoll",  sector: 'Healthcare',  phase: 5, status: 'on-track', contractValue: '$2,450,000', daysInPhase: 23, billingPct: 45, sopComplete: 78, union: 'Local 98',  startDate: 'Mar 3, 2025',  completionDate: 'Nov 14, 2025', openActionItems: 3, openRFIs: 2, openCOs: 1 },
  { id: '2', number: '25-0187', name: 'Temple University STEM Building',       customer: 'Gilbane Building Co.',     pm: 'Damion Covelens', sector: 'Education',   phase: 3, status: 'at-risk', contractValue: '$1,820,000', daysInPhase: 8,  billingPct: 0,  sopComplete: 55, union: 'Local 98',  startDate: 'Jun 1, 2025',  completionDate: 'Feb 28, 2026', openActionItems: 7, openRFIs: 0, openCOs: 0 },
  { id: '3', number: '25-0093', name: 'Reading Terminal Market Renovation',    customer: 'Reading Terminal Authority', pm: 'Ray Reichenbach', sector: 'Commercial', phase: 7, status: 'overdue', contractValue: '$890,000',   daysInPhase: 41, billingPct: 82, sopComplete: 91, union: 'Local 98',  startDate: 'Oct 14, 2024', completionDate: 'Jun 30, 2025', openActionItems: 5, openRFIs: 4, openCOs: 2 },
  { id: '4', number: '26-0011', name: 'Amazon Data Center — Phase 2',          customer: 'Amazon Web Services',      pm: 'Brian Fischer',   sector: 'Data Center', phase: 2, status: 'on-track', contractValue: '$4,100,000', daysInPhase: 5,  billingPct: 0,  sopComplete: 30, union: 'Local 654', startDate: 'TBD',          completionDate: 'TBD',          openActionItems: 2, openRFIs: 0, openCOs: 0 },
  { id: '5', number: '25-0201', name: 'Philadelphia Gov Center Electrical',    customer: 'City of Philadelphia',     pm: "Jim O'Driscoll",  sector: 'Government',  phase: 4, status: 'on-track', contractValue: '$3,250,000', daysInPhase: 14, billingPct: 12, sopComplete: 62, union: 'Local 98',  startDate: 'Jul 7, 2025',  completionDate: 'Mar 31, 2026', openActionItems: 4, openRFIs: 1, openCOs: 0 },
  { id: '6', number: '25-0155', name: 'Rhoads Navy Yard Industrial',           customer: 'Rhoads Industries',        pm: 'Damion Covelens', sector: 'Industrial',  phase: 8, status: 'on-track', contractValue: '$680,000',   daysInPhase: 12, billingPct: 95, sopComplete: 88, union: 'Local 126', startDate: 'Aug 19, 2024', completionDate: 'May 30, 2025', openActionItems: 1, openRFIs: 0, openCOs: 0 },
]

const STATUS_CONFIG = {
  'on-track': { label: 'On Track', bg: '#dcfce7', text: '#16a34a', dot: '#16a34a' },
  'On Track': { label: 'On Track', bg: '#dcfce7', text: '#16a34a', dot: '#16a34a' },
  'at-risk':  { label: 'At Risk',  bg: '#fef9c3', text: '#ca8a04', dot: '#ca8a04' },
  'At Risk':  { label: 'At Risk',  bg: '#fef9c3', text: '#ca8a04', dot: '#ca8a04' },
  'overdue':  { label: 'Overdue',  bg: '#fee2e2', text: '#dc2626', dot: '#dc2626' },
  'Overdue':  { label: 'Overdue',  bg: '#fee2e2', text: '#dc2626', dot: '#dc2626' },
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

function normalizeApiProject(p) {
  const fmtDate = (d) => {
    if (!d) return 'TBD'
    if (d.includes('-') && d.length >= 10) {
      const dt = new Date(d + 'T00:00:00')
      return isNaN(dt) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    return d
  }
  return {
    id:             p._id,
    number:         p.number         || '',
    name:           p.name           || '',
    customer:       p.customer       || '',
    pm:             p.pm             || '',
    sector:         p.sector         || '',
    union:          p.union          || '',
    phase:          p.phase          || 1,
    status:         p.status         || 'On Track',
    contractValue:  p.contractValue != null ? `$${Number(p.contractValue).toLocaleString()}` : 'TBD',
    billingPct:     p.billingPercent ?? p.billingPct ?? 0,
    sopComplete:    p.sopComplete    || 0,
    openActionItems:p.openItems      ?? p.openActionItems ?? 0,
    openRFIs:       p.openRFIs       || 0,
    openCOs:        p.openCOs        || 0,
    daysInPhase:    p.daysInPhase    || 0,
    startDate:      fmtDate(p.startDate),
    completionDate: fmtDate(p.completionDate),
    sopTasks:       p.sopTasks       || [],
  }
}

export default function ProjectDetail({ user, onLogout }) {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [project,       setProject]       = useState(null)
  const [sopTasks,      setSopTasks]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [source,        setSource]        = useState(null) // 'api' | 'mock'
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [advancing,     setAdvancing]     = useState(false)
  const [advanceError,  setAdvanceError]  = useState('')
  const [togglingTask,  setTogglingTask]  = useState(null) // taskId being saved

  // Action Items tab
  const [activeTab,       setActiveTab]       = useState('sop') // 'sop' | 'actions'
  const [actionItems,     setActionItems]     = useState([])
  const [actionsLoading,  setActionsLoading]  = useState(false)
  const [showActionForm,  setShowActionForm]  = useState(false)
  const [updatingAction,  setUpdatingAction]  = useState(null)
  const [deletingAction,  setDeletingAction]  = useState(null)
  const [actionForm,      setActionForm]      = useState({
    title: '', description: '', assignedTo: '', assignedRole: '', priority: 'Medium', dueDate: '',
  })
  const [actionSaving,    setActionSaving]    = useState(false)

  // Which SOP roles this user can check off
  const canEditRoles = ROLE_PERMISSIONS[user?.role] || []
  const isReadOnly   = canEditRoles.length === 0

  const loadProject = useCallback(() => {
    setLoading(true)
    getProject(id)
      .then(async data => {
        if (data && data._id) {
          // If project has no SOP tasks yet, seed them now
          let projectData = data
          if (!data.sopTasks || data.sopTasks.length === 0) {
            projectData = await seedProjectTasks(data._id)
          }
          const normalized = normalizeApiProject(projectData)
          setProject(normalized)
          setSopTasks(projectData.sopTasks || [])
          setSource('api')
        } else {
          const mock = MOCK_PROJECTS.find(p => p.id === id || p.id === String(id))
          setProject(mock || null)
          setSopTasks([])
          setSource('mock')
        }
      })
      .catch(() => {
        const mock = MOCK_PROJECTS.find(p => p.id === id || p.id === String(id))
        setProject(mock || null)
        setSopTasks([])
        setSource('mock')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadProject() }, [loadProject])

  const handleToggleTask = async (task) => {
    if (isReadOnly) return
    if (!canEditRoles.includes(task.role)) return
    if (togglingTask) return // prevent double-clicks

    setTogglingTask(task.id)
    try {
      const newDone = !task.done
      const updated = await updateTask(id, task.id, newDone, user.name)
      if (updated && updated.sopTasks) {
        setSopTasks(updated.sopTasks)
        setProject(prev => ({ ...prev, sopComplete: updated.sopComplete || prev.sopComplete }))
      }
    } catch (err) {
      console.error('Failed to toggle task', err)
    } finally {
      setTogglingTask(null)
    }
  }

  const handleAdvancePhase = async () => {
    setAdvancing(true)
    setAdvanceError('')
    try {
      const updated = await advancePhase(id)
      if (updated.message) {
        // Server returned an error message
        setAdvanceError(updated.message)
      } else {
        // Success — reload
        loadProject()
      }
    } catch (err) {
      setAdvanceError('Failed to advance phase. Please try again.')
    } finally {
      setAdvancing(false)
    }
  }

  // Load action items when switching to Actions tab (API projects only)
  const loadActionItems = useCallback(() => {
    if (source !== 'api') return
    setActionsLoading(true)
    getProjectActionItems(id)
      .then(data => setActionItems(Array.isArray(data) ? data : []))
      .catch(() => setActionItems([]))
      .finally(() => setActionsLoading(false))
  }, [id, source])

  useEffect(() => {
    if (activeTab === 'actions' && source === 'api') loadActionItems()
  }, [activeTab, source, loadActionItems])

  const handleCreateAction = async (e) => {
    e.preventDefault()
    if (!actionForm.title.trim()) return
    setActionSaving(true)
    try {
      const payload = {
        ...actionForm,
        projectId:     id,
        projectName:   project?.name   || '',
        projectNumber: project?.number || '',
        createdBy:     user.name,
        dueDate:       actionForm.dueDate || null,
      }
      const created = await createActionItem(payload)
      setActionItems(prev => [created, ...prev])
      setActionForm({ title: '', description: '', assignedTo: '', assignedRole: '', priority: 'Medium', dueDate: '' })
      setShowActionForm(false)
    } catch (err) {
      console.error('Failed to create action item', err)
    } finally {
      setActionSaving(false)
    }
  }

  const handleActionStatusChange = async (item, newStatus) => {
    setUpdatingAction(item._id)
    try {
      const updated = await updateActionItem(item._id, { status: newStatus })
      setActionItems(prev => prev.map(i => i._id === item._id ? updated : i))
    } catch (err) {
      console.error('Failed to update action item', err)
    } finally {
      setUpdatingAction(null)
    }
  }

  const handleDeleteAction = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    setDeletingAction(item._id)
    try {
      await deleteActionItem(item._id)
      setActionItems(prev => prev.filter(i => i._id !== item._id))
    } catch (err) {
      console.error('Failed to delete action item', err)
    } finally {
      setDeletingAction(null)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
      <div style={{ textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
        <p style={{ fontSize: '15px' }}>Loading project...</p>
      </div>
    </div>
  )

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="text-center">
        <p className="text-gray-500 text-lg">Project not found.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: '#1a2b4a' }}>Back to Dashboard</button>
      </div>
    </div>
  )

  const phase     = PHASES[project.phase - 1]
  const status    = STATUS_CONFIG[project.status] || STATUS_CONFIG['On Track']
  const isPC      = user?.role === 'Project Coordinator'

  // Tasks for current phase from DB (or empty for mock)
  const phaseTasks    = sopTasks.filter(t => t.phase === project.phase)
  const doneTasks     = phaseTasks.filter(t => t.done).length
  const requiredTasks = phaseTasks.filter(t => t.required)
  const allRequiredDone = requiredTasks.length > 0 && requiredTasks.every(t => t.done)

  // For mock projects, fall back to a simple hardcoded display
  const mockTaskMap = {
    1: [{id:'m1',role:'PC',task:'Receive lead and create customer profile in Project HQ',done:true,required:true},{id:'m2',role:'PC',task:'Create OneDrive project folder with correct naming convention',done:true,required:true},{id:'m3',role:'Sales Rep',task:'Assign Sales Rep / Account Rep in Project HQ',done:true,required:false},{id:'m4',role:'PC',task:'Log inquiry into Building Connected project pipeline',done:false,required:true},{id:'m5',role:'Lead Estimator',task:'Complete Bid/No-Bid qualification summary',done:false,required:true},{id:'m6',role:'PC',task:'Submit prequalification package if required',done:false,required:false}],
    2: [{id:'m1',role:'PC',task:'Download all bid documents and file in 01_Bid_Documents',done:true,required:true},{id:'m2',role:'PC',task:'Build estimating schedule and add bid date to calendar',done:true,required:true},{id:'m3',role:'Estimator',task:'Configure Accubid job file with labor rates and union local',done:true,required:true},{id:'m4',role:'Estimator',task:'Complete quantity takeoff by cost code in Accubid',done:true,required:true},{id:'m5',role:'Estimator',task:'Issue RFQs to subcontractors via Building Connected',done:false,required:true},{id:'m6',role:'Estimator',task:'Complete estimate review and apply final markup',done:false,required:true},{id:'m7',role:'PC',task:'Submit proposal and capture email trace in Project HQ',done:false,required:true}],
    3: [{id:'m1',role:'PC',task:'Receive award notification and update all systems',done:true,required:true},{id:'m2',role:'PC',task:'Assign Project Manager and transfer estimate package',done:true,required:true},{id:'m3',role:'PC',task:'Request Certificate of Insurance from EHD',done:false,required:true},{id:'m4',role:'PM',task:'Review contract scope, schedule, and payment terms',done:false,required:true},{id:'m5',role:'Accounting',task:'Set up job in Foundation once PM written approval received',done:false,required:true},{id:'m6',role:'PC',task:'Execute contract and deliver W9 and COI to customer',done:false,required:true}],
    4: [{id:'m1',role:'Estimator',task:'Organize OneDrive folder and prepare Ops Budget workbook',done:true,required:true},{id:'m2',role:'PC',task:'Schedule and conduct Estimating Turnover Meeting',done:true,required:true},{id:'m3',role:'PM',task:'Fill in SOV/Budget table in PMIS from Ops Budget hours',done:true,required:true},{id:'m4',role:'PM',task:'Transfer budget to Foundation by cost code',done:false,required:true},{id:'m5',role:'PM',task:'Develop baseline schedule in Procore',done:false,required:true},{id:'m6',role:'Purchasing',task:'Issue purchase orders from Ops Budget Export',done:false,required:true},{id:'m7',role:'Ops Manager',task:'Contact union hall and confirm crew dispatch',done:false,required:true},{id:'m8',role:'Safety',task:'Create Safety HQ job file and site safety plan',done:false,required:true}],
    5: [{id:'m1',role:'Foreman',task:'Conduct Day 1 site orientation and first toolbox talk',done:true,required:true},{id:'m2',role:'Foreman',task:'Complete Procore daily log each working day',done:true,required:true},{id:'m3',role:'PM',task:'Review and approve prior day daily log each morning',done:true,required:true},{id:'m4',role:'PM',task:'Submit RFIs within 24 hours of identifying field questions',done:false,required:true},{id:'m5',role:'PM',task:'Hold weekly project update meeting and update Procore schedule',done:false,required:true},{id:'m6',role:'PC',task:'Chair monthly Financial Controls Meeting',done:false,required:true},{id:'m7',role:'PM',task:'Document and submit all change orders through Procore',done:false,required:true}],
    6: [{id:'m1',role:'Foreman',task:'Conduct and log daily toolbox talk in Safety HQ and Procore',done:true,required:true},{id:'m2',role:'Safety',task:'Verify all Remarcable worker clearances are current',done:true,required:true},{id:'m3',role:'Foreman',task:'Conduct weekly site safety inspection',done:false,required:true},{id:'m4',role:'Accounting',task:'Submit certified payroll on required schedule if prevailing wage',done:false,required:false},{id:'m5',role:'Safety',task:'Document any incidents in Safety HQ within same shift',done:false,required:false}],
    7: [{id:'m1',role:'PM',task:'Identify projects to bill during weekly PM meeting',done:true,required:true},{id:'m2',role:'PM',task:'Fill out pencil copy of billing and send to customer for approval',done:true,required:true},{id:'m3',role:'Accounting',task:'Enter invoice in Foundation once PM written approval received',done:false,required:true},{id:'m4',role:'PM',task:'Collect conditional lien waivers from subs with each payment',done:false,required:true},{id:'m5',role:'PC',task:'Monitor open change orders through full approval cycle',done:false,required:true}],
    8: [{id:'m1',role:'PM',task:'Populate substantial completion date to trigger closeout tasks',done:true,required:true},{id:'m2',role:'PC',task:'Compile closeout docs: as-builts, O&M manuals, warranties',done:false,required:true},{id:'m3',role:'PC',task:'Submit closeout package to customer and obtain acceptance',done:false,required:true},{id:'m4',role:'Accounting',task:'Confirm final billing released and retention collected',done:false,required:true},{id:'m5',role:'PC',task:'Schedule and chair Closeout / Lessons Learned Meeting',done:false,required:true}],
    9: [{id:'m1',role:'PC',task:'Prepare Final Job Report',done:false,required:true},{id:'m2',role:'PC',task:'Archive project in Foundation, Project HQ, Accubid, and OneDrive',done:false,required:true},{id:'m3',role:'PC',task:'Log lessons learned to firm knowledge base',done:false,required:true},{id:'m4',role:'Sales Rep',task:'Initiate BD follow-up for next opportunity with customer',done:false,required:false}],
  }
  const displayTasks = source === 'api' ? phaseTasks : (mockTaskMap[project.phase] || [])
  const displayDone  = displayTasks.filter(t => t.done).length

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
          {source === 'mock' && (
            <span style={{ backgroundColor: '#f59e0b', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              DEMO DATA
            </span>
          )}
          {source === 'api' && (
            <button onClick={() => setShowEditPanel(true)}
              style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              ✏ Edit Project
            </button>
          )}
          <span className="text-blue-200 text-sm">{user.name} — {user.role}</span>
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
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Contract Value', value: project.contractValue },
                { label: 'Billed',         value: `${project.billingPct}%` },
                { label: 'Start Date',     value: project.startDate },
                { label: 'Completion',     value: project.completionDate },
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

          {/* Main Panel — SOP Checklist + Action Items Tabs */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">

            {/* Tab Bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
              {[
                { key: 'sop',     label: `Phase ${project.phase} SOP Checklist` },
                { key: 'actions', label: `Action Items${actionItems.length > 0 ? ` (${actionItems.filter(i => i.status === 'Open' || i.status === 'In Progress').length} open)` : ''}` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '14px 16px', fontSize: '13px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer',
                    borderBottom: activeTab === tab.key ? `2px solid ${phase.color}` : '2px solid transparent',
                    color: activeTab === tab.key ? phase.color : '#6b7280',
                    marginBottom: '-1px',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>

              {/* ── SOP Checklist Tab ── */}
              {activeTab === 'sop' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">Phase {project.phase} — {phase.name}</h2>
                      {isReadOnly && (
                        <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>Read-only view</span>
                      )}
                      {!isReadOnly && source === 'api' && (
                        <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
                          You can check off <strong>{canEditRoles.join(', ')}</strong> tasks
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: phase.color }}>{displayDone}/{displayTasks.length}</div>
                      <div className="text-xs text-gray-400">steps complete</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${displayTasks.length > 0 ? (displayDone / displayTasks.length) * 100 : 0}%`, backgroundColor: phase.color }} />
                  </div>

                  {/* Phase Advance (PC only, API projects only) */}
                  {isPC && source === 'api' && project.phase < 9 && (
                    <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '8px', backgroundColor: allRequiredDone ? '#f0fdf4' : '#fafafa', border: `1px solid ${allRequiredDone ? '#bbf7d0' : '#e5e7eb'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: allRequiredDone ? '#16a34a' : '#374151', margin: 0 }}>
                            {allRequiredDone ? '✅ All required tasks complete — ready to advance' : `⏳ ${requiredTasks.filter(t => !t.done).length} required task(s) remaining before phase advance`}
                          </p>
                          {advanceError && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{advanceError}</p>}
                        </div>
                        <button
                          onClick={handleAdvancePhase}
                          disabled={!allRequiredDone || advancing}
                          style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: allRequiredDone && !advancing ? 'pointer' : 'not-allowed',
                            backgroundColor: allRequiredDone ? '#1a2b4a' : '#e5e7eb',
                            color: allRequiredDone ? 'white' : '#9ca3af',
                          }}
                        >
                          {advancing ? 'Advancing...' : `Advance to Phase ${project.phase + 1} →`}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Task list */}
                  <div className="space-y-3">
                    {displayTasks.map(task => {
                      const roleStyle  = ROLE_COLORS[task.role] || { bg: '#f1f5f9', text: '#475569' }
                      const canCheck   = source === 'api' && canEditRoles.includes(task.role)
                      const isToggling = togglingTask === task.id
                      const isOptional = task.required === false

                      return (
                        <div
                          key={task.id}
                          onClick={() => canCheck && !isToggling && handleToggleTask(task)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 12px', borderRadius: '8px',
                            backgroundColor: task.done ? '#f0fdf4' : '#fafafa',
                            border: `1px solid ${task.done ? '#bbf7d0' : '#e5e7eb'}`,
                            cursor: canCheck ? 'pointer' : 'default',
                            opacity: isToggling ? 0.6 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{
                            marginTop: '1px', width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: task.done ? '#16a34a' : canCheck ? 'white' : '#e5e7eb',
                            border: canCheck && !task.done ? '2px solid #d1d5db' : 'none',
                          }}>
                            {task.done && <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                            {isToggling && <span style={{ fontSize: '10px' }}>⋯</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', margin: 0, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#9ca3af' : '#1f2937' }}>
                              {task.task}
                              {isOptional && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px' }}>(optional)</span>}
                            </p>
                            {task.done && task.completedBy && (
                              <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>
                                ✓ {task.completedBy}{task.completedAt ? ` · ${new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                              </p>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', flexShrink: 0, backgroundColor: roleStyle.bg, color: roleStyle.text }}>
                            {task.role}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* ── Action Items Tab ── */}
              {activeTab === 'actions' && (
                <>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#111827' }}>Action Items</h2>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{project.name}</p>
                    </div>
                    {isPC && source === 'api' && (
                      <button
                        onClick={() => setShowActionForm(v => !v)}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#1a2b4a', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        {showActionForm ? '✕ Cancel' : '+ New Action Item'}
                      </button>
                    )}
                  </div>

                  {/* Create form (PC only) */}
                  {showActionForm && isPC && source === 'api' && (
                    <form onSubmit={handleCreateAction} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Title *</label>
                          <input
                            required value={actionForm.title}
                            onChange={e => setActionForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="What needs to be done?"
                            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Description</label>
                          <textarea
                            value={actionForm.description}
                            onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Additional details..."
                            rows={2}
                            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Assigned To</label>
                          <input
                            value={actionForm.assignedTo}
                            onChange={e => setActionForm(f => ({ ...f, assignedTo: e.target.value }))}
                            placeholder="Person's name"
                            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Role</label>
                          <select
                            value={actionForm.assignedRole}
                            onChange={e => setActionForm(f => ({ ...f, assignedRole: e.target.value }))}
                            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', boxSizing: 'border-box' }}>
                            <option value="">— Select role —</option>
                            {['Project Coordinator','Project Manager','Estimator','Foreman','Accounting','Purchasing','Safety','Executive'].map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Priority</label>
                          <select
                            value={actionForm.priority}
                            onChange={e => setActionForm(f => ({ ...f, priority: e.target.value }))}
                            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', boxSizing: 'border-box' }}>
                            {['Low','Medium','High','Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Due Date</label>
                          <input
                            type="date"
                            value={actionForm.dueDate}
                            onChange={e => setActionForm(f => ({ ...f, dueDate: e.target.value }))}
                            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setShowActionForm(false)}
                          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', fontSize: '13px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                        <button type="submit" disabled={actionSaving}
                          style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#1a2b4a', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                          {actionSaving ? 'Saving...' : 'Create Action Item'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Action items list */}
                  {actionsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '14px' }}>Loading...</div>
                  ) : actionItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
                      <p style={{ fontSize: '14px', margin: 0 }}>No action items yet{source === 'mock' ? ' (demo project)' : ''}.</p>
                      {isPC && source === 'api' && !showActionForm && (
                        <button onClick={() => setShowActionForm(true)}
                          style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#1a2b4a', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                          + Create First Action Item
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {actionItems.map(item => {
                        const priorityCfg = { Low: { bg: '#f1f5f9', text: '#64748b' }, Medium: { bg: '#dbeafe', text: '#1d4ed8' }, High: { bg: '#fef9c3', text: '#ca8a04' }, Critical: { bg: '#fee2e2', text: '#dc2626' } }[item.priority] || { bg: '#f1f5f9', text: '#64748b' }
                        const statusCfg   = { Open: { bg: '#fee2e2', text: '#dc2626' }, 'In Progress': { bg: '#fef9c3', text: '#ca8a04' }, Resolved: { bg: '#dcfce7', text: '#16a34a' }, Closed: { bg: '#f1f5f9', text: '#6b7280' } }[item.status] || { bg: '#f1f5f9', text: '#6b7280' }
                        const overdue     = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'Resolved' && item.status !== 'Closed'
                        const isUpdating  = updatingAction === item._id
                        const isDeleting  = deletingAction === item._id

                        return (
                          <div key={item._id} style={{
                            backgroundColor: '#fafafa', borderRadius: '8px', padding: '12px 14px',
                            border: `1px solid ${overdue ? '#fca5a5' : '#e5e7eb'}`,
                            opacity: isDeleting ? 0.4 : 1, transition: 'opacity 0.2s',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: '180px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{item.title}</span>
                                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '1px 7px', borderRadius: '999px', backgroundColor: priorityCfg.bg, color: priorityCfg.text }}>{item.priority}</span>
                                  {overdue && <span style={{ fontSize: '11px', fontWeight: '600', padding: '1px 7px', borderRadius: '999px', backgroundColor: '#fee2e2', color: '#dc2626' }}>OVERDUE</span>}
                                </div>
                                {item.description && <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>{item.description}</p>}
                                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#9ca3af', flexWrap: 'wrap' }}>
                                  {item.assignedTo && <span>👤 {item.assignedTo}</span>}
                                  {item.dueDate    && <span style={{ color: overdue ? '#dc2626' : '#9ca3af' }}>📅 {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                                  <span>By {item.createdBy}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                <select
                                  value={item.status}
                                  onChange={e => handleActionStatusChange(item, e.target.value)}
                                  disabled={isUpdating}
                                  style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: statusCfg.bg, color: statusCfg.text, appearance: 'none' }}>
                                  {['Open','In Progress','Resolved','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {isPC && (
                                  <button onClick={() => handleDeleteAction(item)} disabled={isDeleting}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '14px', lineHeight: 1 }} title="Delete">✕</button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">

            {/* Project Team */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Project Team</h3>
              {[
                { role: 'Project Manager', name: project.pm },
                { role: 'Union Local',     name: project.union },
                { role: 'Sector',          name: project.sector },
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
                { label: 'Action Items',    value: project.openActionItems, color: '#f97316' },
                { label: 'Open RFIs',       value: project.openRFIs,        color: '#3b82f6' },
                { label: 'Open Change Orders', value: project.openCOs,      color: '#8b5cf6' },
                { label: 'Days in Phase',   value: project.daysInPhase,     color: '#64748b' },
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
                <button
                  onClick={() => { setActiveTab('actions'); setShowActionForm(true) }}
                  className="w-full text-left text-xs font-medium px-3 py-2 rounded-lg border transition hover:opacity-80"
                  style={{ borderColor: '#1a2b4a', color: '#1a2b4a' }}>
                  + Create Action Item
                </button>
                {[
                  { label: '↗ Open OneDrive Folder', color: '#0369a1' },
                  { label: '↗ Open in Procore',      color: '#ea580c' },
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

      {/* Edit Project Slide-Out Panel */}
      {showEditPanel && project && (
        <EditProjectPanel
          project={project}
          onClose={() => setShowEditPanel(false)}
          onSaved={loadProject}
        />
      )}

    </div>
  )
}
