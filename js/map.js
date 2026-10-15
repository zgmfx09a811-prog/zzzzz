// Map & Pipeline Grid System
window.GameApp = window.GameApp || {};

class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cellSize = 40;
        this.cols = Math.floor(width / this.cellSize);
        this.rows = Math.floor(height / this.cellSize);

        // Git-flow Pipeline Path Waypoints
        this.waypoints = [
            { x: 30,  y: 120, label: 'git push' },
            { x: 200, y: 120, label: 'commit' },
            { x: 200, y: 460, label: 'PR #42' },
            { x: 460, y: 460, label: 'CI Runner' },
            { x: 460, y: 160, label: 'merge main' },
            { x: 720, y: 160, label: 'staging env' },
            { x: 720, y: 420, label: 'prod gateway' },
            { x: 960, y: 420, label: 'PRODUCTION' }
        ];

        // Pipeline Milestone stations along the path
        this.milestones = [
            { x: 30,  y: 120, tag: 'DEV WORKSPACE', sub: 'git push origin feature' },
            { x: 200, y: 460, tag: 'PULL REQUEST', sub: 'Code Review & Approvals' },
            { x: 460, y: 160, tag: 'CI/CD RUNNER', sub: 'GitHub Actions Matrix' },
            { x: 720, y: 160, tag: 'STAGING CLUSTER', sub: 'Pre-flight Smoke Test' },
            { x: 960, y: 420, tag: 'PROD REGION', sub: 'Live Kubernetes Cluster' }
        ];

        // Cache total path length and segment vectors
        this.totalDistance = 0;
        this.segments = [];
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const p1 = this.waypoints[i];
            const p2 = this.waypoints[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy);
            this.segments.push({ p1, p2, dx, dy, length: len, startDist: this.totalDistance });
            this.totalDistance += len;
        }

        // Initialize grid cells: 0 = buildable, 1 = road/blocked
        this.grid = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
        this.markRoadCells();

        // Pulsing animation offset for path energy
        this.pulseOffset = 0;
    }

    markRoadCells() {
        const roadBuffer = 32;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cellCenterX = c * this.cellSize + this.cellSize / 2;
                const cellCenterY = r * this.cellSize + this.cellSize / 2;

                let onPath = false;
                for (const seg of this.segments) {
                    if (this.distanceToSegment(cellCenterX, cellCenterY, seg.p1, seg.p2) < roadBuffer) {
                        onPath = true;
                        break;
                    }
                }

                if (cellCenterX > 910 && cellCenterY > 370) {
                    onPath = true;
                }
                if (cellCenterX < 60 && cellCenterY < 150) {
                    onPath = true;
                }

                if (onPath) {
                    this.grid[r][c] = 1;
                }
            }
        }
    }

    distanceToSegment(px, py, v, w) {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.hypot(px - v.x, py - v.y);
        let t = ((px - v.x) * (w.x - v.x) + (py - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = v.x + t * (w.x - v.x);
        const projY = v.y + t * (w.y - v.y);
        return Math.hypot(px - projX, py - projY);
    }

    getPositionAtDistance(distance) {
        if (distance <= 0) return { x: this.waypoints[0].x, y: this.waypoints[0].y, angle: 0 };
        if (distance >= this.totalDistance) {
            const last = this.waypoints[this.waypoints.length - 1];
            return { x: last.x, y: last.y, angle: 0 };
        }

        for (const seg of this.segments) {
            if (distance >= seg.startDist && distance <= seg.startDist + seg.length) {
                const subDist = distance - seg.startDist;
                const t = subDist / seg.length;
                const x = seg.p1.x + seg.dx * t;
                const y = seg.p1.y + seg.dy * t;
                const angle = Math.atan2(seg.dy, seg.dx);
                return { x, y, angle };
            }
        }
        return { x: this.waypoints[0].x, y: this.waypoints[0].y, angle: 0 };
    }

    isBuildable(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return this.grid[row][col] === 0;
    }

    setTower(col, row, towerInstance) {
        if (this.isBuildable(col, row)) {
            this.grid[row][col] = towerInstance;
            return true;
        }
        return false;
    }

    removeTower(col, row) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            if (typeof this.grid[row][col] === 'object') {
                this.grid[row][col] = 0;
            }
        }
    }

    getTowerAt(col, row) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const cell = this.grid[row][col];
            return typeof cell === 'object' ? cell : null;
        }
        return null;
    }

    worldToGrid(x, y) {
        return {
            col: Math.floor(x / this.cellSize),
            row: Math.floor(y / this.cellSize)
        };
    }

    gridToWorld(col, row) {
        return {
            x: col * this.cellSize + this.cellSize / 2,
            y: row * this.cellSize + this.cellSize / 2
        };
    }

    update(dt) {
        this.pulseOffset = (this.pulseOffset + dt * 45) % 60;
    }

    draw(ctx, hoverGrid = null, selectedTowerType = null) {
        ctx.save();
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.lineWidth = 1;
        for (let c = 0; c <= this.cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * this.cellSize, 0);
            ctx.lineTo(c * this.cellSize, this.height);
            ctx.stroke();
        }
        for (let r = 0; r <= this.rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * this.cellSize);
            ctx.lineTo(this.width, r * this.cellSize);
            ctx.stroke();
        }

        // Draw Pipeline Path Outer glow track
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 36;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
        for (let i = 1; i < this.waypoints.length; i++) {
            ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
        }
        ctx.stroke();

        // Inner cable conduit
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 26;
        ctx.stroke();

        // High-tech pipeline border
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animated glowing data packet pulses along the cable
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 24]);
        ctx.lineDashOffset = -this.pulseOffset;
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Station Badges & Waypoints
        for (let i = 0; i < this.waypoints.length; i++) {
            const wp = this.waypoints[i];
            ctx.fillStyle = '#0369a1';
            ctx.beginPath();
            ctx.arc(wp.x, wp.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Milestone Labels
        for (const ms of this.milestones) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1;
            
            const isProd = ms.tag === 'PROD REGION';
            const badgeW = isProd ? 130 : 110;
            const badgeH = 34;
            const bx = Math.min(this.width - badgeW - 8, Math.max(8, ms.x - badgeW / 2));
            const by = ms.y - (isProd ? 55 : 44);

            ctx.fillRect(bx, by, badgeW, badgeH);
            ctx.strokeRect(bx, by, badgeW, badgeH);

            ctx.fillStyle = isProd ? '#f43f5e' : '#38bdf8';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ms.tag, bx + badgeW / 2, by + 13);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '8px monospace';
            ctx.fillText(ms.sub, bx + badgeW / 2, by + 26);
        }

        // Target: Production Server Core Visual
        const prodX = 940;
        const prodY = 420;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.beginPath();
        ctx.arc(prodX, prodY, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('💻', prodX, prodY - 2);
        ctx.font = 'bold 9px monospace';
        ctx.fillText('PROD CORE', prodX, prodY + 16);

        // Hover Highlight when placing tower
        if (hoverGrid && selectedTowerType) {
            const { col, row } = hoverGrid;
            const valid = this.isBuildable(col, row);
            const gx = col * this.cellSize;
            const gy = row * this.cellSize;
            const cx = gx + this.cellSize / 2;
            const cy = gy + this.cellSize / 2;

            ctx.fillStyle = valid ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.35)';
            ctx.fillRect(gx, gy, this.cellSize, this.cellSize);
            ctx.strokeStyle = valid ? '#22c55e' : '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(gx, gy, this.cellSize, this.cellSize);

            if (valid) {
                ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
                ctx.beginPath();
                ctx.arc(cx, cy, selectedTowerType.range, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        ctx.restore();
    }
}

window.GameApp.GameMap = GameMap;
