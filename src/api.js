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
