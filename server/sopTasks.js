// Master SOP task definitions for all 9 phases.
// This is the single source of truth on the server.
// When a new project is created, these tasks are seeded into the project document.

const SOP_TASKS = {
  1: [
    { id: '1-1', phase: 1, role: 'PC',             task: 'Receive lead and create customer profile in Project HQ', required: true },
    { id: '1-2', phase: 1, role: 'PC',             task: 'Create OneDrive project folder with correct naming convention', required: true },
    { id: '1-3', phase: 1, role: 'Sales Rep',      task: 'Assign Sales Rep / Account Rep in Project HQ', required: false },
    { id: '1-4', phase: 1, role: 'PC',             task: 'Log inquiry into Building Connected project pipeline', required: true },
    { id: '1-5', phase: 1, role: 'Lead Estimator', task: 'Complete Bid/No-Bid qualification summary', required: true },
    { id: '1-6', phase: 1, role: 'PC',             task: 'Submit prequalification package if required', required: false },
  ],
  2: [
    { id: '2-1', phase: 2, role: 'PC',        task: 'Download all bid documents and file in 01_Bid_Documents', required: true },
    { id: '2-2', phase: 2, role: 'PC',        task: 'Build estimating schedule and add bid date to calendar', required: true },
    { id: '2-3', phase: 2, role: 'Estimator', task: 'Configure Accubid job file with labor rates and union local', required: true },
    { id: '2-4', phase: 2, role: 'Estimator', task: 'Complete quantity takeoff by cost code in Accubid', required: true },
    { id: '2-5', phase: 2, role: 'Estimator', task: 'Issue RFQs to subcontractors via Building Connected', required: true },
    { id: '2-6', phase: 2, role: 'Estimator', task: 'Complete estimate review and apply final markup', required: true },
    { id: '2-7', phase: 2, role: 'PC',        task: 'Submit proposal and capture email trace in Project HQ', required: true },
  ],
  3: [
    { id: '3-1', phase: 3, role: 'PC',         task: 'Receive award notification and update all systems', required: true },
    { id: '3-2', phase: 3, role: 'PC',         task: 'Assign Project Manager and transfer estimate package', required: true },
    { id: '3-3', phase: 3, role: 'PC',         task: 'Request Certificate of Insurance from EHD', required: true },
    { id: '3-4', phase: 3, role: 'PM',         task: 'Review contract scope, schedule, and payment terms', required: true },
    { id: '3-5', phase: 3, role: 'Accounting', task: 'Set up job in Foundation once PM written approval received', required: true },
    { id: '3-6', phase: 3, role: 'PC',         task: 'Execute contract and deliver W9 and COI to customer', required: true },
  ],
  4: [
    { id: '4-1', phase: 4, role: 'Estimator',   task: 'Organize OneDrive folder and prepare Ops Budget workbook', required: true },
    { id: '4-2', phase: 4, role: 'PC',          task: 'Schedule and conduct Estimating Turnover Meeting', required: true },
    { id: '4-3', phase: 4, role: 'PM',          task: 'Fill in SOV/Budget table in PMIS from Ops Budget hours', required: true },
    { id: '4-4', phase: 4, role: 'PM',          task: 'Transfer budget to Foundation by cost code', required: true },
    { id: '4-5', phase: 4, role: 'PM',          task: 'Develop baseline schedule in Procore', required: true },
    { id: '4-6', phase: 4, role: 'Purchasing',  task: 'Issue purchase orders from Ops Budget Export', required: true },
    { id: '4-7', phase: 4, role: 'Ops Manager', task: 'Contact union hall and confirm crew dispatch', required: true },
    { id: '4-8', phase: 4, role: 'Safety',      task: 'Create Safety HQ job file and site safety plan', required: true },
  ],
  5: [
    { id: '5-1', phase: 5, role: 'Foreman', task: 'Conduct Day 1 site orientation and first toolbox talk', required: true },
    { id: '5-2', phase: 5, role: 'Foreman', task: 'Complete Procore daily log each working day', required: true },
    { id: '5-3', phase: 5, role: 'PM',      task: 'Review and approve prior day daily log each morning', required: true },
    { id: '5-4', phase: 5, role: 'PM',      task: 'Submit RFIs within 24 hours of identifying field questions', required: true },
    { id: '5-5', phase: 5, role: 'PM',      task: 'Hold weekly project update meeting and update Procore schedule', required: true },
    { id: '5-6', phase: 5, role: 'PC',      task: 'Chair monthly Financial Controls Meeting', required: true },
    { id: '5-7', phase: 5, role: 'PM',      task: 'Document and submit all change orders through Procore', required: true },
  ],
  6: [
    { id: '6-1', phase: 6, role: 'Foreman',    task: 'Conduct and log daily toolbox talk in Safety HQ and Procore', required: true },
    { id: '6-2', phase: 6, role: 'Safety',     task: 'Verify all Remarcable worker clearances are current', required: true },
    { id: '6-3', phase: 6, role: 'Foreman',    task: 'Conduct weekly site safety inspection', required: true },
    { id: '6-4', phase: 6, role: 'Accounting', task: 'Submit certified payroll on required schedule if prevailing wage', required: false },
    { id: '6-5', phase: 6, role: 'Safety',     task: 'Document any incidents in Safety HQ within same shift', required: false },
  ],
  7: [
    { id: '7-1', phase: 7, role: 'PM',         task: 'Identify projects to bill during weekly PM meeting', required: true },
    { id: '7-2', phase: 7, role: 'PM',         task: 'Fill out pencil copy of billing and send to customer for approval', required: true },
    { id: '7-3', phase: 7, role: 'Accounting', task: 'Enter invoice in Foundation once PM written approval received', required: true },
    { id: '7-4', phase: 7, role: 'PM',         task: 'Collect conditional lien waivers from subs with each payment', required: true },
    { id: '7-5', phase: 7, role: 'PC',         task: 'Monitor open change orders through full approval cycle', required: true },
  ],
  8: [
    { id: '8-1', phase: 8, role: 'PM',         task: 'Populate substantial completion date to trigger closeout tasks', required: true },
    { id: '8-2', phase: 8, role: 'PC',         task: 'Compile closeout docs: as-builts, O&M manuals, warranties', required: true },
    { id: '8-3', phase: 8, role: 'PC',         task: 'Submit closeout package to customer and obtain acceptance', required: true },
    { id: '8-4', phase: 8, role: 'Accounting', task: 'Confirm final billing released and retention collected', required: true },
    { id: '8-5', phase: 8, role: 'PC',         task: 'Schedule and chair Closeout / Lessons Learned Meeting', required: true },
  ],
  9: [
    { id: '9-1', phase: 9, role: 'PC',       task: 'Prepare Final Job Report', required: true },
    { id: '9-2', phase: 9, role: 'PC',       task: 'Archive project in Foundation, Project HQ, Accubid, and OneDrive', required: true },
    { id: '9-3', phase: 9, role: 'PC',       task: 'Log lessons learned to firm knowledge base', required: true },
    { id: '9-4', phase: 9, role: 'Sales Rep',task: 'Initiate BD follow-up for next opportunity with customer', required: false },
  ],
}

// Flatten all phases into a single array for seeding a new project
function getAllTasks() {
  return Object.values(SOP_TASKS).flat().map(t => ({
    ...t,
    done: false,
    completedBy: null,
    completedAt: null,
  }))
}

// Get required tasks for a specific phase (used for phase gate validation)
function getRequiredTasksForPhase(phase) {
  return (SOP_TASKS[phase] || []).filter(t => t.required)
}

module.exports = { SOP_TASKS, getAllTasks, getRequiredTasksForPhase }
