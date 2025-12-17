/*
 * GameSystem Hub
 * Ce script est chargé par tous les jeux.
 * Il centralise la communication avec le backend et les utilitaires communs.
 */

(function () {
    console.log("🔌 GameSystem Hub Loaded");

    // 1. Validation de la configuration
    // On accepte window.DyadGame (Legacy/Current) ou window.__GAME_CONFIG__ (Future)
    const config = window.DyadGame || window.__GAME_CONFIG__;

    if (!config) {
        console.error("❌ GameSystem Error: Configuration not found.");
        console.warn("⚠️ Have you defined window.DyadGame = { id: '...', version: '...' } before loading system.js?");
        return;
    }

    console.log(`🎮 Game Detected: ${config.id} (${config.version})`);

    // 2. Définition du Namespace Standard
    window.GameSystem = {
        config: config,

        // Module Score
        Score: {
            submit: async (score, playerName = 'Joueur') => {
                console.log(`[GameSystem] 📤 Sending Score: ${score} (${playerName})`);
                try {
                    const res = await fetch('/api/scores', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            gameId: config.id,
                            playerName,
                            score
                        })
                    });

                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    console.log("[GameSystem] ✅ Score saved.");
                    return true;
                } catch (e) {
                    console.error("[GameSystem] ❌ Error saving score:", e);
                    return false;
                }
            },

            getLeaderboard: async () => {
                console.log("[GameSystem] 📥 Fetching Leaderboard...");
                try {
                    const res = await fetch('/api/scores?gameId=' + config.id);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    return Array.isArray(data) ? data : [];
                } catch (e) {
                    console.error("[GameSystem] ❌ Error fetching leaderboard:", e);
                    return [];
                }
            }
        },

        // Module Affichage
        Display: {
            toggleFullscreen: () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(e => {
                        console.error(`[GameSystem] Fullscreen failed: ${e.message}`);
                    });
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            }
        },

        // Module Cycle de Vie (Placeholder pour l'instant)
        Lifecycle: {
            notifyReady: () => {
                console.log("[GameSystem] Game Ready Signal Sent.");
                window.dispatchEvent(new Event('gamesystem:ready'));
            }
        }
    };

    // 3. Rétro-compatibilité temporaire (pour que Test-Hub V1 fonctionne encore sans rewrite total immédiat)
    // ATTENTION : Sera supprimé dans le futur.
    window.GameAPI = {
        saveScore: window.GameSystem.Score.submit,
        getHighScores: window.GameSystem.Score.getLeaderboard
    };

    console.log("✅ GameSystem Ready");

    // 4. Injection Automatique de l'UI Système (Overlay)
    function injectSystemUI() {
        // Eviter la double injection
        if (document.getElementById('dyad-system-ui')) return;

        console.log("[GameSystem] 🎨 Injecting System UI...");

        // Styles CSS pour l'UI
        const style = document.createElement('style');
        style.innerHTML = `
            #dyad-system-ui {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 0;
                overflow: visible;
                z-index: 9999;
                font-family: sans-serif;
                pointer-events: none; /* Laisser passer les clics vers le jeu */
            }
            .dyad-btn {
                pointer-events: auto;
                background: rgba(0, 0, 0, 0.5);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                padding: 8px 12px;
                cursor: pointer;
                font-size: 20px;
                transition: background 0.2s;
            }
            .dyad-btn:hover { background: rgba(0, 0, 0, 0.8); }
            
            #dyad-menu-btn {
                position: absolute;
                top: 10px;
                left: 10px;
            }

            #dyad-menu-overlay {
                pointer-events: auto;
                display: none;
                position: absolute;
                top: 50px;
                left: 10px;
                background: rgba(20, 20, 20, 0.95);
                border: 1px solid #444;
                border-radius: 8px;
                padding: 10px;
                min-width: 150px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                display: flex; /* Caché par défaut via JS, sinon flex */
                flex-direction: column;
                gap: 5px;
            }
            
            .dyad-menu-item {
                background: transparent;
                border: none;
                color: #ddd;
                text-align: left;
                padding: 8px;
                cursor: pointer;
                font-size: 14px;
                border-radius: 4px;
            }
            .dyad-menu-item:hover { background: rgba(255,255,255,0.1); color: white; }
            .dyad-hidden { display: none !important; }
        `;
        document.head.appendChild(style);

        // Structure HTML
        const container = document.createElement('div');
        container.id = 'dyad-system-ui';
        container.innerHTML = `
            <button id="dyad-menu-btn" class="dyad-btn">☰</button>
            <div id="dyad-menu-overlay" class="dyad-hidden">
                <button class="dyad-menu-item" id="dyad-fs-btn">⛶ Plein Écran</button>
                <div style="height:1px; background:#444; margin:5px 0;"></div>
                <button class="dyad-menu-item" id="dyad-close-menu">Fermer</button>
            </div>
        `;
        document.body.appendChild(container);

        // Logic
        const menuBtn = document.getElementById('dyad-menu-btn');
        const menuOverlay = document.getElementById('dyad-menu-overlay');
        const fsBtn = document.getElementById('dyad-fs-btn');
        const closeBtn = document.getElementById('dyad-close-menu');

        // --- AUTH CHECK UI ---
        // On demande qui est connecté pour l'afficher dans le menu
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    const userDisplay = document.createElement('div');
                    userDisplay.style.padding = '8px';
                    userDisplay.style.fontSize = '12px';
                    userDisplay.style.color = '#4ade80'; // Green
                    userDisplay.style.borderBottom = '1px solid #444';
                    userDisplay.innerHTML = `👤 ${data.user.email}`;
                    menuOverlay.insertBefore(userDisplay, menuOverlay.firstChild);
                } else {
                    const loginLink = document.createElement('a');
                    loginLink.href = "/login";
                    loginLink.target = "_blank"; // Ouvrir dans un nouvel onglet pour pas tuer le jeu
                    loginLink.className = "dyad-menu-item";
                    loginLink.style.color = "#fbbf24"; // Amber
                    loginLink.innerText = "⚠️ Non connecté";
                    menuOverlay.insertBefore(loginLink, menuOverlay.firstChild);
                }
            })
            .catch(e => console.error("Auth check failed", e));
        // ---------------------

        function toggleMenu() {
            const isHidden = menuOverlay.classList.contains('dyad-hidden');
            if (isHidden) {
                menuOverlay.classList.remove('dyad-hidden');
                menuOverlay.style.display = 'flex';
                // Mettre le jeu en pause ? window.GameSystem.Lifecycle.pause();
            } else {
                menuOverlay.classList.add('dyad-hidden');
                menuOverlay.style.display = 'none';
            }
        }

        menuBtn.addEventListener('click', toggleMenu);
        closeBtn.addEventListener('click', toggleMenu);

        fsBtn.addEventListener('click', () => {
            window.GameSystem.Display.toggleFullscreen();
            toggleMenu();
        });
    }

    // Attendre que le DOM soit prêt si le script est chargé dans le <head>
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSystemUI);
    } else {
        injectSystemUI();
    }

    console.log("✅ GameSystem Ready");

    // Auto-notify ready
    window.GameSystem.Lifecycle.notifyReady();

})();
