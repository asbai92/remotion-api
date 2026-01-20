require('dotenv').config();
const express = require('express');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware de sécurité
const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.API_KEY) {
        next(); // La clé est bonne, on continue
    } else {
        res.status(401).json({ error: "Accès refusé. Clé API invalide ou absente." });
    }
};

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
app.post('/render', authMiddleware, async (req, res) => {
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

// 1. GET : Lister toutes les vidéos présentes
app.get('/videos', authMiddleware, (req, res) => {
    fs.readdir(outDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Impossible de lire le dossier out" });
        }

        // On ne garde que les fichiers .mp4
        const videos = files
            .filter(file => file.endsWith('.mp4'))
            .map(file => ({
                name: file,
                url: `${BASE_URL}/out/${file}`,
                size: fs.statSync(path.join(outDir, file)).size,
                createdAt: fs.statSync(path.join(outDir, file)).birthtime
            }));

        res.json({ count: videos.length, videos });
    });
});

// 2. DELETE : Supprimer une vidéo spécifique
app.delete('/delete-video/:filename', authMiddleware, (req, res) => {
    const filename = req.params.filename;
    
    // Sécurité anti-traversée de dossier
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: "Nom de fichier invalide" });
    }

    const filePath = path.join(outDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Fichier non trouvé" });
    }

    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`[DELETE] ${filename} supprimé.`);
        res.json({ success: true, message: `Vidéo ${filename} supprimée.` });
    });
});

// Serveur de fichiers statiques pour le dossier 'out'
app.use('/out', express.static(outDir));

app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`🌍 Base URL : ${BASE_URL}`);
    console.log(`-----------------------------------------`);
});