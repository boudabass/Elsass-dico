"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight, LayoutDashboard, Database, Shield } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 z-0"></div>
      
      <div className="relative z-10 space-y-8 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
          Template <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Next.js Boilerplate</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
          Un point de départ propre incluant : Supabase Auth, Stockage local Lowdb (JSON), 
          Dashboard Admin, et déploiement Docker prêt pour la production.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {!isLoading && user ? (
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 font-bold bg-indigo-600 hover:bg-indigo-500">
                Aller au Dashboard <LayoutDashboard className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 font-bold bg-indigo-600 hover:bg-indigo-500">
                Se connecter <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 text-left">
          <div className="p-4 rounded-xl border border-white/5 bg-white/5">
            <Shield className="w-6 h-6 text-indigo-400 mb-2" />
            <h3 className="font-bold">Auth Supabase</h3>
            <p className="text-sm text-slate-400">Gestion des comptes et rôles (User/Admin) déjà configurée.</p>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/5">
            <Database className="w-6 h-6 text-cyan-400 mb-2" />
            <h3 className="font-bold">Lowdb Storage</h3>
            <p className="text-sm text-slate-400">Persistance locale dans un fichier JSON via Docker Volume.</p>
          </div>
        </div>
      </div>
    </div>
  );
}