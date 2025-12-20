console.log("🚜 Elsass Farm v1 Initializing...");

// 1. Initialisation de l'état global (DOIT ÊTRE FAIT EN PREMIER)
window.ElsassFarm.state = {
    currentZoneId: 'C_C',
    energy: 100,
    gold: 0,
    day: 1,
    time: '6:00',
    showGrid: true 
};

// 2. Instanciation des systèmes
window.ElsassFarm.systems.ui = new UIManager();