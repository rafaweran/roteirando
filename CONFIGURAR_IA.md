# 🤖 Configurar IA para Geração de Textos

## Funcionalidade

Agora você pode usar IA para gerar automaticamente descrições de passeios! Basta preencher o nome do passeio e clicar no botão "Gerar com IA" ao lado do campo de descrição.

## Como Configurar

### 1. Obter API Key do Google Gemini

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar Variável de Ambiente

#### Para Desenvolvimento Local

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
VITE_GEMINI_API_KEY=sua_chave_aqui
```

**Importante:** O prefixo `VITE_` é necessário para que o Vite exponha a variável no cliente.

#### Para Produção (Vercel)

1. Acesse o dashboard do Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** Sua chave do Gemini
   - **Environment:** Production, Preview, Development (selecione todos)
4. Clique em **Save**
5. Faça um novo deploy

#### Para Produção (Netlify)

1. Acesse o dashboard do Netlify
2. Vá em **Site settings** → **Environment variables**
3. Adicione:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** Sua chave do Gemini
4. Clique em **Save**
5. Faça um novo deploy

## Como Usar

1. Abra o formulário de **Novo Passeio**
2. Preencha o **Nome do passeio** (obrigatório)
3. (Opcional) Preencha outros campos como data, local, preço
4. Clique no botão **"Gerar com IA"** ao lado do campo Descrição
5. Aguarde alguns segundos enquanto a IA gera o texto
6. A descrição será preenchida automaticamente
7. Você pode editar o texto gerado se desejar

## O que a IA Considera

A IA usa as seguintes informações para gerar a descrição:
- Nome do passeio
- Data (se preenchida)
- Local (se preenchido)
- Preço (se preenchido)
- Nome da viagem (se vinculada)
- Destino da viagem (se vinculada)

## Limitações

- Requer conexão com a internet
- Requer API key válida do Google Gemini
- Pode levar alguns segundos para gerar
- O texto gerado é uma sugestão e pode ser editado

## Troubleshooting

### Erro: "GEMINI_API_KEY não configurada"

**Solução:** Verifique se:
1. A variável está no arquivo `.env` com o prefixo `VITE_`
2. O servidor foi reiniciado após adicionar a variável
3. Em produção, a variável está configurada no painel do Vercel/Netlify

### Erro: "Erro na API: 400"

**Solução:** Verifique se:
1. A API key está correta
2. A API key não expirou
3. Você tem créditos/quota disponível no Google AI Studio

### Botão "Gerar com IA" desabilitado

**Solução:** O botão só funciona se o campo "Nome do passeio" estiver preenchido.

## Segurança

⚠️ **IMPORTANTE:**
- A API key será exposta no código do cliente (browser)
- Use uma API key com restrições de domínio se possível
- Não compartilhe sua API key publicamente
- Monitore o uso da API no Google AI Studio


