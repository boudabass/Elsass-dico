import { createClient } from '@/lib/supabase/server';

export interface Profile {
  id: string;
  email: string | null;
  role: 'user' | 'admin';
  updated_at: string;
}

export interface AppSettings {
  id: number;
  version: string;
  maintenance: boolean;
  settings: Record<string, unknown>;
  updated_at: string;
}

/**
 * Récupère le profil de l'utilisateur connecté
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

/**
 * Met à jour le profil de l'utilisateur
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * Récupère les paramètres de l'application
 */
export async function getAppSettings(): Promise<AppSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('app_settings')
    .select('*')
    .single();
  return data;
}

/**
 * Met à jour les paramètres de l'application (admin uniquement)
 */
export async function updateAppSettings(updates: Partial<AppSettings>): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('app_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1);
}