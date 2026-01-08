import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://dmsawbzaaftdtiggyfxd.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2F3YnphYWZ0ZHRpZ2d5ZnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTg3NDgsImV4cCI6MjA4MzM3NDc0OH0.Yyr9TtFPim4kUz4oX5asnKRbYqo--rOMwmn6DptrmuY';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verify connection on import - sempre logar para debug em produção
console.log('✅ Supabase client inicializado');
console.log('🔗 URL:', supabaseUrl);
console.log('🔑 Key presente:', !!supabaseAnonKey);
console.log('🌍 Ambiente:', (import.meta as any).env?.MODE || 'production');
console.log('📦 Variáveis de ambiente:');
console.log('   VITE_SUPABASE_URL:', (import.meta as any).env?.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada (usando fallback)');
console.log('   VITE_SUPABASE_ANON_KEY:', (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada (usando fallback)');

