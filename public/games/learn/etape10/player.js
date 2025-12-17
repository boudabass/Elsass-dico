class Player {
    constructor(x, y) {
        this.sprite = new Sprite(x, y, 30, 30);
        this.sprite.color = Config.colors.player;
        this.sprite.collider = 'dynamic';
        this.sprite.rotationLock = true;
        this.sprite.bounciness = 0;
        this.sprite.friction = 0;
        
        // Variables internes pour le Game Feel
        this.groundTimer = 0;
        this.jumpTimer = 0;
        
        // Lien pour accéder à l'instance depuis le sprite si besoin
        this.sprite.playerRef = this;
    }
    
    update(platforms) {
        // --- 1. Gestion des Timers (Coyote & Buffer) ---
        if (this.sprite.colliding(platforms)) {
            this.groundTimer = Config.player.coyoteTime;
        }
        
        if (kb.presses('space') || kb.presses('up')) {
            this.jumpTimer = Config.player.jumpBuffer;
        }
        
        if (this.groundTimer > 0) this.groundTimer--;
        if (this.jumpTimer > 0) this.jumpTimer--;
        
        // --- 2. Saut ---
        if (this.jumpTimer > 0 && this.groundTimer > 0) {
            this.sprite.vel.y = Config.player.jumpForce;
            this.jumpTimer = 0;
            this.groundTimer = 0;
        }
        
        // --- 3. Déplacements ---
        let targetSpeed = 0;
        if (kb.pressing('left')) targetSpeed = -Config.player.speed;
        if (kb.pressing('right')) targetSpeed = Config.player.speed;
        
        let lerpFactor = (this.groundTimer > 0) ? Config.player.groundLerp : Config.player.airLerp;
        this.sprite.vel.x = lerp(this.sprite.vel.x, targetSpeed, lerpFactor);
    }
    
    die() {
        // Logique de mort (sera appelée par sketch.js)
        this.sprite.vel.x = 0;
        this.sprite.vel.y = 0;
    }
    
    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }
    set x(val) { this.sprite.x = val; }
    set y(val) { this.sprite.y = val; }
}