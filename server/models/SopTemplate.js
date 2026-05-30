// server/models/SopTemplate.js
// Stores the master SOP task library in MongoDB.
// Replaces the hardcoded sopTasks.js for Phase 6 — tasks are now DB-driven.
// Edit access: PC and Admin roles only (enforced in routes).

const mongoose = require('mongoose')

const sopTemplateSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },  // e.g. '5-3', 'NEW-1234'
  phase:    { type: Number, required: true, min: 1, max: 9 },
  role:     { type: String, required: true },
  task:     { type: String, required: true },
  required: { type: Boolean, default: true },
  order:    { type: Number, default: 0 },       // display sort order within phase
  addedAt:  { type: Date, default: Date.now },
  addedBy:  { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('SopTemplate', sopTemplateSchema)
