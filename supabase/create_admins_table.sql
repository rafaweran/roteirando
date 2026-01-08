-- Tabela para gerenciar administradores
-- Permite adicionar/remover administradores sem alterar código

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Função para atualizar updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir administradores iniciais
INSERT INTO admins (email, name) 
VALUES 
  ('admin@travel.com', 'Administrador Principal'),
  ('raffiweran@gmail.com', 'Rafaelle Weran')
ON CONFLICT (email) DO NOTHING;

-- Habilitar RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir leitura pública (para verificar se é admin)
CREATE POLICY "Allow public read for admin check" ON admins
    FOR SELECT USING (true);

-- Comentários
COMMENT ON TABLE admins IS 'Tabela de administradores do sistema';
COMMENT ON COLUMN admins.email IS 'Email do administrador (deve ser único)';
COMMENT ON COLUMN admins.name IS 'Nome do administrador';

