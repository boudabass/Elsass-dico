console.log("🚜 Elsass Farm v1 Initializing...");

// Initialisation de l'état global (pour les placeholders du HUD)
window.ElsassFarm.state = {
    currentZoneId: 'C_C',
    energy: 100,
    gold: 0,
    day: 1,
    time: '6:00'
};

// Instanciation des systèmes
window.ElsassFarm.systems.ui = new UIManager();