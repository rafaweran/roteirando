# 🗺️ Configurar Google Maps API (Opcional)

## ⚠️ IMPORTANTE: Você não precisa do Google Maps!

O sistema funciona **100% gratuito** sem nenhuma API key usando cálculo Haversine. Veja `CONFIGURAR_DISTANCIA.md` para alternativas gratuitas.

## Funcionalidade

O Google Maps é uma opção **paga** para cálculo de distâncias. Se você quiser usar (opcional), siga as instruções abaixo.

## Como Configurar

### 1. Obter API Key do Google Maps

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Distance Matrix API**:
   - Vá em **APIs & Services** → **Library**
   - Procure por "Distance Matrix API"
   - Clique em **Enable**
4. Crie uma API Key:
   - Vá em **APIs & Services** → **Credentials**
   - Clique em **Create Credentials** → **API Key**
   - Copie a chave gerada
5. (Opcional) Restrinja a API Key:
   - Clique na chave criada
   - Em **API restrictions**, selecione **Restrict key**
   - Selecione apenas **Distance Matrix API**
   - Em **Application restrictions**, você pode restringir por domínio (recomendado para produção)

### 2. Configurar Variável de Ambiente

#### Para Desenvolvimento Local

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

**Importante:** O prefixo `VITE_` é necessário para que o Vite exponha a variável no cliente.

#### Para Produção (Vercel)

1. Acesse o dashboard do Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - **Name:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** Sua chave do Google Maps
   - **Environment:** Production, Preview, Development (selecione todos)
4. Clique em **Save**
5. Faça um novo deploy

#### Para Produção (Netlify)

1. Acesse o dashboard do Netlify
2. Vá em **Site settings** → **Environment variables**
3. Adicione:
   - **Key:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** Sua chave do Google Maps
4. Clique em **Save**
5. Faça um novo deploy

## Como Funciona

1. Quando um usuário visualiza um passeio, o sistema:
   - Busca o endereço do hotel cadastrado em "Minha Viagem"
   - Busca o endereço do passeio
   - Calcula a distância e tempo usando a Google Maps Distance Matrix API
   - Exibe as informações no card e na página de detalhes

2. As informações exibidas incluem:
   - **Distância:** em km (ex: "5.2 km")
   - **Tempo estimado:** em minutos ou horas (ex: "15 min" ou "1h 30min")

## Onde Aparece

- **TourCard:** Badge com distância e tempo ao lado da data/horário (apenas para usuários)
- **TourDetailPage:** Badge abaixo do endereço do passeio (apenas para usuários)

## Limitações

- Requer conexão com a internet
- Requer API key válida do Google Maps
- Requer que o usuário tenha cadastrado um endereço de hotel em "Minha Viagem"
- Requer que o passeio tenha um endereço cadastrado
- A API do Google Maps tem limites de uso gratuitos (ver abaixo)

## Custos e Limites

A Google Maps Distance Matrix API oferece:
- **$200 de crédito grátis por mês** (equivalente a aproximadamente 40.000 requisições)
- Após o crédito grátis, cobra $5 por 1.000 requisições

**Dica:** Para economizar, o sistema só calcula a distância quando:
- O usuário está logado
- O usuário tem um hotel cadastrado
- O passeio tem um endereço cadastrado

## Solução de Problemas

### Erro: "GOOGLE_MAPS_API_KEY não configurada"

1. Verifique se a variável de ambiente está configurada corretamente
2. Verifique se o prefixo `VITE_` está presente
3. Reinicie o servidor de desenvolvimento após adicionar a variável

### Distância não aparece

1. Verifique se o usuário cadastrou um endereço de hotel em "Minha Viagem"
2. Verifique se o passeio tem um endereço cadastrado
3. Verifique se a API key está ativa e tem permissões corretas
4. Verifique o console do navegador para erros

### Erro na API do Google Maps

1. Verifique se a Distance Matrix API está habilitada no projeto
2. Verifique se a API key tem permissão para usar a Distance Matrix API
3. Verifique se há créditos/quota disponível no Google Cloud Console
4. Verifique se os endereços estão em formato válido

## Notas Importantes

- A API key será exposta no código do cliente (é necessário para funcionar)
- Recomende restringir a API key por domínio em produção
- Monitore o uso da API no Google Cloud Console
- Configure alertas de uso para evitar custos inesperados
