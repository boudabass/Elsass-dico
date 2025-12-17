// Configuration globale du jeu
const Config = {
    // Monde
    worldWidth: 2000,
    worldHeight: 1200,
    gravity: 25,
    
    // Couleurs
    colors: {
        background: 50,
        player: 'blue',
        platform: 'gray',
        enemy: 'red',
        coin: 'gold',
        text: 255
    },
    
    // Tuning (Game Feel)
    player: {
        speed: 5,
        jumpForce: -12,
        groundLerp: 0.2,
        airLerp: 0.05,
        coyoteTime: 6, // frames
        jumpBuffer: 8  // frames
    },
    
    // Ennemis
    enemy: {
        patrolSpeed: 2
    }
};