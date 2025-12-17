'use server';

import { getDb, GameRelease } from '@/lib/database';
import { promises as fs } from 'fs';
import path from 'path';

const GAMES_DIR = path.join(process.cwd(), 'public', 'games');

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

export async function createGameRelease(
    name: string,
    version: string,
    width: number,
    height: number,
    description: string
): Promise<{ success: boolean, release?: GameRelease, error?: string }> {
    const db = await getDb();
    const gameId = `${name.toLowerCase().replace(/\s/g, '-')}-${version.toLowerCase()}`;
    
    if (db.data.games.some(g => g.id === gameId)) {
        return { success: false, error: 'Cette version de jeu existe déjà.' };
    }

    const gamePath = `${name.toLowerCase().replace(/\s/g, '-')}/${version.toLowerCase()}`;
    const fullPath = path.join(GAMES_DIR, gamePath);

    await fs.mkdir(fullPath, { recursive: true });
    const indexHtmlContent = Q5_P5PLAY_TEMPLATE(gameId, version);
    await fs.writeFile(path.join(fullPath, 'index.html'), indexHtmlContent);

    const newRelease: GameRelease = {
        id: gameId, name, version, path: gamePath, description, width, height,
        createdAt: new Date().toISOString(),
    };

    db.data.games.push(newRelease);
    await db.write();

    return { success: true, release: newRelease };
}

export async function updateGameRelease(
    id: string,
    updates: Partial<Omit<GameRelease, 'id' | 'createdAt' | 'path'>>
): Promise<GameRelease | null> {
    const db = await getDb();
    const gameIndex = db.data.games.findIndex(g => g.id === id);
    if (gameIndex === -1) return null;

    const updatedGame = { ...db.data.games[gameIndex], ...updates };
    db.data.games[gameIndex] = updatedGame;
    await db.write();
    return updatedGame;
}

export async function deleteGameRelease(id: string): Promise<boolean> {
    const db = await getDb();
    const game = db.data.games.find(g => g.id === id);
    if (!game) return false;

    const fullPath = path.join(GAMES_DIR, game.path);
    try {
        await fs.rm(fullPath, { recursive: true, force: true });
    } catch (error) {
        console.error(`Erreur suppression dossier ${fullPath}:`, error);
    }

    db.data.games = db.data.games.filter(g => g.id !== id);
    await db.write();
    return true;
}

export async function uploadGameFiles(id: string, formData: FormData): Promise<{ success: boolean, error?: string, fileNames?: string[] }> {
    const db = await getDb();
    const game = db.data.games.find(g => g.id === id);
    if (!game) return { success: false, error: 'Game release not found' };

    const fullPath = path.join(GAMES_DIR, game.path);
    const files = formData.getAll('files') as File[];
    const uploadedFileNames: string[] = [];

    for (const file of files) {
        const filePath = path.join(fullPath, file.name);
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, buffer);
        uploadedFileNames.push(file.name);

        if (file.name.toLowerCase() === 'thumbnail.png') {
            await updateGameRelease(id, { thumbnail: file.name });
        }
    }
    return { success: true, fileNames: uploadedFileNames };
}

export async function getGameReleases(): Promise<GameRelease[]> {
    const db = await getDb();
    return db.data.games;
}

export async function listGameReleaseFiles(id: string): Promise<string[]> {
    const db = await getDb();
    const game = db.data.games.find(g => g.id === id);
    if (!game) return [];

    const fullPath = path.join(GAMES_DIR, game.path);
    try {
        return await fs.readdir(fullPath);
    } catch (error) {
        return [];
    }
}

export async function regenerateIndexHtml(id: string): Promise<boolean> {
    const db = await getDb();
    const game = db.data.games.find(g => g.id === id);
    if (!game) return false;

    const fullPath = path.join(GAMES_DIR, game.path);
    const indexHtmlContent = Q5_P5PLAY_TEMPLATE(game.id, game.version);
    await fs.writeFile(path.join(fullPath, 'index.html'), indexHtmlContent);
    return true;
}