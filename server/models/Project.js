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
