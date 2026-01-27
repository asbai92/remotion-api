FROM node:22-bookworm-slim

# On définit le dossier de cache pour Remotion/Puppeteer
ENV REMOTION_CHROME_CACHE_DIR=/root/.cache/remotion/browser

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 \
    libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 \
    libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 \
    libcups2 ffmpeg fonts-noto-color-emoji ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
# On installe TOUTES les dépendances (y compris devDeps pour le bundle)
RUN npm install

# IMPORTANT : On force l'installation du navigateur ici
# On ajoute parfois 'unsafe-perm' si npm bloque les scripts post-install
RUN npx remotion browser ensure --log=verbose

COPY . .

EXPOSE 3000
CMD ["npm", "start"]