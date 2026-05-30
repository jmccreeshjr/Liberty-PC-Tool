const express = require('express')
const router = express.Router()
const ActionItem = require('../models/ActionItem')

// GET all action items
// Optional query params:
//   ?assignedTo=Joe%20McCreesh   — filter by person's name
//   ?projectId=<objectId>        — filter by project
//   ?status=Open                 — filter by status
router.get('/', async (req, res) => {
  try {
    const filter = {}
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo
    if (req.query.projectId)  filter.projectId  = req.query.projectId
    if (req.query.status)     filter.status      = req.query.status

    const items = await ActionItem.find(filter).sort({ createdAt: -1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET all action items for a specific project
router.get('/project/:projectId', async (req, res) => {
  try {
    const items = await ActionItem.find({ projectId: req.params.projectId }).sort({ createdAt: -1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET single action item
router.get('/:id', async (req, res) => {
  try {
    const item = await ActionItem.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Action item not found' })
    res.json(item)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create action item
router.post('/', async (req, res) => {
  try {
    const item = new ActionItem(req.body)
    const saved = await item.save()
    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PATCH update action item (status change, edit, etc.)
router.patch('/:id', async (req, res) => {
  try {
    const item = await ActionItem.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return res.status(404).json({ message: 'Action item not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// DELETE action item (PC only — enforced client-side)
router.delete('/:id', async (req, res) => {
  try {
    const item = await ActionItem.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Action item not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
