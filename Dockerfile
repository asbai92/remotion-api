# 1. Utilisation d'une image Node légère et stable
FROM docker.io/library/node:20-bookworm-slim

# 2. Installation des dépendances système (Chromium pour le rendu, FFmpeg pour la vidéo)
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

# 3. Définition du dossier de travail
WORKDIR /app

# 4. Installation des dépendances du projet
COPY package*.json ./
RUN npm install

# 5. Copie de tout le code source
COPY . .

# 6. GÉNÉRATION DU BUNDLE (Étape cruciale)
# On lance le bundle. Remotion crée par défaut un dossier nommé "build".
RUN npx remotion bundle src/index.tsx

# 7. NETTOYAGE ET MISE EN PLACE (Meilleure pratique)
# On déplace le fichier généré vers la racine et on le nomme 'bundle.js'
# Cela garantit que le serveur le trouvera à l'adresse /app/bundle.js
RUN mv build/index.js ./bundle.js || mv build/bundle.js ./bundle.js

# On supprime le dossier build maintenant inutile pour garder le serveur propre
RUN rm -rf build

# 8. Configuration de l'environnement pour Chromium
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium

# 9. Exposition du port et lancement du serveur
EXPOSE 3000
CMD ["npm", "start"]
