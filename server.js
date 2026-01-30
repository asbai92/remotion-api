require('dotenv').config();
const express = require('express');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios'); // Ajouté pour les webhooks

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

// 1. Rendu Vidéo (MODE ASYNC)
app.post('/render', authMiddleware, async (req, res) => {
    if (!bundled) {
        return res.status(503).json({ error: "Le moteur de rendu n'est pas encore prêt." });
    }

    if (!req.body.inputProps) {
        return res.status(400).json({ 
            error: "Structure racine invalide", 
            message: "Le JSON doit contenir une clé 'inputProps'." 
        });
    }

    const result = ProjectConfigSchema.safeParse(req.body.inputProps);
    
    if (!result.success) {
        return res.status(400).json({ 
            error: "Le JSON ne respecte pas le schéma", 
            details: result.error.issues 
        });
    }

    const inputProps = result.data;
    const webhookUrl = req.body.webhookUrl; // Optionnel : URL n8n pour le callback
    const requestId = Date.now();
    const outputName = `video-${requestId}.mp4`;
    const outputLocation = path.join(outDir, outputName);

    // --- RÉPONSE IMMÉDIATE À N8N ---
    res.status(202).json({
        success: true,
        message: "Rendu démarré en arrière-plan",
        requestId: requestId,
        status: "processing"
    });

    // --- TRAVAIL EN ARRIÈRE-PLAN ---
    (async () => {
        try {
            console.log(`[${requestId}] 🎬 Rendu lancé...`);

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
                    timeoutInMilliseconds: 120000, // Augmenté à 2min
                    enableMultiProcessOnLinux: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                },
            });

            const videoUrl = `${BASE_URL}/out/${outputName}`;
            console.log(`[${requestId}] ✅ Terminé : ${outputName}`);

            // --- APPEL DU WEBHOOK SI FOURNI ---
            if (webhookUrl) {
                console.log(`[${requestId}] 🪝 Envoi du webhook à n8n...`);
                await axios.post(webhookUrl, {
                    requestId,
                    success: true,
                    videoUrl,
                    filename: outputName
                }).catch(e => console.error("Erreur Webhook:", e.message));
            }

        } catch (error) {
            console.error(`[${requestId}] ❌ Erreur différée:`, error);
            if (webhookUrl) {
                await axios.post(webhookUrl, { requestId, success: false, error: error.message })
                    .catch(e => console.error("Erreur Webhook (fail case):", e.message));
            }
        }
    })();
});

// 2. Gestion des fichiers (Reste inchangé)
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
    🚀 SERVEUR REMOTION ASYNC OPÉRATIONNEL
    =============================================
    `);
});