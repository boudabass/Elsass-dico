import { getDb } from '@/lib/database';
import { GameRelease } from '@/lib/database.types';
import { promises as fs } from 'fs';
import path from 'path';

const GAMES_DIR = path.join(process.cwd(), 'public', 'games');

/**
 * Template HTML standard pour les jeux Q5/P5Play.
 * Ce template inclut les dépendances Q5/P5Play et le GameSystem.
 * @param gameId L'ID unique du jeu (ex: 'snake-v1').
 * @param versionName La version du jeu (ex: 'v1').
 */
const Q5_P5PLAY_TEMPLATE = (gameId: string, versionName: string) => `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${gameId}</title>
    <style> body { margin: 0; overflow: hidden; background: #000; } </style>
    
    <!-- 1️⃣ CONFIGURATION OBLIGATOIRE -->
    <script>
        window.DyadGame = { 
            id: '${gameId}',
            version: '${versionName}'
        };
    </script>

    <!-- 2️⃣ LIBRAIRIES : Q5.js et P5Play (Chemins CDN) -->
    <script src="https://unpkg.com/q5@3/q5.min.js"></script>
    <script src="https://unpkg.com/p5play@3/build/p5play.min.js"></script>

    <!-- 3️⃣ CHARGEMENT DU SYSTÈME (Chemin Relatif Standard) -->
    <script src="../../system/system.js"></script>

    <!-- 4️⃣ TON JEU (main.js est le standard) -->
    <script src="main.js"></script>
</head>
<body>
</body>
</html>`;

/**
 * Crée un nouveau dossier de jeu physique et l'entrée dans la base de données.
 * @param name Nom du jeu (ex: 'Snake').
 * @param version Version (ex: 'v1').
 * @param width Largeur native.
 * @param height Hauteur native.
 * @param description Description.
 * @returns L'objet GameRelease créé.
 */
export async function createGameRelease(
    name: string,
    version: string,
    width: number,
    height: number,
    description: string
): Promise<GameRelease> {
    const db = await getDb();
    const gameId = `${name.toLowerCase().replace(/\s/g, '-')}-${version.toLowerCase()}`;
    const gamePath = `${name.toLowerCase().replace(/\s/g, '-')}/${version.toLowerCase()}`;
    const fullPath = path.join(GAMES_DIR, gamePath);

    // 1. Créer le dossier physique
    await fs.mkdir(fullPath, { recursive: true });

    // 2. Générer le fichier index.html standard Q5/P5Play
    const indexHtmlContent = Q5_P5PLAY_TEMPLATE(gameId, version);
    await fs.writeFile(path.join(fullPath, 'index.html'), indexHtmlContent);

    // 3. Créer l'entrée dans Lowdb
    const newRelease: GameRelease = {
        id: gameId,
        name: name,
        version: version,
        path: gamePath,
        description: description,
        width: width,
        height: height,
        createdAt: new Date().toISOString(),
    };

    db.data.games.push(newRelease);
    await db.write();

    return newRelease;
}

/**
 * Met à jour les métadonnées d'une GameRelease existante.
 */
export async function updateGameRelease(
    id: string,
    updates: Partial<Omit<GameRelease, 'id' | 'createdAt' | 'path'>>
): Promise<GameRelease | null> {
    const db = await getDb();
    const gameIndex = db.data.games.findIndex(g => g.id === id);

    if (gameIndex === -1) {
        return null;
    }

    const updatedGame = { ...db.data.games[gameIndex], ...updates, updatedAt: new Date().toISOString() };
    db.data.games[gameIndex] = updatedGame;
    await db.write();

    return updatedGame;
}

/**
 * Supprime une GameRelease de la DB et son dossier physique.
 */
export async function deleteGameRelease(id: string): Promise<boolean> {
    const db = await getDb();
    const game = db.data.games.find(g => g.id === id);

    if (!game) {
        return false;
    }

    // 1. Supprimer le dossier physique
    const fullPath = path.join(GAMES_DIR, game.path);
    try {
        await fs.rm(fullPath, { recursive: true, force: true });
    } catch (error) {
        console.error(`Erreur lors de la suppression du dossier ${fullPath}:`, error);
        // Continuer la suppression de la DB même si le dossier est manquant
    }

    // 2. Supprimer de Lowdb
    db.data.games = db.data.games.filter(g => g.id !== id);
    // Note: Les scores associés restent pour l'historique, mais pourraient être purgés si nécessaire.
    await db.write();

    return true;
}

/**
 * Gère l'upload de fichiers dans le dossier d'une GameRelease.
 * NOTE: Nous ne faisons plus d'injection HTML complexe ici, nous supposons que le développeur
 * a fourni un index.html conforme au standard Q5/P5Play.
 */
export async function uploadGameFiles(id: string, files: File[]): Promise<boolean> {
    const db = await getDb();
    const game = db.data.games.find(g => g.id === id);

    if (!game) {
        return false;
    }

    const fullPath = path.join(GAMES_DIR, game.path);

    for (const file of files) {
        const filePath = path.join(fullPath, file.name);
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, buffer);
    }

    return true;
}

/**
 * Récupère toutes les GameReleases.
 */
export async function getGameReleases(): Promise<GameRelease[]> {
    const db = await getDb();
    return db.data.games;
}

/**
 * Récupère une GameRelease par ID.
 */
export async function getGameReleaseById(id: string): Promise<GameRelease | undefined> {
    const db = await getDb();
    return db.data.games.find(g => g.id === id);
}