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
    const g = await listGamesFolders();
    setGames(g);
  };

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

  // Helper pour trouver les versions du jeu sélectionné
  const getSelectedGameVersions = () => {
    const game = games.find(g => g.name === selectedGame);
    return game?.versions || [];
  };

  if (isLoading) return <div>Chargement...</div>;
  if (!user) return <div>Accès refusé</div>;

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Administration Game Center</h1>

      {/* Étape 1 : Création Dossier / Import */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>1. Gestion des Jeux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Button 
              variant={mode === "new-game" ? "default" : "outline"}
              onClick={() => { setMode("new-game"); setActivePath(null); }}
            >
              Importer / Nouveau
            </Button>
            <Button 
              variant={mode === "new-version" ? "default" : "outline"}
              onClick={() => { setMode("new-version"); setActivePath(null); }}
            >
              Nouvelle Version
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
                <Button onClick={handleCreateGame}>Valider / Importer (V1)</Button>
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
                <Button onClick={handleCreateVersion}>Valider / Importer Version</Button>
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
              2. Fichiers pour : <span className="text-primary">{activePath.name} / {activePath.version}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">État du dossier :</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Si vous avez copié les fichiers manuellement, cliquez simplement sur "Générer index.html" ci-dessous pour finaliser l'import.
                Sinon, uploadez les fichiers manquants ici.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Label>Ajouter un fichier manquant</Label>
              <Input 
                type="file" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-yellow-500">Upload en cours...</p>}
            </div>

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