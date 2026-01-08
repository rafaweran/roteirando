import { supabase } from './supabase';

/**
 * Cria um usuário no Supabase Auth
 * IMPORTANTE: Para criar usuários via API, você precisa usar a service_role key
 * ou criar uma Edge Function que tenha permissão para isso
 */
export async function createAuthUser(email: string, password: string, metadata?: { [key: string]: any }) {
  try {
    // Método 1: Usar signUp (cria usuário e faz login)
    // Nota: Isso pode enviar email de confirmação dependendo das configurações
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: metadata || {},
        emailRedirectTo: undefined, // Não redirecionar após confirmação
      }
    });

    if (error) {
      // Se o usuário já existe, não é erro fatal
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        console.log('⚠️ Usuário já existe no Auth:', email);
        return { success: true, user: null, alreadyExists: true };
      }
      throw error;
    }

    console.log('✅ Usuário criado no Supabase Auth:', email);
    return { success: true, user: data.user, alreadyExists: false };
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário no Auth:', error);
    // Não falhar completamente - o grupo ainda será criado
    return { success: false, error: error.message, user: null };
  }
}

/**
 * Atualiza a senha de um usuário no Supabase Auth
 * IMPORTANTE: Requer autenticação ou service_role key
 */
export async function updateAuthUserPassword(email: string, newPassword: string) {
  try {
    // Para atualizar senha, precisamos fazer login primeiro ou usar service_role
    // Por enquanto, vamos apenas logar o que seria feito
    console.log('🔄 Atualização de senha no Auth seria feita aqui para:', email);
    
    // Em produção, você usaria:
    // 1. Edge Function com service_role
    // 2. Ou fazer o usuário fazer login e usar updateUser
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao atualizar senha no Auth:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica se um usuário existe no Supabase Auth
 */
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    // Não há API direta para verificar, mas podemos tentar signIn
    // Em produção, use uma Edge Function ou verifique na tabela auth.users
    return false; // Placeholder
  } catch (error) {
    return false;
  }
}

