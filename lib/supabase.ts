import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dmsawbzaaftdtiggyfxd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2F3YnphYWZ0ZHRpZ2d5ZnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTg3NDgsImV4cCI6MjA4MzM3NDc0OH0.Yyr9TtFPim4kUz4oX5asnKRbYqo--rOMwmn6DptrmuY';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verify connection on import (only in development)
if (import.meta.env.DEV) {
  console.log('✅ Supabase client inicializado');
  console.log('🔗 URL:', supabaseUrl);
}

