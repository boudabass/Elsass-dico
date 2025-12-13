"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  listGamesFolders, 
  createGameFolder, 
  createGameVersion, 
  uploadGameFile, 
  uploadGameThumbnail,
  generateIndexHtml, 
  listGameFiles,
  GameFolder 
} from "@/app/actions/game-manager";
import { FileIcon, FileCode, ImageIcon, FileText, Upload } from "lucide-react";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [games, setGames] = useState<GameFolder[]>([]);
  const [mode, setMode] = useState<"new-game" | "new-version">("new-game");
  
  // États formulaires
  const [newGameName, setNewGameName] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [newVersionName, setNewVersionName] = useState("");
  
  // État Upload & Fichiers
  const [activePath, setActivePath] = useState<{name: string, version: string} | null>(null);
  const [uploading, setUploading] = useState(false);
  const [folderFiles, setFolderFiles] = useState<string[]>([]);

  useEffect(() => {
    refreshGames();
  }, []);

  // Rafraîchir la liste des fichiers quand le dossier actif change
  useEffect(() => {
    if (activePath) {
      loadFiles(activePath.name, activePath.version);
    } else {
      setFolderFiles([]);
    }
  }, [activePath]);

  const refreshGames = async () => {
    const g = await listGamesFolders();
    setGames(g);
  };

  const loadFiles = async (name: string, version: string) => {
    const files = await listGameFiles(name, version);
    setFolderFiles(files);
  };

  // ... (Logique isGameUpdate / isVersionUpdate identique)
  const [isGameUpdate, setIsGameUpdate] = useState(false);
  const [isVersionUpdate, setIsVersionUpdate] = useState(false);

  useEffect(() => {
    const existing = games.find(g => g.name === newGameName);
    setIsGameUpdate(!!existing && existing.isImported);
  }, [newGameName, games]);

  useEffect(() => {
    if (!selectedGame) return;
    const game = games.find(g => g.name === selectedGame);
    if (game) {
        const version = game.versions.find(v => v.name === newVersionName);
        setIsVersionUpdate(!!version && version.isImported);
    }
  }, [selectedGame, newVersionName, games]);


  const handleCreateGame = async () => {
    if (!newGameName) return toast.error("Nom du jeu requis");
    const res = await createGameFolder(newGameName);
    if (res.success) {
      toast.success(res.message);
      setActivePath({ name: res.gameName!, version: res.version! });
      refreshGames();
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedGame || !newVersionName) return toast.error("Jeu et version requis");
    const res = await createGameVersion(selectedGame, newVersionName);
    if (res.success) {
      toast.success(res.message);
      setActivePath({ name: res.gameName!, version: res.version! });
      refreshGames();
    } else {
      toast.error(res.error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activePath) return;
    setUploading(true);

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadGameFile(activePath.name, activePath.version, formData);
    
    if (res.success) {
      toast.success(`Fichier ${res.fileName} uploadé`);
      loadFiles(activePath.name, activePath.version); // Rafraîchir la liste
    } else {
      toast.error(res.error);
    }
    setUploading(false);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activePath) return;
    setUploading(true);

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadGameThumbnail(activePath.name, activePath.version, formData);
    
    if (res.success) {
      toast.success(`Image de couverture mise à jour (thumbnail.png)`);
      loadFiles(activePath.name, activePath.version); 
    } else {
      toast.error(res.error);
    }
    setUploading(false);
  };

  const handleGenerateIndex = async () => {
    if (!activePath) return;
    const config = {
      gameId: `${activePath.name}-${activePath.version}`,
      bgColor: '#1a1a1a',
      version: activePath.version
    };
    
    await generateIndexHtml(activePath.name, activePath.version, config);
    toast.success("index.html généré et injecté !");
    loadFiles(activePath.name, activePath.version); // Rafraîchir pour voir le nouveau index.html
  };

  const getSelectedGameVersions = () => {
    const game = games.find(g => g.name === selectedGame);
    return game?.versions || [];
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.js')) return <FileCode className="w-4 h-4 text-yellow-600" />;
    if (fileName.endsWith('.html')) return <FileCode className="w-4 h-4 text-orange-600" />;
    if (fileName.endsWith('.png') || fileName.endsWith('.jpg')) return <ImageIcon className="w-4 h-4 text-blue-600" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  if (isLoading) return <div>Chargement...</div>;
  if (!user) return <div>Accès refusé</div>;

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Administration Game Center</h1>

      {/* Étape 1 : Création Dossier / Import */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>1. Sélection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Button 
              variant={mode === "new-game" ? "default" : "outline"}
              onClick={() => { setMode("new-game"); setActivePath(null); }}
            >
              Jeux
            </Button>
            <Button 
              variant={mode === "new-version" ? "default" : "outline"}
              onClick={() => { setMode("new-version"); setActivePath(null); }}
            >
              Version
            </Button>
          </div>

          {mode === "new-game" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dossiers détectés (🆕 = Non importé)</Label>
                <Select onValueChange={(val) => setNewGameName(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un dossier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map(g => (
                      <SelectItem key={g.name} value={g.name}>
                        {g.isImported ? "✅" : "🆕"} {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Ou taper un nouveau nom..." 
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                />
                <Button 
                    onClick={handleCreateGame}
                    variant={isGameUpdate ? "secondary" : "default"}
                >
                    {isGameUpdate ? "Mettre à jour" : "Valider (V1)"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>1. Choisir le jeu</Label>
                <Select onValueChange={setSelectedGame}>
                  <SelectTrigger>
                    <SelectValue placeholder="Liste des jeux..." />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map(g => (
                      <SelectItem key={g.name} value={g.name}>
                        {g.isImported ? "✅" : "🆕"} {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedGame && (
                <div className="space-y-2">
                  <Label>2. Versions détectées (🆕 = Non importé)</Label>
                  <Select onValueChange={(val) => setNewVersionName(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une version..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getSelectedGameVersions().map(v => (
                        <SelectItem key={v.name} value={v.name}>
                          {v.isImported ? "✅" : "🆕"} {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Input 
                  placeholder="Ou taper nouvelle version (ex: v2)" 
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                />
                <Button 
                    onClick={handleCreateVersion}
                    variant={isVersionUpdate ? "secondary" : "default"}
                >
                    {isVersionUpdate ? "Mettre à jour" : "Valider Version"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Étape 2 : Upload Fichiers */}
      {activePath && (
        <Card className="border-primary border-2">
          <CardHeader>
            <CardTitle>
              2. Fichiers : <span className="text-primary">{activePath.name} / {activePath.version}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Liste des fichiers */}
            <div className="bg-slate-100 rounded-md p-4 border border-slate-200">
              <h3 className="font-semibold mb-2 text-sm text-slate-700">Contenu du dossier :</h3>
              {folderFiles.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Dossier vide.</p>
              ) : (
                <ul className="space-y-1">
                  {folderFiles.map((file) => (
                    <li key={file} className="text-sm flex items-center gap-2 text-slate-700">
                      {getFileIcon(file)}
                      <span>{file}</span>
                      {file === 'index.html' && <span className="text-xs bg-green-100 text-green-700 px-2 rounded-full">Généré</span>}
                      {file === 'thumbnail.png' && <span className="text-xs bg-blue-100 text-blue-700 px-2 rounded-full">Couverture</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Upload className="w-4 h-4"/> Fichier Jeu (.js, etc)
                    </Label>
                    <Input 
                        type="file" 
                        onChange={handleFileUpload} 
                        disabled={uploading}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-blue-600">
                        <ImageIcon className="w-4 h-4"/> Image Couverture
                    </Label>
                    <Input 
                        type="file"
                        accept="image/*" 
                        onChange={handleThumbnailUpload} 
                        disabled={uploading}
                        className="file:text-blue-600"
                    />
                    <p className="text-xs text-slate-500">Sera renommée thumbnail.png</p>
                </div>
            </div>
            
            {uploading && <p className="text-sm text-yellow-500 animate-pulse">Upload en cours...</p>}

            <div className="pt-4 border-t">
              <Button onClick={handleGenerateIndex} className="w-full h-12 text-lg" variant="default">
                🚀 Générer index.html & Finaliser
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}