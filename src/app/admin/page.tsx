listGamesFolders">
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { listGamesFolders, createGameFolder, createGameVersion, uploadGameFile, generateIndexHtml, GameFolder } from "@/app/actions/game-manager";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [games, setGames] = useState<GameFolder[]>([]);
  const [mode, setMode] = useState<"new-game" | "new-version">("new-game");
  
  // États formulaires
  const [newGameName, setNewGameName] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [newVersionName, setNewVersionName] = useState("");
  
  // État Upload
  const [activePath, setActivePath] = useState<{name: string, version: string} | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    refreshGames();
  }, []);

  const refreshGames = async () => {
    // Correction ici : utilisation de listGamesFolders
    const g = await listGamesFolders();
    setGames(g);
  };

  const handleCreateGame = async () => {
    if (!newGameName) return toast.error("Nom du jeu requis");
    const res = await createGameFolder(newGameName);
    if (res.success) {
      toast.success(res.message); // Message ajusté pour le feedback import
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
  };

  if (isLoading) return <div>Chargement...</div>;
  if (!user) return <div>Accès refusé</div>;

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Administration Game Center</h1>

      {/* Étape 1 : Création Dossier */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>1. Structure du Jeu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Button 
              variant={mode === "new-game" ? "default" : "outline"}
              onClick={() => { setMode("new-game"); setActivePath(null); }}
            >
              Nouveau Jeu
            </Button>
            <Button 
              variant={mode === "new-version" ? "default" : "outline"}
              onClick={() => { setMode("new-version"); setActivePath(null); }}
            >
              Nouvelle Version
            </Button>
          </div>

          {mode === "new-game" ? (
            <div className="flex gap-2">
              <Input 
                placeholder="Nom du jeu (ex: Tetris)" 
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
              />
              <Button onClick={handleCreateGame}>Créer / Importer (V1)</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Select onValueChange={setSelectedGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un jeu" />
                </SelectTrigger>
                <SelectContent>
                  {games.map(g => (
                    <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input 
                  placeholder="Version (ex: v2)" 
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                />
                <Button onClick={handleCreateVersion}>Créer / Importer Version</Button>
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
              2. Upload pour : <span className="text-primary">{activePath.name} / {activePath.version}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Fichiers requis (un par un) :</h3>
              <ul className="list-disc ml-5 text-sm text-muted-foreground">
                <li>sketch.js (Logique)</li>
                <li>data.js (Données)</li>
                <li>hud.js (Interface)</li>
                <li>assets (Images/Sons si besoin)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <Label>Uploader un fichier</Label>
              <Input 
                type="file" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-yellow-500">Upload en cours...</p>}
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleGenerateIndex} className="w-full" variant="secondary">
                🪄 Générer & Injecter index.html (Finaliser)
              </Button>
              <p className="text-xs text-center mt-2 text-muted-foreground">
                Crée le fichier index.html avec la configuration injectée pour ce jeu.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}