const mongoose = require('mongoose')

// Singleton — only one document ever exists in this collection.
// GET returns it (creating defaults on first access).
// PATCH updates it.
const alertSettingsSchema = new mongoose.Schema({
  phaseStuckDays:        { type: Number, default: 5  },  // #1
  sopIncompleteDays:     { type: Number, default: 10 },  // #2
  // #3 phaseReady fires immediately — no threshold needed
  billingLagDays:        { type: Number, default: 7  },  // #4/#5
  openCODays:            { type: Number, default: 5  },  // #6
  completionWarningDays: { type: Number, default: 14 },  // #7/#8
  // #9 removed (RFI count)
  // #10 actionItemOverdue fires immediately — no threshold needed
  statusUpdateDays:      { type: Number, default: 7  },  // #11
}, { timestamps: true })

module.exports = mongoose.model('AlertSettings', alertSettingsSchema)
