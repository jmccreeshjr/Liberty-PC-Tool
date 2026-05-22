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
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateProject(id, data) {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}