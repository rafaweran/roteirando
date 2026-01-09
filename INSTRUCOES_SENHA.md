# Instruções: Sistema de Senhas para Líderes de Grupo

## O que foi implementado

Quando um grupo é criado, o sistema agora:
1. **Gera uma senha aleatória segura** (12 caracteres com maiúsculas, minúsculas, números e símbolos)
2. **Salva a senha hasheada** no banco de dados
3. **Envia um email** (simulado no console por enquanto) com as credenciais de acesso

## Passo 1: Atualizar o Banco de Dados

Execute o seguinte SQL no Supabase para adicionar a coluna `leader_password`:

```sql
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS leader_password VARCHAR(255);
```

Ou execute o arquivo `supabase/add_password_column.sql` no Supabase SQL Editor.

## Passo 2: Como Funciona

### Ao Criar um Grupo:
1. O admin preenche o formulário de novo grupo
2. O sistema gera automaticamente uma senha segura
3. A senha é hasheada e salva no banco
4. Um email é enviado (simulado) com:
   - Email do líder
   - Senha inicial
   - Nome do grupo e viagem

### Ao Fazer Login:
1. O usuário digita email e senha
2. O sistema busca o grupo pelo email
3. Verifica se a senha está correta
4. Permite acesso se as credenciais estiverem corretas

## Passo 3: Configurar Envio Real de Email (Opcional)

Atualmente, o email é apenas simulado (aparece no console). Para enviar emails reais:

### Opção 1: Usar Supabase Edge Functions
1. Crie uma Edge Function no Supabase
2. Configure um serviço de email (SendGrid, Resend, etc.)
3. Descomente o código em `lib/email.ts` na função `sendEmailViaSupabase`

### Opção 2: Usar SendGrid
1. Crie conta no SendGrid
2. Obtenha API Key
3. Descomente e configure o código em `lib/email.ts` na função `sendCredentialsEmail`

### Opção 3: Usar Resend
1. Crie conta no Resend
2. Configure API Key
3. Adicione integração similar em `lib/email.ts`

## Segurança

⚠️ **IMPORTANTE**: 
- A senha é hasheada antes de salvar no banco
- Atualmente usa Base64 (apenas para demo)
- **Em produção**, substitua por `bcrypt` ou similar:

```typescript
// Em lib/password.ts, substitua:
import bcrypt from 'bcryptjs';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}
```

## Testando

1. Crie um novo grupo como admin
2. Verifique o console do navegador - você verá o email simulado com as credenciais
3. Faça logout
4. Tente fazer login com o email e senha gerados
5. O login deve funcionar!

## Notas

- Senhas antigas (grupos criados antes desta atualização) não terão senha
- Esses usuários verão uma mensagem pedindo para entrar em contato com o admin
- O admin pode atualizar a senha manualmente no banco se necessário


