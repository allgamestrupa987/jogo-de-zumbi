// Configurações do Jogo e Elementos
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

// Modais
const pauseModal = document.getElementById('pause-modal');
const gameOverModal = document.getElementById('game-over-modal');
const winModal = document.getElementById('win-modal');

// Variáveis de Estado
let isPaused = false;
let gameOver = false;
let gameWon = false;
let gameScore = 0;
let currentLevel = 1;
let backgroundOffset = 0;

// Configurações da Fase (Até a fase do Chefe)
const LEVEL_MAPS = [
    { zombies: 5, bgScrollSpeed: 1 }, // Fase 1: Introdução
    { zombies: 10, bgScrollSpeed: 1.5 }, // Fase 2: Mais rápidos
    { zombies: 15, bgScrollSpeed: 2 }, // Fase 3: Horda pequena
    { zombies: 20, bgScrollSpeed: 2.5 }, // Fase 4: Preparação
    { zombies: 0, boss: true } // Fase 5: O Grande Chefe
];

// Configurações das Armas
const weapons = {
    'Pistola': { ammo: 12, maxAmmo: 30, damage: 20, fireRate: 400, speed: 10, classHeld: 'pistol-held' },
    'AK47': { ammo: 30, maxAmmo: 90, damage: 15, fireRate: 100, speed: 12, classHeld: 'ak47-held' }
};

let currentWeaponName = 'Pistola';
let playerWeapon = weapons[currentWeaponName];
let canFire = true;
let isReloading = false;

// Entidades (Objetos)
let player = {
    x: 100, y: container.offsetHeight / 2 - 35,
    width: 40, height: 70, health: 100, speed: 5,
    element: null, weaponElement: null
};

let zombies = [];
let projectiles = [];
let boss = null;
let bossProjectiles = [];

// Controles (Teclado e Toque)
let keys = {};
let joystickVector = { x: 0, y: 0 };
let isFiring = false;

// Inicialização
function init() {
    createPlayer();
    loadLevel(currentLevel);
    addEventListeners();
    updateHUD();
    requestAnimationFrame(gameLoop);
}

// Criar o Personagem Jogador (Baseado na descrição)
function createPlayer() {
    player.element = document.createElement('div');
    player.element.className = 'player';
    
    // Braço segurando arma
    player.weaponElement = document.createElement('div');
    player.weaponElement.className = `weapon ${playerWeapon.classHeld}`;
    player.element.appendChild(playerWeapon.classHeld);

    // Cabeça
    let head = document.createElement('div');
    head.className = 'player-head';
    head.style.width = '20px'; head.style.height = '20px'; head.style.background = '#ffd700'; head.style.position = 'absolute'; head.style.top = '-20px'; head.style.left = '10px'; head.style.borderRadius = '50%'; head.style.border='2px solid white';
    player.element.appendChild(head);

    canvas.appendChild(player.element);
}

// Carregar o Nível
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

// Loop Principal do Jogo
function gameLoop() {
    if (isPaused || gameOver || gameWon) return;

    handleInput();
    updateProjectiles();
    updateZombies();
    if (boss) updateBoss();
    updateBackground();
    checkCollisions();
    updateHUD();

    requestAnimationFrame(gameLoop);
}

// Entrada de Controles (Teclado)
function addEventListeners() {
    window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('mousedown', () => isFiring = true );
    window.addEventListener('mouseup', () => isFiring = false );

    // Controles de Toque (Simplificados)
    document.getElementById('btn-fire').addEventListener('touchstart', () => isFiring = true );
    document.getElementById('btn-fire').addEventListener('touchend', () => isFiring = false );
    document.getElementById('btn-reload').addEventListener('touchstart', reloadWeapon);
    document.getElementById('btn-weapon-swap').addEventListener('touchstart', swapWeapon);
    
    // Joystick Virtual (Esboço rápido)
    const knob = document.getElementById('joystick-knob');
    let joystickOrigin = null;

    document.getElementById('joystick').addEventListener('touchstart', e => {
        joystickOrigin = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    
    document.getElementById('joystick').addEventListener('touchmove', e => {
        if (!joystickOrigin) return;
        let dx = e.touches[0].clientX - joystickOrigin.x;
        let dy = e.touches[0].clientY - joystickOrigin.y;
        let dist = Math.min(50, Math.sqrt(dx*dx + dy*dy));
        let angle = Math.atan2(dy, dx);
        
        knob.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
        joystickVector = { x: Math.cos(angle)*(dist/50), y: Math.sin(angle)*(dist/50) };
    });

    document.getElementById('joystick').addEventListener('touchend', () => {
        knob.style.transform = 'translate(0, 0)';
        joystickVector = { x: 0, y: 0 };
        joystickOrigin = null;
    });

    document.getElementById('pause-btn').addEventListener('click', togglePause);
}

// Tratar Entrada e Mover Jogador
function handleInput() {
    // Mover (Teclado e Joystick)
    let vx = (keys['a'] || keys['arrowleft'] ? -1 : 0) + (keys['d'] || keys['arrowright'] ? 1 : 0) + joystickVector.x;
    let vy = (keys['w'] || keys['arrowup'] ? -1 : 0) + (keys['s'] || keys['arrowdown'] ? 1 : 0) + joystickVector.y;

    let moveX = vx * player.speed;
    let moveY = vy * player.speed;

    // Manter dentro do container
    player.x = Math.max(0, Math.min(container.offsetWidth - player.width, player.x + moveX));
    player.y = Math.max(0, Math.min(container.offsetHeight - player.height, player.y + moveY));

    // Atualizar posição visual
    player.element.style.left = `${player.x}px`;
    player.element.style.top = `${player.y}px`;

    // Atirar
    if (isFiring && canFire && !isReloading) {
        fireProjectile();
    }
}

// Atirar
function fireProjectile() {
    if (playerWeapon.ammo <= 0) return;
    canFire = false;
    playerWeapon.ammo--;

    let projEl = document.createElement('div');
    projEl.className = 'projectile';
    projEl.style.left = `${player.x + player.width}px`;
    projEl.style.top = `${player.y + 30}px`;
    canvas.appendChild(projEl);

    projectiles.push({
        x: player.x + player.width,
        y: player.y + 30,
        element: projEl,
        damage: playerWeapon.damage,
        speed: playerWeapon.speed
    });

    setTimeout(() => { canFire = true; }, playerWeapon.fireRate);
}

// Atualizar Projéteis
function updateProjectiles() {
    projectiles.forEach((proj, index) => {
        proj.x += proj.speed;
        proj.element.style.left = `${proj.x}px`;
        
        // Remove se sair da tela
        if (proj.x > container.offsetWidth) {
            proj.element.remove();
            projectiles.splice(index, 1);
        }
    });

    bossProjectiles.forEach((proj, index) => {
        proj.x -= proj.speed;
        proj.element.style.left = `${proj.x}px`;
        if (proj.x < 0) {
            proj.element.remove();
            bossProjectiles.splice(index, 1);
        }
    });
}

// Spawn Zumbi Comum
function spawnZombie() {
    let zombieEl = document.createElement('div');
    zombieEl.className = 'zombie';
    let zX = container.offsetWidth + Math.random() * 200;
    let zY = Math.random() * (container.offsetHeight - 70);
    zombieEl.style.left = `${zX}px`;
    zombieEl.style.top = `${zY}px`;
    canvas.appendChild(zombieEl);

    zombies.push({
        x: zX, y: zY, element: zombieEl, health: 30, speed: 0.5 + Math.random() * 1.0
    });
}

// Atualizar Zumbis (Perseguir jogador)
function updateZombies() {
    zombies.forEach((zom, index) => {
        let dx = player.x - zom.x;
        let dy = player.y - zom.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 5) {
            zom.x += (dx/dist) * zom.speed;
            zom.y += (dy/dist) * zom.speed;
            zom.element.style.left = `${zom.x}px`;
            zom.element.style.top = `${zom.y}px`;
        }

        // Colisão Dano Zumbi -> Player
        if (checkRectCollision(player, zom)) {
            takeDamage(0.1); // Dano por contato
        }
    });
}

// Limpar zumbis ao mudar de fase
function clearZombies() {
    zombies.forEach(z => z.element.remove());
    zombies = [];
    bossProjectiles.forEach(p => p.element.remove());
    bossProjectiles = [];
}

// --- CHEFE ZUMBI (Fase 5) ---
function createBoss() {
    boss = {
        x: container.offsetWidth - 120,
        y: container.offsetHeight / 2 - 75,
        width: 80, height: 150,
        health: 2000, maxHealth: 2000,
        element: null,
        abilityCooldown: 3000,
        lastAbility: 0
    };

    boss.element = document.createElement('div');
    boss.element.className = 'boss-zombie';
    boss.element.style.left = `${boss.x}px`;
    boss.element.style.top = `${boss.y}px`;
    canvas.appendChild(boss.element);
}

function updateBoss() {
    // Chefe se move lentamente para cima e para baixo
    let yMove = Math.sin(Date.now() / 1000) * 1.5;
    boss.y += yMove;
    boss.element.style.top = `${boss.y}px`;

    // Usar Habilidades Especiais
    let now = Date.now();
    if (now - boss.lastAbility > boss.abilityCooldown) {
        let r = Math.random();
        if (r < 0.6) {
            bossAbilitySpawn(); // Invocação (Mais comum)
        } else {
            bossAbilityThrow(); // Joga pedra
        }
        boss.lastAbility = now;
        boss.abilityCooldown = 2000 + Math.random() * 2000; // Tempo aleatório para o próximo
    }
}

// Habilidade 1: Criar Zumbis (Horda)
function bossAbilitySpawn() {
    console.log("Chefe invoca horda!");
    let num = 3 + Math.random() * 3;
    for(let i=0; i<num; i++){
        spawnZombie();
    }
}

// Habilidade 2: Joga Bloco de Pedra
function bossAbilityThrow() {
    console.log("Chefe joga pedra!");
    let rockEl = document.createElement('div');
    rockEl.className = 'rock-projectile';
    rockEl.style.left = `${boss.x - 20}px`;
    rockEl.style.top = `${boss.y + 50}px`;
    canvas.appendChild(rockEl);

    bossProjectiles.push({
        x: boss.x - 20,
        y: boss.y + 50,
        element: rockEl,
        damage: 15,
        speed: 6,
        type: 'rock'
    });
}

// --- Mecânicas ---

// Verificação de Colisões
function checkCollisions() {
    // Projéteis do Player -> Zumbis
    projectiles.forEach((proj, pIndex) => {
        // Zumbis Comuns
        zombies.forEach((zom, zIndex) => {
            if (checkPointRectCollision(proj, zom)) {
                zom.health -= proj.damage;
                proj.element.remove();
                projectiles.splice(pIndex, 1);

                if (zom.health <= 0) {
                    zom.element.remove();
                    zombies.splice(zIndex, 1);
                    gameScore += 10;
                    checkLevelComplete();
                }
                return;
            }
        });

        // Chefe (se existir)
        if (boss && checkPointRectCollision(proj, boss)) {
            boss.health -= proj.damage;
            proj.element.remove();
            projectiles.splice(pIndex, 1);
            if (boss.health <= 0) {
                defeatBoss();
            }
            return;
        }
    });

    // Projéteis do Chefe (Pedra) -> Player
    bossProjectiles.forEach((proj, pIndex) => {
        if (checkPointRectCollision(proj, player)) {
            takeDamage(proj.damage);
            proj.element.remove();
            bossProjectiles.splice(pIndex, 1);
        }
    });
}

function checkLevelComplete() {
    if (boss) return; // Não completa fase enquanto o chefe está vivo

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

function takeDamage(dmg) {
    player.health -= dmg;
    if (player.health <= 0 && !gameOver) {
        triggerGameOver();
    }
}

// Rolagem do Fundo
function updateBackground() {
    const map = LEVEL_MAPS[currentLevel - 1];
    if (!boss && player.x > container.offsetWidth * 0.4) {
        backgroundOffset -= map.bgScrollSpeed;
        background.style.transform = `translateX(${backgroundOffset}px)`;
        // Faz zumbis se moverem junto com o fundo
        zombies.forEach(z => z.x -= map.bgScrollSpeed);
    }
}

// Troca de Arma (Pistola <-> AK47)
function swapWeapon() {
    currentWeaponName = currentWeaponName === 'Pistola' ? 'AK47' : 'Pistola';
    playerWeapon = weapons[currentWeaponName];
    // Atualiza braço visual
    player.weaponElement.className = `weapon ${playerWeapon.classHeld}`;
    updateHUD();
}

// Recarregar
function reloadWeapon() {
    if (playerWeapon.ammo >= playerWeapon.maxAmmo || isReloading) return;
    isReloading = true;
    hud.weapon.innerText = `... Recarregando (${currentWeaponName}) ...`;
    setTimeout(() => {
        playerWeapon.ammo = playerWeapon.maxAmmo;
        isReloading = false;
        updateHUD();
    }, currentWeaponName === 'AK47' ? 1500 : 1000);
}

// Utilidades
function checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

function checkPointRectCollision(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function updateHUD() {
    hud.health.style.width = `${player.health}%`;
    hud.weapon.innerText = isReloading ? `Recarregando...` : currentWeaponName;
    hud.level.innerText = `${currentLevel}/5${LEVEL_MAPS[currentLevel - 1].boss ? ' (CHEFE)' : ''}`;
    hud.score.innerText = gameScore;
    hud.ammo.innerText = isReloading ? '--' : `${playerWeapon.ammo}/${playerWeapon.maxAmmo}`;
}

// Estados do Jogo
function togglePause() {
    isPaused = !isPaused;
    pauseModal.classList.toggle('hidden');
    if (!isPaused) requestAnimationFrame(gameLoop);
}

function triggerGameOver() {
    gameOver = true;
    document.getElementById('final-level').innerText = currentLevel;
    gameOverModal.classList.remove('hidden');
}

function restartGame() {
    location.reload(); // Maneira mais simples de reiniciar
}

// Começar o jogo
init();