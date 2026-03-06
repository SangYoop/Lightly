// Supabase Auth helper functions
import { createSupabaseClient } from './supabase'

export async function getUser(c: any) {
  const supabase = createSupabaseClient(c.env)
  
  // Get auth token from cookie or header
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return null
  
  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) return null
  
  return user
}

export async function requireAuth(c: any) {
  const user = await getUser(c)
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  return user
}
