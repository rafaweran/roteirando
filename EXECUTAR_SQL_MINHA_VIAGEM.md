# Executar SQL para Criar Tabela de Informações de Viagem do Usuário

## ⚠️ IMPORTANTE
Para que a funcionalidade "Minha Viagem" funcione completamente, você precisa executar o SQL abaixo no Supabase.

## 📋 Como Executar o SQL

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o SQL abaixo:

```sql
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
CREATE TRIGGER update_user_travel_info_updated_at 
  BEFORE UPDATE ON user_travel_info
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE user_travel_info ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir leitura e escrita para usuários autenticados
CREATE POLICY "Allow all for authenticated users" ON user_travel_info
  FOR ALL USING (true) WITH CHECK (true);

-- Policy: Permitir leitura pública (para compatibilidade)
CREATE POLICY "Allow public read" ON user_travel_info
  FOR SELECT USING (true);
```

6. Clique em **Run** (ou pressione `Cmd+Enter` / `Ctrl+Enter`)
7. Verifique se a mensagem de sucesso aparece

### Opção 2: Via Arquivo SQL

O arquivo está em: `supabase/create_user_travel_info.sql`

Você pode copiar o conteúdo desse arquivo e executar no SQL Editor.

## ✅ Verificação

Após executar o SQL, você pode verificar se funcionou:

1. No SQL Editor, execute:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_travel_info'
ORDER BY ordinal_position;
```

2. Deve retornar todas as colunas da tabela `user_travel_info`

## 🎯 Resultado

Depois de executar o SQL:
- ✅ A página "Minha Viagem" estará disponível no menu
- ✅ Usuários poderão cadastrar informações do hotel
- ✅ Usuários poderão cadastrar detalhes do voo
- ✅ Usuários poderão cadastrar informações de aluguel de carro
- ✅ Usuários poderão editar seus dados pessoais
- ✅ Todas as informações serão salvas no banco de dados

## 📝 Nota

O código já foi ajustado para funcionar **mesmo sem** a tabela, mas os dados não serão salvos até você executar o SQL.
