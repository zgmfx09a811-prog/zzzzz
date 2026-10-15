// Core Game Loop & State Management
window.GameApp = window.GameApp || {};

class Game {
    constructor() {
        const { GAME_CONFIG, TOWER_TYPES, WAVES, SKILLS, GameMap, UIManager, Tower, Enemy, FloatingText, Particle, audio } = window.GameApp;

        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
        this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

        this.map = new GameMap(this.canvas.width, this.canvas.height);
        this.ui = new UIManager(this);

        this.sla = GAME_CONFIG.INITIAL_SLA;
        this.credits = GAME_CONFIG.INITIAL_CREDITS;
        this.waveIndex = 0;
        this.state = 'IDLE';
        this.gameSpeed = 1.0;
        this.isPaused = false;

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];

        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hoverGrid = null;

        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveInProgress = false;

        this.skillCooldowns = {
            revert: 0,
            hotfix: 0,
            bluegreen: 0
        };
        this.invulnerableTimer = 0;

        this.lastTime = performance.now();

        this.setupEventHandlers();
        this.startInitialState();
    }

    startInitialState() {
        const WAVES = window.GameApp.WAVES;
        this.ui.log('🚀 System initialized. Welcome SRE, protect the deployment pipeline!', 'info');
        this.ui.updateHUD(this.sla, this.credits, this.waveIndex, WAVES.length, 0);
        this.ui.updateInspector(null);

        this.ui.showModal(
            '🛡️ MISSION: PRODUCTION TOWER DEFENSE',
            `<p>Developers are pushing code directly to the repository!</p>
             <p>Deploy Linters, Unit Tests, and E2E Containers along the pipeline to catch bugs before they crash the <b>Production Cluster</b>.</p>
             <p>Keep the SLA above <b>0.0%</b> to achieve a successful release.</p>`,
            'START SPRINT ➔',
            () => {
                this.startNextWave();
            }
        );

        requestAnimationFrame((t) => this.loop(t));
    }

    setupEventHandlers() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            this.hoverGrid = this.map.worldToGrid(x, y);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoverGrid = null;
        });

        this.canvas.addEventListener('click', (e) => {
            window.GameApp.audio.ensureContext();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            this.handleCanvasClick(x, y);
        });

        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const TOWER_TYPES = window.GameApp.TOWER_TYPES;
            if (e.key >= '1' && e.key <= '5') {
                const towerTypesList = Object.values(TOWER_TYPES);
                const idx = parseInt(e.key) - 1;
                if (towerTypesList[idx]) {
                    this.selectTowerType(towerTypesList[idx].id);
                }
            } else if (e.key.toLowerCase() === 'r') {
                this.activateSkill('revert');
            } else if (e.key.toLowerCase() === 'h') {
                this.activateSkill('hotfix');
            } else if (e.key.toLowerCase() === 'b') {
                this.activateSkill('bluegreen');
            } else if (e.key === 'Escape') {
                this.selectedTowerType = null;
                this.deselectTower();
            } else if (e.key === ' ') {
                e.preventDefault();
                this.togglePause();
            }
        });
    }

    handleCanvasClick(x, y) {
        const gridPos = this.map.worldToGrid(x, y);
        const { col, row } = gridPos;

        if (this.selectedTowerType) {
            if (this.map.isBuildable(col, row)) {
                if (this.credits >= this.selectedTowerType.cost) {
                    this.buildTower(col, row, this.selectedTowerType.id);
                } else {
                    this.ui.log('❌ Insufficient compute credits to deploy module.', 'warn');
                    window.GameApp.audio.playAlarm();
                }
            } else {
                window.GameApp.audio.playAlarm();
            }
            return;
        }

        const clickedTower = this.map.getTowerAt(col, row);
        if (clickedTower) {
            window.GameApp.audio.playClick();
            this.selectTower(clickedTower);
        } else {
            this.deselectTower();
        }
    }

    selectTowerType(typeId) {
        const TOWER_TYPES = window.GameApp.TOWER_TYPES;
        if (this.selectedTowerType?.id === typeId) {
            this.selectedTowerType = null;
        } else {
            this.selectedTowerType = TOWER_TYPES[typeId];
            this.deselectTower();
        }
    }

    selectTower(tower) {
        this.selectedTower = tower;
        this.selectedTowerType = null;
        this.ui.updateInspector(tower);
    }

    deselectTower() {
        this.selectedTower = null;
        this.ui.updateInspector(null);
    }

    buildTower(col, row, typeId) {
        const { TOWER_TYPES, Tower, Particle, FloatingText, WAVES, audio } = window.GameApp;
        const typeConfig = TOWER_TYPES[typeId];
        this.credits -= typeConfig.cost;

        const tower = new Tower(col, row, typeId);
        this.map.setTower(col, row, tower);
        this.towers.push(tower);

        audio.playBuild();
        this.ui.log(`📦 Deployed [${tower.name}] at [${col}, ${row}]`, 'info');
        this.floatingTexts.push(new FloatingText(tower.x, tower.y - 20, `-$${typeConfig.cost}`, '#f43f5e', 13));

        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(tower.x, tower.y, tower.color, 'spark', 2));
        }

        this.ui.updateHUD(this.sla, this.credits, this.waveIndex, WAVES.length, this.enemies.length);
    }

    upgradeSelectedTower() {
        if (!this.selectedTower) return;
        const cost = this.selectedTower.getUpgradeCost();
        const { Particle, FloatingText, WAVES, audio } = window.GameApp;

        if (this.credits >= cost) {
            this.credits -= cost;
            this.selectedTower.upgrade();
            audio.playBuild();
            this.ui.log(`▲ Upgraded [${this.selectedTower.name}] to Level ${this.selectedTower.level}!`, 'success');
            this.floatingTexts.push(new FloatingText(this.selectedTower.x, this.selectedTower.y - 20, `LV.${this.selectedTower.level} UP!`, '#facc15', 13));

            for (let i = 0; i < 12; i++) {
                this.particles.push(new Particle(this.selectedTower.x, this.selectedTower.y, '#facc15', 'circle', 2.5));
            }

            this.ui.updateInspector(this.selectedTower);
            this.ui.updateHUD(this.sla, this.credits, this.waveIndex, WAVES.length, this.enemies.length);
        } else {
            this.ui.log('❌ Not enough credits to upgrade module.', 'warn');
            audio.playAlarm();
        }
    }

    sellSelectedTower() {
        if (!this.selectedTower) return;
        const refund = this.selectedTower.getSellValue();
        const { FloatingText, WAVES, audio } = window.GameApp;

        this.credits += refund;
        this.map.removeTower(this.selectedTower.col, this.selectedTower.row);
        this.towers = this.towers.filter(t => t !== this.selectedTower);

        audio.playClick();
        this.ui.log(`♻ Refactored [${this.selectedTower.name}], recovered +$${refund} compute credits.`, 'info');
        this.floatingTexts.push(new FloatingText(this.selectedTower.x, this.selectedTower.y - 15, `+$${refund}`, '#22c55e', 13));

        this.deselectTower();
        this.ui.updateHUD(this.sla, this.credits, this.waveIndex, WAVES.length, this.enemies.length);
    }

    startNextWave() {
        const WAVES = window.GameApp.WAVES;
        if (this.waveIndex >= WAVES.length) {
            this.triggerVictory();
            return;
        }

        const waveConfig = WAVES[this.waveIndex];
        this.waveInProgress = true;
        this.state = 'RUNNING';

        this.spawnQueue = [];
        waveConfig.enemies.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    interval: group.interval
                });
            }
        });

        this.ui.log(`🚀 [STARTED] ${waveConfig.title}`, 'warn');
        this.ui.log(`ℹ ${waveConfig.desc}`, 'info');
    }

    activateSkill(skillId) {
        if (this.skillCooldowns[skillId] > 0) {
            this.ui.log(`⏳ Skill [${skillId}] is on cooldown.`, 'warn');
            return;
        }

        const { SKILLS, Particle, FloatingText, audio } = window.GameApp;
        const skill = SKILLS[skillId];
        if (!skill) return;

        audio.playSkill();
        this.skillCooldowns[skillId] = skill.cooldown;

        if (skillId === 'revert') {
            let count = 0;
            this.enemies.forEach(e => {
                if (!e.dead && !e.reachedEnd) {
                    e.rollback(160);
                    count++;
                    for (let i = 0; i < 6; i++) {
                        this.particles.push(new Particle(e.x, e.y, '#38bdf8', 'circle', 2));
                    }
                }
            });
            this.ui.log(`⏪ git revert executed! Rolled back ${count} bugs on pipeline.`, 'success');
            this.floatingTexts.push(new FloatingText(500, 300, 'GIT REVERT ROLLBACK!', '#38bdf8', 18));
        } else if (skillId === 'hotfix') {
            let count = 0;
            this.enemies.forEach(e => {
                if (!e.dead && !e.reachedEnd) {
                    e.takeDamage(skill.damage);
                    count++;
                    for (let i = 0; i < 10; i++) {
                        this.particles.push(new Particle(e.x, e.y, '#fb7185', 'spark', 3));
                    }
                }
            });
            this.ui.log(`⚡ Hotfix deployed! Struck ${count} active bugs with ${skill.damage} damage.`, 'success');
            this.floatingTexts.push(new FloatingText(500, 300, 'HOTFIX 160 DMG ALL!', '#fb7185', 18));
        } else if (skillId === 'bluegreen') {
            this.invulnerableTimer = skill.duration;
            this.ui.log(`🔄 Blue/Green failover active! Production cluster immune for 6s.`, 'success');
            this.floatingTexts.push(new FloatingText(940, 370, 'SHIELD ACTIVE (6s)', '#38bdf8', 14));
        }
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    loop(currentTime) {
        const rawDt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        const dt = Math.min(rawDt, 0.1) * (this.isPaused ? 0 : this.gameSpeed);

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        if (dt <= 0) return;

        const { Enemy, Particle, FloatingText, WAVES, audio } = window.GameApp;

        this.map.update(dt);

        for (const key of Object.keys(this.skillCooldowns)) {
            if (this.skillCooldowns[key] > 0) {
                this.skillCooldowns[key] -= dt;
                if (this.skillCooldowns[key] < 0) this.skillCooldowns[key] = 0;
            }
        }

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer < 0) this.invulnerableTimer = 0;
        }

        if (this.waveInProgress && this.spawnQueue.length > 0) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                const nextEnemy = this.spawnQueue.shift();
                const multiplier = 1.0 + this.waveIndex * 0.18;
                const enemy = new Enemy(nextEnemy.type, this.map, multiplier);
                this.enemies.push(enemy);

                if (enemy.isBoss) {
                    audio.playAlarm();
                    this.ui.log(`🚨 BOSS DETECTED: [${enemy.name}]! All defenses focus fire!`, 'critical');
                    this.floatingTexts.push(new FloatingText(30, 90, 'BOSS ARRIVED!', '#ef4444', 16));
                }

                this.spawnTimer = nextEnemy.interval;
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.map);

            if (enemy.reachedEnd) {
                if (this.invulnerableTimer <= 0) {
                    this.sla -= enemy.slaDamage;
                    audio.playAlarm();
                    this.ui.log(`🚨 Incident! [${enemy.name}] breached production (-${enemy.slaDamage}% SLA)`, 'critical');
                    this.floatingTexts.push(new FloatingText(940, 420 - 30, `-${enemy.slaDamage}% SLA`, '#ef4444', 14));
                } else {
                    this.ui.log(`🛡️ Blue/Green shield absorbed breach from [${enemy.name}]!`, 'info');
                    this.floatingTexts.push(new FloatingText(940, 420 - 30, 'ABSORBED!', '#38bdf8', 14));
                }
                this.enemies.splice(i, 1);
                continue;
            }

            if (enemy.dead) {
                this.credits += enemy.reward;
                audio.playEnemyDestroyed(enemy.isBoss);
                this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 12, `+$${enemy.reward}`, '#22c55e', 12));

                const particleCount = enemy.isBoss ? 35 : 12;
                for (let p = 0; p < particleCount; p++) {
                    this.particles.push(new Particle(enemy.x, enemy.y, enemy.color, 'circle', enemy.isBoss ? 4 : 2.5));
                }

                if (enemy.isBoss) {
                    this.ui.log(`🏆 BOSS DEFEATED: [${enemy.name}] neutralized! +$${enemy.reward}`, 'success');
                }

                this.enemies.splice(i, 1);
            }
        }

        this.towers.forEach(tower => {
            tower.update(dt, this.enemies, this.projectiles);
        });

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt, this.enemies, this.particles, this.floatingTexts);
            if (!proj.active) {
                this.projectiles.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (!p.active) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.update(dt);
            if (!ft.active) {
                this.floatingTexts.splice(i, 1);
            }
        }

        if (this.sla <= 0) {
            this.sla = 0;
            this.triggerGameOver();
            return;
        }

        if (this.waveInProgress && this.spawnQueue.length === 0 && this.enemies.length === 0) {
            this.waveInProgress = false;
            this.waveIndex++;
            audio.playVictory();

            const waveReward = 50 + this.waveIndex * 25;
            this.credits += waveReward;
            this.ui.log(`✅ Wave ${this.waveIndex} cleared! Deployment stable. Bonus: +$${waveReward}`, 'success');

            if (this.waveIndex >= WAVES.length) {
                this.triggerVictory();
            } else {
                this.ui.showModal(
                    `🎉 WAVE ${this.waveIndex} DEPLOYED!`,
                    `<p>All pull requests and bugs in Wave ${this.waveIndex} were resolved.</p>
                     <p><b>Deployment Bonus:</b> +$${waveReward} Compute Credits.</p>
                     <p>Prepare your pipeline for <b>Wave ${this.waveIndex + 1}</b>!</p>`,
                    `START WAVE ${this.waveIndex + 1} ➔`,
                    () => {
                        this.startNextWave();
                    }
                );
            }
        }

        const totalRemaining = this.spawnQueue.length + this.enemies.length;
        this.ui.updateHUD(this.sla, this.credits, this.waveIndex, WAVES.length, totalRemaining);
    }

    triggerGameOver() {
        const { WAVES, audio } = window.GameApp;
        this.state = 'GAME_OVER';
        audio.playDefeat();
        this.ui.log('💥 PRODUCTION DOWN! SLA reached 0.0%. Executive escalation in progress!', 'critical');

        this.ui.showModal(
            '🔥 OUTAGE INCIDENT (SLA 0.0%)',
            `<p>The production cluster crashed due to critical uncaught bugs.</p>
             <p>Reached: <b>Wave ${this.waveIndex + 1} of ${WAVES.length}</b></p>
             <p>Re-architect your test suites and try again!</p>`,
            'RETRY SPRINT ↺',
            () => {
                this.restart();
            }
        );
    }

    triggerVictory() {
        const audio = window.GameApp.audio;
        this.state = 'VICTORY';
        audio.playVictory();
        this.ui.log('🌟 ALL WAVES PASSED! Production is 100% stable. Zero downtime deployment achieved!', 'success');

        this.ui.showModal(
            '🚀 100% ZERO DOWNTIME DEPLOYMENT!',
            `<p>Congratulations SRE Lead! All 7 critical waves including the <b>Friday 17:59 Force Push</b> were intercepted and mitigated.</p>
             <p>Final SLA: <b>${this.sla.toFixed(1)}%</b></p>
             <p>Remaining Budget: <b>$${this.credits}</b></p>
             <p>You survived Friday deployment!</p>`,
            'PLAY AGAIN ↺',
            () => {
                this.restart();
            }
        );
    }

    restart() {
        const { GAME_CONFIG, GameMap } = window.GameApp;
        this.sla = GAME_CONFIG.INITIAL_SLA;
        this.credits = GAME_CONFIG.INITIAL_CREDITS;
        this.waveIndex = 0;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.spawnQueue = [];
        this.waveInProgress = false;
        this.map = new GameMap(this.canvas.width, this.canvas.height);
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.invulnerableTimer = 0;
        this.skillCooldowns = { revert: 0, hotfix: 0, bluegreen: 0 };

        this.ui.updateInspector(null);
        this.ui.log('🔄 Pipeline reset. Starting a clean sprint release.', 'info');
        this.startNextWave();
    }

    draw() {
        this.ctx.fillStyle = '#0a0f1d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.map.draw(this.ctx, this.hoverGrid, this.selectedTowerType);

        if (this.invulnerableTimer > 0) {
            this.ctx.save();
            this.ctx.strokeStyle = '#38bdf8';
            this.ctx.lineWidth = 4;
            this.ctx.shadowColor = '#38bdf8';
            this.ctx.shadowBlur = 16;
            this.ctx.beginPath();
            this.ctx.arc(940, 420, 46, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }

        this.towers.forEach(tower => {
            tower.draw(this.ctx, this.selectedTower === tower);
        });

        this.enemies.forEach(enemy => {
            enemy.draw(this.ctx);
        });

        this.projectiles.forEach(proj => {
            proj.draw(this.ctx);
        });

        this.particles.forEach(p => {
            p.draw(this.ctx);
        });

        this.floatingTexts.forEach(ft => {
            ft.draw(this.ctx);
        });
    }
}

window.GameApp.Game = Game;

window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
