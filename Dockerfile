FROM node:22-bookworm-slim

# Install Chrome dependencies (Liste exacte de la doc)
# 1. Ajoutez des options de retry et le "no-recommends"
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

# On installe les dépendances d'abord (optimisation du cache Docker)
COPY package*.json ./
RUN npm i

# ON INSTALLE CHROME (Étape cruciale de la doc)
RUN npx remotion browser ensure

# On copie le reste du projet
COPY . .

# IMPORTANT : On ne fait plus le bundle ici, on va laisser le script Node
# le faire au démarrage ou à la volée comme dans l'exemple "render.mjs"
EXPOSE 3000

CMD ["npm", "start"]
