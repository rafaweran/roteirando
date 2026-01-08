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
  return btoa(password) === hashedPassword;
}

