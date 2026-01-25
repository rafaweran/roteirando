import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env') });
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const email = 'elleafarnarew@gmail.com';

async function checkEmail() {
  console.log(`🔍 Verificando email: ${email}\n`);

  // Verificar na tabela groups
  console.log('📋 Verificando na tabela groups...');
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .eq('leader_email', email);

  if (groupsError) {
    console.error('❌ Erro ao buscar na tabela groups:', groupsError);
  } else {
    console.log(`✅ Encontrados ${groups?.length || 0} grupo(s) com este email:`);
    if (groups && groups.length > 0) {
      groups.forEach((group, index) => {
        console.log(`\n  Grupo ${index + 1}:`);
        console.log(`    - ID: ${group.id}`);
        console.log(`    - Nome: ${group.name}`);
        console.log(`    - Líder: ${group.leader_name}`);
        console.log(`    - Email: ${group.leader_email}`);
        console.log(`    - Trip ID: ${group.trip_id}`);
        console.log(`    - Tem senha: ${!!group.leader_password}`);
        console.log(`    - Senha alterada: ${group.password_changed}`);
      });
    }
  }

  // Verificar na tabela admins
  console.log('\n\n👤 Verificando na tabela admins...');
  const { data: admins, error: adminsError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email);

  if (adminsError) {
    console.error('❌ Erro ao buscar na tabela admins:', adminsError);
  } else {
    console.log(`✅ Encontrados ${admins?.length || 0} admin(s) com este email:`);
    if (admins && admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`\n  Admin ${index + 1}:`);
        console.log(`    - ID: ${admin.id}`);
        console.log(`    - Email: ${admin.email}`);
        console.log(`    - Tem senha: ${!!admin.password}`);
        console.log(`    - Senha alterada: ${admin.password_changed}`);
      });
    }
  }

  // Verificar variações do email
  console.log('\n\n🔎 Verificando variações do email...');
  const variations = [
    email.toLowerCase(),
    email.toUpperCase(),
    email.trim(),
    email.toLowerCase().trim()
  ];

  for (const variation of variations) {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, leader_email')
      .ilike('leader_email', variation);

    if (!error && data && data.length > 0) {
      console.log(`  ✅ Encontrado com variação "${variation}":`, data.length);
    }
  }

  console.log('\n✅ Verificação concluída!');
}

checkEmail().catch(console.error);
