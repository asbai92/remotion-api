require('dotenv').config();
const express = require('express');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Configuration via variables d'environnement
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Sécurité : Création du dossier 'out' s'il n'existe pas
const outDir = path.resolve(__dirname, 'out');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
    console.log("[SETUP] Dossier 'out' créé.");
}

let bundled = null;

// INITIALISATION : Création du bundle au démarrage
const initBundle = async () => {
    console.log("[INIT] Création du bundle Remotion (Webpack)...");
    bundled = await bundle({
        entryPoint: path.resolve(__dirname, './src/index.tsx'),
        webpackOverride: (config) => config,
    });
    console.log("[INIT] Bundle prêt !");
};

initBundle().catch(err => {
    console.error("[ERROR] Échec du bundle:", err);
});

// ROUTE PRINCIPALE : Rendu de la vidéo
app.post('/render', async (req, res) => {
    if (!bundled) {
        return res.status(503).json({ error: "Le bundle n'est pas encore prêt. Veuillez patienter." });
    }

    const requestId = Date.now();
    try {
        const { id, inputProps } = req.body;
        const compositionId = id || 'HelloWorld';

        // 1. Sélection de la composition
        const composition = await selectComposition({
            serveUrl: bundled,
            id: compositionId,
            inputProps: inputProps || {},
        });

        const outputName = `video-${requestId}.mp4`;
        const outputLocation = path.join(outDir, outputName);

        // 2. Rendu de la vidéo
        console.log(`[${requestId}] Rendu en cours : ${compositionId}`);
        await renderMedia({
            codec: 'h264',
            composition,
            serveUrl: bundled,
            outputLocation: outputLocation,
            chromiumOptions: {
                enableMultiProcessOnLinux: true,
            },
            inputProps: inputProps || {},
        });

        // 3. Réponse avec l'URL dynamique (Local ou Prod)
        res.json({ 
            success: true, 
            url: `${BASE_URL}/out/${outputName}` 
        });

        console.log(`[${requestId}] Rendu terminé : ${outputName}`);

    } catch (e) {
        console.error(`[${requestId}] Erreur:`, e.message);
        res.status(500).json({ error: e.message });
    }
});

// Serveur de fichiers statiques pour le dossier 'out'
app.use('/out', express.static(outDir));

app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`🌍 Base URL : ${BASE_URL}`);
    console.log(`-----------------------------------------`);
});