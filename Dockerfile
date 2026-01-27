# 1. Image recommandée par la doc
FROM node:22-bookworm-slim

# 2. On définit le cache du navigateur (crucial pour éviter les erreurs de droits)
ENV REMOTION_CHROME_CACHE_DIR=/root/.cache/remotion/browser

# 3. Installation des dépendances (Doc + Emojis + Robustesse réseau)
# J'ajoute Acquire::Retries car vos logs montrent que le réseau coupe au milieu
RUN apt-get update && \
    apt-get install -y -o Acquire::Retries=3 --no-install-recommends \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libgbm-dev \
    libasound2 \
    libxrandr2 \
    libxkbcommon-dev \
    libxfixes3 \
    libxcomposite1 \
    libxdamage1 \
    libatk-bridge2.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libcups2 \
    ffmpeg \
    fonts-noto-color-emoji \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 4. On copie les fichiers de config d'abord (Optimisation du cache Docker)
COPY package*.json tsconfig.json* ./

# 5. Installation des dépendances Node
RUN npm install

# 6. Installation de Chrome (Étape 5 de la doc)
# On ajoute --verbose pour débugger sur Coolify si ça bloque encore
RUN npx remotion browser ensure

# 7. Copie du reste du code (y compris votre server.js et src)
COPY . .

# 8. Sortie vidéo
RUN mkdir -p out

EXPOSE 3000

# 9. Lancement de votre API Express
CMD ["npm", "start"]