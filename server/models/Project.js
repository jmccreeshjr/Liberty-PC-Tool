const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
  name:            String,
  number:          String,
  customer:        String,
  pm:              String,
  sector:          String,
  union:           String,
  phase:           { type: Number, min: 1, max: 9 },
  status:          { type: String, enum: ['On Track', 'At Risk', 'Overdue'] },
  contractValue:   Number,
  billingPercent:  Number,
  sopComplete:     Number,
  openItems:       Number,
  openRFIs:        Number,
  openCOs:         Number,
  daysInPhase:     Number,
  startDate:       String,
  completionDate:  String,
  team: [{
    name: String,
    role: String
  }],
  sopTasks: [{
    phase: Number,
    id:    String,
    role:  String,
    task:  String,
    done:  Boolean
  }]
}, { timestamps: true })

module.exports = mongoose.model('Project', projectSchema)
