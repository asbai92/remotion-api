FROM node:22-bookworm-slim

# On définit le dossier de cache pour Remotion
ENV REMOTION_CHROME_CACHE_DIR=/root/.cache/remotion/browser

# OPTIMISATION RÉSEAU : On configure apt pour être plus résistant aux coupures
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries

# On installe les dépendances par petits blocs pour faciliter le cache en cas de coupure
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates ffmpeg fonts-noto-color-emoji

RUN apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 \
    libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 \
    libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 \
    libcups2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# On installe les dépendances Node
COPY package*.json ./
RUN npm install

# Installation du navigateur avec logs détaillés
RUN npx remotion browser ensure --verbose

COPY . .

EXPOSE 3000
CMD ["npm", "start"]