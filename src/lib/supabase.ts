// Supabase Client for Cloudflare Workers/Pages
import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient(env: any) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

// Type definitions for our database
export type Database = {
  public: {
    Tables: {
      spots: {
        Row: {
          id: string
          name: string
          address: string
          district: string | null
          pickup_guide: string
          pickup_location: string
          image_url: string | null
          is_active: boolean
          order_deadline: string
          pickup_time: string
          coordinates: any
          created_at: string
          updated_at: string
        }
      }
      collections: {
        Row: {
          id: string
          theme_no: string
          title: string
          tagline: string | null
          description: string
          price: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          ingredients: any
          tags: any
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      supplements: {
        Row: {
          id: string
          theme: string
          title: string
          nutrients: any
          provided_week: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      inventory: {
        Row: {
          id: string
          spot_id: string
          collection_id: string
          remain_qty: number
          cutoff_time: string
          last_updated: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          spot_id: string
          collection_id: string
          status: string
          pickup_code: string
          qr_code: string
          pickup_location: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
