/**
 * GameSystem Hub (v2 - Q5/P5Play Standard)
 * 
 * Ce script est injecté dans l'iframe de chaque jeu et fournit l'API
 * standardisée pour la soumission des scores et la gestion du cycle de vie.
 * Il utilise fetch pour communiquer avec le backend Next.js (/api/scores).
 */

(function () {
    // Vérifie si la configuration DyadGame est présente
    if (typeof window.DyadGame === 'undefined' || !window.DyadGame.id) {
        console.error("[GameSystem] Erreur: window.DyadGame.id n'est pas défini. Le jeu ne peut pas s'initialiser correctement.");
        return;
    }

    const GAME_ID = window.DyadGame.id;
    const API_URL = '/api/scores';

    /**
     * Gestion des scores (Soumission et Leaderboard)
     */
    const Score = {
        /**
         * Soumet un score au serveur.
         * @param {number} score - Le score du joueur.
         * @param {string} [playerName] - Nom du joueur (optionnel, sera ignoré si l'utilisateur est authentifié).
         * @returns {Promise<boolean>} True si la soumission a réussi.
         */
        async submit(score, playerName = 'Anonyme') {
            if (typeof score !== 'number' || score < 0) {
                console.warn(`[GameSystem] Tentative de soumission d'un score invalide: ${score}`);
                return false;
            }

            console.log(`[GameSystem] Soumission du score ${score} pour le jeu ${GAME_ID}...`);

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        gameId: GAME_ID,
                        score: score,
                        playerName: playerName, // Le backend gère l'identité si l'utilisateur est connecté
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("[GameSystem] Échec de la soumission du score:", response.status, errorData.error);
                    return false;
                }

                console.log("[GameSystem] Score soumis avec succès.");
                return true;

            } catch (error) {
                console.error("[GameSystem] Erreur réseau lors de la soumission du score:", error);
                return false;
            }
        },

        /**
         * Récupère le leaderboard pour le jeu actuel.
         * @returns {Promise<Array<{ playerName: string, score: number, date: string }>>}
         */
        async getLeaderboard() {
            console.log(`[GameSystem] Récupération du leaderboard pour ${GAME_ID}...`);
            try {
                const response = await fetch(`${API_URL}?gameId=${GAME_ID}`);

                if (!response.ok) {
                    console.error("[GameSystem] Échec de la récupération du leaderboard:", response.status);
                    return [];
                }

                const data = await response.json();
                console.log(`[GameSystem] Leaderboard récupéré (${data.length} entrées).`);
                return data;

            } catch (error) {
                console.error("[GameSystem] Erreur réseau lors de la récupération du leaderboard:", error);
                return [];
            }
        }
    };

    /**
     * Gestion de l'affichage (Fullscreen)
     */
    const Display = {
        toggleFullscreen() {
            const elem = document.documentElement;
            if (!document.fullscreenElement) {
                elem.requestFullscreen().catch(err => {
                    console.error(`[GameSystem] Erreur lors du passage en plein écran: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }
    };

    /**
     * Gestion du cycle de vie (pour communication avec le wrapper React)
     */
    const Lifecycle = {
        /**
         * Notifie le wrapper parent que le jeu a fini de charger ses assets et est prêt à jouer.
         */
        notifyReady() {
            console.log("[GameSystem] Jeu prêt (notifyReady).");
            window.parent.postMessage({ type: 'GAME_READY', gameId: GAME_ID }, '*');
        },
    };

    // Expose l'API globale
    window.GameSystem = {
        config: window.DyadGame,
        Score,
        Display,
        Lifecycle,
    };

    // Dispatch un événement pour que les jeux puissent écouter la disponibilité du système
    document.dispatchEvent(new CustomEvent('dyad:system:ready'));

    console.log(`[GameSystem] Initialisé pour le jeu: ${GAME_ID}`);

})();