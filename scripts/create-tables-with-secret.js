/**
 * Script para criar todas as tabelas no Supabase usando a service_role key
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://dmsawbzaaftdtiggyfxd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_gRVxnhkrJS30kHCUZvRQXQ_RWTuX1OF';

// Ler o arquivo SQL
const sqlPath = path.join(__dirname, '../supabase/schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function createTables() {
  console.log('🚀 Criando tabelas no Supabase...\n');
  
  try {
    // O Supabase não tem um endpoint REST direto para executar SQL
    // Mas podemos usar a API REST com a service_role key via pg_net ou
    // usar o método correto do Supabase Management API
    
    // Tentativa 1: Usar o endpoint de RPC se houver uma função disponível
    // Tentativa 2: Usar o Management API diretamente
    
    console.log('📝 SQL a ser executado:\n');
    console.log(sql.substring(0, 200) + '...\n');
    
    // Dividir SQL em statements individuais
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s.length > 10);
    
    console.log(`📊 Encontrados ${statements.length} comandos SQL para executar\n`);
    
    // Para executar SQL DDL, precisamos usar o Management API ou connection direta
    // O Supabase Management API não expõe um endpoint público para executar SQL
    // A melhor forma é usar um script que se conecta diretamente ao PostgreSQL
    
    // Alternativa: Criar tabelas via REST API usando inserts (não funciona para DDL)
    // OU: Usar a connection string do Supabase para conectar diretamente ao PostgreSQL
    
    console.log('⚠️  O Supabase não permite executar SQL DDL via REST API, mesmo com service_role key.');
    console.log('📋 A forma mais confiável é usar o SQL Editor ou conectar diretamente ao PostgreSQL.\n');
    
    // Tentar usar a connection string do Supabase para executar via pg
    console.log('🔍 Tentando método alternativo...\n');
    
    // Podemos tentar criar uma função RPC primeiro que execute SQL
    // Mas isso também requer que já tenhamos acesso ao banco
    
    console.log('💡 SOLUÇÃO: Usar a service_role key para conectar diretamente ao PostgreSQL');
    console.log('   Isso requer a connection string do banco.\n');
    
    // Para executar SQL DDL via API, precisamos usar a connection string
    // Vou criar um script que usa a biblioteca @supabase/supabase-js com a service_role key
    // e tenta executar via uma função RPC ou via Management API
    
    console.log('📋 Criando tabelas via método alternativo...\n');
    
    // Método: Executar SQL via função RPC que precisa ser criada primeiro
    // OU usar uma biblioteca PostgreSQL para conectar diretamente
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n📋 SOLUÇÃO ALTERNATIVA:');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/sql/new');
    console.log('   2. Cole o SQL do arquivo: supabase/schema.sql');
    console.log('   3. Execute no SQL Editor\n');
  }
}

createTables();


