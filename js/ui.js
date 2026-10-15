// UI Controller & HUD Management
window.GameApp = window.GameApp || {};

class UIManager {
    constructor(game) {
        this.game = game;

        this.slaEl = document.getElementById('hud-sla');
        this.slaBarEl = document.getElementById('hud-sla-bar');
        this.creditsEl = document.getElementById('hud-credits');
        this.waveEl = document.getElementById('hud-wave');
        this.enemyCountEl = document.getElementById('hud-enemies');
        this.terminalLogsEl = document.getElementById('terminal-logs');
        this.towerShopEl = document.getElementById('tower-shop');
        this.inspectorPanelEl = document.getElementById('inspector-panel');
        this.skillsContainerEl = document.getElementById('skills-container');

        this.modalEl = document.getElementById('game-modal');
        this.modalTitleEl = document.getElementById('modal-title');
        this.modalBodyEl = document.getElementById('modal-body');
        this.modalBtnEl = document.getElementById('modal-btn');

        this.initShop();
        this.initSkills();
        this.initControls();
    }

    log(message, type = 'info') {
        if (!this.terminalLogsEl) return;
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;

        const d = new Date();
        const timeStr = [d.getHours(), d.getMinutes(), d.getSeconds()]
            .map(n => n.toString().padStart(2, '0'))
            .join(':');

        entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${message}`;
        this.terminalLogsEl.appendChild(entry);
        this.terminalLogsEl.scrollTop = this.terminalLogsEl.scrollHeight;

        while (this.terminalLogsEl.children.length > 35) {
            this.terminalLogsEl.removeChild(this.terminalLogsEl.firstChild);
        }
    }

    initShop() {
        if (!this.towerShopEl) return;
        this.towerShopEl.innerHTML = '';
        const TOWER_TYPES = window.GameApp.TOWER_TYPES;

        Object.values(TOWER_TYPES).forEach((tower, idx) => {
            const btn = document.createElement('button');
            btn.className = 'tower-btn';
            btn.id = `btn-tower-${tower.id}`;
            btn.title = tower.desc;
            btn.innerHTML = `
                <div class="tower-btn-header">
                    <span class="tower-badge" style="background:${tower.color}"></span>
                    <span class="tower-name">${tower.shortName}</span>
                    <span class="tower-cost">$${tower.cost}</span>
                </div>
                <div class="tower-role">${tower.role}</div>
                <div class="tower-shortcut">[Key ${idx + 1}]</div>
            `;

            btn.addEventListener('click', () => {
                window.GameApp.audio.playClick();
                this.game.selectTowerType(tower.id);
            });

            this.towerShopEl.appendChild(btn);
        });
    }

    initSkills() {
        if (!this.skillsContainerEl) return;
        this.skillsContainerEl.innerHTML = '';
        const SKILLS = window.GameApp.SKILLS;

        Object.values(SKILLS).forEach(skill => {
            const btn = document.createElement('button');
            btn.className = 'skill-btn';
            btn.id = `skill-${skill.id}`;
            btn.title = skill.desc;
            btn.innerHTML = `
                <div class="skill-name">
                    <span class="skill-key">[${skill.key}]</span> ${skill.name}
                </div>
                <div class="skill-cd-overlay" id="cd-${skill.id}"></div>
            `;

            btn.addEventListener('click', () => {
                this.game.activateSkill(skill.id);
            });

            this.skillsContainerEl.appendChild(btn);
        });
    }

    initControls() {
        const speedBtns = document.querySelectorAll('.speed-btn');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                window.GameApp.audio.playClick();
                speedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const speed = parseFloat(btn.dataset.speed || '1');
                this.game.setGameSpeed(speed);
            });
        });

        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                window.GameApp.audio.playClick();
                const paused = this.game.togglePause();
                pauseBtn.textContent = paused ? '▶ RESUME' : '⏸ PAUSE';
                pauseBtn.classList.toggle('active', paused);
            });
        }

        const muteBtn = document.getElementById('btn-mute');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = window.GameApp.audio.toggleMute();
                muteBtn.textContent = isMuted ? '🔇 MUTED' : '🔊 SOUND';
                muteBtn.classList.toggle('muted', isMuted);
            });
        }

        if (this.modalBtnEl) {
            this.modalBtnEl.addEventListener('click', () => {
                window.GameApp.audio.playClick();
                this.hideModal();
                if (this.modalAction) {
                    this.modalAction();
                }
            });
        }
    }

    updateHUD(sla, credits, waveIndex, totalWaves, activeEnemies) {
        const safeSla = Math.max(0, sla).toFixed(1);
        if (this.slaEl) this.slaEl.textContent = `${safeSla}%`;
        if (this.slaBarEl) {
            this.slaBarEl.style.width = `${safeSla}%`;
            if (safeSla > 60) {
                this.slaBarEl.className = 'sla-bar sla-healthy';
            } else if (safeSla > 25) {
                this.slaBarEl.className = 'sla-bar sla-warning';
            } else {
                this.slaBarEl.className = 'sla-bar sla-critical';
            }
        }

        if (this.creditsEl) this.creditsEl.textContent = `$${credits}`;
        if (this.waveEl) this.waveEl.textContent = `${waveIndex + 1} / ${totalWaves}`;
        if (this.enemyCountEl) this.enemyCountEl.textContent = activeEnemies;

        const TOWER_TYPES = window.GameApp.TOWER_TYPES;
        Object.values(TOWER_TYPES).forEach(tower => {
            const btn = document.getElementById(`btn-tower-${tower.id}`);
            if (btn) {
                const canAfford = credits >= tower.cost;
                btn.classList.toggle('disabled', !canAfford);
                btn.classList.toggle('selected', this.game.selectedTowerType?.id === tower.id);
            }
        });

        const SKILLS = window.GameApp.SKILLS;
        for (const [id, timer] of Object.entries(this.game.skillCooldowns)) {
            const overlay = document.getElementById(`cd-${id}`);
            const btn = document.getElementById(`skill-${id}`);
            const skill = SKILLS[id];
            if (overlay && skill) {
                if (timer > 0) {
                    const percent = (timer / skill.cooldown) * 100;
                    overlay.style.height = `${percent}%`;
                    overlay.textContent = `${Math.ceil(timer)}s`;
                    btn?.classList.add('on-cooldown');
                } else {
                    overlay.style.height = '0%';
                    overlay.textContent = '';
                    btn?.classList.remove('on-cooldown');
                }
            }
        }
    }

    updateInspector(selectedTower) {
        if (!this.inspectorPanelEl) return;

        if (!selectedTower) {
            this.inspectorPanelEl.innerHTML = `
                <div class="inspector-empty">
                    <span class="icon">🔍</span>
                    <div>Click any deployed module on the pipeline to inspect, upgrade, or refactor.</div>
                </div>
            `;
            return;
        }

        const upgradeCost = selectedTower.getUpgradeCost();
        const sellValue = selectedTower.getSellValue();
        const canAffordUpgrade = this.game.credits >= upgradeCost;

        this.inspectorPanelEl.innerHTML = `
            <div class="inspector-card">
                <div class="inspector-header">
                    <div>
                        <span class="inspector-name" style="color:${selectedTower.color}">${selectedTower.name}</span>
                        <span class="inspector-level">LV.${selectedTower.level}</span>
                    </div>
                    <button class="close-inspector-btn" id="btn-close-inspector">✕</button>
                </div>
                <div class="inspector-stats">
                    <div class="stat-row"><span>Damage:</span> <b>${selectedTower.damage}</b></div>
                    <div class="stat-row"><span>Range:</span> <b>${selectedTower.range}px</b></div>
                    <div class="stat-row"><span>Fire Rate:</span> <b>${selectedTower.fireRate}/s</b></div>
                    <div class="stat-row"><span>Bugs Resolved:</span> <b>${selectedTower.kills}</b></div>
                    <div class="stat-row"><span>Total Output:</span> <b>${selectedTower.totalDamageDealt} dmg</b></div>
                </div>
                <div class="inspector-actions">
                    <button class="upgrade-btn ${canAffordUpgrade ? '' : 'disabled'}" id="btn-upgrade-tower">
                        ▲ UPGRADE ($${upgradeCost})
                    </button>
                    <button class="sell-btn" id="btn-sell-tower">
                        ♻ REFACTOR (+$${sellValue})
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
            window.GameApp.audio.playClick();
            this.game.deselectTower();
        });

        document.getElementById('btn-upgrade-tower')?.addEventListener('click', () => {
            if (canAffordUpgrade) {
                this.game.upgradeSelectedTower();
            }
        });

        document.getElementById('btn-sell-tower')?.addEventListener('click', () => {
            this.game.sellSelectedTower();
        });
    }

    showModal(title, bodyHtml, btnText, onAction) {
        if (!this.modalEl) return;
        this.modalTitleEl.innerHTML = title;
        this.modalBodyEl.innerHTML = bodyHtml;
        this.modalBtnEl.textContent = btnText;
        this.modalAction = onAction;
        this.modalEl.classList.remove('hidden');
    }

    hideModal() {
        if (!this.modalEl) return;
        this.modalEl.classList.add('hidden');
    }
}

window.GameApp.UIManager = UIManager;
