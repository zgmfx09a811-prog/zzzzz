// Game Configuration & Balance Definitions
window.GameApp = window.GameApp || {};

window.GameApp.GAME_CONFIG = {
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 600,
    INITIAL_CREDITS: 250,
    INITIAL_SLA: 100.0,
    SELL_REFUND_RATIO: 0.7,
};

window.GameApp.TOWER_TYPES = {
    linter: {
        id: 'linter',
        name: 'Linter / Prettier',
        shortName: 'LINT',
        role: 'Fast Typo Cleaner',
        cost: 60,
        range: 120,
        fireRate: 4.5,
        damage: 12,
        bulletSpeed: 500,
        color: '#a855f7',
        bulletColor: '#c084fc',
        type: 'projectile',
        upgradeCostMultiplier: 1.5,
        desc: 'Rapid fire, low damage. Cleans up typos and small syntax issues with extreme speed.'
    },
    unit: {
        id: 'unit',
        name: 'Unit Tester (Jest)',
        shortName: 'UNIT',
        role: 'Standard DPS',
        cost: 100,
        range: 155,
        fireRate: 2.0,
        damage: 32,
        bulletSpeed: 420,
        color: '#22c55e',
        bulletColor: '#4ade80',
        type: 'projectile',
        upgradeCostMultiplier: 1.6,
        desc: 'Solid balanced single-target attacker. Fires green checkmark assertions at incoming bugs.'
    },
    e2e: {
        id: 'e2e',
        name: 'E2E Test (Playwright)',
        shortName: 'E2E',
        role: 'AoE Splash Mortar',
        cost: 180,
        range: 200,
        fireRate: 0.8,
        damage: 65,
        splashRadius: 75,
        bulletSpeed: 280,
        color: '#06b6d4',
        bulletColor: '#22d3ee',
        type: 'splash',
        upgradeCostMultiplier: 1.7,
        desc: 'Launches isolated container pods that detonate on impact, dealing AoE splash damage to clusters.'
    },
    reviewer: {
        id: 'reviewer',
        name: 'Senior Reviewer',
        shortName: 'REVW',
        role: 'Slow & Debuff',
        cost: 120,
        range: 140,
        fireRate: 1.5,
        damage: 10,
        slowFactor: 0.45,
        slowDuration: 2.0,
        bulletSpeed: 600,
        color: '#eab308',
        bulletColor: '#facc15',
        type: 'beam',
        upgradeCostMultiplier: 1.55,
        desc: 'Emits a thorough code review beam. Deals light damage and heavily slows down enemy movement.'
    },
    waf: {
        id: 'waf',
        name: 'WAF & Security Scan',
        shortName: 'WAF',
        role: 'High Damage Anti-Boss',
        cost: 220,
        range: 170,
        fireRate: 1.0,
        damage: 120,
        bulletSpeed: 650,
        color: '#f43f5e',
        bulletColor: '#fb7185',
        type: 'pierce',
        upgradeCostMultiplier: 1.8,
        desc: 'Security scanner targeting critical threats. Deals massive damage, crushing heavy bugs and bosses.'
    }
};

window.GameApp.ENEMY_TYPES = {
    typo: {
        id: 'typo',
        name: 'Typo in Variable',
        hp: 35,
        speed: 95,
        reward: 10,
        slaDamage: 2.5,
        color: '#94a3b8',
        size: 11,
        symbol: ';'
    },
    syntax: {
        id: 'syntax',
        name: 'SyntaxError: Unexpected token',
        hp: 60,
        speed: 80,
        reward: 15,
        slaDamage: 4.0,
        color: '#f97316',
        size: 13,
        symbol: '{ }'
    },
    nullPointer: {
        id: 'nullPointer',
        name: 'Cannot read properties of undefined',
        hp: 90,
        speed: 140,
        reward: 22,
        slaDamage: 6.0,
        color: '#e11d48',
        size: 12,
        symbol: 'null'
    },
    memoryLeak: {
        id: 'memoryLeak',
        name: 'Zombie Process / Memory Leak',
        hp: 340,
        speed: 50,
        reward: 45,
        slaDamage: 12.0,
        color: '#10b981',
        size: 18,
        symbol: 'RAM'
    },
    raceCondition: {
        id: 'raceCondition',
        name: 'Race Condition (Blink)',
        hp: 150,
        speed: 100,
        reward: 35,
        slaDamage: 8.0,
        color: '#8b5cf6',
        size: 14,
        canBlink: true,
        blinkCooldown: 3.5,
        symbol: '⇄'
    },
    ddos: {
        id: 'ddos',
        name: 'SYN Flood / Query Storm',
        hp: 55,
        speed: 110,
        reward: 12,
        slaDamage: 3.5,
        color: '#ec4899',
        size: 10,
        symbol: 'REQ'
    },
    bossForcePush: {
        id: 'bossForcePush',
        name: '🚨 Friday 17:59: git push --force --no-verify',
        hp: 1600,
        speed: 40,
        reward: 250,
        slaDamage: 40.0,
        color: '#ef4444',
        size: 26,
        isBoss: true,
        shield: 500,
        maxShield: 500,
        symbol: 'FORCE'
    }
};

window.GameApp.WAVES = [
    {
        title: "Wave 1: Morning Standup Commits",
        desc: "Junior devs pushing typo fixes and missing semicolons.",
        enemies: [
            { type: 'typo', count: 8, interval: 1.2 }
        ]
    },
    {
        title: "Wave 2: Syntax Havoc",
        desc: "Mismatched braces and unexpected tokens breaking the AST.",
        enemies: [
            { type: 'typo', count: 6, interval: 0.9 },
            { type: 'syntax', count: 5, interval: 1.3 }
        ]
    },
    {
        title: "Wave 3: The Null Outbreak",
        desc: "Fast-moving 'undefined is not a function' rushing straight for production!",
        enemies: [
            { type: 'typo', count: 8, interval: 0.6 },
            { type: 'nullPointer', count: 7, interval: 1.1 }
        ]
    },
    {
        title: "Wave 4: Memory Bloat & Zombies",
        desc: "Heavy unclosed database connections consuming all server heap.",
        enemies: [
            { type: 'syntax', count: 6, interval: 0.8 },
            { type: 'memoryLeak', count: 3, interval: 2.4 },
            { type: 'nullPointer', count: 5, interval: 1.0 }
        ]
    },
    {
        title: "Wave 5: Asynchronous Nightmare",
        desc: "Race conditions that teleport unexpectedly when unhandled promises reject.",
        enemies: [
            { type: 'raceCondition', count: 6, interval: 1.4 },
            { type: 'memoryLeak', count: 4, interval: 2.0 },
            { type: 'nullPointer', count: 6, interval: 0.8 }
        ]
    },
    {
        title: "Wave 6: Midnight Traffic Spike",
        desc: "A swarm of concurrent requests and SQL injections attacking the pipeline.",
        enemies: [
            { type: 'ddos', count: 20, interval: 0.4 },
            { type: 'raceCondition', count: 4, interval: 1.5 },
            { type: 'memoryLeak', count: 4, interval: 1.8 }
        ]
    },
    {
        title: "Wave 7: 🚨 Friday 17:59 Emergency Force Push",
        desc: "BOSS ARRIVAL: Someone pushed directly to main on a Friday evening!",
        enemies: [
            { type: 'bossForcePush', count: 1, interval: 1.0 },
            { type: 'nullPointer', count: 8, interval: 1.2 },
            { type: 'raceCondition', count: 5, interval: 1.8 }
        ]
    }
];

window.GameApp.SKILLS = {
    revert: {
        id: 'revert',
        name: 'git revert',
        key: 'R',
        cooldown: 25,
        cost: 0,
        desc: 'Rolls back the pipeline: teleports all active bugs backwards on the path.'
    },
    hotfix: {
        id: 'hotfix',
        name: 'Hotfix Deploy',
        key: 'H',
        cooldown: 40,
        cost: 0,
        damage: 160,
        desc: 'Emergency cloud patch: strikes all active bugs on screen with 160 instant damage.'
    },
    bluegreen: {
        id: 'bluegreen',
        name: 'Blue/Green Failover',
        key: 'B',
        cooldown: 55,
        cost: 0,
        duration: 6.0,
        desc: 'Switches routing to backup cluster: Production is 100% immune to SLA damage for 6 seconds.'
    }
};
