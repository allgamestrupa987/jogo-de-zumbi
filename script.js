const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos UI
const hpEl = document.getElementById('player-hp');
const weaponEl = document.getElementById('weapon-name');
const stageEl = document.getElementById('stage-num');

// Estado do Jogo
let stage = 1; // 1: Caminho, 2: Chefe
let cameraX = 0;
const mapWidth = 2400;

// Teclas
const keys = {};
let mousePos = { x: 0, y: 0 };

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => player.shoot());

// Jogador
const player = {
    x: 100,
    y: 280,
    width: 30,
    height: 50,
    vx: 0,
    vy: 0,
    speed: 4,
    jumpPower: -12,
    grounded: false,
    hp: 100,
    currentWeapon: 'pistol',
    weapons: {
        pistol: { name: 'Pistola', damage: 15, cooldown: 250, lastShot: 0 },
        heavy: { name: 'Lança-Granadas', damage: 60, cooldown: 800, lastShot: 0 }
    },
    update() {
        if (keys['a']) this.vx = -this.speed;
        else if (keys['d']) this.vx = this.speed;
        else this.vx = 0;

        if (keys[' '] && this.grounded) {
            this.vy = this.jumpPower;
            this.grounded = false;
        }

        if (keys['1']) { this.currentWeapon = 'pistol'; weaponEl.textContent = this.weapons.pistol.name; }
        if (keys['2']) { this.currentWeapon = 'heavy'; weaponEl.textContent = this.weapons.heavy.name; }

        this.vy += 0.6; // Gravidade
        this.x += this.vx;
        this.y += this.vy;

        // Limites de chão e mapa
        if (this.y >= 280) {
            this.y = 280;
            this.vy = 0;
            this.grounded = true;
        }
        if (this.x < 0) this.x = 0;
        if (stage === 1 && this.x > mapWidth - this.width) {
            stage = 2;
            stageEl.textContent = "2 (CHEFE)";
            this.x = 50;
            spawnBoss();
        } else if (stage === 2 && this.x > canvas.width - this.width) {
            this.x = canvas.width - this.width;
        }

        // Câmera no estágio 1
        if (stage === 1) {
            cameraX = this.x - canvas.width / 3;
            if (cameraX < 0) cameraX = 0;
            if (cameraX > mapWidth - canvas.width) cameraX = mapWidth - canvas.width;
        } else {
            cameraX = 0;
        }
    },
    shoot() {
        const now = Date.now();
        const w = this.weapons[this.currentWeapon];
        if (now - w.lastShot >= w.cooldown) {
            w.lastShot = now;
            const targetX = mousePos.x + cameraX;
            const angle = Math.atan2(mousePos.y - (this.y + 20), targetX - (this.x + 15));
            
            bullets.push({
                x: this.x + 15,
                y: this.y + 20,
                vx: Math.cos(angle) * 10,
                vy: Math.sin(angle) * 10,
                damage: w.damage,
                type: this.currentWeapon,
                radius: this.currentWeapon === 'heavy' ? 8 : 4
            });
        }
    },
    draw() {
        ctx.fillStyle = '#3498db'; // Estilo Cartoon Simples (Azul)
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        
        // Olho/Viseira
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - cameraX + 18, this.y + 8, 8, 8);
    }
};

// Projéteis
let bullets = [];
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // Dano em obstáculos
        obstacles.forEach((obs, obsIdx) => {
            if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) {
                obs.hp -= b.damage;
                if (obs.hp <= 0) obstacles.splice(obsIdx, 1);
                bullets.splice(i, 1);
                return;
            }
        });

        // Dano em Zumbis
        zombies.forEach((z) => {
            if (b.x > z.x && b.x < z.x + z.width && b.y > z.y && b.y < z.y + z.height) {
                z.hp -= b.damage;
                bullets.splice(i, 1);
            }
        });

        if (b && (b.x < cameraX || b.x > cameraX + canvas.width || b.y > canvas.height)) {
            bullets.splice(i, 1);
        }
    }
}

// Zumbis e Chefe
let zombies = [];
function createZombies() {
    for (let i = 0; i < 15; i++) {
        let type = Math.random();
        if (type < 0.5) {
            // Normal
            zombies.push({ x: 500 + i * 120, y: 290, width: 25, height: 40, hp: 30, maxHp: 30, speed: 1.2, color: '#2ecc71' });
        } else if (type < 0.8) {
            // Rápido e Pequeno
            zombies.push({ x: 500 + i * 120, y: 300, width: 20, height: 30, hp: 15, maxHp: 15, speed: 2.2, color: '#f1c40f' });
        } else {
            // Grande / Tank
            zombies.push({ x: 500 + i * 120, y: 260, width: 40, height: 70, hp: 100, maxHp: 100, speed: 0.6, color: '#e74c3c' });
        }
    }
}
createZombies();

function spawnBoss() {
    zombies = [{
        x: 600,
        y: 210,
        width: 70,
        height: 120,
        hp: 800,
        maxHp: 800,
        speed: 0.8,
        color: '#8e44ad',
        isBoss: true,
        specialTimer: 0
    }];
}

function updateZombies() {
    for (let i = zombies.length - 1; i >= 0; i--) {
        let z = zombies[i];
        
        // Movimento
        if (z.x > player.x) z.x -= z.speed;
        else z.x += z.speed;

        // Habilidade Especial do Chefe
        if (z.isBoss) {
            z.specialTimer++;
            if (z.specialTimer > 180) { // A cada ~3 segundos cria um ataque
                z.specialTimer = 0;
                // Ataque: Investida rápida temporária
                z.x -= 40; 
            }
        }

        // Colisão com Jogador
        if (Math.abs(z.x - player.x) < 20 && Math.abs(z.y - player.y) < 20) {
            player.hp -= 0.5;
            hpEl.textContent = Math.max(0, Math.floor(player.hp));
        }

        // Morte do Zumbi
        if (z.hp <= 0) {
            zombies.splice(i, 1);
        }
    }
}

// Obstáculos Destruíveis
let obstacles = [
    { x: 400, y: 280, w: 40, h: 50, hp: 80 },
    { x: 900, y: 280, w: 40, h: 50, hp: 80 },
    { x: 1400, y: 280, w: 40, h: 50, hp: 80 }
];

// Renderização do Cenário Apocalíptico
function drawBackground() {
    // Céu Cinzento Escuro
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Prédios destruídos em silhueta (Parallax simples)
    ctx.fillStyle = '#333';
    for (let i = 0; i < 10; i++) {
        let bgX = (i * 150) - (cameraX * 0.2);
        ctx.fillRect(bgX, 80 + (i % 3) * 20, 90, 300);
        
        // Detalhe de fogo nos prédios
        if (i % 2 === 0) {
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(bgX + 20, 100 + (i % 3) * 20, 15, 15);
            ctx.fillStyle = '#333';
        }
    }

    // Chão
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 330, canvas.width, 70);
}

// Renderização Geral
function draw() {
    drawBackground();

    // Obstáculos
    ctx.fillStyle = '#7f8c8d';
    obstacles.forEach(obs => {
        if (obs.x - cameraX < canvas.width && obs.x + obs.w - cameraX > 0) {
            ctx.fillRect(obs.x - cameraX, obs.y, obs.w, obs.h);
        }
    });

    // Projéteis
    bullets.forEach(b => {
        ctx.fillStyle = b.type === 'heavy' ? '#e67e22' : '#f1c40f';
        ctx.beginPath();
        ctx.arc(b.x - cameraX, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Zumbis
    zombies.forEach(z => {
        ctx.fillStyle = z.color;
        ctx.fillRect(z.x - cameraX, z.y, z.width, z.height);

        // Barra de vida dos Zumbis
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(z.x - cameraX, z.y - 10, z.width, 5);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(z.x - cameraX, z.y - 10, (z.hp / z.maxHp) * z.width, 5);
    });

    // Jogador
    player.draw();
}

// Loop Principal
function gameLoop() {
    if (player.hp > 0) {
        player.update();
        updateBullets();
        updateZombies();
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e74c3c';
        ctx.font = '30px Courier New';
        ctx.fillText('VOCÊ MORREU', canvas.width / 2 - 100, canvas.height / 2);
    }
}

requestAnimationFrame(gameLoop);