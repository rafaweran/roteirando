/**
 * Script FINAL para criar todas as tabelas no Supabase
 * Usa a connection string do PostgreSQL diretamente
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Informações do Supabase
const PROJECT_REF = 'dmsawbzaaftdtiggyfxd';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_gRVxnhkrJS30kHCUZvRQXQ_RWTuX1OF';

// Ler o arquivo SQL
const sqlPath = path.join(__dirname, '../supabase/schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

/**
 * Obter connection string do Supabase
 * Formato esperado: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
 * OU: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
 */
async function getConnectionString() {
  // A connection string precisa ser obtida manualmente do painel do Supabase
  // Mas podemos tentar construir com a senha do banco se disponível
  
  // Para criar via script, você precisa:
  // 1. Ir em Settings > Database > Connection string
  // 2. Copiar a connection string (URI mode)
  // 3. Usar como: DATABASE_URL="..." node scripts/create-all-tables.js
  
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    return connectionString;
  }
  
  console.log('❌ Connection string não encontrada!\n');
  console.log('📋 Para obter a connection string:');
  console.log('   1. Acesse: https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/database');
  console.log('   2. Role até "Connection string"');
  console.log('   3. Selecione "URI" mode');
  console.log('   4. Copie a connection string\n');
  console.log('💡 Depois, execute:');
  console.log('   DATABASE_URL="sua_connection_string" node scripts/create-all-tables.js\n');
  
  return null;
}

/**
 * Criar todas as tabelas
 */
async function createTables() {
  console.log('🚀 Iniciando criação de tabelas no Supabase...\n');
  
  const connectionString = await getConnectionString();
  
  if (!connectionString) {
    console.log('⚠️  Não é possível criar tabelas sem a connection string.\n');
    console.log('💡 ALTERNATIVA: Execute o SQL manualmente no SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new\n');
    console.log('📄 SQL está em: supabase/schema.sql\n');
    return false;
  }
  
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔌 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');
    
    console.log('📝 Executando SQL para criar tabelas...\n');
    
    // Executar o SQL completo
    await client.query(sql);
    
    console.log('✅ SQL executado com sucesso!\n');
    
    // Verificar tabelas criadas
    console.log('🔍 Verificando tabelas criadas...\n');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    if (result.rows.length > 0) {
      console.log('📊 Tabelas encontradas no banco:');
      result.rows.forEach(row => {
        console.log(`   ✅ ${row.table_name}`);
      });
      console.log('');
    } else {
      console.log('⚠️  Nenhuma tabela encontrada. Verifique se o SQL foi executado corretamente.\n');
    }
    
    // Verificar políticas RLS
    console.log('🔍 Verificando políticas RLS...\n');
    const policiesResult = await client.query(`
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    
    if (policiesResult.rows.length > 0) {
      console.log('🔐 Políticas RLS criadas:');
      let currentTable = '';
      policiesResult.rows.forEach(row => {
        if (row.tablename !== currentTable) {
          currentTable = row.tablename;
          console.log(`\n   📋 ${row.tablename}:`);
        }
        console.log(`      ✅ ${row.policyname}`);
      });
      console.log('');
    }
    
    await client.end();
    
    console.log('🎉 Processo concluído com sucesso!');
    console.log('✅ Todas as tabelas foram criadas no Supabase.\n');
    console.log('🔄 Agora recarregue a página http://localhost:3000 e o erro deve desaparecer!\n');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    console.error('\n📋 Detalhes:', error);
    
    if (error.code === '28P01') {
      console.log('\n💡 Dica: Verifique se a connection string está correta.');
      console.log('   A connection string deve ter o formato:');
      console.log('   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres\n');
    }
    
    await client.end().catch(() => {});
    return false;
  }
}

// Executar
createTables().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

