const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hpEl = document.getElementById('player-hp');
const weaponEl = document.getElementById('weapon-name');
const stageEl = document.getElementById('stage-num');

let stage = 1;
let cameraX = 0;
const mapWidth = 2400;

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

        this.vy += 0.6;
        this.x += this.vx;
        this.y += this.vy;

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
        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - cameraX + 18, this.y + 8, 8, 8);
    }
};

let bullets = [];
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        let hit = false;

        for (let j = obstacles.length - 1; j >= 0; j--) {
            let obs = obstacles[j];
            if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) {
                obs.hp -= b.damage;
                if (obs.hp <= 0) obstacles.splice(j, 1);
                hit = true;
                break;
            }
        }

        if (!hit) {
            for (let j = zombies.length - 1; j >= 0; j--) {
                let z = zombies[j];
                if (b.x > z.x && b.x < z.x + z.width && b.y > z.y && b.y < z.y + z.height) {
                    z.hp -= b.damage;
                    hit = true;
                    break;
                }
            }
        }

        if (hit || b.x < cameraX || b.x > cameraX + canvas.width || b.y > canvas.height || b.y < 0) {
            bullets.splice(i, 1);
        }
    }
}

let zombies = [];
function createZombies() {
    for (let i = 0; i < 15; i++) {
        let type = Math.random();
        if (type < 0.5) {
            zombies.push({ x: 500 + i * 120, y: 290, width: 25, height: 40, hp: 30, maxHp: 30, speed: 1.2, color: '#2ecc71' });
        } else if (type < 0.8) {
            zombies.push({ x: 500 + i * 120, y: 300, width: 20, height: 30, hp: 15, maxHp: 15, speed: 2.2, color: '#f1c40f' });
        } else {
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
        
        if (z.x > player.x) z.x -= z.speed;
        else z.x += z.speed;

        if (z.isBoss) {
            z.specialTimer++;
            if (z.specialTimer > 180) {
                z.specialTimer = 0;
                z.x -= 40; 
            }
        }

        if (player.x < z.x + z.width &&
            player.x + player.width > z.x &&
            player.y < z.y + z.height &&
            player.y + player.height > z.y) {
            player.hp -= 0.5;
            hpEl.textContent = Math.max(0, Math.floor(player.hp));
        }

        if (z.hp <= 0) {
            zombies.splice(i, 1);
        }
    }
}

let obstacles = [
    { x: 400, y: 280, w: 40, h: 50, hp: 80 },
    { x: 900, y: 280, w: 40, h: 50, hp: 80 },
    { x: 1400, y: 280, w: 40, h: 50, hp: 80 }
];

function drawBackground() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 10; i++) {
        let bgX = (i * 150) - (cameraX * 0.2);
        ctx.fillStyle = '#333';
        ctx.fillRect(bgX, 80 + (i % 3) * 20, 90, 300);
        
        if (i % 2 === 0) {
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(bgX + 20, 100 + (i % 3) * 20, 15, 15);
        }
    }

    ctx.fillStyle = '#444';
    ctx.fillRect(0, 330, canvas.width, 70);
}

function draw() {
    drawBackground();

    ctx.fillStyle = '#7f8c8d';
    obstacles.forEach(obs => {
        if (obs.x - cameraX < canvas.width && obs.x + obs.w - cameraX > 0) {
            ctx.fillRect(obs.x - cameraX, obs.y, obs.w, obs.h);
        }
    });

    bullets.forEach(b => {
        ctx.fillStyle = b.type === 'heavy' ? '#e67e22' : '#f1c40f';
        ctx.beginPath();
        ctx.arc(b.x - cameraX, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    zombies.forEach(z => {
        ctx.fillStyle = z.color;
        ctx.fillRect(z.x - cameraX, z.y, z.width, z.height);

        ctx.fillStyle = '#c0392b';
        ctx.fillRect(z.x - cameraX, z.y - 10, z.width, 5);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(z.x - cameraX, z.y - 10, (z.hp / z.maxHp) * z.width, 5);
    });

    player.draw();
}

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