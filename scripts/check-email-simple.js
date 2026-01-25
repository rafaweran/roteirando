import { createClient } from '@supabase/supabase-js';

// Cole aqui suas credenciais do Supabase temporariamente
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'SUA_URL_AQUI';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'SUA_CHAVE_AQUI';

if (supabaseUrl === 'SUA_URL_AQUI' || supabaseKey === 'SUA_CHAVE_AQUI') {
  console.error('❌ Por favor, edite o arquivo e adicione suas credenciais do Supabase');
  console.error('   Ou execute: VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=xxx node scripts/check-email-simple.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const email = 'paulapgc@hotmail.com';

async function checkEmail() {
  console.log(`🔍 Verificando email: ${email}\n`);

  // Verificar na tabela groups
  console.log('📋 Verificando na tabela groups...');
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .eq('leader_email', email);

  if (groupsError) {
    console.error('❌ Erro:', groupsError.message);
  } else {
    console.log(`✅ Encontrados ${groups?.length || 0} grupo(s)\n`);
    if (groups && groups.length > 0) {
      groups.forEach((group, index) => {
        console.log(`Grupo ${index + 1}:`);
        console.log(`  ID: ${group.id}`);
        console.log(`  Nome: ${group.name}`);
        console.log(`  Líder: ${group.leader_name}`);
        console.log(`  Email: ${group.leader_email}`);
        console.log(`  Tem senha: ${!!group.leader_password}`);
        console.log('');
      });
    } else {
      console.log('❌ NENHUM GRUPO ENCONTRADO com este email!');
      console.log('\n💡 Você precisa criar o grupo novamente.');
    }
  }

  // Buscar todos os emails similares
  console.log('\n🔎 Buscando emails similares...');
  const { data: allGroups, error: allError } = await supabase
    .from('groups')
    .select('id, name, leader_name, leader_email')
    .ilike('leader_email', '%paula%');

  if (!allError && allGroups && allGroups.length > 0) {
    console.log(`✅ Encontrados ${allGroups.length} email(s) similar(es):`);
    allGroups.forEach((g, i) => {
      console.log(`  ${i + 1}. ${g.leader_email} - ${g.name} (ID: ${g.id})`);
    });
  } else {
    console.log('❌ Nenhum email similar encontrado');
  }
}

checkEmail().catch(console.error);
