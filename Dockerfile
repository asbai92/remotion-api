FROM docker.io/library/node:20-bookworm-slim

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    chromium ffmpeg fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation des paquets
COPY package*.json ./
RUN npm install

# Copie du code
COPY . .

# Commande par défaut : génère le dossier /app/build/
RUN npx remotion bundle src/index.tsx

# Configuration environnement
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium
EXPOSE 3000

CMD ["npm", "start"]
