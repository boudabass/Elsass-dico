class Enemy {
    constructor(x, y, group) {
        // On utilise le groupe fourni pour créer le sprite
        this.sprite = new group.Sprite(x, y, 25, 25);
        this.sprite.vel.x = random([-1, 1]) * Config.enemy.patrolSpeed;
        if(this.sprite.vel.x === 0) this.sprite.vel.x = Config.enemy.patrolSpeed;
        
        this.sprite.friction = 0;
        this.sprite.bounciness = 0;
        this.sprite.rotationLock = true;
    }
    
    update(platforms) {
        let s = this.sprite;
        
        // --- Patrouille Robuste (AABB Check) ---
        let dir = Math.sign(s.vel.x) || 1;
        
        // Point devant et en bas
        let scanX = s.x + dir * (s.w/2 + 5);
        let scanY = s.y + s.h/2 + 5;
        
        let onGround = false;
        
        // On doit vérifier manuellement car l'API overlap est capricieuse
        for (let p of platforms) {
            if (scanX > p.x - p.w/2 && scanX < p.x + p.w/2 &&
                scanY > p.y - p.h/2 && scanY < p.y + p.h/2) {
                onGround = true;
                break;
            }
        }
        
        if (!onGround) {
            s.vel.x *= -1;
            s.x += s.vel.x * 2; // Petit saut pour ne pas coincer
        }
    }
}