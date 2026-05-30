const API_URL = 'https://liberty-pc-tool-api.onrender.com/api'

export async function getProjects() {
  const res = await fetch(`${API_URL}/projects`)
  return res.json()
}

export async function getProject(id) {
  const res = await fetch(`${API_URL}/projects/${id}`)
  return res.json()
}

export async function createProject(data) {
  const res = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateProject(id, data) {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// Seed SOP tasks into an existing project that has none
export async function seedProjectTasks(id) {
  const res = await fetch(`${API_URL}/projects/${id}/seed-tasks`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  })
  return res.json()
}

// Toggle a single SOP task done/undone
// completedBy = logged-in user's name
export async function updateTask(projectId, taskId, done, completedBy) {
  const res = await fetch(`${API_URL}/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done, completedBy }),
  })
  return res.json()
}

// Advance a project to the next phase (PC only, phase gate enforced on server)
export async function advancePhase(projectId) {
  const res = await fetch(`${API_URL}/projects/${projectId}/advance`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  })
  return res.json()
}

// ─── Action Items ─────────────────────────────────────────────────────────────

// Get all action items — optional filters: { assignedTo, projectId, status }
export async function getActionItems(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  const res = await fetch(`${API_URL}/action-items${params ? `?${params}` : ''}`)
  return res.json()
}

// Get all action items for a specific project
export async function getProjectActionItems(projectId) {
  const res = await fetch(`${API_URL}/action-items/project/${projectId}`)
  return res.json()
}

// Create a new action item
export async function createActionItem(data) {
  const res = await fetch(`${API_URL}/action-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// Update an action item (status, fields, etc.)
export async function updateActionItem(id, data) {
  const res = await fetch(`${API_URL}/action-items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// Delete an action item (PC only — enforced client-side)
export async function deleteActionItem(id) {
  const res = await fetch(`${API_URL}/action-items/${id}`, {
    method: 'DELETE',
  })
  return res.json()
}

// ─── Alert Settings ───────────────────────────────────────────────────────────

// Get global alert threshold settings
export async function getAlertSettings() {
  const res = await fetch(`${API_URL}/alert-settings`)
  return res.json()
}

// Update global alert threshold settings
export async function updateAlertSettings(data) {
  const res = await fetch(`${API_URL}/alert-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// ─── Status Updates ───────────────────────────────────────────────────────────

// Add a status update note to a project (note is required)
// data: { note, author, role, status }
export async function addStatusUpdate(projectId, data) {
  const res = await fetch(`${API_URL}/projects/${projectId}/status-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// ─── Alert Dismiss / Snooze ───────────────────────────────────────────────────

// Permanently dismiss an alert type for a project
export async function dismissAlert(projectId, alertType, dismissedBy) {
  const res = await fetch(`${API_URL}/projects/${projectId}/alerts/dismiss`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertType, dismissedBy }),
  })
  return res.json()
}

// Snooze an alert until a future date
// snoozeUntil = ISO date string (e.g. new Date(Date.now() + 3 * 86400000).toISOString())
export async function snoozeAlert(projectId, alertType, snoozedBy, snoozeUntil) {
  const res = await fetch(`${API_URL}/projects/${projectId}/alerts/snooze`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertType, snoozedBy, snoozeUntil }),
  })
  return res.json()
}

// Update per-project alert threshold overrides (null clears override → reverts to global)
export async function updateProjectAlertOverrides(projectId, data) {
  const res = await fetch(`${API_URL}/projects/${projectId}/alert-overrides`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}
