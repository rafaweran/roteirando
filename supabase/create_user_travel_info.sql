-- Tabela para armazenar informações pessoais de viagem do usuário
-- Cada grupo (group) pode ter informações de hotel, voo e aluguel de carro

CREATE TABLE IF NOT EXISTS user_travel_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  
  -- Dados do Hotel
  hotel_name VARCHAR(255),
  hotel_address TEXT,
  hotel_checkin DATE,
  hotel_checkout DATE,
  hotel_phone VARCHAR(50),
  hotel_confirmation_code VARCHAR(100),
  hotel_notes TEXT,
  
  -- Dados do Voo
  flight_company VARCHAR(255),
  flight_number VARCHAR(50),
  flight_departure_date DATE,
  flight_departure_time TIME,
  flight_departure_airport VARCHAR(255),
  flight_arrival_date DATE,
  flight_arrival_time TIME,
  flight_arrival_airport VARCHAR(255),
  flight_confirmation_code VARCHAR(100),
  flight_notes TEXT,
  
  -- Dados do Aluguel de Carro
  car_rental_company VARCHAR(255),
  car_rental_pickup_date DATE,
  car_rental_pickup_time TIME,
  car_rental_pickup_location TEXT,
  car_rental_return_date DATE,
  car_rental_return_time TIME,
  car_rental_return_location TEXT,
  car_rental_confirmation_code VARCHAR(100),
  car_rental_notes TEXT,
  
  -- Dados Pessoais (podem ser editados pelo usuário)
  personal_name VARCHAR(255),
  personal_email VARCHAR(255),
  personal_phone VARCHAR(50),
  personal_document VARCHAR(50), -- CPF, Passaporte, etc.
  personal_emergency_contact VARCHAR(255),
  personal_emergency_phone VARCHAR(50),
  personal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(group_id) -- Um registro por grupo
);

-- Índice para busca rápida por grupo
CREATE INDEX IF NOT EXISTS idx_user_travel_info_group_id ON user_travel_info(group_id);

-- Trigger para atualizar updated_at
-- Remove o trigger se já existir antes de criar
DROP TRIGGER IF EXISTS update_user_travel_info_updated_at ON user_travel_info;
CREATE TRIGGER update_user_travel_info_updated_at 
  BEFORE UPDATE ON user_travel_info
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE user_travel_info IS 'Informações pessoais de viagem do usuário (hotel, voo, aluguel de carro)';
COMMENT ON COLUMN user_travel_info.group_id IS 'Referência ao grupo do usuário';
COMMENT ON COLUMN user_travel_info.hotel_name IS 'Nome do hotel';
COMMENT ON COLUMN user_travel_info.flight_company IS 'Companhia aérea';
COMMENT ON COLUMN user_travel_info.car_rental_company IS 'Empresa de aluguel de carro';

-- Habilitar RLS
ALTER TABLE user_travel_info ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir leitura e escrita para usuários autenticados
-- Remove a policy se já existir antes de criar
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_travel_info;
CREATE POLICY "Allow all for authenticated users" ON user_travel_info
  FOR ALL USING (true) WITH CHECK (true);

-- Policy: Permitir leitura pública (para compatibilidade)
-- Remove a policy se já existir antes de criar
DROP POLICY IF EXISTS "Allow public read" ON user_travel_info;
CREATE POLICY "Allow public read" ON user_travel_info
  FOR SELECT USING (true);
