const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

async function apiRequest(path, { method = 'GET', body, accessToken } = {}) {
  const headers = {
    Accept: 'application/json',
  }

  // Keep the payload compact by sending URL-encoded form data instead of a larger JSON body.
  if (body instanceof URLSearchParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
  }

  // The frontend forwards the short-lived Supabase access token so the backend can verify it.
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload.error
    const error = new Error(message || 'Request failed.')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export async function createItem({ title, description, accessToken }) {
  const formData = new URLSearchParams({
    title: title.trim(),
    description: description.trim(),
  })

  return apiRequest('/api/items', {
    method: 'POST',
    body: formData,
    accessToken,
  })
}