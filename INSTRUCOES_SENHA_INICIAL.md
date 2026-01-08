# Instruções: Sistema de Senha Inicial e Primeiro Acesso

## O que foi implementado

O sistema agora permite:
1. **Definir senha inicial** ao criar um grupo (no formulário Novo Grupo)
2. **Gerar senha automaticamente** com botão "Gerar"
3. **Obrigar alteração de senha** no primeiro acesso
4. **Modal de alteração de senha** que aparece automaticamente após login inicial

## Passo 1: Atualizar o Banco de Dados

Execute o seguinte SQL no Supabase para adicionar a coluna `password_changed`:

```sql
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

UPDATE groups 
SET password_changed = FALSE 
WHERE password_changed IS NULL;
```

Ou execute o arquivo `supabase/add_password_changed_column.sql` no Supabase SQL Editor.

## Passo 2: Como Funciona

### Ao Criar um Grupo:
1. O admin preenche o formulário "Novo Grupo"
2. No campo "Senha Inicial":
   - Define uma senha manualmente (mínimo 8 caracteres)
   - Ou clica em "Gerar" para criar uma senha aleatória de 12 caracteres
3. Ao salvar:
   - A senha é hasheada e salva no banco
   - `password_changed` é definido como `FALSE`
   - Email é enviado com as credenciais

### No Primeiro Login:
1. Usuário faz login com email e senha inicial
2. O sistema detecta que `password_changed = FALSE`
3. Modal de "Primeiro Acesso - Alterar Senha" aparece automaticamente
4. **Não é possível fechar o modal** até alterar a senha
5. Usuário:
   - Define nova senha (mínimo 8 caracteres)
   - Confirma a nova senha
6. Após alterar:
   - `password_changed` é atualizado para `TRUE`
   - Modal fecha automaticamente
   - Usuário é redirecionado para a tela de viagem

### Em Logins Posteriores:
- Modal não aparece mais
- Usuário acessa normalmente
- Se precisar alterar senha depois, pode usar a opção (ainda não implementada) de alterar senha no perfil

## Passo 3: Testando

1. **Como Admin:**
   - Crie um novo grupo
   - Defina uma senha inicial (ou gere uma)
   - Salve o grupo
   - Verifique o console - email será simulado com as credenciais

2. **Como Usuário (primeiro acesso):**
   - Faça logout
   - Faça login com o email e senha inicial do grupo criado
   - O modal de alteração de senha deve aparecer
   - Defina uma nova senha
   - Após alterar, você será redirecionado para a viagem

3. **Como Usuário (acessos seguintes):**
   - Faça logout e login novamente
   - Modal não deve aparecer
   - Acesso normal

## Campos do Formulário

### Senha Inicial no NewGroupForm:
- **Campo obrigatório** (mínimo 8 caracteres)
- Botão "Gerar" para criar senha aleatória
- Botão de mostrar/ocultar senha (ícone de olho)
- Texto explicativo sobre uso no primeiro acesso

### Modal de Alteração:
- **Primeiro acesso:** Não pede senha atual
- **Alterações futuras:** Pede senha atual
- Validação:
  - Nova senha mínimo 8 caracteres
  - Confirmação deve ser igual
  - Nova senha diferente da atual

## Segurança

⚠️ **IMPORTANTE**: 
- Senhas são hasheadas antes de salvar
- Atualmente usa Base64 (apenas para demo)
- **Em produção**, substitua por `bcrypt` (veja `INSTRUCOES_SENHA.md`)

## Fluxo Visual

```
Admin cria grupo
    ↓
Define senha inicial (ou gera)
    ↓
Salva → Senha hasheada → password_changed = FALSE
    ↓
Email enviado com credenciais
    ↓
───────────────────────────────
    ↓
Usuário faz login
    ↓
Sistema verifica: password_changed = FALSE?
    ↓ SIM
Modal aparece automaticamente
    ↓
Usuário altera senha
    ↓
password_changed = TRUE
    ↓
Modal fecha → Redireciona para viagem
```

## Notas

- Grupos antigos (sem senha): precisarão ter senha definida manualmente
- O modal de primeiro acesso **não pode ser cancelado**
- Após primeiro acesso, modal não aparece mais
- Para redefinir senha futuramente, seria necessário implementar função adicional

