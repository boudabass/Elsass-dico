'use server';

import fs from 'fs/promises';
import path from 'path';
import { readdir, stat } from 'fs/promises';
import { getDb, GameMetadata } from '@/lib/database';
import { revalidatePath } from 'next/cache'; // Importation nécessaire

const GAMES_DIR = path.join(process.cwd(), 'public', 'games');
const ABSOLUTE_GAMES_DIR = path.resolve(GAMES_DIR); // Define once for security checks
const EXCLUDED_FOLDERS = ['system']; // Dossiers à ignorer

// S'assurer que le dossier games existe
async function ensureGamesDir() {
  try {
    await fs.access(GAMES_DIR);
  } catch {
    await fs.mkdir(GAMES_DIR, { recursive: true });
  }
}

// --- UTILITAIRE DE LECTURE DES MÉTADONNÉES LOCALES ---
async function readLocalMetadata(dirPath: string) {
  let description = undefined;
  let thumbnail = undefined;

  try {
    description = await fs.readFile(path.join(dirPath, 'description.md'), 'utf-8');
  } catch (e) { }

  try {
    await fs.access(path.join(dirPath, 'thumbnail.png'));
    thumbnail = 'thumbnail.png';
  } catch (e) { }

  return { description, thumbnail };
}

// Récupérer les jeux depuis la DB
export async function listGamesFromDb() {
  const db = await getDb();
  await db.read();
  return db.data.games;
}

export interface GameVersionInfo {
  name: string;
  lastModified: number;
  isImported: boolean;
  dbId?: string;
  width?: number;
  height?: number;
  description?: string;
}

export interface GameFolder {
  name: string;
  versions: GameVersionInfo[];
  lastModified: number;
  isImported: boolean;
  description?: string;
  prettyName?: string;
  width?: number;
  height?: number;
}

export async function listGamesFolders(): Promise<GameFolder[]> {
  await ensureGamesDir();

  const db = await getDb();
  await db.read();
  const dbGames = db.data.games;

  const entries = await readdir(GAMES_DIR, { withFileTypes: true });

  const gameFoldersPromises = entries
    .filter(entry => entry.isDirectory() && !EXCLUDED_FOLDERS.includes(entry.name))
    .map(async (entry) => {
      const gamePath = path.join(GAMES_DIR, entry.name);
      const stats = await stat(gamePath);

      let versions: GameVersionInfo[] = [];
      let hasImportedVersion = false;
      // lastImportedGame removed

      try {
        const versionEntries = await readdir(gamePath, { withFileTypes: true });

        const versionsWithStats = await Promise.all(
          versionEntries
            .filter(v => v.isDirectory())
            .map(async (v) => {
              const vPath = path.join(gamePath, v.name);
              const vStats = await stat(vPath);

              const safeGameName = entry.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
              const safeVersionName = v.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
              const expectedId = `${safeGameName}-${safeVersionName}`;

              const foundGame = dbGames.find(g => g.id === expectedId);
              if (foundGame) {
                hasImportedVersion = true;
                // Retirer lastImportedGame qui cause des problèmes de portée/type
                hasImportedVersion = true;
              }

              return {
                name: v.name,
                lastModified: vStats.mtimeMs,
                isImported: !!foundGame,
                dbId: foundGame?.id,
                width: foundGame?.width || 800,
                height: foundGame?.height || 600,
                description: foundGame?.description
              };
            })
        );

        versions = versionsWithStats.sort((a, b) => b.lastModified - a.lastModified);

      } catch (e) { }


      // On récupère les métadonnées depuis la version importée (si elle existe)
      const importedVersion = versions.find(v => v.isImported);
      const importedGameMetadata = importedVersion?.dbId ? dbGames.find(g => g.id === importedVersion.dbId) : null;

      return {
        name: entry.name,
        versions,
        lastModified: stats.mtimeMs,
        isImported: hasImportedVersion,
        description: importedGameMetadata?.description,
        prettyName: importedGameMetadata?.name,
        width: importedGameMetadata?.width || 800,
        height: importedGameMetadata?.height || 600
      };
    });

  const gameFolders = await Promise.all(gameFoldersPromises);
  return gameFolders.sort((a, b) => b.lastModified - a.lastModified);
}

// Lister les fichiers d'une version spécifique
export async function listGameFiles(gameName: string, versionName: string): Promise<string[]> {
  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = versionName.replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, safeVersion);

  try {
    const files = await readdir(dirPath);
    return files.filter(f => !f.startsWith('.')).sort();
  } catch (e) {
    return [];
  }
}


// --- CRÉATION DE JEU STANDARD ---
async function createStandardGameFiles(gameName: string, version: string, config: any) {
  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = version.replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, safeVersion);
  const filePath = path.join(dirPath, 'index.html');

  // Si le fichier existe déjà, ON NE TOUCHE À RIEN.
  // La philosophie : "Le Jeu s'adapte au Système".
  // Si le fichier n'existe pas, on crée le squelette standard.
  try {
    await fs.access(filePath);
    return { success: true, message: "Index existant conservé" };
  } catch {
    // Fichier inexistant, on crée le template standard
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gameName}</title>
    <style>
        body { margin: 0; overflow: hidden; background: ${config.bgColor || '#000'}; }
        canvas { display: block; margin: 0 auto; }
    </style>
    <!-- Bibliothèques par défaut (p5.js) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/addons/p5.sound.min.js"></script>
</head>
<body>
    <!-- 1. CONFIGURATION STANDARD -->
    <script>
        window.DyadGame = { 
            id: '${safeName.toLowerCase()}-${safeVersion.toLowerCase()}',
            version: '${version}'
        };
    </script>

    <!-- 2. SYSTEME CENTRALISÉ -->
    <script src="../../system/system.js"></script>

    <!-- 3. JEU (Squelette) -->
    <script>
        function setup() {
            createCanvas(windowWidth, windowHeight);
            background(0);
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(24);
            text("Nouveau Jeu : ${gameName}", width/2, height/2);
            text("Modifiez main.js pour commencer", width/2, height/2 + 40);
        }
        function draw() { }
        function windowResized() { resizeCanvas(windowWidth, windowHeight); }
    </script>
</body>
</html>`;

  await fs.writeFile(filePath, htmlContent);
  return { success: true, message: "Squelette standard créé" };
}

// --- CRÉATION / MISE À JOUR JEU ---
export async function createGameFolder(gameName: string, width = 800, height = 600) {
  const safeName = gameName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, 'v1');

  await fs.mkdir(dirPath, { recursive: true });

  const meta = await readLocalMetadata(dirPath);
  const db = await getDb();
  const gameId = `${safeName}-v1`;

  const existingIndex = db.data.games.findIndex(g => g.id === gameId);

  if (existingIndex >= 0) {
    await db.update(({ games }) => {
      const g = games[existingIndex];
      if (meta.description) g.description = meta.description;
      if (meta.thumbnail) g.thumbnail = meta.thumbnail;
      g.width = width;
      g.height = height;
    });
  } else {
    await db.update(({ games }) => games.push({
      id: gameId,
      name: gameName,
      description: meta.description || "Description par défaut",
      path: `${safeName}/v1`,
      version: 'v1',
      thumbnail: meta.thumbnail,
      createdAt: new Date().toISOString(),
      width,
      height
    }));
  }

  await createStandardGameFiles(safeName, 'v1', { bgColor: '#000000' });
  await db.write(); // PERSISTENCE CRITIQUE
  revalidatePath('/games');

  return {
    success: true,
    gameName: safeName,
    version: 'v1',
    message: existingIndex >= 0 ? "Jeu mis à jour" : "Nouveau jeu créé"
  };
}

// --- CRÉATION / MISE À JOUR VERSION ---
export async function createGameVersion(gameName: string, versionName: string) {
  try {
    const safeVersion = versionName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const dirPath = path.join(GAMES_DIR, gameName, safeVersion);

    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }

    const meta = await readLocalMetadata(dirPath);
    const db = await getDb();
    const gameId = `${gameName}-${safeVersion}`;

    const parentGame = db.data.games.find(g => g.name === gameName);
    const defaultWidth = parentGame?.width || 800;
    const defaultHeight = parentGame?.height || 600;

    const existingIndex = db.data.games.findIndex(g => g.id === gameId);

    if (existingIndex >= 0) {
      await db.update(({ games }) => {
        const g = games[existingIndex];
        if (meta.description) g.description = meta.description;
        if (meta.thumbnail) g.thumbnail = meta.thumbnail;
      });
    } else {
      await db.update(({ games }) => games.push({
        id: gameId,
        name: gameName,
        description: meta.description || `Version ${safeVersion}`,
        path: `${gameName}/${safeVersion}`,
        version: safeVersion,
        thumbnail: meta.thumbnail,
        createdAt: new Date().toISOString(),
        width: defaultWidth,
        height: defaultHeight
      }));
    }

    await createStandardGameFiles(gameName, safeVersion, { bgColor: '#000000' });
    await db.write(); // PERSISTENCE CRITIQUE
    revalidatePath('/games');

    return {
      success: true,
      gameName,
      version: safeVersion,
      message: existingIndex >= 0 ? "Version mise à jour" : "Nouvelle version créée"
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message || "Erreur création version",
      gameName,
      version: versionName,
      message: "Erreur"
    };
  }
}

export async function uploadGameFile(gameName: string, version: string, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: "Pas de fichier fourni" };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = version.replace(/[^a-z0-9-]/g, '-');
  
  // Sanitize file.name to prevent path traversal and unsafe characters
  const originalFileName = file.name;
  const baseFileName = path.basename(originalFileName);
  const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9-._]/g, '_'); // Allow alphanumeric, hyphens, underscores, dots

  const filePath = path.join(GAMES_DIR, safeName, safeVersion, sanitizedFileName);

  await fs.writeFile(filePath, buffer);

  // AUCUNE INJECTION MAGIQUE. 
  // On laisse le fichier tel quel. C'est au développeur de suivre le guide.

  return { success: true, fileName: file.name };
}

export async function deleteGame(gameFolderName: string) {
  // 1. Déterminer le nom sécurisé et en minuscules pour la DB
  const safeGameName = gameFolderName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dbIdPrefix = `${safeGameName}-`;
  
  // 2. Déterminer le chemin physique et valider pour éviter le path traversal
  const intendedGamePath = path.join(GAMES_DIR, gameFolderName);
  const resolvedGamePath = path.resolve(intendedGamePath);

  // CRITICAL SECURITY CHECK: Ensure the resolved path is still within the GAMES_DIR
  if (!resolvedGamePath.startsWith(ABSOLUTE_GAMES_DIR)) {
    console.error(`[SECURITY ALERT] Path traversal attempt detected for game: ${gameFolderName}`);
    return { success: false, error: "Invalid path provided." };
  }

  try {
    await fs.rm(resolvedGamePath, { recursive: true, force: true });
  } catch (e) {
    console.error("Erreur suppression dossier", e);
  }

  const db = await getDb();
  await db.read(); // Lire l'état actuel du disque

  // Filtrer les jeux et scores dont l'ID commence par le préfixe du jeu (ex: 'tetris-')
  db.data.games = db.data.games.filter(g => !g.id.startsWith(dbIdPrefix));
  db.data.scores = db.data.scores.filter(s => !s.gameId.startsWith(dbIdPrefix));
  
  await db.write(); // PERSISTENCE CRITIQUE

  revalidatePath('/games');
  revalidatePath('/dashboard');
  revalidatePath('/scores');

  return { success: true };
}

export async function deleteVersion(gameFolderName: string, versionName: string) {
  // 1. Déterminer le chemin physique et valider pour éviter le path traversal
  const intendedVersionPath = path.join(GAMES_DIR, gameFolderName, versionName);
  const resolvedVersionPath = path.resolve(intendedVersionPath);

  // CRITICAL SECURITY CHECK: Ensure the resolved path is still within the GAMES_DIR
  if (!resolvedVersionPath.startsWith(ABSOLUTE_GAMES_DIR)) {
    console.error(`[SECURITY ALERT] Path traversal attempt detected for version: ${gameFolderName}/${versionName}`);
    return { success: false, error: "Invalid path provided." };
  }

  // Supprimer les fichiers
  try {
    await fs.rm(resolvedVersionPath, { recursive: true, force: true });
    console.log(`[GameManager] Successfully deleted directory: ${resolvedVersionPath}`);
  } catch (e) { 
    console.error(`[GameManager] Failed to delete directory ${resolvedVersionPath}. Continuing with DB cleanup.`, e);
  }

  // 2. Calcul de l'ID DB (doit être en minuscules/safe pour correspondre aux entrées DB)
  const safeGameName = gameFolderName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const safeVersionName = versionName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const gameId = `${safeGameName}-${safeVersionName}`;

  // 3. Supprimer l'entrée DB
  const db = await getDb();
  await db.read(); // Lire l'état actuel du disque
  
  db.data.games = db.data.games.filter(g => g.id !== gameId);
  db.data.scores = db.data.scores.filter(s => s.gameId !== gameId);
  
  await db.write(); // PERSISTENCE CRITIQUE
  
  revalidatePath('/games');
  revalidatePath('/dashboard');
  revalidatePath('/scores');

  return { success: true };
}

export async function updateGameMetadata(gameFolderName: string, version: string, newName: string, newDescription: string, width: number, height: number) {
  // IMPORTANT: On applique toLowerCase() pour matcher l'ID en base
  const safeName = gameFolderName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const safeVersion = version.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const gameId = `${safeName}-${safeVersion}`;

  // For file system path, we use the sanitized folder name and version name
  const intendedDirPath = path.join(GAMES_DIR, gameFolderName.replace(/[^a-z0-9-]/g, '-'), version.replace(/[^a-z0-9-]/g, '-'));
  const resolvedDirPath = path.resolve(intendedDirPath);

  // CRITICAL SECURITY CHECK: Ensure the resolved path is still within the GAMES_DIR
  if (!resolvedDirPath.startsWith(ABSOLUTE_GAMES_DIR)) {
    console.error(`[SECURITY ALERT] Path traversal attempt detected for metadata update: ${gameFolderName}/${version}`);
    return { success: false, error: "Invalid path provided." };
  }

  const db = await getDb();
  await db.read();

  const game = db.data.games.find(g => g.id === gameId);
  if (game) {
    game.name = newName;
    game.description = newDescription;
    game.width = width;
    game.height = height;
  }

  try {
    await fs.writeFile(path.join(resolvedDirPath, 'description.md'), newDescription);
  } catch (e) { }

  await db.write(); // PERSISTENCE CRITIQUE
  revalidatePath('/games');
  revalidatePath('/dashboard');
  revalidatePath('/scores');

  return { success: true };
}

export async function uploadGameThumbnail(gameName: string, version: string, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: "Pas de fichier fourni" };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = version.replace(/[^a-z0-9-]/g, '-');
  
  // Sanitize file.name to prevent path traversal and unsafe characters
  const originalFileName = file.name;
  const baseFileName = path.basename(originalFileName);
  const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9-._]/g, '_'); // Allow alphanumeric, hyphens, underscores, dots

  const filePath = path.join(GAMES_DIR, safeName, safeVersion, 'thumbnail.png'); // Fixed filename for thumbnail

  await fs.writeFile(filePath, buffer);

  // Update DB metadata
  /*
  const db = await getDb();
  await db.update(({ games }) => {
      const gameId = `${safeName.toLowerCase()}-${safeVersion.toLowerCase()}`;
      const game = games.find(g => g.id === gameId);
      if(game) game.thumbnail = 'thumbnail.png';
  });
  */

  return { success: true, fileName: 'thumbnail.png' };
}

export async function generateIndexHtml(gameName: string, version: string, config: any) {
  // Cette fonction force la recréation de l'index.html standard
  // Utile si l'utilisateur a tout cassé ou veut mettre à jour vers le dernier standard système
  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');

  // On supprime l'ancien index pour forcer la création
  try {
    const indexParams = { gameName, version, config }; // Dummy usage
    const dirPath = path.join(GAMES_DIR, safeName, version);
    const resolvedDirPath = path.resolve(dirPath);

    // CRITICAL SECURITY CHECK: Ensure the resolved path is still within the GAMES_DIR
    if (!resolvedDirPath.startsWith(ABSOLUTE_GAMES_DIR)) {
      console.error(`[SECURITY ALERT] Path traversal attempt detected for index.html generation: ${gameName}/${version}`);
      return { success: false, error: "Invalid path provided." };
    }

    await fs.unlink(path.join(resolvedDirPath, 'index.html'));
  } catch (e) { }

  // On rappelle la fonction interne qui contient le template
  const result = await createStandardGameFiles(gameName, version, config);
  revalidatePath('/games');
  return result;
}