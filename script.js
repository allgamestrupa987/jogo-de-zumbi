// Configurações e Elementos Globais
const container = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');
const background = document.getElementById('game-background');

const hud = {
    health: document.getElementById('health-bar'),
    weapon: document.getElementById('current-weapon'),
    level: document.getElementById('current-level'),
    score: document.getElementById('current-score'),
    ammo: document.getElementById('current-ammo')
};

const pauseModal = document.getElementById('pause-modal');
const gameOverModal = document.getElementById('game-over-modal');
const winModal = document.getElementById('win-modal');

// Estados do Jogo
let isPaused = false;
let gameOver = false;
let gameWon = false;
let gameScore = 0;
let currentLevel = 1;
let backgroundOffset = 0;

// Configuração dos Níveis
const LEVEL_MAPS = [
    { zombies: 6, bgSpeed: 1 },
    { zombies: 12, bgSpeed: 1.5 },
    { zombies: 18, bgSpeed: 2 },
    { zombies: 24, bgSpeed: 2.5 },
    { zombies: 0, boss: true } // Fase 5: Chefe
];

// Configuração das Armas
const WEAPONS = {
    'Pistola': { ammo: 12, maxAmmo: 12, reserveAmmo: 60, damage: 25, fireRate: 300, speed: 14, classHeld: 'pistol-held' },
    'AK47': { ammo: 30, maxAmmo: 30, reserveAmmo: 120, damage: 18, fireRate: 100, speed: 16, classHeld: 'ak47-held' }
};

let currentWeaponName = 'Pistola';
let activeWeapon = { ...WEAPONS[currentWeaponName] };
let canFire = true;
let isReloading = false;

// Posição do Mouse
let mousePos = { x: 0, y: 0 };

// Jogador
let player = {
    x: 100,
    y: container.offsetHeight / 2,
    width: 36,
    height: 64,
    speed: 5,
    health: 100,
    element: null,
    weaponElement: null
};

// Coleções de Entidades
let zombies = [];
let bullets = [];
let boss = null;
let bossProjectiles = [];

// Teclas Pressionadas
const keys = {};

// Inicialização
function init() {
    createPlayer();
    loadLevel(currentLevel);
    setupInputs();
    updateHUD();
    requestAnimationFrame(gameLoop);
}

// Criação do Personagem (Corpo completo: 2 pernas, 2 braços, 1 cabeça)
function createPlayer() {
    player.element = document.createElement('div');
    player.element.className = 'player';

    const head = document.createElement('div');
    head.className = 'player-head';

    const body = document.createElement('div');
    body.className = 'player-body';

    const armLeft = document.createElement('div');
    armLeft.className = 'player-arm left';

    const armRight = document.createElement('div');
    armRight.className = 'player-arm right';

    const legLeft = document.createElement('div');
    legLeft.className = 'player-leg left';

    const legRight = document.createElement('div');
    legRight.className = 'player-leg right';

    player.weaponElement = document.createElement('div');
    player.weaponElement.className = `weapon ${activeWeapon.classHeld}`;

    player.element.appendChild(head);
    player.element.appendChild(body);
    player.element.appendChild(armLeft);
    player.element.appendChild(armRight);
    player.element.appendChild(legLeft);
    player.element.appendChild(legRight);
    player.element.appendChild(player.weaponElement);

    canvas.appendChild(player.element);
}

// Carregar Fase
function loadLevel(level) {
    clearZombies();
    const map = LEVEL_MAPS[level - 1];

    if (map.boss) {
        createBoss();
    } else {
        boss = null;
        for (let i = 0; i < map.zombies; i++) {
            spawnZombie();
        }
    }
}

// Configuração dos Controles de PC
function setupInputs() {
    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;

        if (e.key.toLowerCase() === 'r') reloadWeapon();
        if (e.key.toLowerCase() === 'q') swapWeapon();
        if (e.key.toLowerCase() === 'p') togglePause();
    });

    window.addEventListener('keyup', e => {
        keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousemove', e => {
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;
    });

    window.addEventListener('mousedown', e => {
        if (e.button === 0) keys['click'] = true;
    });

    window.addEventListener('mouseup', e => {
        if (e.button === 0) keys['click'] = false;
    });
}

// Loop Principal
function gameLoop() {
    if (!isPaused && !gameOver && !gameWon) {
        updatePlayer();
        updateBullets();
        updateZombies();
        if (boss) updateBoss();
        checkCollisions();
        updateBackground();
        updateHUD();
    }
    requestAnimationFrame(gameLoop);
}

// Atualizar Movimento e Mira do Jogador
function updatePlayer() {
    let vx = 0;
    let vy = 0;

    if (keys['w'] || keys['arrowup']) vy -= 1;
    if (keys['s'] || keys['arrowdown']) vy += 1;
    if (keys['a'] || keys['arrowleft']) vx -= 1;
    if (keys['d'] || keys['arrowright']) vx += 1;

    // Normalização para movimento diagonal uniforme
    if (vx !== 0 && vy !== 0) {
        vx *= 0.7071;
        vy *= 0.7071;
    }

    player.x = Math.max(0, Math.min(container.offsetWidth - player.width, player.x + vx * player.speed));
    player.y = Math.max(80, Math.min(container.offsetHeight - player.height, player.y + vy * player.speed));

    player.element.style.left = `${player.x}px`;
    player.element.style.top = `${player.y}px`;

    // Rotacionar Arma em Direção ao Mouse
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const angle = Math.atan2(mousePos.y - playerCenterY, mousePos.x - playerCenterX);
    player.weaponElement.style.transform = `rotate(${angle}rad)`;

    // Disparo contínuo ou simples
    if (keys['click'] && canFire && !isReloading) {
        fireBullet(angle);
    }
}

// Disparo de Projétil
function fireBullet(angle) {
    if (activeWeapon.ammo <= 0) {
        reloadWeapon();
        return;
    }

    canFire = false;
    activeWeapon.ammo--;

    const bulletEl = document.createElement('div');
    bulletEl.className = 'bullet';
    canvas.appendChild(bulletEl);

    const startX = player.x + player.width / 2;
    const startY = player.y + 26;

    bullets.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * activeWeapon.speed,
        vy: Math.sin(angle) * activeWeapon.speed,
        damage: activeWeapon.damage,
        element: bulletEl
    });

    setTimeout(() => { canFire = true; }, activeWeapon.fireRate);
}

// Atualizar Projéteis do Jogador e do Chefe
function updateBullets() {
    bullets.forEach((b, index) => {
        b.x += b.vx;
        b.y += b.vy;
        b.element.style.left = `${b.x}px`;
        b.element.style.top = `${b.y}px`;

        if (b.x < 0 || b.x > container.offsetWidth || b.y < 0 || b.y > container.offsetHeight) {
            b.element.remove();
            bullets.splice(index, 1);
        }
    });

    bossProjectiles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.element.style.left = `${p.x}px`;
        p.element.style.top = `${p.y}px`;

        if (p.x < 0 || p.x > container.offsetWidth || p.y < 0 || p.y > container.offsetHeight) {
            p.element.remove();
            bossProjectiles.splice(index, 1);
        }
    });
}

// Gerar Zumbi
function spawnZombie() {
    const zEl = document.createElement('div');
    zEl.className = 'zombie';
    canvas.appendChild(zEl);

    const spawnX = container.offsetWidth + Math.random() * 300;
    const spawnY = 80 + Math.random() * (container.offsetHeight - 150);

    zombies.push({
        x: spawnX,
        y: spawnY,
        width: 36,
        height: 64,
        health: 50,
        speed: 1 + Math.random() * 1.5,
        element: zEl
    });
}

// Atualizar Zumbis
function updateZombies() {
    zombies.forEach((z) => {
        const dx = player.x - z.x;
        const dy = player.y - z.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            z.x += (dx / dist) * z.speed;
            z.y += (dy / dist) * z.speed;
        }

        z.element.style.left = `${z.x}px`;
        z.element.style.top = `${z.y}px`;

        // Dano de Contato no Jogador
        if (checkRectCollision(player, z)) {
            takeDamage(0.2);
        }
    });
}

// Limpar Inimigos da Fase
function clearZombies() {
    zombies.forEach(z => z.element.remove());
    zombies = [];
    bossProjectiles.forEach(p => p.element.remove());
    bossProjectiles = [];
}

// --- CHEFE ZUMBI (Fase 5) ---
function createBoss() {
    const bEl = document.createElement('div');
    bEl.className = 'boss-zombie';
    canvas.appendChild(bEl);

    boss = {
        x: container.offsetWidth - 150,
        y: container.offsetHeight / 2 - 80,
        width: 90,
        height: 160,
        health: 1500,
        maxHealth: 1500,
        element: bEl,
        lastAbilityTime: Date.now(),
        abilityCooldown: 2500
    };
}

function updateBoss() {
    // Movimento do Chefe
    boss.y += Math.sin(Date.now() / 800) * 2;
    boss.element.style.left = `${boss.x}px`;
    boss.element.style.top = `${boss.y}px`;

    // Uso de Habilidades
    const now = Date.now();
    if (now - boss.lastAbilityTime > boss.abilityCooldown) {
        if (Math.random() < 0.5) {
            bossAbilitySummon();
        } else {
            bossAbilityThrowRock();
        }
        boss.lastAbilityTime = now;
    }
}

// Habilidade 1: Invocar Zumbis
function bossAbilitySummon() {
    for (let i = 0; i < 3; i++) {
        spawnZombie();
    }
}

// Habilidade 2: Lançar Bloco de Pedra em Direção ao Jogador
function bossAbilityThrowRock() {
    const rockEl = document.createElement('div');
    rockEl.className = 'rock-projectile';
    canvas.appendChild(rockEl);

    const startX = boss.x;
    const startY = boss.y + boss.height / 2;
    const angle = Math.atan2(player.y - startY, player.x - startX);

    bossProjectiles.push({
        x: startX,
        y: startY,
        width: 45,
        height: 45,
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7,
        damage: 25,
        element: rockEl
    });
}

// Verificação de Colisões
function checkCollisions() {
    // Projéteis do Jogador -> Zumbis
    bullets.forEach((b, bIdx) => {
        zombies.forEach((z, zIdx) => {
            if (checkPointRectCollision(b, z)) {
                z.health -= b.damage;
                b.element.remove();
                bullets.splice(bIdx, 1);

                if (z.health <= 0) {
                    z.element.remove();
                    zombies.splice(zIdx, 1);
                    gameScore += 20;
                    checkLevelProgress();
                }
            }
        });

        // Projéteis -> Chefe
        if (boss && checkPointRectCollision(b, boss)) {
            boss.health -= b.damage;
            b.element.remove();
            bullets.splice(bIdx, 1);

            if (boss.health <= 0) {
                defeatBoss();
            }
        }
    });

    // Projéteis do Chefe -> Jogador
    bossProjectiles.forEach((p, pIdx) => {
        if (checkRectCollision(p, player)) {
            takeDamage(p.damage);
            p.element.remove();
            bossProjectiles.splice(pIdx, 1);
        }
    });
}

function checkLevelProgress() {
    if (boss) return;

    if (zombies.length === 0 && currentLevel < 5) {
        currentLevel++;
        loadLevel(currentLevel);
    }
}

function defeatBoss() {
    gameWon = true;
    boss.element.remove();
    winModal.classList.remove('hidden');
}

function takeDamage(amount) {
    player.health -= amount;
    if (player.health <= 0 && !gameOver) {
        gameOver = true;
        document.getElementById('final-level').innerText = currentLevel;
        gameOverModal.classList.remove('hidden');
    }
}

// Rolagem de Fundo Parallax
function updateBackground() {
    const map = LEVEL_MAPS[currentLevel - 1];
    if (!boss && player.x > container.offsetWidth * 0.4) {
        backgroundOffset -= map.bgSpeed;
        background.style.transform = `translateX(${backgroundOffset}px)`;
        zombies.forEach(z => z.x -= map.bgSpeed);
    }
}

// Mecânica de Troca de Armas (Pistola / AK47)
function swapWeapon() {
    currentWeaponName = currentWeaponName === 'Pistola' ? 'AK47' : 'Pistola';
    activeWeapon = { ...WEAPONS[currentWeaponName] };
    player.weaponElement.className = `weapon ${activeWeapon.classHeld}`;
    updateHUD();
}

// Recarga de Arma
function reloadWeapon() {
    if (isReloading || activeWeapon.ammo === activeWeapon.maxAmmo) return;

    isReloading = true;
    hud.weapon.innerText = 'Recarregando...';

    setTimeout(() => {
        activeWeapon.ammo = activeWeapon.maxAmmo;
        isReloading = false;
        updateHUD();
    }, currentWeaponName === 'AK47' ? 1400 : 900);
}

// Utilitários de Colisão
function checkRectCollision(r1, r2) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
}

function checkPointRectCollision(pt, r) {
    return pt.x >= r.x && pt.x <= r.x + r.width &&
           pt.y >= r.y && pt.y <= r.y + r.height;
}

// Atualizar Interface
function updateHUD() {
    hud.health.style.width = `${Math.max(0, player.health)}%`;
    hud.weapon.innerText = isReloading ? 'Recarregando...' : currentWeaponName;
    hud.level.innerText = `${currentLevel}/5${LEVEL_MAPS[currentLevel - 1].boss ? ' (CHEFE)' : ''}`;
    hud.score.innerText = gameScore;
    hud.ammo.innerText = `${activeWeapon.ammo}/${activeWeapon.maxAmmo}`;
}

function togglePause() {
    isPaused = !isPaused;
    pauseModal.classList.toggle('hidden');
}

function restartGame() {
    location.reload();
}

// Iniciar Jogo
init();