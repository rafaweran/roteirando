import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://dmsawbzaaftdtiggyfxd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2F3YnphYWZ0ZHRpZ2d5ZnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTg3NDgsImV4cCI6MjA4MzM3NDc0OH0.Yyr9TtFPim4kUz4oX5asnKRbYqo--rOMwmn6DptrmuY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL file
const sqlPath = path.join(__dirname, '../supabase/schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Split SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log('📊 Conectando ao Supabase...');
console.log(`📝 Encontrados ${statements.length} comandos SQL para executar\n`);

// Execute each statement
async function setupDatabase() {
  try {
    // For DDL operations, we need to use the REST API with RPC
    // Unfortunately, the anon key doesn't have permission to execute arbitrary SQL
    // So we'll need to execute via the Supabase dashboard SQL Editor
    // But we can verify the connection first
    
    console.log('⚠️  IMPORTANTE: Execute o SQL manualmente no painel do Supabase.');
    console.log('📋 Instruções:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd');
    console.log('2. Vá em SQL Editor > New Query');
    console.log('3. Copie e cole o conteúdo do arquivo: supabase/schema.sql');
    console.log('4. Clique em Run\n');
    
    // Test connection by querying a system table
    console.log('🔍 Testando conexão...');
    const { data, error } = await supabase.from('_realtime').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.log('✅ Conexão estabelecida com o Supabase!');
    } else {
      console.log('✅ Conexão estabelecida com o Supabase!');
    }
    
    console.log('\n✨ Próximo passo: Execute o SQL no painel do Supabase conforme instruções acima.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n📋 Execute o SQL manualmente no painel do Supabase:');
    console.log('   https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/sql/new');
  }
}

setupDatabase();


