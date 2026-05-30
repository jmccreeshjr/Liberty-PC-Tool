const express = require('express')
const router = express.Router()
const Project = require('../models/Project')
const { getAllTasks, getRequiredTasksForPhase } = require('../sopTasks')

// GET all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
    res.json(projects)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.json(project)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create project — auto-seeds SOP tasks for all 9 phases
router.post('/', async (req, res) => {
  try {
    const projectData = { ...req.body }
    // Seed all SOP tasks if not provided
    if (!projectData.sopTasks || projectData.sopTasks.length === 0) {
      projectData.sopTasks = getAllTasks()
    }
    const project = new Project(projectData)
    const newProject = await project.save()
    res.status(201).json(newProject)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH update a project's core fields
router.patch('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH seed SOP tasks into an existing project that has none
// Called by the frontend when it detects a project has no sopTasks
router.patch('/:id/seed-tasks', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (project.sopTasks && project.sopTasks.length > 0) {
      return res.json(project) // already seeded
    }
    project.sopTasks = getAllTasks()
    await project.save()
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH toggle a single SOP task done/undone
// Body: { done: true/false, completedBy: 'Joe McCreesh' }
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
    const phaseTasks = project.sopTasks.filter(t => t.phase === project.phase)
    const donePhaseTasks = phaseTasks.filter(t => t.done)
    project.sopComplete = phaseTasks.length > 0
      ? Math.round((donePhaseTasks.length / phaseTasks.length) * 100)
      : 0

    await project.save()
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH advance project to the next phase
// Only succeeds if all required tasks for the current phase are complete
router.patch('/:id/advance', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (project.phase >= 9) return res.status(400).json({ message: 'Project is already in the final phase.' })

    // Check required tasks for current phase
    const requiredIds = getRequiredTasksForPhase(project.phase).map(t => t.id)
    const incomplete = project.sopTasks.filter(
      t => requiredIds.includes(t.id) && !t.done
    )

    if (incomplete.length > 0) {
      return res.status(400).json({
        message: `Cannot advance: ${incomplete.length} required SOP task(s) are not yet complete.`,
        incomplete: incomplete.map(t => t.task),
      })
    }

    // Advance the phase
    project.phase = project.phase + 1
    project.sopComplete = 0

    // Recalculate sopComplete for the new phase
    const newPhaseTasks = project.sopTasks.filter(t => t.phase === project.phase)
    const doneNewPhaseTasks = newPhaseTasks.filter(t => t.done)
    project.sopComplete = newPhaseTasks.length > 0
      ? Math.round((doneNewPhaseTasks.length / newPhaseTasks.length) * 100)
      : 0

    await project.save()
    res.json(project)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
