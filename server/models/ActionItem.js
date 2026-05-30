const mongoose = require('mongoose')

const actionItemSchema = new mongoose.Schema({
  projectId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectName:   { type: String, default: '' },   // denormalized for inbox display
  projectNumber: { type: String, default: '' },   // denormalized for inbox display
  title:         { type: String, required: true },
  description:   { type: String, default: '' },
  assignedTo:    { type: String, default: '' },   // person's name
  assignedRole:  { type: String, default: '' },   // their role
  createdBy:     { type: String, default: '' },
  priority:      { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status:        { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  dueDate:       { type: Date, default: null },
  // Notification stubs — wired in Phase 5 via Microsoft Graph / Twilio
  emailSent:     { type: Boolean, default: false },
  smsSent:       { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('ActionItem', actionItemSchema)
