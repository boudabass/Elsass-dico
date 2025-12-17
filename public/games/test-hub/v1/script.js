// script.js du jeu "Test Hub"

const log = (msg) => {
    const el = document.getElementById('logs');
    if (el) {
        el.textContent += msg + '\n';
        el.scrollTop = el.scrollHeight;
    }
    console.log('[TestGame]', msg);
};

// Attendre que le système soit prêt
// On peut écouter l'event 'dyad:system:ready' ou vérifier window.GameAPI
window.addEventListener('dyad:system:ready', () => {
    document.getElementById('status').innerText = "✅ System Connected via Event";
    document.getElementById('status').style.color = "#4ade80";
    log("Event: dyad:system:ready received.");
});

// Fallback si on a raté l'event (le script charge vite)
if (window.GameAPI) {
    document.getElementById('status').innerText = "✅ System Connected (Direct)";
    document.getElementById('status').style.color = "#4ade80";
    log("Direct check: GameAPI is available.");
}

async function testSave() {
    log("Click: Save Score...");
    if (!window.GameAPI) return log("❌ API not ready");

    // Générer un score aléatoire pour voir la diff
    const randomScore = Math.floor(Math.random() * 1000);
    const res = await window.GameAPI.saveScore(randomScore, "Tester_" + Math.floor(Math.random() * 100));
    log(`Result Save (${randomScore}): ${res}`);
}

async function testLoad() {
    log("Click: Load Scores...");
    if (!window.GameAPI) return log("❌ API not ready");

    const scores = await window.GameAPI.getHighScores();
    log("Result Load: " + scores.length + " scores found.");
    log(JSON.stringify(scores, null, 2));
}

log("Test Game Script Loaded.");
