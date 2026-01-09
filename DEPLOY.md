# Guia de Deploy - Roteirando

## Opções de Deploy

### 1. Vercel (Recomendado - Mais Fácil)

#### Passo 1: Build do Projeto
```bash
npm run build
```

#### Passo 2: Instalar Vercel CLI (se ainda não tiver)
```bash
npm install -g vercel
```

#### Passo 3: Fazer Login
```bash
vercel login
```

#### Passo 4: Deploy
```bash
vercel
```

Ou para produção:
```bash
vercel --prod
```

#### Passo 5: Configurar Variáveis de Ambiente
No dashboard da Vercel, adicione as variáveis:
- `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anon do Supabase

**Vantagens:**
- Deploy automático a cada push no GitHub
- HTTPS automático
- CDN global
- Gratuito para projetos pessoais

---

### 2. Netlify

#### Passo 1: Build do Projeto
```bash
npm run build
```

#### Passo 2: Instalar Netlify CLI
```bash
npm install -g netlify-cli
```

#### Passo 3: Fazer Login
```bash
netlify login
```

#### Passo 4: Deploy
```bash
netlify deploy --prod
```

Ou arraste a pasta `dist` para o site da Netlify.

#### Configuração no Netlify Dashboard:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Environment variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

---

### 3. GitHub Pages

#### Passo 1: Instalar gh-pages
```bash
npm install --save-dev gh-pages
```

#### Passo 2: Adicionar script no package.json
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

#### Passo 3: Deploy
```bash
npm run deploy
```

**Nota:** Configure o `base` no `vite.config.ts` para o nome do repositório.

---

### 4. Deploy Manual (Qualquer Servidor)

#### Passo 1: Build
```bash
npm run build
```

#### Passo 2: Upload
Faça upload da pasta `dist` para seu servidor via FTP/SFTP.

#### Passo 3: Configurar Servidor
Configure seu servidor web (Nginx, Apache, etc.) para servir os arquivos da pasta `dist`.

---

## Comandos Úteis

### Build para Produção
```bash
npm run build
```
Isso cria a pasta `dist/` com os arquivos otimizados.

### Preview Local do Build
```bash
npm run preview
```
Testa o build localmente antes de fazer deploy.

### Verificar Build
```bash
npm run build && npm run preview
```

---

## Variáveis de Ambiente

Certifique-se de configurar estas variáveis no seu serviço de deploy:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

**Importante:** Variáveis que começam com `VITE_` são expostas no cliente. Não coloque informações sensíveis aqui.

---

## Checklist Antes do Deploy

- [ ] Executar `npm run build` localmente e verificar se funciona
- [ ] Testar com `npm run preview`
- [ ] Configurar variáveis de ambiente no serviço de deploy
- [ ] Verificar se o Supabase está configurado corretamente
- [ ] Testar login e funcionalidades principais
- [ ] Verificar se as imagens/assets estão sendo carregados corretamente

---

## Troubleshooting

### Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro: Variáveis de ambiente não funcionam
- Certifique-se de que as variáveis começam com `VITE_`
- Faça rebuild após adicionar variáveis: `npm run build`

### Erro: Rotas não funcionam
- Configure redirects no servidor para apontar todas as rotas para `index.html`
- Veja exemplos em `vercel.json` ou `netlify.toml`


