"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  listGamesFolders,
  createGameFolder,
  createGameVersion,
  uploadGameFile,
  uploadGameThumbnail,
  generateIndexHtml,
  listGameFiles,
  deleteGame,
  deleteVersion,
  updateGameMetadata,
  importGameVersion,
  GameFolder,
  GameVersionInfo
} from "@/app/actions/game-manager";
import {
  getUsersAction,
  createUserAction,
  deleteUserAction,
  updateUserRoleAction
} from "@/app/actions/user-management";
import { User } from "@supabase/supabase-js";
import { FileCode, ImageIcon, FileText, Trash2, Edit, Save, FolderOpen, FolderPlus, Layers, Users, UserPlus, Shield, ShieldCheck } from "lucide-react";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [games, setGames] = useState<GameFolder[]>([]);
  const [mode, setMode] = useState<"new-game" | "new-version" | "manage" | "users">("manage");

  // États Utilisateurs
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // États Creation / Import
  const [newGameName, setNewGameName] = useState("");

  const [selectedGame, setSelectedGame] = useState("");
  const [newVersionName, setNewVersionName] = useState("");

  // État Upload & Fichiers
  const [activePath, setActivePath] = useState<{ name: string, version: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [folderFiles, setFolderFiles] = useState<string[]>([]);

  // État Edition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string, description: string }>({ name: "", description: "" });

  useEffect(() => {
    refreshGames();
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    setIsUsersLoading(true);
    const res = await getUsersAction();
    if (res.success && res.users) {
      setUsersList(res.users);
    }
    setIsUsersLoading(false);
  };

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
      setMode("manage");
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
      loadFiles(activePath.name, activePath.version);
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
    loadFiles(activePath.name, activePath.version);
  };

  const handleDeleteGame = async (gameName: string) => {
    if (!confirm(`Supprimer TOUT le jeu "${gameName}" et ses scores ?`)) return;
    await deleteGame(gameName);
    toast.success("Jeu supprimé");
    refreshGames();
    setActivePath(null);
  };

  const handleDeleteVersion = async (gameName: string, version: string) => {
    if (!confirm(`Supprimer la version "${version}" ?`)) return;
    await deleteVersion(gameName, version);
    toast.success("Version supprimée");
    refreshGames();
    if (activePath?.name === gameName && activePath?.version === version) setActivePath(null);
  };

  const handleImportVersion = async (gameName: string, versionName: string) => {
    const res = await importGameVersion(gameName, versionName);
    if (res.success) {
      toast.success(res.message);
      refreshGames();
    } else {
      toast.error(res.error);
    }
  };

  const startEditing = (game: GameFolder, version: GameVersionInfo) => {
    setEditingId(`${game.name}-${version.name}`);
    setEditForm({
      name: game.prettyName || game.name,
      description: version.description || game.description || ""
    });
  };

  const saveEditing = async (gameName: string, version: string) => {
    await updateGameMetadata(gameName, version, editForm.name, editForm.description);
    toast.success("Métadonnées mises à jour");
    setEditingId(null);
    refreshGames();
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.js')) return <FileCode className="w-4 h-4 text-yellow-600" />;
    if (fileName.endsWith('.html')) return <FileCode className="w-4 h-4 text-orange-600" />;
    if (fileName.endsWith('.png') || fileName.endsWith('.jpg')) return <ImageIcon className="w-4 h-4 text-blue-600" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getSelectedGameVersions = () => {
    const game = games.find(g => g.name === selectedGame);
    return game?.versions || [];
  };

  if (isLoading) {
    console.log("[Admin Page] Loading auth state...");
    return <div>Chargement...</div>;
  }
  if (!user) {
    console.warn("[Admin Page] Access denied: No user found.");
    return <div>Accès refusé</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <Button
            variant={mode === "manage" ? "default" : "ghost"}
            onClick={() => { setMode("manage"); setActivePath(null); }}
            className="flex gap-2"
          >
            <FolderOpen className="w-4 h-4" /> Gérer
          </Button>
          <Button
            variant={mode === "new-game" ? "default" : "ghost"}
            onClick={() => { setMode("new-game"); setActivePath(null); }}
            className="flex gap-2"
          >
            <FolderPlus className="w-4 h-4" /> Nouveau Jeu
          </Button>
          <Button
            variant={mode === "new-version" ? "default" : "ghost"}
            onClick={() => { setMode("new-version"); setActivePath(null); }}
            className="flex gap-2"
          >
            <Layers className="w-4 h-4" /> Nouvelle Version
          </Button>
          <Button
            variant={mode === "users" ? "default" : "ghost"}
            onClick={() => { setMode("users"); setActivePath(null); }}
            className="flex gap-2"
          >
            <Users className="w-4 h-4" /> Utilisateurs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE : ACTIONS PRINCIPALES */}
        <div className="lg:col-span-2 space-y-8">

          {mode === "manage" && (
            <Card>
              <CardHeader>
                <CardTitle>Jeux Installés</CardTitle>
                <CardDescription>Liste des dossiers trouvés dans /public/games</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {games.length === 0 && <p className="text-slate-400 italic">Aucun jeu détecté.</p>}

                {games.map(game => (
                  <div key={game.name} className="border rounded-lg p-4 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {game.prettyName || game.name}
                          <span className="text-xs font-normal text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{game.name}</span>
                        </h3>
                        {game.description && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{game.description}</p>}
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteGame(game.name)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {game.versions.map(v => {
                        const editKey = `${game.name}-${v.name}`;
                        const isEditing = editingId === editKey;

                        return (
                          <div key={v.name} className="flex flex-col gap-2 bg-white p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-bold text-blue-600">{v.name}</span>
                                {v.isImported ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 rounded-full">
                                    Actif
                                  </span>
                                ) : (
                                  <Button variant="outline" size="sm" className="h-5 text-xs bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100" onClick={() => handleImportVersion(game.name, v.name)}>Importer</Button>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setActivePath({ name: game.name, version: v.name })}>
                                  Fichiers
                                </Button>
                                {v.isImported && !isEditing && (
                                  <Button variant="ghost" size="sm" onClick={() => startEditing(game, v)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteVersion(game.name, v.name)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {isEditing && (
                              <div className="mt-2 p-3 bg-slate-50 border rounded-md space-y-3 animate-accordion-down">
                                <div className="grid gap-2">
                                  <Label>Titre (Affichage)</Label>
                                  <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Description</Label>
                                  <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Annuler</Button>
                                  <Button size="sm" onClick={() => saveEditing(game.name, v.name)}>
                                    <Save className="w-4 h-4 mr-2" /> Enregistrer
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {mode === "new-game" && (
            <Card>
              <CardHeader>
                <CardTitle>Créer / Importer un Jeu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Dossier existant ?</Label>
                  <Select onValueChange={(val) => setNewGameName(val)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {games.map(g => (
                        <SelectItem key={g.name} value={g.name}>{g.isImported ? "✅" : "🆕"} {g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nom (Identifiant dossier)</Label>
                  <Input placeholder="ex: snake" value={newGameName} onChange={(e) => setNewGameName(e.target.value)} />
                </div>

                <Button onClick={handleCreateGame} variant={isGameUpdate ? "secondary" : "default"} className="w-full">
                  {isGameUpdate ? "Mettre à jour v1" : "Créer le jeu"}
                </Button>
              </CardContent>
            </Card>
          )}

          {mode === "users" && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" /> Créer un Utilisateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={async (formData) => {
                    const res = await createUserAction(formData);
                    if (res.success) {
                      toast.success(res.message);
                      refreshUsers();
                    } else {
                      toast.error(res.error);
                    }
                  }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input name="email" type="email" placeholder="email@exemple.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Mot de passe</Label>
                      <Input name="password" type="password" placeholder="******" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <Select name="role" defaultValue="user">
                        <SelectTrigger>
                          <SelectValue placeholder="Rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Utilisateur</SelectItem>
                          <SelectItem value="admin">Administrateur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit">Créer</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Liste des Utilisateurs</CardTitle>
                  <CardDescription>Gestion des accès et des rôles</CardDescription>
                </CardHeader>
                <CardContent>
                  {isUsersLoading ? (
                    <p className="text-center py-4">Chargement...</p>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="p-3 font-semibold">Email</th>
                            <th className="p-3 font-semibold">Rôle</th>
                            <th className="p-3 font-semibold">Création</th>
                            <th className="p-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {usersList.map((u: any) => {
                            const currentRole = u.profile_role || "user";
                            return (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3">{u.email}</td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${currentRole === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {currentRole === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                    {currentRole}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-500">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-3 text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const newRole = currentRole === 'admin' ? 'user' : 'admin';
                                      const res = await updateUserRoleAction(u.id, newRole);
                                      if (res.success) {
                                        toast.success(res.message);
                                        refreshUsers();
                                      }
                                    }}
                                  >
                                    Changer Rôle
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={async () => {
                                      if (confirm(`Supprimer l'utilisateur ${u.email} ?`)) {
                                        const res = await deleteUserAction(u.id);
                                        if (res.success) {
                                          toast.success(res.message);
                                          refreshUsers();
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                          {usersList.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400 italic">Aucun utilisateur trouvé</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* COLONNE DROITE : GESTION FICHIERS (CONTEXTUELLE) */}
        <div>
          {activePath ? (
            <Card className="border-primary border-2 sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  Fichiers : <span className="text-primary">{activePath.name}/{activePath.version}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-100 rounded-md p-3 border text-xs max-h-60 overflow-y-auto">
                  {folderFiles.length === 0 ? <p className="text-slate-400 italic">Vide</p> : (
                    <ul className="space-y-1">
                      {folderFiles.map((file) => (
                        <li key={file} className="flex items-center gap-2 text-slate-700">
                          {getFileIcon(file)} {file}
                          {file === 'thumbnail.png' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Cover</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Fichier Jeu (.js)</Label>
                    <Input type="file" onChange={handleFileUpload} disabled={uploading} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600">Image Couverture</Label>
                    <Input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} className="h-8 text-xs file:text-blue-600" />
                  </div>
                </div>

                {uploading && <p className="text-xs text-yellow-500 animate-pulse">Upload...</p>}

                <Button onClick={handleGenerateIndex} className="w-full" size="sm">
                  🚀 Générer index.html
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border-2 border-dashed rounded-lg text-slate-300">
              <p className="text-center">Sélectionnez un jeu<br />pour gérer ses fichiers</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}