// core/LoadingManager.js
// Gère la barre de progression et les messages de statut pendant le chargement initial.

window.LoadingManager = {
    MAX_STEPS: 50,
    currentStep: 0,
    statusMessage: "Initialisation...",
    
    // Met à jour le statut et avance la barre de progression
    advanceStep: function (message) {
        this.currentStep = Math.min(this.currentStep + 1, this.MAX_STEPS);
        if (message) {
            this.statusMessage = message;
        }
        this.updateDisplay(true); // true pour ajouter à l'historique
    },

    // Met à jour uniquement le message de statut
    updateStatus: function (message) {
        if (message) {
            this.statusMessage = message;
        }
        this.updateDisplay(false); // false pour ne pas ajouter à l'historique (seulement pour les messages temporaires)
    },

    // Met à jour l'affichage DOM
    updateDisplay: function (addToHistory) {
        const historyEl = document.getElementById('loading-history');
        const barEl = document.getElementById('loading-progress-fill');
        const progress = (this.currentStep / this.MAX_STEPS) * 100;
        
        const message = `[${this.currentStep}/${this.MAX_STEPS}] ${this.statusMessage}`;

        if (historyEl && addToHistory) {
            const p = document.createElement('p');
            p.innerText = message;
            
            // Ajouter une classe de succès si l'étape est terminée
            if (this.statusMessage.startsWith('✅')) {
                p.classList.add('step-success');
            }
            
            historyEl.appendChild(p);
            // Scroll automatique vers le bas
            historyEl.scrollTop = historyEl.scrollHeight;
        }
        
        if (barEl) {
            barEl.style.width = `${progress}%`;
        }
    },

    // Masque l'écran de chargement et affiche le bouton Jouer
    finishLoading: function () {
        this.advanceStep("Chargement terminé. Prêt à jouer.");
        const loadingScreen = document.getElementById('loading-screen');
        const playButton = document.getElementById('play-button');
        
        if (loadingScreen) {
            // Masquer la barre et le texte
            document.getElementById('loading-bar-container').style.display = 'block'; // La barre reste visible
            
            // Afficher le bouton Jouer
            if (playButton) {
                playButton.style.display = 'block';
                playButton.onclick = () => {
                    // Utiliser une transition douce pour masquer l'écran de chargement
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        // Démarrer la boucle de jeu p5.js (si elle n'est pas déjà lancée)
                        if (typeof loop === 'function') loop();
                        
                        // Notifier le GameSystem que le jeu est prêt
                        if(window.GameSystem && window.GameSystem.Lifecycle) {
                            window.GameSystem.Lifecycle.notifyReady();
                        }
                    }, 500);
                };
            }
        }
    }
};

// Initialisation de l'affichage au chargement du script
window.LoadingManager.updateDisplay(true);

console.log("✅ LoadingManager.js chargé");