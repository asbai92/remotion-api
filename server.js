const express = require('express');
const { renderMedia, selectComposition, getCompositions } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Définition des chemins absolus pour éviter l'erreur "serveUrl is undefined"
const BUNDLE_PATH = path.resolve(__dirname, 'bundle.js');
const OUT_DIR = path.resolve(__dirname, 'out');

// Création du dossier de sortie s'il n'existe pas
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 1. Route pour lister les compositions (Utile pour vérifier le projet)
app.get('/compositions', async (req, res) => {
    try {
        const compositions = await getCompositions(BUNDLE_PATH);
        res.json(compositions);
    } catch (e) {
        res.status(500).json({ error: "Impossible de lire le bundle", details: e.message });
    }
});

// 2. Route principale de rendu appelée par n8n
app.post('/render', async (req, res) => {
    try {
        const { id, inputProps } = req.body;
        const fileName = `video-${Date.now()}.mp4`;
        const outputLocation = path.join(OUT_DIR, fileName);

        console.log(`Début du rendu pour la composition : ${id || 'HelloWorld'}`);

        // Sélection de la composition dans le bundle
        const composition = await selectComposition({
            bundle: BUNDLE_PATH,
            id: id || 'HelloWorld',
            inputProps: inputProps || {},
        });

        // Exécution du rendu
        await renderMedia({
            composition,
            serveUrl: BUNDLE_PATH, // Utilisation du chemin absolu résolu
            codec: 'h264',
            outputLocation: outputLocation,
            chromiumOptions: {
                executablePath: process.env.REMOTION_CHROME_EXECUTABLE || '/usr/bin/chromium',
                args: ['--no-sandbox'] // Recommandé pour Docker
            }
        });

        // Réponse à n8n avec l'URL de téléchargement
        res.json({
            success: true,
            message: "Rendu terminé",
            file: fileName,
            url: `https://api-video.mohamedasb.com/out/${fileName}`
        });

    } catch (e) {
        console.error("Erreur de rendu:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// 3. Rendre les fichiers vidéos accessibles via le navigateur
app.use('/out', express.static(OUT_DIR));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur Remotion prêt sur le port ${PORT}`);
    console.log(`Bundle attendu à : ${BUNDLE_PATH}`);
});
