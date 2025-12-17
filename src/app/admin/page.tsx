"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  createGameRelease,
  deleteGameRelease,
  getGameReleases,
  listGameReleaseFiles,
  regenerateIndexHtml,
  updateGameRelease,
  uploadGameFiles
} from "@/app/actions/game-manager";
import { GameRelease } from "@/lib/database";
import { FileCode, ImageIcon, FileText, Trash2, Edit, Save, FolderPlus, Layers, Upload, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [releases, setReleases] = useState<GameRelease[]>([]);
  
  // Form state
  const [newGameName, setNewGameName] = useState("");
  const [newVersionName, setNewVersionName] = useState("v1");
  const [newGameWidth, setNewGameWidth] = useState(800);
  const [newGameHeight, setNewGameHeight] = useState(600);
  const [newGameDescription, setNewGameDescription] = useState("");

  // File management state
  const [activeRelease, setActiveRelease] = useState<GameRelease | null>(null);
  const [uploading, setUploading] = useState(false);
  const [releaseFiles, setReleaseFiles] = useState<string[]>([]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", width: 800, height: 600 });

  useEffect(() => {
    refreshReleases();
  }, []);

  useEffect(() => {
    if (activeRelease) {
      loadFiles(activeRelease.id);
    } else {
      setReleaseFiles([]);
    }
  }, [activeRelease]);

  const refreshReleases = async () => {
    const r = await getGameReleases();
    setReleases(r.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version)));
  };

  const loadFiles = async (id: string) => {
    const files = await listGameReleaseFiles(id);
    setReleaseFiles(files);
  };

  const handleCreateRelease = async () => {
    if (!newGameName || !newVersionName) return toast.error("Nom et version requis");
    const res = await createGameRelease(newGameName, newVersionName, newGameWidth, newGameHeight, newGameDescription);
    if (res.success && res.release) {
      toast.success(`Jeu "${res.release.id}" créé !`);
      setNewGameName("");
      setNewVersionName("v1");
      setNewGameDescription("");
      setActiveRelease(res.release);
      refreshReleases();
    } else {
      toast.error(res.error || "Erreur inconnue");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activeRelease) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(e.target.files).forEach(file => formData.append('files', file));
    
    const res = await uploadGameFiles(activeRelease.id, formData);
    if (res.success) {
      toast.success(`${res.fileNames?.length || 0} fichier(s) uploadé(s)`);
      loadFiles(activeRelease.id);
      refreshReleases(); // To update thumbnail if present
    } else {
      toast.error(res.error);
    }
    setUploading(false);
  };

  const handleRegenerateIndex = async () => {
    if (!activeRelease) return;
    await regenerateIndexHtml(activeRelease.id);
    toast.success("index.html régénéré !");
    loadFiles(activeRelease.id);
  };

  const handleDeleteRelease = async (id: string) => {
    if (!confirm(`Supprimer la release "${id}" et ses fichiers ?`)) return;
    await deleteGameRelease(id);
    toast.success("Release supprimée");
    refreshReleases();
    if (activeRelease?.id === id) setActiveRelease(null);
  };

  const startEditing = (release: GameRelease) => {
    setEditingId(release.id);
    setEditForm({ 
        name: release.name, 
        description: release.description || "",
        width: release.width || 800,
        height: release.height || 600
    });
  };

  const saveEditing = async (id: string) => {
    await updateGameRelease(id, editForm);
    toast.success("Métadonnées mises à jour");
    setEditingId(null);
    refreshReleases();
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
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FolderPlus /> Créer une Release de Jeu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nom du Jeu</Label><Input placeholder="ex: Snake" value={newGameName} onChange={(e) => setNewGameName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Version</Label><Input placeholder="ex: v1" value={newVersionName} onChange={(e) => setNewVersionName(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Largeur</Label><Input type="number" value={newGameWidth} onChange={(e) => setNewGameWidth(Number(e.target.value))} /></div>
                <div className="space-y-2"><Label>Hauteur</Label><Input type="number" value={newGameHeight} onChange={(e) => setNewGameHeight(Number(e.target.value))} /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Description courte..." value={newGameDescription} onChange={(e) => setNewGameDescription(e.target.value)} /></div>
              <Button onClick={handleCreateRelease} className="w-full">Créer la Release</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Releases Installées</CardTitle>
              <CardDescription>Liste des jeux configurés dans la base de données.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {releases.length === 0 && <p className="text-slate-400 italic">Aucune release trouvée.</p>}
              {releases.map(release => {
                const isEditing = editingId === release.id;
                return (
                  <div key={release.id} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{release.name} <span className="font-mono text-sm text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{release.version}</span></h3>
                        <p className="text-xs text-slate-500">{release.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setActiveRelease(release)}>Fichiers</Button>
                        {!isEditing && <Button variant="ghost" size="sm" onClick={() => startEditing(release)}><Edit className="w-4 h-4" /></Button>}
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteRelease(release.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="mt-2 p-3 bg-white border rounded-md space-y-3 animate-accordion-down">
                        <div className="grid gap-2"><Label>Titre</Label><Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label>Largeur</Label><Input type="number" value={editForm.width} onChange={e => setEditForm({...editForm, width: Number(e.target.value)})} /></div>
                          <div><Label>Hauteur</Label><Input type="number" value={editForm.height} onChange={e => setEditForm({...editForm, height: Number(e.target.value)})} /></div>
                        </div>
                        <div className="grid gap-2"><Label>Description</Label><Textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Annuler</Button>
                          <Button size="sm" onClick={() => saveEditing(release.id)}><Save className="w-4 h-4 mr-2" /> Enregistrer</Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div>
          {activeRelease ? (
            <Card className="border-primary border-2 sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Fichiers : <span className="text-primary">{activeRelease.id}</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-100 rounded-md p-3 border text-xs max-h-60 overflow-y-auto">
                  {releaseFiles.length === 0 ? <p className="text-slate-400 italic">Vide</p> : (
                    <ul className="space-y-1">
                      {releaseFiles.map((file) => (
                        <li key={file} className="flex items-center gap-2 text-slate-700">
                          {getFileIcon(file)} {file}
                          {file === activeRelease.thumbnail && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Cover</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2"><Upload className="w-4 h-4" /> Uploader Fichiers</Label>
                  <Input type="file" multiple onChange={handleFileUpload} disabled={uploading} className="h-10 text-xs" />
                  <p className="text-xs text-slate-400">Un fichier nommé `thumbnail.png` sera défini comme image de couverture.</p>
                </div>
                {uploading && <p className="text-xs text-yellow-500 animate-pulse">Upload...</p>}
                <Button onClick={handleRegenerateIndex} className="w-full" size="sm" variant="secondary">
                  <RefreshCw className="w-4 h-4 mr-2" /> Régénérer index.html
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border-2 border-dashed rounded-lg text-slate-300">
              <p className="text-center">Sélectionnez une release<br/>pour gérer ses fichiers</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}