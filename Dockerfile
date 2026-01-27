FROM node:22-bookworm-slim

# On utilise les variables d'environnement pour Puppeteer/Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    DEBIAN_FRONTEND=noninteractive

# Installation optimisée des dépendances
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 \
    libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 \
    libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 \
    libcups2 ffmpeg fonts-noto-color-emoji \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache des dépendances npm
COPY package*.json ./
RUN npm install --frozen-lockfile

# Installation du navigateur spécifique à Remotion
RUN npx remotion browser ensure

COPY . .

EXPOSE 3000

CMD ["npm", "start"]