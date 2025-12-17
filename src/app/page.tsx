"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Gamepad2, Rocket, ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* Header / Nav Rapide */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-black text-2xl tracking-tighter bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            ARCADE.OS
          </div>
          <div>
            {!isLoading && user ? (
              <Link href="/dashboard">
                <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/20">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Accéder au Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                  Connexion
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[80vh] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 z-0"></div>
        <div className={`container mx-auto relative z-10 text-center space-y-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-4">
            <Rocket className="w-4 h-4" /> Nouvelle Version Disponible
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight max-w-5xl mx-auto">
            Retrouvez le frisson du <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-400">Gaming Rétro</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Une collection curée de jeux classiques et indépendants.
            Sauvegardez vos scores, défiez la communauté et redécouvrez le plaisir simple du jeu d'arcade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all transform hover:scale-105">
                  Lancer l'Arcade <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all transform hover:scale-105">
                  Commencer maintenant <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-900/30 border-t border-white/5">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-950 border border-white/5 hover:border-indigo-500/30 transition-colors">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-400">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Jeux Instantanés</h3>
            <p className="text-slate-400 leading-relaxed">Pas d'installation. Lancez vos jeux préférés directement dans le navigateur en haute performance.</p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-950 border border-white/5 hover:border-cyan-500/30 transition-colors">
            <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 text-cyan-400">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Classements Mondiaux</h3>
            <p className="text-slate-400 leading-relaxed">Chaque pixel compte. Vos scores sont enregistrés et comparés aux meilleurs joueurs de la plateforme.</p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-950 border border-white/5 hover:border-teal-500/30 transition-colors">
            <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 text-teal-400">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Compte Unique</h3>
            <p className="text-slate-400 leading-relaxed">Retrouvez votre historique, vos statistiques et votre progression sur tous vos appareils.</p>
          </div>
        </div>
      </section>
    </div>
  );
}