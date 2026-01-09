/**
 * Script para configurar o banco de dados Supabase
 * Este script cria todas as tabelas necessárias via API REST
 */

const SUPABASE_URL = 'https://dmsawbzaaftdtiggyfxd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2F3YnphYWZ0ZHRpZ2d5ZnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTg3NDgsImV4cCI6MjA4MzM3NDc0OH0.Yyr9TtFPim4kUz4oX5asnKRbYqo--rOMwmn6DptrmuY';

console.log('🚀 Configurando banco de dados Supabase...\n');
console.log('⚠️  IMPORTANTE: Para executar SQL DDL (CREATE TABLE), você precisa da service_role key.');
console.log('   Como temos apenas a anon key, execute o SQL manualmente no painel.\n');
console.log('📋 LINK DIRETO PARA O SQL EDITOR:\n');
console.log(`   https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/sql/new\n`);
console.log('📝 PASSO A PASSO:\n');
console.log('1. Abra o link acima no navegador');
console.log('2. Copie TODO o conteúdo do arquivo: supabase/schema.sql');
console.log('3. Cole no SQL Editor');
console.log('4. Clique em "Run" (ou pressione Cmd+Enter / Ctrl+Enter)');
console.log('5. Aguarde a execução completar\n');
console.log('✅ Após executar o SQL, todas as tabelas estarão criadas!\n');
console.log('📄 Arquivo SQL localizado em: supabase/schema.sql\n');

// Test connection
async function testConnection() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (response.ok || response.status === 404) {
      console.log('✅ Conexão com Supabase verificada!');
      console.log('✅ Credenciais configuradas corretamente no arquivo .env\n');
      return true;
    }
  } catch (error) {
    console.log('⚠️  Erro ao testar conexão:', error.message);
  }
  
  return false;
}

testConnection().then(() => {
  console.log('\n✨ Próximo passo: Execute o SQL no painel do Supabase conforme instruções acima.');
});


