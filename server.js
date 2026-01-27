require('dotenv').config();
const express = require('express');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Utilisation de ts-node pour charger le schéma TypeScript
require('ts-node').register({ transpileOnly: true });

const { ProjectConfigSchema } = require('./src/types/schema');

const app = express();
app.use(express.json({ limit: '50mb' }));

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const outDir = path.resolve(__dirname, 'out');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

// --- MIDDLEWARE DE SÉCURITÉ ---
const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (API_KEY && apiKey !== API_KEY) {
        return res.status(401).json({ error: "Accès refusé. Clé API invalide." });
    }
    next();
};

// --- INITIALISATION DU BUNDLE ---
let bundled = null;
const initBundle = async () => {
    try {
        console.log("[INIT] Création du bundle Remotion...");
        bundled = await bundle({
            entryPoint: path.resolve(__dirname, './src/index.tsx'),
            webpackOverride: (config) => config,
        });
        console.log("[INIT] Bundle prêt et chargé.");
    } catch (err) {
        console.error("[ERROR] Échec du bundle au démarrage:", err);
    }
};

initBundle();

// --- ROUTES ---

// 1. Rendu Vidéo
app.post('/render', authMiddleware, async (req, res) => {
    if (!bundled) {
        return res.status(503).json({ error: "Le moteur de rendu n'est pas encore prêt." });
    }

    // Vérification de la structure racine
    if (!req.body.inputProps) {
        console.error("❌ Erreur : 'inputProps' est manquant.");
        return res.status(400).json({ 
            error: "Structure racine invalide", 
            message: "Le JSON doit contenir une clé 'inputProps' à la racine." 
        });
    }

    // CORRECTION : Validation avec le bon nom de schéma
    const result = ProjectConfigSchema.safeParse(req.body.inputProps);
    
    if (!result.success) {
        const detailedErrors = result.error.issues.map(issue => ({
            emplacement: issue.path.join(' -> '),
            message: issue.message,
            type: issue.code
        }));

        console.error("❌ Erreur de validation JSON :", JSON.stringify(detailedErrors, null, 2));

        return res.status(400).json({ 
            error: "Le JSON ne respecte pas le schéma", 
            details: detailedErrors 
        });
    }

    const inputProps = result.data;
    const requestId = Date.now();
    const outputName = `video-${requestId}.mp4`;
    const outputLocation = path.join(outDir, outputName);

    try {
        console.log(`[${requestId}] Début du rendu...`);

        const composition = await selectComposition({
            serveUrl: bundled,
            id: 'MainVideo', 
            inputProps,
        });

        await renderMedia({
            codec: 'h264',
            composition,
            serveUrl: bundled,
            outputLocation,
            inputProps,
            concurrency: os.cpus().length,
            chromiumOptions: {
                timeoutInMilliseconds: 60000,
                enableMultiProcessOnLinux: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
        });

        console.log(`[${requestId}] Terminé : ${outputName}`);

        res.json({
            success: true,
            videoUrl: `${BASE_URL}/out/${outputName}`,
            filename: outputName
        });

    } catch (error) {
        console.error(`[${requestId}] Erreur de rendu:`, error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Gestion des fichiers
app.get('/videos', authMiddleware, (req, res) => {
    const files = fs.readdirSync(outDir)
        .filter(f => f.endsWith('.mp4'))
        .map(f => ({ name: f, url: `${BASE_URL}/out/${f}` }));
    res.json(files);
});

app.delete('/video/:name', authMiddleware, (req, res) => {
    const filePath = path.join(outDir, req.params.name);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ success: true });
    }
    res.status(404).json({ error: "Fichier non trouvé" });
});

app.use('/out', express.static(outDir));

app.listen(PORT, () => {
    console.log(`
    =============================================
    🚀 SERVEUR REMOTION PRO OPÉRATIONNEL
    🌍 URL : ${BASE_URL}
    📂 SORTIE : ${outDir}
    =============================================
    `);
});
