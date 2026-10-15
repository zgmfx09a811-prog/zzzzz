// Entities: Tower, Enemy, Projectile, Particle, FloatingText
window.GameApp = window.GameApp || {};

class Enemy {
    constructor(typeId, map, waveMultiplier = 1.0) {
        const ENEMY_TYPES = window.GameApp.ENEMY_TYPES;
        const template = ENEMY_TYPES[typeId] || ENEMY_TYPES.typo;
        this.typeId = typeId;
        this.name = template.name;
        this.maxHp = Math.round(template.hp * waveMultiplier);
        this.hp = this.maxHp;
        this.baseSpeed = template.speed;
        this.speed = this.baseSpeed;
        this.reward = Math.round(template.reward * Math.max(1, waveMultiplier * 0.9));
        this.slaDamage = template.slaDamage;
        this.color = template.color;
        this.size = template.size;
        this.symbol = template.symbol;
        this.isBoss = !!template.isBoss;

        this.shield = template.shield ? Math.round(template.shield * waveMultiplier) : 0;
        this.maxShield = this.shield;

        this.canBlink = !!template.canBlink;
        this.blinkTimer = template.blinkCooldown || 3.0;

        this.distance = 0;
        const pos = map.getPositionAtDistance(this.distance);
        this.x = pos.x;
        this.y = pos.y;
        this.angle = pos.angle;

        this.slowTimer = 0;
        this.slowFactor = 1.0;
        this.dead = false;
        this.reachedEnd = false;

        this.jitterX = 0;
        this.jitterY = 0;
        this.animTimer = Math.random() * 10;
    }

    update(dt, map) {
        if (this.dead || this.reachedEnd) return;

        this.animTimer += dt;
        if (Math.random() < 0.15) {
            this.jitterX = (Math.random() - 0.5) * 4;
            this.jitterY = (Math.random() - 0.5) * 4;
        } else {
            this.jitterX *= 0.8;
            this.jitterY *= 0.8;
        }

        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) {
                this.slowFactor = 1.0;
            }
        }

        if (this.canBlink) {
            this.blinkTimer -= dt;
            if (this.blinkTimer <= 0) {
                this.blinkTimer = 4.0;
                this.distance = Math.min(map.totalDistance - 20, this.distance + 80);
                this.jitterX = (Math.random() - 0.5) * 16;
            }
        }

        const currentSpeed = this.baseSpeed * this.slowFactor;
        this.distance += currentSpeed * dt;

        if (this.distance >= map.totalDistance) {
            this.reachedEnd = true;
            return;
        }

        const pos = map.getPositionAtDistance(this.distance);
        this.x = pos.x;
        this.y = pos.y;
        this.angle = pos.angle;
    }

    takeDamage(amount) {
        if (this.dead) return 0;

        let damageRemaining = amount;
        if (this.shield > 0) {
            if (this.shield >= damageRemaining) {
                this.shield -= damageRemaining;
                damageRemaining = 0;
            } else {
                damageRemaining -= this.shield;
                this.shield = 0;
            }
        }

        this.hp -= damageRemaining;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
        }
        return amount;
    }

    applySlow(factor, duration) {
        this.slowFactor = Math.min(this.slowFactor, factor);
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    rollback(distanceOffset) {
        this.distance = Math.max(0, this.distance - distanceOffset);
    }

    draw(ctx) {
        if (this.dead || this.reachedEnd) return;

        ctx.save();
        ctx.translate(this.x + this.jitterX, this.y + this.jitterY);

        if (this.slowTimer > 0) {
            ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 6, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.isBoss) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 8 + Math.sin(this.animTimer * 6) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.isBoss) {
            const r = this.size;
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI) / 3;
                const hx = Math.cos(a) * r;
                const hy = Math.sin(a) * r;
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
        } else {
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(9, Math.floor(this.size * 0.9))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 1);

        const barWidth = Math.max(28, this.size * 2.2);
        const barHeight = 4;
        const barY = -this.size - 9;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);

        if (this.maxShield > 0 && this.shield > 0) {
            const shieldPercent = this.shield / this.maxShield;
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-barWidth / 2, barY - 4, barWidth * shieldPercent, 3);
        }

        ctx.restore();
    }
}

class Tower {
    constructor(col, row, typeId) {
        this.col = col;
        this.row = row;
        this.typeId = typeId;

        const template = window.GameApp.TOWER_TYPES[typeId];
        this.name = template.name;
        this.shortName = template.shortName;
        this.color = template.color;
        this.bulletColor = template.bulletColor;
        this.type = template.type;
        this.desc = template.desc;

        this.level = 1;
        this.baseCost = template.cost;
        this.totalInvested = template.cost;
        this.upgradeCostMultiplier = template.upgradeCostMultiplier;

        this.baseDamage = template.damage;
        this.damage = this.baseDamage;

        this.baseRange = template.range;
        this.range = this.baseRange;

        this.baseFireRate = template.fireRate;
        this.fireRate = this.baseFireRate;

        this.bulletSpeed = template.bulletSpeed;
        this.splashRadius = template.splashRadius || 0;
        this.slowFactor = template.slowFactor || 1.0;
        this.slowDuration = template.slowDuration || 0;

        this.x = col * 40 + 20;
        this.y = row * 40 + 20;

        this.cooldown = 0;
        this.target = null;
        this.targetAngle = 0;

        this.kills = 0;
        this.totalDamageDealt = 0;
        this.beamTimer = 0;
    }

    getUpgradeCost() {
        return Math.round(this.baseCost * Math.pow(this.upgradeCostMultiplier, this.level));
    }

    getSellValue() {
        const GAME_CONFIG = window.GameApp.GAME_CONFIG;
        return Math.floor(this.totalInvested * GAME_CONFIG.SELL_REFUND_RATIO);
    }

    upgrade() {
        const cost = this.getUpgradeCost();
        this.totalInvested += cost;
        this.level += 1;

        this.damage = Math.round(this.baseDamage * (1 + (this.level - 1) * 0.45));
        this.range = Math.round(this.baseRange * (1 + (this.level - 1) * 0.12));
        this.fireRate = Number((this.baseFireRate * (1 + (this.level - 1) * 0.18)).toFixed(2));
        if (this.splashRadius > 0) {
            this.splashRadius = Math.round(this.splashRadius * 1.15);
        }
        return cost;
    }

    update(dt, enemies, projectiles) {
        this.cooldown -= dt;
        if (this.beamTimer > 0) {
            this.beamTimer -= dt;
        }

        let bestEnemy = null;
        let maxDist = -1;

        for (const enemy of enemies) {
            if (enemy.dead || enemy.reachedEnd) continue;
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.range) {
                const priorityWeight = enemy.distance + (enemy.isBoss ? 200 : 0);
                if (priorityWeight > maxDist) {
                    maxDist = priorityWeight;
                    bestEnemy = enemy;
                }
            }
        }

        this.target = bestEnemy;

        if (this.target) {
            this.targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

            if (this.cooldown <= 0) {
                this.shoot(projectiles);
                this.cooldown = 1.0 / this.fireRate;
            }
        }
    }

    shoot(projectiles) {
        if (!this.target) return;

        window.GameApp.audio.playShoot(this.typeId);

        if (this.type === 'beam') {
            this.beamTimer = 0.18;
            this.target.takeDamage(this.damage);
            this.target.applySlow(this.slowFactor, this.slowDuration);
            this.totalDamageDealt += this.damage;
            if (this.target.dead) this.kills++;
        } else {
            projectiles.push(new window.GameApp.Projectile(
                this.x,
                this.y,
                this.target,
                this.damage,
                this.bulletSpeed,
                this.type,
                this.bulletColor,
                this.typeId,
                this.splashRadius,
                this
            ));
        }
    }

    draw(ctx, isSelected = false) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (isSelected) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-17, -17, 34, 34);
        ctx.strokeStyle = isSelected ? '#38bdf8' : this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(-17, -17, 34, 34);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.rotate(this.targetAngle);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, -3, 15, 6);
        ctx.strokeRect(0, -3, 15, 6);
        ctx.rotate(-this.targetAngle);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.shortName.slice(0, 3), 0, 0);

        if (this.level > 1) {
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('★'.repeat(Math.min(5, this.level - 1)), 0, -19);
        }

        if (this.type === 'beam' && this.beamTimer > 0 && this.target && !this.target.dead) {
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.restore();
    }
}

class Projectile {
    constructor(x, y, target, damage, speed, type, color, typeId, splashRadius = 0, sourceTower = null) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.targetX = target.x;
        this.targetY = target.y;
        this.damage = damage;
        this.speed = speed;
        this.type = type;
        this.color = color;
        this.typeId = typeId;
        this.splashRadius = splashRadius;
        this.sourceTower = sourceTower;
        this.active = true;
    }

    update(dt, enemies, particles, floatingTexts) {
        if (!this.active) return;

        if (this.target && !this.target.dead && !this.target.reachedEnd) {
            this.targetX = this.target.x;
            this.targetY = this.target.y;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);
        const step = this.speed * dt;

        if (dist <= step || dist < 12) {
            this.hit(enemies, particles, floatingTexts);
            this.active = false;
        } else {
            this.x += (dx / dist) * step;
            this.y += (dy / dist) * step;
        }
    }

    hit(enemies, particles, floatingTexts) {
        const Particle = window.GameApp.Particle;
        const FloatingText = window.GameApp.FloatingText;

        if (this.type === 'splash') {
            let totalSplashDmg = 0;
            for (const enemy of enemies) {
                if (enemy.dead || enemy.reachedEnd) continue;
                const d = Math.hypot(enemy.x - this.targetX, enemy.y - this.targetY);
                if (d <= this.splashRadius) {
                    const falloff = 1 - (d / this.splashRadius) * 0.4;
                    const dmg = Math.round(this.damage * falloff);
                    enemy.takeDamage(dmg);
                    totalSplashDmg += dmg;
                    if (enemy.dead && this.sourceTower) this.sourceTower.kills++;
                }
            }
            if (this.sourceTower) this.sourceTower.totalDamageDealt += totalSplashDmg;

            for (let i = 0; i < 16; i++) {
                particles.push(new Particle(this.targetX, this.targetY, this.color, 'circle', 2.5));
            }
            floatingTexts.push(new FloatingText(this.targetX, this.targetY - 10, 'AOE HIT!', '#22d3ee'));
        } else {
            if (this.target && !this.target.dead) {
                this.target.takeDamage(this.damage);
                if (this.sourceTower) {
                    this.sourceTower.totalDamageDealt += this.damage;
                    if (this.target.dead) this.sourceTower.kills++;
                }

                for (let i = 0; i < 6; i++) {
                    particles.push(new Particle(this.target.x, this.target.y, this.color, 'spark', 1.5));
                }

                if (this.typeId === 'unit') {
                    floatingTexts.push(new FloatingText(this.target.x, this.target.y - 12, '✓ PASSED', '#4ade80', 10));
                }
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.typeId === 'unit') {
            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', 0, 0);
        } else if (this.typeId === 'e2e') {
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(-5, -5, 10, 10);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(-5, -5, 10, 10);
        } else if (this.typeId === 'linter') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(-6, -2, 12, 4);
        }

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, shape = 'circle', size = 3) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.shape = shape;
        this.size = size;

        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 120;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.life = 0.4 + Math.random() * 0.3;
        this.maxLife = this.life;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.95;
        this.vy *= 0.95;
    }

    draw(ctx) {
        if (!this.active) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        if (this.shape === 'spark') {
            ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color = '#22c55e', fontSize = 12) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
        this.life = 0.9;
        this.maxLife = 0.9;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        this.y -= dt * 28;
    }

    draw(ctx) {
        if (!this.active) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

window.GameApp.Enemy = Enemy;
window.GameApp.Tower = Tower;
window.GameApp.Projectile = Projectile;
window.GameApp.Particle = Particle;
window.GameApp.FloatingText = FloatingText;
