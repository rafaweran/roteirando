/**
 * Função para gerar senha aleatória segura
 */
export function generatePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Garantir pelo menos um de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Preencher o resto aleatoriamente
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralhar a senha
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Hash simples da senha (em produção, use bcrypt ou similar)
 * Por enquanto, apenas base64 para demonstração
 */
export function hashPassword(password: string): string {
  // Em produção, use: import bcrypt from 'bcryptjs'; return bcrypt.hashSync(password, 10);
  return btoa(password); // Base64 encoding (apenas para demo)
}

/**
 * Verifica se a senha está correta
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  // Em produção, use: return bcrypt.compareSync(password, hashedPassword);
  
  if (!password || !hashedPassword) {
    console.log('❌ Senha ou hash vazio');
    return false;
  }
  
  // Remover espaços em branco e normalizar
  const cleanPassword = password.trim();
  const cleanHash = hashedPassword.trim();
  
  // Verificar se a senha armazenada está em texto plano (caso tenha sido salva sem hash)
  // Se a senha digitada for igual à senha armazenada, aceitar (senha em texto plano)
  if (cleanPassword === cleanHash) {
    console.log('⚠️ Senha encontrada em texto plano no banco (sem hash)');
    return true;
  }
  
  // Gerar hash da senha fornecida
  try {
    const inputHash = btoa(cleanPassword);
    
    // Debug log
    console.log('🔍 verifyPassword - Comparação:', {
      passwordLength: cleanPassword.length,
      hashLength: cleanHash.length,
      inputHash,
      storedHash: cleanHash,
      match: inputHash === cleanHash
    });
    
    const match = inputHash === cleanHash;
    
    if (!match) {
      console.log('❌ Hash não corresponde. Verificando se há diferenças de encoding...');
      // Tentar diferentes formas de comparação
      const inputHash2 = btoa(unescape(encodeURIComponent(cleanPassword)));
      if (inputHash2 === cleanHash) {
        console.log('✅ Match encontrado com encoding alternativo');
        return true;
      }
    }
    
    return match;
  } catch (error) {
    console.error('❌ Erro ao verificar senha:', error);
    return false;
  }
}


