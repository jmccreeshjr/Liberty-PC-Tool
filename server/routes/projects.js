const express = require('express')
const router = express.Router()
const Project = require('../models/Project')
const { getAllTasks, getRequiredTasksForPhase } = require('../sopTasks')

// Helper — compute live daysInPhase from phaseStartDate
function computeDaysInPhase(project) {
  const start = project.phaseStartDate || project.createdAt
  if (!start) return project.daysInPhase || 0
  return Math.floor((Date.now() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
}

function withLiveDays(project) {
  const obj = project.toObject ? project.toObject() : { ...project }
  obj.daysInPhase = computeDaysInPhase(project)
  return obj
}

// GET all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
    res.json(projects.map(withLiveDays))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.json(withLiveDays(project))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create project — auto-seeds SOP tasks for all 9 phases
router.post('/', async (req, res) => {
  try {
    const projectData = { ...req.body }
    if (!projectData.sopTasks || projectData.sopTasks.length === 0) {
      projectData.sopTasks = getAllTasks()
    }
    // Set initial timestamps
    projectData.phaseStartDate    = new Date()
    projectData.lastBillingUpdate = new Date()
    projectData.lastStatusUpdate  = new Date()
    projectData.lastCOUpdate      = new Date()
    const project = new Project(projectData)
    const newProject = await project.save()
    res.status(201).json(newProject)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH update a project's core fields
// Auto-tracks lastBillingUpdate, lastCOUpdate when those fields change
router.patch('/:id', async (req, res) => {
  try {
    const existing = await Project.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Project not found' })

    const update = { ...req.body }

    // Track billing updates
    if (req.body.billingPercent !== undefined && req.body.billingPercent !== existing.billingPercent) {
      update.lastBillingUpdate = new Date()
    }
    // Track CO updates
    if (req.body.openCOs !== undefined && req.body.openCOs !== existing.openCOs) {
      update.lastCOUpdate = new Date()
    }

    const project = await Project.findByIdAndUpdate(req.params.id, update, { new: true })
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH seed SOP tasks into an existing project that has none
router.patch('/:id/seed-tasks', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (project.sopTasks && project.sopTasks.length > 0) {
      return res.json(project)
    }
    project.sopTasks = getAllTasks()
    await project.save()
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH toggle a single SOP task done/undone
router.patch('/:id/tasks/:taskId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const task = project.sopTasks.find(t => t.id === req.params.taskId)
    if (!task) return res.status(404).json({ message: 'Task not found' })

    task.done        = req.body.done
    task.completedBy = req.body.done ? (req.body.completedBy || null) : null
    task.completedAt = req.body.done ? new Date() : null

    // Recalculate sopComplete % for current phase
    const phaseTasks     = project.sopTasks.filter(t => t.phase === project.phase)
    const donePhaseTasks = phaseTasks.filter(t => t.done)
    project.sopComplete  = phaseTasks.length > 0
      ? Math.round((donePhaseTasks.length / phaseTasks.length) * 100)
      : 0

    // Update phaseReady flag — true when all required tasks for current phase are done
    const requiredTasks   = phaseTasks.filter(t => t.required)
    project.phaseReady    = requiredTasks.length > 0 && requiredTasks.every(t => t.done)

    await project.save()
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH advance project to the next phase
router.patch('/:id/advance', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (project.phase >= 9) return res.status(400).json({ message: 'Project is already in the final phase.' })

    const requiredIds = getRequiredTasksForPhase(project.phase).map(t => t.id)
    const incomplete  = project.sopTasks.filter(t => requiredIds.includes(t.id) && !t.done)

    if (incomplete.length > 0) {
      return res.status(400).json({
        message: `Cannot advance: ${incomplete.length} required SOP task(s) are not yet complete.`,
        incomplete: incomplete.map(t => t.task),
      })
    }

    project.phase          = project.phase + 1
    project.sopComplete    = 0
    project.phaseReady     = false
    project.daysInPhase    = 0
    project.phaseStartDate = new Date()   // reset the clock for the new phase

    // Recalculate sopComplete for the new phase
    const newPhaseTasks     = project.sopTasks.filter(t => t.phase === project.phase)
    const doneNewPhaseTasks = newPhaseTasks.filter(t => t.done)
    project.sopComplete     = newPhaseTasks.length > 0
      ? Math.round((doneNewPhaseTasks.length / newPhaseTasks.length) * 100)
      : 0

    await project.save()
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ─── Phase 5: Status Updates ──────────────────────────────────────────────────

// POST add a status update note (required field: note)
// Body: { note, author, role, status }
router.post('/:id/status-update', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (!req.body.note || !req.body.note.trim()) {
      return res.status(400).json({ message: 'A status note is required.' })
    }

    // Update the project status if provided
    if (req.body.status) {
      project.status = req.body.status
    }

    // Append note to log and refresh timestamp
    project.statusUpdates.push({
      note:      req.body.note.trim(),
      author:    req.body.author || '',
      role:      req.body.role   || '',
      status:    project.status,
      createdAt: new Date(),
    })
    project.lastStatusUpdate = new Date()

    // Dismiss any active 'statusUpdateNeeded' snooze/dismiss since they just updated
    project.dismissedAlerts = project.dismissedAlerts.filter(d => d.alertType !== 'statusUpdateNeeded')
    project.snoozedAlerts   = project.snoozedAlerts.filter(s => s.alertType !== 'statusUpdateNeeded')

    await project.save()
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ─── Phase 5: Alert Dismiss / Snooze ─────────────────────────────────────────

// PATCH dismiss an alert permanently (until condition re-fires)
// Body: { alertType, dismissedBy }
router.patch('/:id/alerts/dismiss', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const { alertType, dismissedBy } = req.body
    // Remove any existing dismiss/snooze for this type, then add fresh dismiss
    project.dismissedAlerts = project.dismissedAlerts.filter(d => d.alertType !== alertType)
    project.snoozedAlerts   = project.snoozedAlerts.filter(s => s.alertType !== alertType)
    project.dismissedAlerts.push({ alertType, dismissedBy, dismissedAt: new Date() })

    await project.save()
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH snooze an alert until a future date
// Body: { alertType, snoozedBy, snoozeUntil (ISO date string) }
router.patch('/:id/alerts/snooze', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const { alertType, snoozedBy, snoozeUntil } = req.body
    // Remove existing dismiss/snooze for this type, then add snooze
    project.dismissedAlerts = project.dismissedAlerts.filter(d => d.alertType !== alertType)
    project.snoozedAlerts   = project.snoozedAlerts.filter(s => s.alertType !== alertType)
    project.snoozedAlerts.push({ alertType, snoozedBy, snoozeUntil: new Date(snoozeUntil) })

    await project.save()
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH update per-project alert overrides
// Body: { phaseStuckDays, sopIncompleteDays, ... } — null value clears the override (reverts to global)
router.patch('/:id/alert-overrides', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const allowed = ['phaseStuckDays', 'sopIncompleteDays', 'billingLagDays', 'openCODays', 'completionWarningDays', 'statusUpdateDays']
    if (!project.alertOverrides) project.alertOverrides = {}
    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        project.alertOverrides[key] = req.body[key] // null clears override
      }
    })
    project.markModified('alertOverrides')
    await project.save()
    res.json(withLiveDays(project))
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
