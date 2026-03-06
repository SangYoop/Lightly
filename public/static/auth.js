// Auth helper for frontend
const AUTH_KEY = 'urban_fresh_session'

export const auth = {
  // Save session to localStorage
  setSession(session) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  },
  
  // Get session from localStorage
  getSession() {
    const data = localStorage.getItem(AUTH_KEY)
    return data ? JSON.parse(data) : null
  },
  
  // Get access token
  getToken() {
    const session = this.getSession()
    return session?.access_token || null
  },
  
  // Clear session
  clearSession() {
    localStorage.removeItem(AUTH_KEY)
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    const session = this.getSession()
    if (!session) return false
    
    // Check if token is expired
    const expiresAt = session.expires_at * 1000
    return Date.now() < expiresAt
  },
  
  // Make authenticated API request
  async fetch(url, options = {}) {
    const token = this.getToken()
    
    if (!token) {
      throw new Error('Not authenticated')
    }
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    return fetch(url, { ...options, headers })
  },
  
  // Login
  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }
    
    this.setSession(data.session)
    return data
  },
  
  // Signup
  async signup(email, password, name) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Signup failed')
    }
    
    this.setSession(data.session)
    return data
  },
  
  // Logout
  async logout() {
    try {
      await this.fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      this.clearSession()
      window.location.href = '/login'
    }
  }
}

// Check auth on protected pages
export function requireAuth() {
  if (!auth.isAuthenticated()) {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
    return false
  }
  return true
}
