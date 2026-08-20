const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

let supabase = null

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_ANON_KEY') {
  console.warn('⚠️  Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env')
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

module.exports = { supabase }