import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lycfiotgwgzixsxokatb.supabase.co' 
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y2Zpb3Rnd2d6aXhzeG9rYXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDcxMDUsImV4cCI6MjA3NTAyMzEwNX0.5PzudyZXSFa1HZKxYRX2V6TugGuEmUx80a7n3KZbVg0'


export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

