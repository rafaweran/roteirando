-- Tabela para passeios personalizados dos usuários
-- Permite que usuários cadastrem seus próprios passeios na agenda

CREATE TABLE IF NOT EXISTS user_custom_tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  price DECIMAL(10, 2),
  description TEXT,
  image_url TEXT,
  address TEXT,
  location TEXT, -- Local/ponto de encontro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_custom_tours_group_id ON user_custom_tours(group_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_tours_date ON user_custom_tours(date);

-- Função para atualizar updated_at (já deve existir, mas garantindo)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_custom_tours_updated_at ON user_custom_tours;
CREATE TRIGGER update_user_custom_tours_updated_at 
  BEFORE UPDATE ON user_custom_tours
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_custom_tours ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir todas as operações para usuários autenticados
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_custom_tours;
CREATE POLICY "Allow all for authenticated users" ON user_custom_tours
  FOR ALL USING (true) WITH CHECK (true);

-- Policy: Permitir leitura pública
DROP POLICY IF EXISTS "Allow public read" ON user_custom_tours;
CREATE POLICY "Allow public read" ON user_custom_tours
  FOR SELECT USING (true);

-- Comentários nas colunas
COMMENT ON TABLE user_custom_tours IS 'Passeios personalizados cadastrados pelos usuários';
COMMENT ON COLUMN user_custom_tours.group_id IS 'Grupo do usuário que cadastrou o passeio';
COMMENT ON COLUMN user_custom_tours.location IS 'Local/ponto de encontro do passeio (ex: Saída do hotel)';
COMMENT ON COLUMN user_custom_tours.address IS 'Endereço completo do passeio';
