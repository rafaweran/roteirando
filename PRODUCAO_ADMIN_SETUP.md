# Configurar Administrador em Produção

## Problema
O email `raffiweran@gmail.com` funciona localmente mas não em produção.

## Solução

### Passo 1: Executar Script SQL no Supabase de Produção

1. Acesse o **Supabase Dashboard** do seu projeto de produção
2. Vá em **SQL Editor**
3. Execute o script completo abaixo:

```sql
-- Criar tabela de administradores se não existir
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Criar função de trigger se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar administradores
INSERT INTO admins (email, name) 
VALUES 
  ('admin@travel.com', 'Administrador Principal'),
  ('raffiweran@gmail.com', 'Rafaelle Weran')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, updated_at = NOW();

-- Habilitar RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Criar policy para leitura pública
DROP POLICY IF EXISTS "Allow public read for admin check" ON admins;
CREATE POLICY "Allow public read for admin check" ON admins
    FOR SELECT USING (true);

-- Verificar se foi adicionado
SELECT * FROM admins ORDER BY created_at;
```

### Passo 2: Verificar Variáveis de Ambiente em Produção

Certifique-se de que as variáveis de ambiente estão configuradas no seu serviço de deploy:

**Vercel:**
1. Vá em Settings → Environment Variables
2. Adicione:
   - `VITE_SUPABASE_URL` = URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` = Chave anon do Supabase

**Netlify:**
1. Vá em Site settings → Environment variables
2. Adicione as mesmas variáveis acima

### Passo 3: Verificar se o Código em Produção está Atualizado

Certifique-se de que o código em produção tem a versão mais recente com o sistema de administradores:

1. Verifique se o deploy foi feito após as últimas alterações
2. Se necessário, faça um novo deploy:
   ```bash
   npm run build
   vercel --prod  # ou netlify deploy --prod
   ```

### Passo 4: Testar

1. Acesse a aplicação em produção
2. Tente fazer login com `raffiweran@gmail.com`
3. Verifique o console do navegador (F12) para ver os logs

## Debug

Se ainda não funcionar, verifique:

1. **Console do navegador (F12):**
   - Procure por logs que começam com "✅ Login como administrador"
   - Verifique se há erros relacionados ao Supabase

2. **Network tab:**
   - Verifique se as requisições ao Supabase estão sendo feitas
   - Verifique se há erros 401/403 nas requisições

3. **Verificar no Supabase:**
   ```sql
   -- Ver todos os administradores
   SELECT * FROM admins;
   
   -- Verificar se o email está lá
   SELECT * FROM admins WHERE email = 'raffiweran@gmail.com';
   ```

4. **Verificar variáveis de ambiente:**
   - No console do navegador, verifique:
     ```javascript
     console.log(import.meta.env.VITE_SUPABASE_URL);
     console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
     ```
   - Se retornar `undefined`, as variáveis não estão configuradas

## Fallback

O sistema tem um fallback que funciona mesmo sem a tabela `admins`:
- `admin@travel.com`
- `raffiweran@gmail.com`

Se a tabela não existir, esses emails ainda funcionarão como administradores.

