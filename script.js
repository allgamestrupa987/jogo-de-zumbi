// ============================================================
// APOCALIPSE ZUMBI
// ============================================================

// ------------------------------------------------------------
// ELEMENTOS
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// ESTADO DO JOGO
// ------------------------------------------------------------

let isPaused = false;
let gameOver = false;
let gameWon = false;

let gameScore = 0;
let currentLevel = 1;

let backgroundOffset = 0;


// ------------------------------------------------------------
// FASES
// ------------------------------------------------------------

const LEVEL_MAPS = [

    {
        zombies: 6,
        bgSpeed: 0.5
    },

    {
        zombies: 12,
        bgSpeed: 0.8
    },

    {
        zombies: 18,
        bgSpeed: 1
    },

    {
        zombies: 24,
        bgSpeed: 1.2
    },

    {
        zombies: 0,
        boss: true
    }

];


// ------------------------------------------------------------
// ARMAS
// ------------------------------------------------------------

const WEAPONS = {

    Pistola: {
        ammo: 12,
        maxAmmo: 12,
        reserveAmmo: 60,
        damage: 25,
        fireRate: 300,
        speed: 14,
        classHeld: 'pistol-held',
        image: './pistola.jpg'
    },

    AK47: {
        ammo: 30,
        maxAmmo: 30,
        reserveAmmo: 120,
        damage: 18,
        fireRate: 100,
        speed: 16,
        classHeld: 'ak47-held',
        image: './X6nIEx (1).png'
    }

};


let currentWeaponName = 'Pistola';

let activeWeapon = {
    ...WEAPONS[currentWeaponName]
};

let canFire = true;
let isReloading = false;


// ------------------------------------------------------------
// MOUSE
// ------------------------------------------------------------

let mousePos = {
    x: 0,
    y: 0
};


// ------------------------------------------------------------
// JOGADOR
// ------------------------------------------------------------

let player = {

    x: 120,

    y: 300,

    width: 55,

    height: 80,

    speed: 5,

    health: 100,

    element: null,

    weaponElement: null

};


// ------------------------------------------------------------
// ENTIDADES
// ------------------------------------------------------------

let zombies = [];

let bullets = [];

let boss = null;

let bossProjectiles = [];


// ------------------------------------------------------------
// TECLAS
// ------------------------------------------------------------

const keys = {};


// ============================================================
// INICIALIZAÇÃO
// ============================================================

function init() {

    createPlayer();

    loadLevel(currentLevel);

    setupInputs();

    updateHUD();

    requestAnimationFrame(gameLoop);

}


// ============================================================
// CRIAR JOGADOR
// ============================================================

function createPlayer() {

    player.element = document.createElement('div');

    player.element.className = 'player';


    // Corpo visual simples
    const body = document.createElement('div');

    body.className = 'player-body';


    // Cabeça
    const head = document.createElement('div');

    head.className = 'player-head';


    // Arma
    player.weaponElement = document.createElement('img');

    player.weaponElement.className = 'weapon';


    updateWeaponImage();


    player.element.appendChild(body);

    player.element.appendChild(head);

    player.element.appendChild(player.weaponElement);


    canvas.appendChild(player.element);

}


// ============================================================
// IMAGEM DA ARMA
// ============================================================

function updateWeaponImage() {

    player.weaponElement.src =
        activeWeapon.image;

    player.weaponElement.alt =
        currentWeaponName;

    player.weaponElement.className =
        `weapon ${activeWeapon.classHeld}`;

}


// ============================================================
// CARREGAR FASE
// ============================================================

function loadLevel(level) {

    clearZombies();

    const map = LEVEL_MAPS[level - 1];


    if (!map) {

        return;

    }


    if (map.boss) {

        createBoss();

    } else {

        boss = null;

        for (
            let i = 0;
            i < map.zombies;
            i++
        ) {

            spawnZombie();

        }

    }

}


// ============================================================
// CONTROLES
// ============================================================

function setupInputs() {

    window.addEventListener('keydown', (e) => {

        const key =
            e.key.toLowerCase();

        keys[key] = true;


        // Evita ações repetidas por tecla segurada
        if (e.repeat) {

            if (
                key === 'r' ||
                key === 'q' ||
                key === 'p'
            ) {

                return;

            }

        }


        if (key === 'r') {

            reloadWeapon();

        }


        if (key === 'q') {

            swapWeapon();

        }


        if (key === 'p') {

            togglePause();

        }

    });


    window.addEventListener('keyup', (e) => {

        keys[e.key.toLowerCase()] = false;

    });


    window.addEventListener('mousemove', (e) => {

        mousePos.x = e.clientX;

        mousePos.y = e.clientY;

    });


    window.addEventListener('mousedown', (e) => {

        if (e.button === 0) {

            keys.click = true;

        }

    });


    window.addEventListener('mouseup', (e) => {

        if (e.button === 0) {

            keys.click = false;

        }

    });

}


// ============================================================
// LOOP PRINCIPAL
// ============================================================

function gameLoop() {

    if (
        !isPaused &&
        !gameOver &&
        !gameWon
    ) {

        updatePlayer();

        updateBullets();

        updateZombies();

        if (boss) {

            updateBoss();

        }

        checkCollisions();

        updateBackground();

        updateHUD();

    }


    requestAnimationFrame(gameLoop);

}


// ============================================================
// JOGADOR
// ============================================================

function updatePlayer() {

    let vx = 0;

    let vy = 0;


    if (
        keys.w ||
        keys.arrowup
    ) {

        vy -= 1;

    }


    if (
        keys.s ||
        keys.arrowdown
    ) {

        vy += 1;

    }


    if (
        keys.a ||
        keys.arrowleft
    ) {

        vx -= 1;

    }


    if (
        keys.d ||
        keys.arrowright
    ) {

        vx += 1;

    }


    // Movimento diagonal
    if (
        vx !== 0 &&
        vy !== 0
    ) {

        vx *= 0.7071;

        vy *= 0.7071;

    }


    // Limites
    player.x = Math.max(
        0,
        Math.min(
            container.offsetWidth - player.width,
            player.x + vx * player.speed
        )
    );


    player.y = Math.max(
        80,
        Math.min(
            container.offsetHeight - player.height,
            player.y + vy * player.speed
        )
    );


    player.element.style.left =
        `${player.x}px`;

    player.element.style.top =
        `${player.y}px`;


    // --------------------------------------------------------
    // MIRA
    // --------------------------------------------------------

    const rect =
        container.getBoundingClientRect();


    const mouseX =
        mousePos.x - rect.left;

    const mouseY =
        mousePos.y - rect.top;


    const playerCenterX =
        player.x + player.width / 2;

    const playerCenterY =
        player.y + player.height / 2;


    const angle =
        Math.atan2(
            mouseY - playerCenterY,
            mouseX - playerCenterX
        );


    player.weaponElement.style.transform =
        `rotate(${angle}rad)`;


    // --------------------------------------------------------
    // TIRO
    // --------------------------------------------------------

    if (
        keys.click &&
        canFire &&
        !isReloading
    ) {

        fireBullet(angle);

    }

}


// ============================================================
// ATIRAR
// ============================================================

function fireBullet(angle) {

    if (
        activeWeapon.ammo <= 0
    ) {

        reloadWeapon();

        return;

    }


    canFire = false;

    activeWeapon.ammo--;


    const bulletEl =
        document.createElement('div');

    bulletEl.className =
        'bullet';


    canvas.appendChild(bulletEl);


    // Tiro sai da frente da arma
    const startX =
        player.x +
        player.width / 2 +
        Math.cos(angle) * 35;


    const startY =
        player.y +
        player.height / 2 +
        Math.sin(angle) * 20;


    bullets.push({

        x: startX,

        y: startY,

        vx:
            Math.cos(angle) *
            activeWeapon.speed,

        vy:
            Math.sin(angle) *
            activeWeapon.speed,

        damage:
            activeWeapon.damage,

        element:
            bulletEl

    });


    setTimeout(() => {

        canFire = true;

    }, activeWeapon.fireRate);

}


// ============================================================
// PROJÉTEIS
// ============================================================

function updateBullets() {

    // Balas do jogador
    bullets.forEach((b, index) => {

        b.x += b.vx;

        b.y += b.vy;


        b.element.style.left =
            `${b.x}px`;

        b.element.style.top =
            `${b.y}px`;


        if (
            b.x < -50 ||
            b.x > container.offsetWidth + 50 ||
            b.y < -50 ||
            b.y > container.offsetHeight + 50
        ) {

            b.element.remove();

            bullets.splice(index, 1);

        }

    });


    // Pedras do chefe
    bossProjectiles.forEach((p, index) => {

        p.x += p.vx;

        p.y += p.vy;


        p.element.style.left =
            `${p.x}px`;

        p.element.style.top =
            `${p.y}px`;


        if (
            p.x < -100 ||
            p.x > container.offsetWidth + 100 ||
            p.y < -100 ||
            p.y > container.offsetHeight + 100
        ) {

            p.element.remove();

            bossProjectiles.splice(index, 1);

        }

    });

}


// ============================================================
// CRIAR ZUMBI
// ============================================================

function spawnZombie() {

    const zEl =
        document.createElement('img');


    zEl.className =
        'zombie';


    zEl.src =
        './zumbi.webp';


    zEl.alt =
        'Zumbi';


    canvas.appendChild(zEl);


    const spawnX =
        container.offsetWidth +
        50 +
        Math.random() * 300;


    const spawnY =
        100 +
        Math.random() *
        Math.max(
            100,
            container.offsetHeight - 200
        );


    zombies.push({

        x: spawnX,

        y: spawnY,

        width: 55,

        height: 75,

        health: 50,

        speed:
            0.8 +
            Math.random() * 1.2,

        element: zEl

    });

}


// ============================================================
// ATUALIZAR ZUMBIS
// ============================================================

function updateZombies() {

    zombies.forEach((z) => {

        const dx =
            player.x - z.x;


        const dy =
            player.y - z.y;


        const dist =
            Math.hypot(dx, dy);


        if (dist > 0) {

            z.x +=
                (dx / dist) *
                z.speed;


            z.y +=
                (dy / dist) *
                z.speed;

        }


        z.element.style.left =
            `${z.x}px`;


        z.element.style.top =
            `${z.y}px`;


        // Dano de contato
        if (
            checkRectCollision(
                player,
                z
            )
        ) {

            takeDamage(0.15);

        }

    });

}


// ============================================================
// LIMPAR ZUMBIS
// ============================================================

function clearZombies() {

    zombies.forEach((z) => {

        z.element.remove();

    });


    zombies = [];


    bossProjectiles.forEach((p) => {

        p.element.remove();

    });


    bossProjectiles = [];

}


// ============================================================
// CRIAR CHEFE
// ============================================================

function createBoss() {

    const bEl =
        document.createElement('img');


    bEl.className =
        'boss-zombie';


    bEl.src =
        './otiQd2.png';


    bEl.alt =
        'Chefe Zumbi';


    canvas.appendChild(bEl);


    boss = {

        x:
            container.offsetWidth - 180,

        y:
            container.offsetHeight / 2 - 100,

        width: 130,

        height: 200,

        health: 1500,

        maxHealth: 1500,

        element: bEl,

        lastAbilityTime:
            Date.now(),

        abilityCooldown:
            2500

    };

}


// ============================================================
// ATUALIZAR CHEFE
// ============================================================

function updateBoss() {

    if (!boss) {

        return;

    }


    // Movimento vertical
    const baseY =
        container.offsetHeight / 2 - 100;


    boss.y =
        baseY +
        Math.sin(Date.now() / 800) *
        70;


    boss.element.style.left =
        `${boss.x}px`;


    boss.element.style.top =
        `${boss.y}px`;


    // Habilidades
    const now =
        Date.now();


    if (
        now -
        boss.lastAbilityTime >
        boss.abilityCooldown
    ) {

        if (
            Math.random() < 0.5
        ) {

            bossAbilitySummon();

        } else {

            bossAbilityThrowRock();

        }


        boss.lastAbilityTime =
            now;

    }

}


// ============================================================
// CHEFE - INVOCAR ZUMBIS
// ============================================================

function bossAbilitySummon() {

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        spawnZombie();

    }

}


// ============================================================
// CHEFE - PEDRA
// ============================================================

function bossAbilityThrowRock() {

    if (!boss) {

        return;

    }


    const rockEl =
        document.createElement('div');


    rockEl.className =
        'rock-projectile';


    canvas.appendChild(rockEl);


    const startX =
        boss.x;


    const startY =
        boss.y +
        boss.height / 2;


    const angle =
        Math.atan2(
            player.y - startY,
            player.x - startX
        );


    bossProjectiles.push({

        x: startX,

        y: startY,

        width: 45,

        height: 45,

        vx:
            Math.cos(angle) * 7,

        vy:
            Math.sin(angle) * 7,

        damage: 25,

        element: rockEl

    });

}


// ============================================================
// COLISÕES
// ============================================================

function checkCollisions() {

    // --------------------------------------------------------
    // BALAS -> ZUMBIS
    // --------------------------------------------------------

    for (
        let bIdx = bullets.length - 1;
        bIdx >= 0;
        bIdx--
    ) {

        const b =
            bullets[bIdx];


        let bulletRemoved =
            false;


        for (
            let zIdx = zombies.length - 1;
            zIdx >= 0;
            zIdx--
        ) {

            const z =
                zombies[zIdx];


            if (
                checkPointRectCollision(
                    b,
                    z
                )
            ) {

                z.health -=
                    b.damage;


                b.element.remove();

                bullets.splice(
                    bIdx,
                    1
                );


                bulletRemoved =
                    true;


                if (
                    z.health <= 0
                ) {

                    z.element.remove();

                    zombies.splice(
                        zIdx,
                        1
                    );


                    gameScore += 20;

                    checkLevelProgress();

                }


                break;

            }

        }


        if (
            bulletRemoved
        ) {

            continue;

        }


        // ----------------------------------------------------
        // BALAS -> CHEFE
        // ----------------------------------------------------

        if (
            boss &&
            checkPointRectCollision(
                b,
                boss
            )
        ) {

            boss.health -=
                b.damage;


            b.element.remove();

            bullets.splice(
                bIdx,
                1
            );


            if (
                boss.health <= 0
            ) {

                defeatBoss();

            }

        }

    }


    // --------------------------------------------------------
    // PEDRAS -> JOGADOR
    // --------------------------------------------------------

    for (
        let pIdx =
            bossProjectiles.length - 1;
        pIdx >= 0;
        pIdx--
    ) {

        const p =
            bossProjectiles[pIdx];


        if (
            checkRectCollision(
                p,
                player
            )
        ) {

            takeDamage(
                p.damage
            );


            p.element.remove();

            bossProjectiles.splice(
                pIdx,
                1
            );

        }

    }

}


// ============================================================
// PROGRESSÃO DAS FASES
// ============================================================

function checkLevelProgress() {

    if (boss) {

        return;

    }


    if (
        zombies.length === 0 &&
        currentLevel < 5
    ) {

        currentLevel++;

        loadLevel(
            currentLevel
        );

    }

}


// ============================================================
// DERROTAR CHEFE
// ============================================================

function defeatBoss() {

    if (!boss) {

        return;

    }


    gameWon = true;


    boss.element.remove();

    boss = null;


    winModal.classList.remove(
        'hidden'
    );

}


// ============================================================
// DANO
// ============================================================

function takeDamage(amount) {

    if (
        gameOver ||
        gameWon
    ) {

        return;

    }


    player.health -=
        amount;


    player.health =
        Math.max(
            0,
            player.health
        );


    if (
        player.health <= 0
    ) {

        gameOver = true;


        document.getElementById(
            'final-level'
        ).innerText =
            currentLevel;


        gameOverModal.classList.remove(
            'hidden'
        );

    }

}


// ============================================================
// FUNDO PARALLAX
// ============================================================

function updateBackground() {

    const map =
        LEVEL_MAPS[
            currentLevel - 1
        ];


    if (
        !map ||
        map.boss
    ) {

        return;

    }


    // Fundo se move continuamente
    backgroundOffset -=
        map.bgSpeed;


    // Quando chega muito longe,
    // volta para evitar números enormes
    if (
        backgroundOffset <
        -container.offsetWidth
    ) {

        backgroundOffset = 0;

    }


    background.style.transform =
        `translateX(${backgroundOffset}px)`;

}


// ============================================================
// TROCAR ARMA
// ============================================================

function swapWeapon() {

    if (isReloading) {

        return;

    }


    currentWeaponName =
        currentWeaponName === 'Pistola'
            ? 'AK47'
            : 'Pistola';


    activeWeapon = {
        ...WEAPONS[
            currentWeaponName
        ]
    };


    updateWeaponImage();

    updateHUD();

}


// ============================================================
// RECARREGAR
// ============================================================

function reloadWeapon() {

    if (
        isReloading
    ) {

        return;

    }


    if (
        activeWeapon.ammo ===
        activeWeapon.maxAmmo
    ) {

        return;

    }


    if (
        activeWeapon.reserveAmmo <= 0
    ) {

        return;

    }


    isReloading = true;


    updateHUD();


    const reloadTime =
        currentWeaponName === 'AK47'
            ? 1400
            : 900;


    setTimeout(() => {

        const needed =
            activeWeapon.maxAmmo -
            activeWeapon.ammo;


        const amount =
            Math.min(
                needed,
                activeWeapon.reserveAmmo
            );


        activeWeapon.ammo +=
            amount;


        activeWeapon.reserveAmmo -=
            amount;


        isReloading = false;


        updateHUD();

    }, reloadTime);

}


// ============================================================
// COLISÃO RETÂNGULO
// ============================================================

function checkRectCollision(r1, r2) {

    return (

        r1.x <
        r2.x + r2.width

        &&

        r1.x + r1.width >
        r2.x

        &&

        r1.y <
        r2.y + r2.height

        &&

        r1.y + r1.height >
        r2.y

    );

}


// ============================================================
// COLISÃO PONTO
// ============================================================

function checkPointRectCollision(pt, r) {

    return (

        pt.x >= r.x &&

        pt.x <=
        r.x + r.width &&

        pt.y >= r.y &&

        pt.y <=
        r.y + r.height

    );

}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    hud.health.style.width =
        `${Math.max(
            0,
            player.health
        )}%`;


    hud.weapon.innerText =
        isReloading
            ? 'Recarregando...'
            : currentWeaponName;


    const map =
        LEVEL_MAPS[
            currentLevel - 1
        ];


    hud.level.innerText =
        `${currentLevel}/5${
            map && map.boss
                ? ' (CHEFE)'
                : ''
        }`;


    hud.score.innerText =
        gameScore;


    hud.ammo.innerText =
        `${activeWeapon.ammo}/${activeWeapon.reserveAmmo}`;

}


// ============================================================
// PAUSA
// ============================================================

function togglePause() {

    if (
        gameOver ||
        gameWon
    ) {

        return;

    }


    isPaused =
        !isPaused;


    pauseModal.classList.toggle(
        'hidden'
    );

}


// ============================================================
// REINICIAR
// ============================================================

function restartGame() {

    location.reload();

}


// ============================================================
// INICIAR
// ============================================================

init();
