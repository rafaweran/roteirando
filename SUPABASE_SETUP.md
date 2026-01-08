# Configuração do Supabase

Este documento explica como configurar o Supabase para o projeto Roteirando.

## Passos para Configuração

### 1. Criar um Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha os dados do projeto:
   - Nome do projeto
   - Senha do banco de dados
   - Região (escolha a mais próxima)
5. Aguarde a criação do projeto

### 2. Obter as Credenciais

1. No painel do Supabase, vá em **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL** (será sua `VITE_SUPABASE_URL`)
   - **anon/public key** (será sua `VITE_SUPABASE_ANON_KEY`)

### 3. Criar o Arquivo .env

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

**IMPORTANTE**: Substitua `sua_url_do_supabase` e `sua_chave_anon_do_supabase` pelos valores reais do seu projeto.

### 4. Criar as Tabelas no Banco de Dados

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `supabase/schema.sql`
4. Clique em **Run** para executar o SQL

Isso criará todas as tabelas necessárias:
- `trips` - Viagens
- `tours` - Excursões/Tours
- `tour_links` - Links relacionados a tours ou trips
- `groups` - Grupos de viajantes
- `tour_attendance` - Participação de grupos em tours

### 5. Verificar se Está Funcionando

1. No painel do Supabase, vá em **Table Editor**
2. Você deve ver as seguintes tabelas:
   - trips
   - tours
   - tour_links
   - groups
   - tour_attendance

## Estrutura das Tabelas

### trips (Viagens)
- `id` (UUID) - Identificador único
- `name` (VARCHAR) - Nome da viagem
- `destination` (VARCHAR) - Destino
- `start_date` (DATE) - Data de início
- `end_date` (DATE) - Data de término
- `description` (TEXT) - Descrição
- `status` (VARCHAR) - Status: 'active', 'upcoming', 'completed'
- `image_url` (TEXT) - URL da imagem

### tours (Excursões)
- `id` (UUID) - Identificador único
- `trip_id` (UUID) - Referência à viagem
- `name` (VARCHAR) - Nome do tour
- `date` (DATE) - Data do tour
- `time` (TIME) - Horário
- `price` (DECIMAL) - Preço
- `description` (TEXT) - Descrição
- `image_url` (TEXT) - URL da imagem

### tour_links (Links)
- `id` (UUID) - Identificador único
- `tour_id` (UUID) - Referência ao tour (opcional)
- `trip_id` (UUID) - Referência à viagem (opcional)
- `title` (VARCHAR) - Título do link
- `url` (TEXT) - URL do link

### groups (Grupos)
- `id` (UUID) - Identificador único
- `trip_id` (UUID) - Referência à viagem
- `name` (VARCHAR) - Nome do grupo
- `members_count` (INTEGER) - Quantidade de membros
- `members` (TEXT[]) - Array com nomes dos membros
- `leader_name` (VARCHAR) - Nome do líder
- `leader_email` (VARCHAR) - Email do líder

### tour_attendance (Participação)
- `id` (UUID) - Identificador único
- `group_id` (UUID) - Referência ao grupo
- `tour_id` (UUID) - Referência ao tour
- `members` (TEXT[]) - Array com nomes dos membros que participam

## Políticas de Segurança (RLS)

Por padrão, o schema cria políticas que permitem:
- **Leitura pública**: Qualquer pessoa pode ler os dados
- **Escrita para usuários autenticados**: Apenas usuários autenticados podem criar/editar/deletar

Você pode personalizar essas políticas no painel do Supabase em **Authentication** > **Policies** se precisar de controle mais granular.

## Testando a Conexão

Após configurar tudo, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

O projeto deve se conectar ao Supabase automaticamente. Se houver erros, verifique:
1. Se o arquivo `.env` foi criado corretamente
2. Se as credenciais estão corretas
3. Se as tabelas foram criadas no Supabase

