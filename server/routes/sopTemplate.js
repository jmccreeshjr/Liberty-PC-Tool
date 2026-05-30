// server/routes/sopTemplate.js    ← rename this file to sopTemplate.js when copying to your repo
// REST endpoints for the SOP task template library.
// Seeding, listing, adding, editing, deleting, and bulk re-applying to all projects.

const express = require('express')
const router  = express.Router()
const SopTemplate = require('../models/SopTemplate')
const Project     = require('../models/Project')
const { SOP_TASKS } = require('../sopTasks')   // used only on initial seed

// ─── Role guard helper ────────────────────────────────────────────────────────
// Call this at the top of any mutating route.
// In a future SSO build, decode the JWT here; for now, pass role in X-User-Role header.
function requireEditRole(req, res) {
  const role = req.headers['x-user-role'] || ''
  const allowed = ['PC', 'Project Coordinator', 'Admin', 'Executive']
  if (!allowed.includes(role)) {
    res.status(403).json({ message: 'Only PC or Admin users may edit SOP tasks.' })
    return false
  }
  return true
}

// ─── Seed helper: populate SopTemplate from hardcoded sopTasks.js ─────────────
// Safe to call repeatedly — skips IDs that already exist.
async function seedIfEmpty() {
  const count = await SopTemplate.countDocuments()
  if (count > 0) return
  const tasks = Object.values(SOP_TASKS).flat()
  const docs  = tasks.map((t, i) => ({
    id:       t.id,
    phase:    t.phase,
    role:     t.role,
    task:     t.task,
    required: t.required,
    order:    i,
    addedBy:  'system (initial seed)',
  }))
  await SopTemplate.insertMany(docs, { ordered: false }).catch(() => {})
}

// ─── GET /api/sop-template  — list all tasks ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    await seedIfEmpty()
    const tasks = await SopTemplate.find().sort({ phase: 1, order: 1 })
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/sop-template  — add a new task ─────────────────────────────────
// Body: { phase, role, task, required, addedBy }
// After adding, the task is applied to ALL existing projects.
// If a project has already passed that phase → task is auto-marked complete.
router.post('/', async (req, res) => {
  if (!requireEditRole(req, res)) return
  try {
    const { phase, role, task, required = true, addedBy = '' } = req.body
    if (!phase || !role || !task) {
      return res.status(400).json({ message: 'phase, role, and task are required.' })
    }

    // Generate a unique ID: phase-timestamp
    const id = `${phase}-${Date.now()}`

    // Find max order in this phase for sorting
    const maxOrder = await SopTemplate.findOne({ phase }).sort({ order: -1 }).lean()
    const order = maxOrder ? maxOrder.order + 1 : 0

    const template = new SopTemplate({ id, phase, role, task, required, order, addedBy })
    await template.save()

    // Apply to all projects
    await applyTemplateTaskToAllProjects(template)

    res.status(201).json(template)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ─── PATCH /api/sop-template/:id  — edit a task ───────────────────────────────
// Body: any subset of { role, task, required, order }
// Updates the template record; propagates text/required changes to all projects.
router.patch('/:id', async (req, res) => {
  if (!requireEditRole(req, res)) return
  try {
    const allowed = ['role', 'task', 'required', 'order']
    const update  = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })

    const template = await SopTemplate.findOneAndUpdate({ id: req.params.id }, update, { new: true })
    if (!template) return res.status(404).json({ message: 'Task not found' })

    // Propagate text/required/role changes to all projects
    await propagateTemplateUpdate(template)

    res.json(template)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ─── DELETE /api/sop-template/:id  — remove a task ────────────────────────────
// Removes from template; also removes from all project sopTasks arrays.
router.delete('/:id', async (req, res) => {
  if (!requireEditRole(req, res)) return
  try {
    const template = await SopTemplate.findOneAndDelete({ id: req.params.id })
    if (!template) return res.status(404).json({ message: 'Task not found' })

    // Remove from all projects and recalculate
    const projects = await Project.find({ 'sopTasks.id': req.params.id })
    for (const project of projects) {
      project.sopTasks = project.sopTasks.filter(t => t.id !== req.params.id)
      recalcPhaseStats(project)
      await project.save()
    }

    res.json({ message: `Task ${req.params.id} deleted from template and ${projects.length} project(s).` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/sop-template/resync-all  — push full template to all projects ──
// Useful after importing or bulk-editing tasks.
router.post('/resync-all', async (req, res) => {
  if (!requireEditRole(req, res)) return
  try {
    await seedIfEmpty()
    const templates = await SopTemplate.find().sort({ phase: 1, order: 1 }).lean()
    const projects  = await Project.find()
    let updated = 0

    for (const project of projects) {
      resyncProjectFromTemplates(project, templates)
      await project.save()
      updated++
    }

    res.json({ message: `Resynced ${updated} project(s) from ${templates.length} template task(s).` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Internal helpers ─────────────────────────────────────────────────────────

// Apply a single new template task to every project.
async function applyTemplateTaskToAllProjects(template) {
  const projects = await Project.find()
  for (const project of projects) {
    const exists = project.sopTasks.some(t => t.id === template.id)
    if (!exists) {
      const alreadyPassed = project.phase > template.phase
      project.sopTasks.push({
        id:          template.id,
        phase:       template.phase,
        role:        template.role,
        task:        template.task,
        required:    template.required,
        done:        alreadyPassed,
        completedBy: alreadyPassed ? 'system (phase advance)' : null,
        completedAt: alreadyPassed ? new Date() : null,
      })
      recalcPhaseStats(project)
      await project.save()
    }
  }
}

// Propagate text/required/role changes from a template update to all projects.
async function propagateTemplateUpdate(template) {
  const projects = await Project.find({ 'sopTasks.id': template.id })
  for (const project of projects) {
    const task = project.sopTasks.find(t => t.id === template.id)
    if (task) {
      task.task     = template.task
      task.required = template.required
      task.role     = template.role
      recalcPhaseStats(project)
      await project.save()
    }
  }
}

// Resync a project's sopTasks against the full template list (preserving done states).
function resyncProjectFromTemplates(project, templates) {
  const existingMap = {}
  for (const t of (project.sopTasks || [])) existingMap[t.id] = t

  project.sopTasks = templates.map(template => {
    const existing     = existingMap[template.id]
    const alreadyPassed = project.phase > template.phase
    if (existing) {
      existing.task     = template.task
      existing.required = template.required
      existing.role     = template.role
      if (alreadyPassed && !existing.done) {
        existing.done        = true
        existing.completedBy = 'system (resync)'
        existing.completedAt = new Date()
      }
      return existing
    }
    return {
      id:          template.id,
      phase:       template.phase,
      role:        template.role,
      task:        template.task,
      required:    template.required,
      done:        alreadyPassed,
      completedBy: alreadyPassed ? 'system (resync)' : null,
      completedAt: alreadyPassed ? new Date() : null,
    }
  })
  recalcPhaseStats(project)
}

// Recalculate sopComplete% and phaseReady for a project's current phase.
function recalcPhaseStats(project) {
  const phaseTasks = project.sopTasks.filter(t => t.phase === project.phase)
  const doneTasks  = phaseTasks.filter(t => t.done)
  project.sopComplete = phaseTasks.length > 0
    ? Math.round((doneTasks.length / phaseTasks.length) * 100)
    : 0
  const required  = phaseTasks.filter(t => t.required)
  project.phaseReady = required.length > 0 && required.every(t => t.done)
}

module.exports = router
