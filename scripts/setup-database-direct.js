/**
 * Script para criar todas as tabelas no Supabase
 * Conecta diretamente ao PostgreSQL usando a connection string
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection string do Supabase
// Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
// Você precisa obter isso em: Settings > Database > Connection string (URI mode)
// Por enquanto, vou tentar usar a API REST com service_role key

const SUPABASE_URL = 'https://dmsawbzaaftdtiggyfxd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_gRVxnhkrJS30kHCUZvRQXQ_RWTuX1OF';

// Ler o arquivo SQL
const sqlPath = path.join(__dirname, '../supabase/schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function createTablesViaAPI() {
  console.log('🚀 Criando tabelas no Supabase usando service_role key...\n');
  
  try {
    // O Supabase não expõe endpoint REST público para executar SQL DDL
    // Mas podemos tentar usar o Management API ou criar via REST usando operações específicas
    
    // Tentativa: Usar a API REST do Supabase para criar tabelas manualmente
    // Isso requer criar cada tabela via API REST usando operações específicas
    
    console.log('📝 Preparando para criar tabelas...\n');
    
    // Infelizmente, o Supabase não tem um endpoint REST público para executar SQL arbitrário
    // A melhor solução é usar a connection string do PostgreSQL diretamente
    
    console.log('⚠️  O Supabase não expõe endpoint REST para executar SQL DDL.');
    console.log('📋 SOLUÇÃO: Obter a connection string do banco e conectar diretamente.\n');
    console.log('🔗 Passos:');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/settings/database');
    console.log('   2. Role até "Connection string"');
    console.log('   3. Copie a connection string (URI mode)');
    console.log('   4. Execute este script novamente com a connection string\n');
    console.log('💡 OU execute manualmente no SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/sql/new\n');
    
    return false;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

// Função para criar tabelas usando connection string direta
async function createTablesDirectly(connectionString) {
  console.log('🔌 Conectando ao PostgreSQL diretamente...\n');
  
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados!\n');
    
    // Executar SQL
    console.log('📝 Executando SQL...\n');
    await client.query(sql);
    
    console.log('✅ Todas as tabelas foram criadas com sucesso!\n');
    
    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    await client.end();
    return false;
  }
}

// Main
async function main() {
  // Verificar se connection string foi fornecida
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    await createTablesDirectly(connectionString);
  } else {
    console.log('📋 Para criar tabelas automaticamente, você precisa da connection string.\n');
    console.log('🔗 Obtenha em: https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/settings/database\n');
    console.log('💡 Depois, execute:');
    console.log('   DATABASE_URL="sua_connection_string" node scripts/setup-database-direct.js\n');
    
    // Tentar usar API REST (pode não funcionar para DDL)
    await createTablesViaAPI();
  }
}

main();

