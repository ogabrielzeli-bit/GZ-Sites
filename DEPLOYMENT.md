# Deploy

Há dois deploys diferentes: **os sites dos clientes** (estáticos, Netlify) e **o próprio GZ OS** (painel + API, opcional hospedar).

## 1. Sites dos clientes (Netlify)

Cada projeto gera em `dist/`:

- HTML/CSS/JS estáticos (sem build no servidor);
- `_headers` — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS, Content-Security-Policy e cache de `assets/*`;
- `_redirects` — `/index.html → /`;
- `netlify.toml` — mesmos headers (redundância para deploy via Git);
- `robots.txt`, `sitemap.xml` (quando não é prévia).

### Manual (recomendado, sem credenciais)
1. Painel → projeto → **Exportar ZIP (Netlify)**.
2. app.netlify.com → _Add new site_ → _Deploy manually_ → arraste o ZIP.
3. Em _Domain management_, aponte o domínio do cliente.

### Netlify CLI
```bash
cd data/projects/<slug>
npx netlify deploy --dir=dist --prod
```

### API (botão "Publicar na Netlify")
Informe um Personal Access Token (Netlify → User settings → Applications). O token é enviado apenas naquela requisição e **não é armazenado**. Alternativa: `NETLIFY_AUTH_TOKEN` no `.env`. Guarde o Site ID retornado para atualizações.

### Formulários
Padrão: envio via WhatsApp (abre a conversa com os dados). Para Netlify Forms, defina `integrations.form = "netlify"` no `site.config.json` e refaça o build (o formulário já sai com `data-netlify` e honeypot).

### Fora da Netlify
O `dist/` é estático: funciona em Vercel, Cloudflare Pages, GitHub Pages, cPanel. Replique os headers do `_headers` no servidor escolhido.

## 2. Hospedar o GZ OS

O GZ OS precisa de Node ≥ 22.13 e Chromium (Playwright). Roda bem em uma VPS pequena (2 GB RAM) ou no seu computador.

```bash
npm ci
npx playwright install --with-deps chromium
npm run build
# .env:
#   HOST=0.0.0.0
#   PORT=4800
#   GZ_ACCESS_TOKEN=<um segredo longo>     ← obrigatório se exposto na internet
#   GZ_DATA_DIR=/var/gz-os/data            ← fora da pasta do código
npm start
```

- Com `GZ_ACCESS_TOKEN` definido, tudo exige o token (`?token=` uma vez, vira cookie HttpOnly; ou `Authorization: Bearer`). As prévias (`/previews/*`) continuam públicas para enviar aos clientes.
- Coloque atrás de um proxy HTTPS (Caddy/Nginx). Exemplo Caddy:
  ```
  gz.seudominio.com.br {
    reverse_proxy 127.0.0.1:4800
  }
  ```
- Mantenha o processo com `pm2 start npm --name gz-os -- start` ou um serviço systemd.
- Backups: **Configurações → Backup → ZIP completo**, ou `npm run gz:backup`. Guarde fora do servidor.

### Docker (opcional)
```Dockerfile
FROM mcr.microsoft.com/playwright:v1.56.1-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV HOST=0.0.0.0 PORT=4800 GZ_DATA_DIR=/data NODE_ENV=production
VOLUME /data
EXPOSE 4800
CMD ["npm","start"]
```
A imagem da Playwright já traz o Chromium e dependências; a versão deve bater com a do `package.json` (1.56.1).

## 3. Atualizar o GZ OS

```bash
git pull
npm ci
npm run build
npm run db:migrate   # aplica migrations novas (idempotente)
npm start
```
Os dados em `GZ_DATA_DIR` não são tocados pelo código.
