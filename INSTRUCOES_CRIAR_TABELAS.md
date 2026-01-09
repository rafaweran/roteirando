# 🚀 Instruções para Criar as Tabelas no Supabase

## ⚠️ IMPORTANTE: 
O erro "Could not find the table 'public.groups'" significa que as tabelas ainda não foram criadas no banco de dados.

## 📋 PASSO A PASSO RÁPIDO:

### 1. Abra o SQL Editor do Supabase:
👉 **LINK DIRETO:** https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/sql/new

### 2. Copie TODO o SQL abaixo:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'upcoming', 'completed')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tours table
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour Links table
CREATE TABLE IF NOT EXISTS tour_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (tour_id IS NOT NULL AND trip_id IS NULL) OR 
    (tour_id IS NULL AND trip_id IS NOT NULL)
  )
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  members_count INTEGER NOT NULL DEFAULT 0,
  members TEXT[] NOT NULL DEFAULT '{}',
  leader_name VARCHAR(255) NOT NULL,
  leader_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour Attendance table
CREATE TABLE IF NOT EXISTS tour_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  members TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, tour_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tours_trip_id ON tours(trip_id);
CREATE INDEX IF NOT EXISTS idx_tour_links_tour_id ON tour_links(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_links_trip_id ON tour_links(trip_id);
CREATE INDEX IF NOT EXISTS idx_groups_trip_id ON groups(trip_id);
CREATE INDEX IF NOT EXISTS idx_tour_attendance_group_id ON tour_attendance(group_id);
CREATE INDEX IF NOT EXISTS idx_tour_attendance_tour_id ON tour_attendance(tour_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_attendance_updated_at BEFORE UPDATE ON tour_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON trips
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON tours
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON tour_links
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON groups
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON tour_attendance
    FOR ALL USING (true) WITH CHECK (true);

-- Policy: Allow public read access
CREATE POLICY "Allow public read" ON trips
    FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON tours
    FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON tour_links
    FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON groups
    FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON tour_attendance
    FOR SELECT USING (true);
```

### 3. Cole o SQL no editor e clique em "Run" (ou pressione Cmd+Enter / Ctrl+Enter)

### 4. Aguarde a execução completar (pode levar alguns segundos)

### 5. Recarregue a página http://localhost:3000

## ✅ Depois de executar o SQL:

- Todas as tabelas serão criadas
- O erro desaparecerá
- Você poderá criar viagens, tours e grupos normalmente

## 🔗 Links Úteis:

- **SQL Editor:** https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/sql/new
- **Table Editor:** https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/editor


