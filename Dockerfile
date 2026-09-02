# syntax=docker/dockerfile:1

# ==========================================================================
# 1. AŞAMA — bağımlılıklar
# ==========================================================================
FROM node:24-slim AS bagimliliklar
WORKDIR /app

# better-sqlite3 ve sharp derlenmiş ikili dosyalar indirir; indirilemezse
# kaynaktan derlenmeleri için bu araçlar gerekir.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Yalnizca manifest dosyalari kopyalaniyor: kaynak kod degistiginde bu
# katman onbellekten gelir ve npm ci yeniden calismaz.
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================================================
# 2. AŞAMA — derleme
# ==========================================================================
FROM node:24-slim AS derleyici
WORKDIR /app

COPY --from=bagimliliklar /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ==========================================================================
# 3. AŞAMA — çalıştırma
# ==========================================================================
FROM node:24-slim AS calisan
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# root olarak çalıştırmamak için ayrı bir kullanıcı. Kapsayıcı içinde bir
# açık bulunursa saldırganın elde edeceği yetki bu kullanıcıyla sınırlı olur.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs basari

# output: "standalone" sayesinde Next, gerçekten kullanılan node_modules
# dosyalarını kendisi seçip .next/standalone içine koyuyor. Tüm node_modules
# klasörünü kopyalamaya göre imaj boyutu birkaç yüz MB küçülüyor.
COPY --from=derleyici --chown=basari:nodejs /app/.next/standalone ./
COPY --from=derleyici --chown=basari:nodejs /app/.next/static ./.next/static
COPY --from=derleyici --chown=basari:nodejs /app/public ./public

# Tum kalici veri TEK klasorde toplaniyor:
#   /app/veri/basari.db  -> veritabani
#   /app/veri/uploads    -> fotograflar (public/uploads buraya symlink)
#
# Neden tek klasor: Railway, Render ve Fly.io servis basina TEK kalici disk
# veriyor. Ayri ayri /app/data + /app/public/uploads baglamak bu platformlarda
# mumkun degil; biri mutlaka volume'suz kalir ve her deploy'da silinir.
#
# Veritabani BILEREK public/ disinda: public/ altindaki her sey statik olarak
# sunulur. basari.db oraya konsaydi mesajlar ve ayarlar internetten
# indirilebilir olurdu.
#
# public/uploads .dockerignore'da, yani imajda yok - symlink'i biz yaratiyoruz.
ENV DB_YOLU=/app/veri/basari.db
RUN mkdir -p /app/veri/uploads \
    && ln -s /app/veri/uploads /app/public/uploads \
    && chown -R basari:nodejs /app/veri \
    && chown -h basari:nodejs /app/public/uploads

USER basari
EXPOSE 3000

# Konteyner sağlık kontrolü: uygulama yanıt vermiyorsa Docker yeniden başlatır.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
