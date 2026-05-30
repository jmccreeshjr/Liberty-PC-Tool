const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
  name:           String,
  number:         String,
  customer:       String,
  pm:             String,
  sector:         String,
  union:          String,
  phase:          { type: Number, min: 1, max: 9 },
  status:         { type: String, enum: ['On Track', 'At Risk', 'Overdue'] },
  contractValue:  Number,
  billingPercent: Number,
  sopComplete:    Number,
  openItems:      Number,
  openRFIs:       Number,
  openCOs:        Number,
  daysInPhase:    Number,
  startDate:      String,
  completionDate: String,

  // Phase 5 — alert engine timestamps
  phaseReady:         { type: Boolean, default: false },  // true when all required tasks for current phase are done
  lastBillingUpdate:  { type: Date,    default: null  },  // set when billingPercent changes
  lastStatusUpdate:   { type: Date,    default: null  },  // set when a status note is added
  lastCOUpdate:       { type: Date,    default: null  },  // set when openCOs changes

  // Phase 5 — per-project alert threshold overrides (null = use global setting)
  alertOverrides: {
    phaseStuckDays:        { type: Number, default: null },
    sopIncompleteDays:     { type: Number, default: null },
    billingLagDays:        { type: Number, default: null },
    openCODays:            { type: Number, default: null },
    completionWarningDays: { type: Number, default: null },
    statusUpdateDays:      { type: Number, default: null },
  },

  // Phase 5 — status update log (PM required notes)
  statusUpdates: [{
    note:      { type: String, required: true },
    author:    String,
    role:      String,
    status:    String,   // project status at time of update
    createdAt: { type: Date, default: Date.now },
  }],

  // Phase 5 — dismissed alerts (permanent until condition re-fires)
  dismissedAlerts: [{
    alertType:   String,
    dismissedAt: { type: Date, default: Date.now },
    dismissedBy: String,
  }],

  // Phase 5 — snoozed alerts (hidden until snoozeUntil date)
  snoozedAlerts: [{
    alertType:   String,
    snoozeUntil: Date,
    snoozedBy:   String,
  }],

  team: [{
    name: String,
    role: String,
  }],

  sopTasks: [{
    id:          String,
    phase:       Number,
    role:        String,
    task:        String,
    required:    Boolean,
    done:        { type: Boolean, default: false },
    completedBy: { type: String, default: null },
    completedAt: { type: Date,   default: null },
  }],
}, { timestamps: true })

module.exports = mongoose.model('Project', projectSchema)
