// server/routes/alertSettings.js
const express = require('express')
const router = express.Router()
const AlertSettings = require('../models/AlertSettings')

// GET global alert settings — creates defaults on first access
router.get('/', async (req, res) => {
  try {
    let settings = await AlertSettings.findOne()
    if (!settings) {
      settings = await AlertSettings.create({})
    }
    res.json(settings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH update global alert settings
router.patch('/', async (req, res) => {
  try {
    let settings = await AlertSettings.findOne()
    if (!settings) {
      settings = await AlertSettings.create(req.body)
    } else {
      const allowed = ['phaseStuckDays', 'sopIncompleteDays', 'billingLagDays', 'openCODays', 'completionWarningDays', 'statusUpdateDays']
      allowed.forEach(key => {
        if (req.body[key] !== undefined) settings[key] = req.body[key]
      })
      await settings.save()
    }
    res.json(settings)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
