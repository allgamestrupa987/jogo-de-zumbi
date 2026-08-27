
Conversa com o Gemini
faça um jogo de zumbi 2d onde o plano de fundo seja predios e casas destruidas e pegando fogo algo bem apocaliptico com uma paleta de cores cinzentas onde o personagem principal ande para a direita matando zumbis de diferentes tamanhos e forma e diferente barras de vida, o personagem principal tem que conter duas armas iniciais uma sendo uma pistola e a outra arma sendo uma arma pesada mas que de muito danos aos zumbis e obstaculos e quando o personagem terminar o mapa ele passa de fase e cvai direto a uma fase onde ele tem que lutar contra um zumbi chefe forte imponete com design diferente e muita vida e com habilidades especiais

Este é um protótipo completo de um jogo 2D em HTML5 e Canvas JavaScript. Ele possui cenários apocalípticos em tons de cinza, prédios em chamas no fundo, dois tipos de armas com alternância, zumbis variados com barras de vida, transição de fase e um chefão final com habilidades especiais.

Para jogar, basta salvar o código abaixo como index.html e abri-lo em qualquer navegador de internet.

HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apocalipse Zumbi 2D</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #111;
            color: #fff;
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }
        #gameCanvas {
            border: 2px solid #444;
            background-color: #1a1a1a;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
        }
        .controls-info {
            margin-top: 10px;
            font-size: 14px;
            color: #aaa;
            text-align: center;
        }
    </style>
</head>
<body>

<canvas id="gameCanvas" width="800" height="400"></canvas>
<div class="controls-info">
    <b>Controles:</b> A / D ou Setas = Mover | Espaço = Pular | J = Atirar | Q = Trocar Arma (1: Pistola / 2: Arma Pesada)
</div>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ESTADO DO JOGO ---
let faseAtual = 1; // 1 = Caminho, 2 = Chefe
let gameOver = false;
let jogoVencido = false;

// --- TECLAS ---
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === '1') jogador.armaAtual = 'pistola';
    if (e.key === '2') jogador.armaAtual = 'pesada';
    if (e.key.toLowerCase() === 'q') {
        jogador.armaAtual = jogador.armaAtual === 'pistola' ? 'pesada' : 'pistola';
    }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// --- JOGADOR ---
const jogador = {
    x: 50,
    y: 280,
    largura: 30,
    altura: 50,
    velocidade: 4,
    velY: 0,
    gravidade: 0.6,
    forcaPulo: -12,
    noChao: false,
    vidaMax: 100,
    vida: 100,
    armaAtual: 'pistola', // 'pistola' ou 'pesada'
    cooldownTiro: 0
};

// --- ARMAS ---
const armas = {
    pistola: { dano: 25, cdMax: 15, cor: '#fff', tamanho: 4, vel: 10 },
    pesada: { dano: 80, cdMax: 35, cor: '#ff4500', tamanho: 8, vel: 7 }
};

// --- ELEMENTOS DO MAPA ---
let projeteis = [];
let particulasFogo = [];
let zumbis = [];
let obstaculos = [];
let chefe = null;
let projeteisChefe = [];

const TAMANHO_MAPA = 2400; // Extensão do mapa na Fase 1
let cameraX = 0;

// Gerar fundo destruído (Prédios cinzas)
const predios = [];
for (let i = 0; i < 30; i++) {
    predios.push({
        x: i * 100 + Math.random() * 20 - 10,
        largura: 60 + Math.random() * 40,
        altura: 150 + Math.random() * 180,
        cor: `rgb(${30 + Math.random()*20}, ${30 + Math.random()*20}, ${30 + Math.random()*20})`
    });
}

// Criar Partículas de Fogo nos Prédios
for (let i = 0; i < 60; i++) {
    particulasFogo.push({
        x: Math.random() * TAMANHO_MAPA,
        y: 100 + Math.random() * 150,
        raio: Math.random() * 3 + 1,
        vy: -Math.random() * 1.5 - 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vida: Math.random() * 100
    });
}

// Inicializar Fase 1
function iniciarFase1() {
    faseAtual = 1;
    zumbis = [];
    obstaculos = [];
    
    // Barricadas destruíveis pela arma pesada/pistola
    for (let x = 400; x < TAMANHO_MAPA - 400; x += 500) {
        obstaculos.push({ x: x, y: 290, largura: 35, altura: 40, vida: 120, vidaMax: 120 });
    }

    // Inimigos Variados
    for (let x = 300; x < TAMANHO_MAPA - 200; x += 180) {
        let tipo = Math.random();
        if (tipo < 0.5) {
            // Zumbi Comum
            zumbis.push({ x: x, y: 285, largura: 28, altura: 45, vel: 1.2, vida: 50, vidaMax: 50, dano: 10, cor: '#4a6b4c' });
        } else if (tipo < 0.8) {
            // Zumbi Rápido/Pequeno
            zumbis.push({ x: x, y: 295, largura: 22, altura: 35, vel: 2.2, vida: 30, vidaMax: 30, dano: 5, cor: '#7a9e47' });
        } else {
            // Zumbi Tanque (Grande)
            zumbis.push({ x: x, y: 265, largura: 40, altura: 65, vel: 0.6, vida: 150, vidaMax: 150, dano: 25, cor: '#2d402e' });
        }
    }
}

// Inicializar Fase 2 (Chefe)
function iniciarFase2() {
    faseAtual = 2;
    jogador.x = 50;
    cameraX = 0;
    zumbis = [];
    obstaculos = [];

    chefe = {
        x: 600,
        y: 210,
        largura: 75,
        altura: 120,
        vida: 1200,
        vidaMax: 1200,
        cor: '#8b0000',
        cdAtaque: 0,
        estado: 'normal',
        timerEstado: 0
    };
}

// --- ATIRAR ---
function atirar() {
    if (jogador.cooldownTiro > 0) return;
    
    const arma = armas[jogador.armaAtual];
    projeteis.push({
        x: jogador.x + jogador.largura,
        y: jogador.y + 18,
        raio: arma.tamanho,
        vel: arma.vel,
        dano: arma.dano,
        cor: arma.cor
    });
    
    jogador.cooldownTiro = arma.cdMax;
}

// --- ATUALIZAÇÃO DO JOGO ---
function update() {
    if (gameOver || jogoVencido) return;

    // Cooldown de Tiro
    if (jogador.cooldownTiro > 0) jogador.cooldownTiro--;

    // Movimentação do Jogador
    if (keys['a'] || keys['arrowleft']) jogador.x -= jogador.velocidade;
    if (keys['d'] || keys['arrowright']) jogador.x += jogador.velocidade;
    
    if ((keys[' '] || keys['w'] || keys['arrowup']) && jogador.noChao) {
        jogador.velY = jogador.forcaPulo;
        jogador.noChao = false;
    }

    if (keys['j']) atirar();

    // Aplicação de Gravidade
    jogador.velY += jogador.gravidade;
    jogador.y += jogador.velY;

    if (jogador.y >= 280) {
        jogador.y = 280;
        jogador.velY = 0;
        jogador.noChao = true;
    }

    // Limites de Tela/Mapa
    if (jogador.x < 0) jogador.x = 0;
    if (faseAtual === 1) {
        if (jogador.x > TAMANHO_MAPA - jogador.largura) {
            iniciarFase2(); // Avança de fase ao chegar ao fim
        }
        // Câmera segue o jogador
        cameraX = jogador.x - 150;
        if (cameraX < 0) cameraX = 0;
        if (cameraX > TAMANHO_MAPA - canvas.width) cameraX = TAMANHO_MAPA - canvas.width;
    } else {
        cameraX = 0; // Fase do Chefe é fixa
        if (jogador.x > canvas.width - jogador.largura) jogador.x = canvas.width - jogador.largura;
    }

    // Atualizar Projetéis do Jogador
    for (let i = projeteis.length - 1; i >= 0; i--) {
        let p = projeteis[i];
        p.x += p.vel;

        // Colisão com Obstáculos
        for (let j = obstaculos.length - 1; j >= 0; j--) {
            let obs = obstaculos[j];
            if (p.x > obs.x && p.x < obs.x + obs.largura && p.y > obs.y && p.y < obs.y + obs.altura) {
                obs.vida -= p.dano;
                projeteis.splice(i, 1);
                if (obs.vida <= 0) obstaculos.splice(j, 1);
                break;
            }
        }

        if (!projeteis[i]) continue;

        // Colisão com Zumbis (Fase 1)
        for (let j = zumbis.length - 1; j >= 0; j--) {
            let z = zumbis[j];
            if (p.x > z.x && p.x < z.x + z.largura && p.y > z.y && p.y < z.y + z.altura) {
                z.vida -= p.dano;
                projeteis.splice(i, 1);
                if (z.vida <= 0) zumbis.splice(j, 1);
                break;
            }
        }

        if (!projeteis[i]) continue;

        // Colisão com Chefe (Fase 2)
        if (faseAtual === 2 && chefe) {
            if (p.x > chefe.x && p.x < chefe.x + chefe.largura && p.y > chefe.y && p.y < chefe.y + chefe.altura) {
                chefe.vida -= p.dano;
                projeteis.splice(i, 1);
                if (chefe.vida <= 0) {
                    jogoVencido = true;
                }
                continue;
            }
        }

        // Remover projétil fora da tela
        if (p.x > cameraX + canvas.width + 50) projeteis.splice(i, 1);
    }

    // Colisão do Jogador com Obstáculos
    for (let obs of obstaculos) {
        if (jogador.x + jogador.largura > obs.x && jogador.x < obs.x + obs.largura && jogador.y + jogador.altura > obs.y) {
            jogador.x = obs.x - jogador.largura;
        }
    }

    // Atualizar Zumbis (Fase 1)
    for (let z of zumbis) {
        // Mover em direção ao jogador
        if (z.x > jogador.x) z.x -= z.vel;
        else z.x += z.vel;

        // Colisão com o Jogador
        if (jogador.x < z.x + z.largura && jogador.x + jogador.largura > z.x &&
            jogador.y < z.y + z.altura && jogador.y + jogador.altura > z.y) {
            jogador.vida -= 0.3; // Dano contínuo por contato
            if (jogador.vida <= 0) gameOver = true;
        }
    }

    // Comportamento do Chefe (Fase 2)
    if (faseAtual === 2 && chefe && chefe.vida > 0) {
        chefe.cdAtaque++;

        // Habilidade Especial 1: Invocar Zumbis
        if (chefe.cdAtaque % 250 === 0) {
            zumbis.push({ x: chefe.x - 20, y: 285, largura: 25, altura: 45, vel: 1.5, vida: 40, vidaMax: 40, dano: 10, cor: '#4a6b4c' });
        }

        // Habilidade Especial 2: Lançar Bola de Fogo
        if (chefe.cdAtaque % 180 === 0) {
            projeteisChefe.push({
                x: chefe.x,
                y: chefe.y + 30,
                vx: -5,
                vy: (jogador.y - chefe.y) / 50,
                raio: 12
            });
        }

        // Colisão do Chefe com o Jogador
        if (jogador.x < chefe.x + chefe.largura && jogador.x + jogador.largura > chefe.x &&
            jogador.y < chefe.y + chefe.altura && jogador.y + jogador.altura > chefe.y) {
            jogador.vida -= 0.8;
            if (jogador.vida <= 0) gameOver = true;
        }
    }

    // Projetéis do Chefe
    for (let i = projeteisChefe.length - 1; i >= 0; i--) {
        let pc = projeteisChefe[i];
        pc.x += pc.vx;
        pc.y += pc.vy;

        // Colisão com Jogador
        if (jogador.x < pc.x + pc.raio && jogador.x + jogador.largura > pc.x - pc.raio &&
            jogador.y < pc.y + pc.raio && jogador.y + jogador.altura > pc.y - pc.raio) {
            jogador.vida -= 20;
            projeteisChefe.splice(i, 1);
            if (jogador.vida <= 0) gameOver = true;
            continue;
        }

        if (pc.x < 0 || pc.y > 400) projeteisChefe.splice(i, 1);
    }

    // Atualizar Fogo do Fundo
    for (let p of particulasFogo) {
        p.y += p.vy;
        p.x += p.vx;
        p.vida--;
        if (p.vida <= 0) {
            p.y = 150 + Math.random() * 100;
            p.x = cameraX + Math.random() * canvas.width;
            p.vida = 100;
        }
    }
}

// --- DESENHAR NA TELA ---
function draw() {
    // Limpar Tela
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    // --- FUNDO APOCALÍPTICO (Escala de Cinza + Fogo) ---
    // Prédios destruídos
    for (let p of predios) {
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x, 330 - p.altura, p.largura, p.altura);
        
        // Detalhes de janelas quebradas (cinza escuro)
        ctx.fillStyle = '#151515';
        for (let jx = p.x + 8; jx < p.x + p.largura - 10; jx += 15) {
            for (let jy = 330 - p.altura + 10; jy < 310; jy += 25) {
                if (Math.random() > 0.3) ctx.fillRect(jx, jy, 8, 12);
            }
        }
    }

    // Partículas de Fogo nos prédios
    for (let p of particulasFogo) {
        ctx.fillStyle = `rgba(255, ${Math.random() * 100 + 50}, 0, 0.8)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fill();
    }

    // Chão cinza escuro
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 330, TAMANHO_MAPA + 800, 70);
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 330, TAMANHO_MAPA + 800, 5); // Linha do solo

    // --- OBSTÁCULOS ---
    for (let obs of obstaculos) {
        ctx.fillStyle = '#555';
        ctx.fillRect(obs.x, obs.y, obs.largura, obs.altura);
        // Barra de vida do obstáculo
        ctx.fillStyle = 'red';
        ctx.fillRect(obs.x, obs.y - 8, obs.largura, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(obs.x, obs.y - 8, obs.largura * (obs.vida / obs.vidaMax), 4);
    }

    // --- ZUMBIS ---
    for (let z of zumbis) {
        ctx.fillStyle = z.cor;
        ctx.fillRect(z.x, z.y, z.largura, z.altura);

        // Barra de Vida do Zumbi
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(z.x, z.y - 10, z.largura, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(z.x, z.y - 10, z.largura * (z.vida / z.vidaMax), 5);
    }

    // --- CHEFE (FASE 2) ---
    if (faseAtual === 2 && chefe) {
        // Corpo do Chefe
        ctx.fillStyle = chefe.cor;
        ctx.fillRect(chefe.x, chefe.y, chefe.largura, chefe.altura);
        
        // Olhos brilhantes
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(chefe.x + 10, chefe.y + 20, 12, 12);

        // Barra de Vida Gigante do Chefe
        ctx.fillStyle = '#333';
        ctx.fillRect(chefe.x - 20, chefe.y - 25, chefe.largura + 40, 10);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(chefe.x - 20, chefe.y - 25, (chefe.largura + 40) * (chefe.vida / chefe.vidaMax), 10);
    }

    // Projetéis do Chefe
    ctx.fillStyle = '#ff1100';
    for (let pc of projeteisChefe) {
        ctx.beginPath();
        ctx.arc(pc.x, pc.y, pc.raio, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- JOGADOR ---
    ctx.fillStyle = '#00bfff'; // Azul
    ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);

    // Arma no Jogador
    ctx.fillStyle = armas[jogador.armaAtual].cor;
    ctx.fillRect(jogador.x + jogador.largura, jogador.y + 15, jogador.armaAtual === 'pesada' ? 20 : 10, 6);

    // Projetéis do Jogador
    for (let p of projeteis) {
        ctx.fillStyle = p.cor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // --- INTERFACE DE USUÁRIO (UI - Fixa na tela) ---
    // Barra de Vida do Jogador
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(20, 20, Math.max(0, jogador.vida * 2), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(20, 20, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`VIDA: ${Math.ceil(jogador.vida)}%`, 25, 35);

    // Indicador da Arma Atual
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Arma: ${jogador.armaAtual.toUpperCase()} (Pressione Q ou 1/2 para trocar)`, 20, 65);
    ctx.fillText(`Fase: ${faseAtual} ${faseAtual === 1 ? '- Caminho para o Destino' : '- CONFRONTO FINAL'}`, 20, 85);

    // Telas de Fim de Jogo
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '48px sans-serif';
        ctx.fillText('VOCÊ MORREU', 230, 200);
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.fillText('Recarregue a página para tentar novamente', 210, 250);
    }

    if (jogoVencido) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00';
        ctx.font = '40px sans-serif';
        ctx.fillText('O CHEFE FOI DERROTADO!', 160, 200);
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.fillText('Você sobreviveu ao apocalipse!', 260, 250);
    }
}

// --- LOOP PRINCIPAL ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

iniciarFase1();
gameLoop();
</script>

</body>
</html>
faça um jogo de zumbi 2d onde o plano de fundo seja predios e casas destruidas e pegando fogo  algo bem apocaliptico com uma paleta de cores cinzentas onde o personagem principal ande para a direita matando zumbis de diferentes tamanhos e forma e diferente barras de vida, o personagem principal tem que conter duas armas iniciais uma sendo uma pistola e a outra arma sendo uma arma pesada mas que de muito danos aos zumbis e obstaculos e quando o personagem terminar o mapa ele passa de fase e cvai direto a uma fase onde ele tem que lutar contra um zumbi chefe forte imponete com design diferente e muita vida e com habilidades especiais faça os codigos para mim

Aqui está o código completo de um jogo 2D em HTML5 e JavaScript. Ele contém o cenário apocalíptico em tons de cinza com prédios e chamas, duas armas intercaláveis (pistola e arma pesada), zumbis de diferentes tamanhos e barras de vida, obstáculos destruíveis, transição de fase e um chefe final com habilidades especiais.

Para rodar o jogo, salve o código abaixo em um arquivo chamado index.html e abra-o em qualquer navegador de internet.

HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apocalipse Zumbi 2D</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #111;
            color: #fff;
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }
        #gameCanvas {
            border: 2px solid #444;
            background-color: #1a1a1a;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
        }
        .controls-info {
            margin-top: 10px;
            font-size: 14px;
            color: #aaa;
            text-align: center;
        }
    </style>
</head>
<body>

<canvas id="gameCanvas" width="800" height="400"></canvas>
<div class="controls-info">
    <b>Controles:</b> A / D ou Setas = Mover | Espaço ou W = Pular | J = Atirar | Q = Trocar Arma (1: Pistola / 2: Arma Pesada)
</div>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ESTADO DO JOGO ---
let faseAtual = 1; // 1 = Caminho, 2 = Chefe
let gameOver = false;
let jogoVencido = false;

// --- TECLAS ---
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === '1') jogador.armaAtual = 'pistola';
    if (e.key === '2') jogador.armaAtual = 'pesada';
    if (e.key.toLowerCase() === 'q') {
        jogador.armaAtual = jogador.armaAtual === 'pistola' ? 'pesada' : 'pistola';
    }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// --- JOGADOR ---
const jogador = {
    x: 50,
    y: 280,
    largura: 30,
    altura: 50,
    velocidade: 4,
    velY: 0,
    gravidade: 0.6,
    forcaPulo: -12,
    noChao: false,
    vidaMax: 100,
    vida: 100,
    armaAtual: 'pistola',
    cooldownTiro: 0
};

// --- ARMAS ---
const armas = {
    pistola: { dano: 25, cdMax: 15, cor: '#fff', tamanho: 4, vel: 10 },
    pesada: { dano: 80, cdMax: 35, cor: '#ff4500', tamanho: 8, vel: 7 }
};

// --- ELEMENTOS DO MAPA ---
let projeteis = [];
let particulasFogo = [];
let zumbis = [];
let obstaculos = [];
let chefe = null;
let projeteisChefe = [];

const TAMANHO_MAPA = 2400; // Extensão da Fase 1
let cameraX = 0;

// Gerar fundo destruído em tons de cinza
const predios = [];
for (let i = 0; i < 30; i++) {
    predios.push({
        x: i * 100 + Math.random() * 20 - 10,
        largura: 60 + Math.random() * 40,
        altura: 150 + Math.random() * 180,
        cor: `rgb(${30 + Math.random()*20}, ${30 + Math.random()*20}, ${30 + Math.random()*20})`
    });
}

// Criar partículas de fogo nos prédios do fundo
for (let i = 0; i < 60; i++) {
    particulasFogo.push({
        x: Math.random() * TAMANHO_MAPA,
        y: 100 + Math.random() * 150,
        raio: Math.random() * 3 + 1,
        vy: -Math.random() * 1.5 - 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vida: Math.random() * 100
    });
}

// Inicializar Fase 1
function iniciarFase1() {
    faseAtual = 1;
    zumbis = [];
    obstaculos = [];
    
    // Obstáculos e Barricadas
    for (let x = 400; x < TAMANHO_MAPA - 400; x += 500) {
        obstaculos.push({ x: x, y: 290, largura: 35, altura: 40, vida: 120, vidaMax: 120 });
    }

    // Inimigos Variados
    for (let x = 300; x < TAMANHO_MAPA - 200; x += 180) {
        let tipo = Math.random();
        if (tipo < 0.5) {
            // Zumbi Comum
            zumbis.push({ x: x, y: 285, largura: 28, altura: 45, vel: 1.2, vida: 50, vidaMax: 50, cor: '#4a6b4c' });
        } else if (tipo < 0.8) {
            // Zumbi Rápido e Pequeno
            zumbis.push({ x: x, y: 295, largura: 22, altura: 35, vel: 2.2, vida: 30, vidaMax: 30, cor: '#7a9e47' });
        } else {
            // Zumbi Tanque (Grande)
            zumbis.push({ x: x, y: 265, largura: 40, altura: 65, vel: 0.6, vida: 150, vidaMax: 150, cor: '#2d402e' });
        }
    }
}

// Inicializar Fase 2 (Chefe)
function iniciarFase2() {
    faseAtual = 2;
    jogador.x = 50;
    cameraX = 0;
    zumbis = [];
    obstaculos = [];

    chefe = {
        x: 600,
        y: 210,
        largura: 75,
        altura: 120,
        vida: 1200,
        vidaMax: 1200,
        cor: '#8b0000',
        cdAtaque: 0
    };
}

// --- ATIRAR ---
function atirar() {
    if (jogador.cooldownTiro > 0) return;
    
    const arma = armas[jogador.armaAtual];
    projeteis.push({
        x: jogador.x + jogador.largura,
        y: jogador.y + 18,
        raio: arma.tamanho,
        vel: arma.vel,
        dano: arma.dano,
        cor: arma.cor
    });
    
    jogador.cooldownTiro = arma.cdMax;
}

// --- ATUALIZAÇÃO DO JOGO ---
function update() {
    if (gameOver || jogoVencido) return;

    if (jogador.cooldownTiro > 0) jogador.cooldownTiro--;

    // Movimentação
    if (keys['a'] || keys['arrowleft']) jogador.x -= jogador.velocidade;
    if (keys['d'] || keys['arrowright']) jogador.x += jogador.velocidade;
    
    if ((keys[' '] || keys['w'] || keys['arrowup']) && jogador.noChao) {
        jogador.velY = jogador.forcaPulo;
        jogador.noChao = false;
    }

    if (keys['j']) atirar();

    // Gravidade
    jogador.velY += jogador.gravidade;
    jogador.y += jogador.velY;

    if (jogador.y >= 280) {
        jogador.y = 280;
        jogador.velY = 0;
        jogador.noChao = true;
    }

    // Limites de Tela e Transição de Fase
    if (jogador.x < 0) jogador.x = 0;
    if (faseAtual === 1) {
        if (jogador.x > TAMANHO_MAPA - jogador.largura) {
            iniciarFase2();
        }
        cameraX = jogador.x - 150;
        if (cameraX < 0) cameraX = 0;
        if (cameraX > TAMANHO_MAPA - canvas.width) cameraX = TAMANHO_MAPA - canvas.width;
    } else {
        cameraX = 0;
        if (jogador.x > canvas.width - jogador.largura) jogador.x = canvas.width - jogador.largura;
    }

    // Atualizar Projetéis
    for (let i = projeteis.length - 1; i >= 0; i--) {
        let p = projeteis[i];
        p.x += p.vel;

        // Colisão com Obstáculos
        for (let j = obstaculos.length - 1; j >= 0; j--) {
            let obs = obstaculos[j];
            if (p.x > obs.x && p.x < obs.x + obs.largura && p.y > obs.y && p.y < obs.y + obs.altura) {
                obs.vida -= p.dano;
                projeteis.splice(i, 1);
                if (obs.vida <= 0) obstaculos.splice(j, 1);
                break;
            }
        }

        if (!projeteis[i]) continue;

        // Colisão com Zumbis (Fase 1)
        for (let j = zumbis.length - 1; j >= 0; j--) {
            let z = zumbis[j];
            if (p.x > z.x && p.x < z.x + z.largura && p.y > z.y && p.y < z.y + z.altura) {
                z.vida -= p.dano;
                projeteis.splice(i, 1);
                if (z.vida <= 0) zumbis.splice(j, 1);
                break;
            }
        }

        if (!projeteis[i]) continue;

        // Colisão com Chefe (Fase 2)
        if (faseAtual === 2 && chefe) {
            if (p.x > chefe.x && p.x < chefe.x + chefe.largura && p.y > chefe.y && p.y < chefe.y + chefe.altura) {
                chefe.vida -= p.dano;
                projeteis.splice(i, 1);
                if (chefe.vida <= 0) {
                    jogoVencido = true;
                }
                continue;
            }
        }

        if (p.x > cameraX + canvas.width + 50) projeteis.splice(i, 1);
    }

    // Colisão do Jogador com Obstáculos
    for (let obs of obstaculos) {
        if (jogador.x + jogador.largura > obs.x && jogador.x < obs.x + obs.largura && jogador.y + jogador.altura > obs.y) {
            jogador.x = obs.x - jogador.largura;
        }
    }

    // Atualizar Zumbis (Fase 1)
    for (let z of zumbis) {
        if (z.x > jogador.x) z.x -= z.vel;
        else z.x += z.vel;

        if (jogador.x < z.x + z.largura && jogador.x + jogador.largura > z.x &&
            jogador.y < z.y + z.altura && jogador.y + jogador.altura > z.y) {
            jogador.vida -= 0.3;
            if (jogador.vida <= 0) gameOver = true;
        }
    }

    // Comportamento do Chefe (Fase 2)
    if (faseAtual === 2 && chefe && chefe.vida > 0) {
        chefe.cdAtaque++;

        // Habilidade Especial 1: Invocar Minions
        if (chefe.cdAtaque % 250 === 0) {
            zumbis.push({ x: chefe.x - 20, y: 285, largura: 25, altura: 45, vel: 1.5, vida: 40, vidaMax: 40, cor: '#4a6b4c' });
        }

        // Habilidade Especial 2: Lançar Ataque Distância
        if (chefe.cdAtaque % 180 === 0) {
            projeteisChefe.push({
                x: chefe.x,
                y: chefe.y + 30,
                vx: -5,
                vy: (jogador.y - chefe.y) / 50,
                raio: 12
            });
        }

        if (jogador.x < chefe.x + chefe.largura && jogador.x + jogador.largura > chefe.x &&
            jogador.y < chefe.y + chefe.altura && jogador.y + jogador.altura > chefe.y) {
            jogador.vida -= 0.8;
            if (jogador.vida <= 0) gameOver = true;
        }
    }

    // Projetéis do Chefe
    for (let i = projeteisChefe.length - 1; i >= 0; i--) {
        let pc = projeteisChefe[i];
        pc.x += pc.vx;
        pc.y += pc.vy;

        if (jogador.x < pc.x + pc.raio && jogador.x + jogador.largura > pc.x - pc.raio &&
            jogador.y < pc.y + pc.raio && jogador.y + jogador.altura > pc.y - pc.raio) {
            jogador.vida -= 20;
            projeteisChefe.splice(i, 1);
            if (jogador.vida <= 0) gameOver = true;
            continue;
        }

        if (pc.x < 0 || pc.y > 400) projeteisChefe.splice(i, 1);
    }

    // Atualizar Fogo do Fundo
    for (let p of particulasFogo) {
        p.y += p.vy;
        p.x += p.vx;
        p.vida--;
        if (p.vida <= 0) {
            p.y = 150 + Math.random() * 100;
            p.x = cameraX + Math.random() * canvas.width;
            p.vida = 100;
        }
    }
}

// --- RENDERIZAÇÃO ---
function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Prédios destruídos (Escala de Cinza)
    for (let p of predios) {
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x, 330 - p.altura, p.largura, p.altura);
        
        ctx.fillStyle = '#151515';
        for (let jx = p.x + 8; jx < p.x + p.largura - 10; jx += 15) {
            for (let jy = 330 - p.altura + 10; jy < 310; jy += 25) {
                if (Math.random() > 0.3) ctx.fillRect(jx, jy, 8, 12);
            }
        }
    }

    // Partículas de Fogo
    for (let p of particulasFogo) {
        ctx.fillStyle = `rgba(255, ${Math.random() * 100 + 50}, 0, 0.8)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fill();
    }

    // Chão
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 330, TAMANHO_MAPA + 800, 70);
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 330, TAMANHO_MAPA + 800, 5);

    // Obstáculos
    for (let obs of obstaculos) {
        ctx.fillStyle = '#555';
        ctx.fillRect(obs.x, obs.y, obs.largura, obs.altura);
        ctx.fillStyle = 'red';
        ctx.fillRect(obs.x, obs.y - 8, obs.largura, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(obs.x, obs.y - 8, obs.largura * (obs.vida / obs.vidaMax), 4);
    }

    // Zumbis
    for (let z of zumbis) {
        ctx.fillStyle = z.cor;
        ctx.fillRect(z.x, z.y, z.largura, z.altura);

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(z.x, z.y - 10, z.largura, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(z.x, z.y - 10, z.largura * (z.vida / z.vidaMax), 5);
    }

    // Chefe Final
    if (faseAtual === 2 && chefe) {
        ctx.fillStyle = chefe.cor;
        ctx.fillRect(chefe.x, chefe.y, chefe.largura, chefe.altura);
        
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(chefe.x + 10, chefe.y + 20, 12, 12);

        ctx.fillStyle = '#333';
        ctx.fillRect(chefe.x - 20, chefe.y - 25, chefe.largura + 40, 10);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(chefe.x - 20, chefe.y - 25, (chefe.largura + 40) * (chefe.vida / chefe.vidaMax), 10);
    }

    // Projetéis do Chefe
    ctx.fillStyle = '#ff1100';
    for (let pc of projeteisChefe) {
        ctx.beginPath();
        ctx.arc(pc.x, pc.y, pc.raio, 0, Math.PI * 2);
        ctx.fill();
    }

    // Jogador
    ctx.fillStyle = '#00bfff';
    ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);

    ctx.fillStyle = armas[jogador.armaAtual].cor;
    ctx.fillRect(jogador.x + jogador.largura, jogador.y + 15, jogador.armaAtual === 'pesada' ? 20 : 10, 6);

    // Projetéis do Jogador
    for (let p of projeteis) {
        ctx.fillStyle = p.cor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // INTERFACE DE USUÁRIO (HUD)
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(20, 20, Math.max(0, jogador.vida * 2), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(20, 20, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`VIDA: ${Math.ceil(jogador.vida)}%`, 25, 35);

    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Arma: ${jogador.armaAtual.toUpperCase()}`, 20, 65);
    ctx.fillText(`Fase: ${faseAtual} ${faseAtual === 1 ? '- Cidade em Ruínas' : '- CHEFE FINAL'}`, 20, 85);

    // Final de Jogo
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '48px sans-serif';
        ctx.fillText('FIM DE JOGO', 250, 200);
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.fillText('Recarregue a página para tentar novamente', 210, 250);
    }

    if (jogoVencido) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00';
        ctx.font = '40px sans-serif';
        ctx.fillText('CHEFE DERROTADO!', 210, 200);
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.fillText('Você sobreviveu ao apocalipse!', 260, 250);
    }
}

// Loop Principal
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

iniciarFase1();
gameLoop();
</script>

</body>
</html>
faça um jogo de zumbi 2d onde o plano de fundo seja predios e casas destruidas e pegando fogo  algo bem apocaliptico com uma paleta de cores cinzentas onde o personagem principal ande para a direita matando zumbis de diferentes tamanhos e forma e diferente barras de vida, o personagem principal tem que conter duas armas iniciais uma sendo uma pistola e a outra arma sendo uma arma pesada mas que de muito danos aos zumbis e obstaculos e quando o personagem terminar o mapa ele passa de fase e cvai direto a uma fase onde ele tem que lutar contra um zumbi chefe forte imponete com design diferente e muita vida e com habilidades especiais faça os codigos para mim faça o design do personagem principal ter dois braços e perna e cabeça e cabelos longos e desgrenhados e uma roupa toda esfarrapada e faça com que os zumbis tenham braços e pernas e cabeça e que tenham bocas com dentes podres e faça o chefe em forma humanoíde musculosa e grotesca e melhore o efeito do tiro da bala da arma

Aqui está uma versão aprimorada do código em HTML5 e Canvas JavaScript. Ela inclui sprites desenhados diretamente no Canvas para dar formas detalhadas aos personagens:

Personagem Principal: Cabelos longos e desgrenhados, roupas esfarrapadas e membros definidos (braços, pernas e cabeça).

Zumbis: Membros completos e detalhes de boca com dentes podres e deformados.

Chefe Final: Um modelo humanoide grande, musculoso e grotesco com olhos brilhantes e habilidades especiais.

Efeitos visuais: Animações e efeitos de projéteis (rastro para a pistola e projétil de energia com brilho para a arma pesada).

Para jogar, salve o código abaixo em um arquivo chamado index.html e abra-o em seu navegador.

HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apocalipse Zumbi 2D</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0d0d0d;
            color: #fff;
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }
        #gameCanvas {
            border: 2px solid #333;
            background-color: #1a1a1a;
            box-shadow: 0 0 25px rgba(0,0,0,0.9);
        }
        .controls-info {
            margin-top: 10px;
            font-size: 14px;
            color: #aaa;
            text-align: center;
        }
    </style>
</head>
<body>

<canvas id="gameCanvas" width="800" height="400"></canvas>
<div class="controls-info">
    <b>Controles:</b> A / D ou Setas = Mover | Espaço ou W = Pular | J = Atirar | Q = Trocar Arma (1: Pistola / 2: Arma Pesada)
</div>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ESTADO DO JOGO ---
let faseAtual = 1;
let gameOver = false;
let jogoVencido = false;

// --- TECLAS ---
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === '1') jogador.armaAtual = 'pistola';
    if (e.key === '2') jogador.armaAtual = 'pesada';
    if (e.key.toLowerCase() === 'q') {
        jogador.armaAtual = jogador.armaAtual === 'pistola' ? 'pesada' : 'pistola';
    }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// --- JOGADOR ---
const jogador = {
    x: 50,
    y: 270,
    largura: 32,
    altura: 60,
    velocidade: 4,
    velY: 0,
    gravidade: 0.6,
    forcaPulo: -12,
    noChao: false,
    vidaMax: 100,
    vida: 100,
    armaAtual: 'pistola',
    cooldownTiro: 0
};

// --- ARMAS E PROJÉTEIS ---
const armas = {
    pistola: { dano: 30, cdMax: 12, vel: 14, cor: '#ffff88' },
    pesada: { dano: 90, cdMax: 30, vel: 9, cor: '#ff3300' }
};

let projeteis = [];
let particulasFogo = [];
let zumbis = [];
let obstaculos = [];
let chefe = null;
let projeteisChefe = [];

const TAMANHO_MAPA = 2400;
let cameraX = 0;

// Cenário em escala de cinza
const predios = [];
for (let i = 0; i < 30; i++) {
    predios.push({
        x: i * 100 + Math.random() * 20 - 10,
        largura: 60 + Math.random() * 40,
        altura: 160 + Math.random() * 180,
        cor: `rgb(${25 + Math.random()*20}, ${25 + Math.random()*20}, ${25 + Math.random()*20})`
    });
}

for (let i = 0; i < 70; i++) {
    particulasFogo.push({
        x: Math.random() * TAMANHO_MAPA,
        y: 80 + Math.random() * 180,
        raio: Math.random() * 3 + 1,
        vy: -Math.random() * 1.5 - 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vida: Math.random() * 100
    });
}

function iniciarFase1() {
    faseAtual = 1;
    zumbis = [];
    obstaculos = [];
    
    for (let x = 450; x < TAMANHO_MAPA - 400; x += 550) {
        obstaculos.push({ x: x, y: 285, largura: 35, altura: 45, vida: 150, vidaMax: 150 });
    }

    for (let x = 350; x < TAMANHO_MAPA - 200; x += 190) {
        let tipo = Math.random();
        if (tipo < 0.5) {
            zumbis.push({ x: x, y: 270, largura: 30, altura: 60, vel: 1.2, vida: 60, vidaMax: 60, tipo: 'comum' });
        } else if (tipo < 0.8) {
            zumbis.push({ x: x, y: 285, largura: 24, altura: 45, vel: 2.3, vida: 35, vidaMax: 35, tipo: 'pequeno' });
        } else {
            zumbis.push({ x: x, y: 250, largura: 45, altura: 80, vel: 0.6, vida: 180, vidaMax: 180, tipo: 'tanque' });
        }
    }
}

function iniciarFase2() {
Você interrompeu a resposta
faça um jogo de zumbi 2d onde o plano de fundo seja predios e casas destruidas e pegando fogo  algo bem apocaliptico com uma paleta de cores cinzentas onde o personagem principal ande para a direita matando zumbis de diferentes tamanhos e forma e diferente barras de vida, o personagem principal tem que conter duas armas iniciais uma sendo uma pistola e a outra arma sendo uma arma pesada mas que de muito danos aos zumbis e obstaculos e quando o personagem terminar o mapa ele passa de fase e cvai direto a uma fase onde ele tem que lutar contra um zumbi chefe forte imponete com design diferente e muita vida e com habilidades especiais faça os codigos para mim faça o design do personagem principal ter dois braços e perna e cabeça e cabelos longos e desgrenhados e uma roupa toda esfarrapada e faça com que os zumbis tenham braços e pernas e cabeça e que tenham bocas com dentes podres  e faça o chefe em forma humanoíde musculosa e grotesca e melhore o efeito do tiro da bala da arma  separe o index.html do java e ddo css

O jogo de zumbi apocalíptico foi criado. Os códigos foram totalmente separados nos arquivos index.html, style.css e script.js.

Você pode baixar todos os arquivos juntos no pacote zombie_game.zip:

Ícone do app ZIP
zombie_game
 ZIP 
Aberto
📁 Arquivos Individuais
1. index.html
Ícone do app HTML
zombie_game/index
 HTML 
Aberto
HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apocalipse Zumbi 2D - Sobrevivência</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div id="game-container">
        <canvas id="gameCanvas" width="900" height="450"></canvas>
        
        <!-- HUD Overlay -->
        <div id="hud">
            <div class="hud-top">
                <div class="health-box">
                    <span class="hud-label">VIDA</span>
                    <div class="health-bar-container">
                        <div id="player-health-bar"></div>
                        <span id="player-health-text">100 / 100</span>
                    </div>
                </div>
                
                <div class="stage-box">
                    <span id="stage-title">FASE 1: CIDADE EM RUÍNAS</span>
                </div>
            </div>

            <div class="hud-bottom">
                <div class="weapon-box active" id="weapon-pistol">
                    <div class="weapon-name">[1] PISTOLA</div>
                    <div class="weapon-desc">Rápida | Dano Moderado</div>
                </div>
                <div class="weapon-box" id="weapon-heavy">
                    <div class="weapon-name">[2] ARMA PESADA</div>
                    <div class="weapon-desc">Devastadora | Destrói Barricadas</div>
                </div>
            </div>
        </div>

        <!-- Overlays de Fim de Jogo -->
        <div id="overlay-gameover" class="overlay hidden">
            <h1 class="text-danger">VOCÊ MORREU</h1>
            <p>Os zumbis devoraram seus restos mortais...</p>
            <button onclick="reiniciarJogo()">TENTAR NOVAMENTE</button>
        </div>

        <div id="overlay-victory" class="overlay hidden">
            <h1 class="text-success">VITÓRIA APOCALÍPTICA!</h1>
            <p>O Zumbi Chefe Mutante foi destruído e a ameaça foi erradicada!</p>
            <button onclick="reiniciarJogo()">JOGAR NOVAMENTE</button>
        </div>
    </div>

    <div class="controls-guide">
        <span><b>Mover:</b> A / D ou Setas</span>
        <span><b>Pular:</b> Espaço / W / Seta Cima</span>
        <span><b>Atirar:</b> J / Clique Esquerdo</span>
        <span><b>Trocar Arma:</b> Q / Teclas 1 e 2</span>
    </div>

    <script src="script.js"></script>
</body>
</html>
2. style.css
Ícone do app CSS
zombie_game/style
 CSS 
Aberto
CSS
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none;
}

body {
    background-color: #080808;
    color: #e0e0e0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    overflow: hidden;
}

#game-container {
    position: relative;
    width: 900px;
    height: 450px;
    border: 3px solid #333;
    box-shadow: 0 0 35px rgba(0, 0, 0, 0.9), 0 0 15px rgba(255, 60, 0, 0.2);
    border-radius: 6px;
    overflow: hidden;
}

#gameCanvas {
    display: block;
    background-color: #121212;
}

#hud {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 15px 20px;
}

.hud-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.health-box {
    background: rgba(15, 15, 15, 0.85);
    padding: 8px 14px;
    border-radius: 6px;
    border: 1px solid #444;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
}

.hud-label {
    font-size: 11px;
    font-weight: bold;
    color: #aaa;
    letter-spacing: 1px;
    display: block;
    margin-bottom: 4px;
}

.health-bar-container {
    position: relative;
    width: 220px;
    height: 18px;
    background: #222;
    border-radius: 3px;
    overflow: hidden;
    border: 1px solid #555;
}

#player-health-bar {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #ff3333, #00e676);
    transition: width 0.1s ease-out;
}

#player-health-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 11px;
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px #000;
}

.stage-box {
    background: rgba(15, 15, 15, 0.85);
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid #444;
    color: #ffaa00;
    font-weight: bold;
    font-size: 14px;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.hud-bottom {
    display: flex;
    gap: 12px;
}

.weapon-box {
    background: rgba(20, 20, 20, 0.8);
    border: 2px solid #444;
    padding: 8px 14px;
    border-radius: 6px;
    color: #888;
    transition: all 0.2s ease;
}

.weapon-box.active {
    border-color: #ff5500;
    background: rgba(40, 20, 10, 0.9);
    color: #fff;
    box-shadow: 0 0 12px rgba(255, 85, 0, 0.4);
}

.weapon-name {
    font-size: 13px;
    font-weight: bold;
}

.weapon-desc {
    font-size: 10px;
    opacity: 0.8;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(5, 5, 5, 0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

.overlay.hidden { display: none; }

.overlay h1 {
    font-size: 42px;
    margin-bottom: 10px;
    letter-spacing: 2px;
}

.text-danger { color: #ff2a2a; text-shadow: 0 0 15px rgba(255,0,0,0.6); }
.text-success { color: #00ff66; text-shadow: 0 0 15px rgba(0,255,100,0.6); }

.overlay p {
    font-size: 16px;
    color: #ccc;
    margin-bottom: 25px;
}

.overlay button {
    background: #ff4500;
    color: #fff;
    border: none;
    padding: 12px 28px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(255, 69, 0, 0.4);
    transition: all 0.2s;
}

.overlay button:hover {
    background: #ff631c;
    transform: scale(1.05);
}

.controls-guide {
    margin-top: 15px;
    display: flex;
    gap: 20px;
    font-size: 13px;
    color: #888;
    background: #111;
    padding: 8px 18px;
    border-radius: 20px;
    border: 1px solid #222;
}

.controls-guide b { color: #ddd; }
3. script.js
Ícone do app JS
zombie_game/script
 JS 
Aberto
🎮 Características e Recursos Implementados
Cenário Apocalíptico:

Paleta de cores escura e cinzenta.

Prédios e casas destruídas com telhados caindo e janelas quebradas.

Efeitos de chamas e fumaça dinâmica ao fundo.

Personagem Principal:

Possui cabeça, tronco, 2 braços e 2 pernas articulados.

Cabelos longos, pretos e desgrenhados caindo sobre a cabeça.

Roupas esfarrapadas com rasgos realistas.

Inimigos e Zumbis:

Zumbis comuns, rápidos/rastejantes e brutamontes (diferentes formas, tamanhos, velocidades e barras de vida).

Possuem braços, pernas, cabeça e mandíbulas abertas revelando dentes podres amarelados.

Armas e Efeitos de Tiro:

Pistola (Tecla 1): Rápida para eliminar zumbis menores.

Arma Pesada (Tecla 2): Projetéis massivos com alto dano, ideais para destruição de barricadas de entulho no cenário e causar dano no chefe.

Efeito Visual de Tiro Melhora: Inclui muzzle flash (brilho da boca da arma), rastros luminosos de alta velocidade e partículas de impacto/faíscas no momento do tiro.

Fase 2 & Zumbi Chefe:

Ao avançar até o final do mapa na Fase 1, o jogador é transportado para a arena da Fase 2.

Chefe Mutante: Design humanoide musculoso, grotesco, com veias tóxicas.

Habilidades Especiais do Chefe:

Invoca ondas de zumbis de suporte.

Lança projéteis de ácido verde.

Executa investidas violentas com alta velocidade ao ficar com pouca vida.

faça os codigos do java script

Para poder ajudar você com o código em JavaScript, preciso saber o que exatamente você deseja criar ou resolver!

Por favor, detalhe qual é o seu objetivo:

Aplicação Web: Quer manipular elementos de uma página HTML (como criar um botão interativo ou um formulário)?

Lógica de Programação: Precisa resolver um exercício específico (usando loops, arrays, funções ou condicionais)?

Node.js: Está desenvolvendo algo para o lado do servidor ou criando uma API?

Se tiver um trecho de código com erro ou a descrição de um projeto em mente, compartilhe aqui para construirmos a solução juntos.




Suas conversas de SEED não são usadas para aprimorar nossos modelos. O Gemini não é humano. Ele pode cometer erros. Por isso, cheque as respostas. Sua privacidade e o GeminiAbre em uma nova janela

// --- SETUP INICIAL E CANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- VARIÁVEIS DE ESTADO ---
let faseAtual = 1; // 1 = Ruínas da Cidade, 2 = Arena do Chefe
let gameOver = false;
let jogoVencido = false;
let gameTime = 0;

// --- TECLAS E INPUTS ---
const keys = {};
window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    
    if (e.key === '1') selecionarArma('pistola');
    if (e.key === '2') selecionarArma('pesada');
    if (key === 'q') {
        selecionarArma(jogador.armaAtual === 'pistola' ? 'pesada' : 'pistola');
    }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('mousedown', e => {
    if (e.button === 0 && !gameOver && !jogoVencido) {
        atirar();
    }
});

function selecionarArma(arma) {
    jogador.armaAtual = arma;
    document.getElementById('weapon-pistol').classList.toggle('active', arma === 'pistola');
    document.getElementById('weapon-heavy').classList.toggle('active', arma === 'pesada');
}

// --- JOGADOR (SOBREVIVENTE) ---
const jogador = {
    x: 50,
    y: 280,
    largura: 34,
    altura: 58,
    velocidade: 4.2,
    velY: 0,
    gravidade: 0.65,
    forcaPulo: -12.5,
    noChao: false,
    vidaMax: 100,
    vida: 100,
    armaAtual: 'pistola',
    cooldownTiro: 0,
    viradoDireita: true,
    passoAnimacao: 0
};

// --- ARMAS ---
const armas = {
    pistola: {
        dano: 30,
        cooldownMax: 12,
        velBala: 14,
        tamanhoBala: 4,
        corBala: '#ffea00',
        rastroCor: 'rgba(255, 234, 0, 0.4)',
        recuo: 2,
        flashSize: 12
    },
    pesada: {
        dano: 110,
        cooldownMax: 28,
        velBala: 18,
        tamanhoBala: 8,
        corBala: '#ff3300',
        rastroCor: 'rgba(255, 60, 0, 0.5)',
        recuo: 6,
        flashSize: 22
    }
};

// --- ESTRUTURAS DO MUNDO ---
let projeteis = [];
let projeteisChefe = [];
let particulas = [];
let zumbis = [];
let obstaculos = [];
let chefe = null;

const TAMANHO_MAPA = 2600;
let cameraX = 0;

// Fundo: Prédios e Casas Destruídas
const prediosFundo = [];
for (let i = 0; i < 35; i++) {
    prediosFundo.push({
        x: i * 90 + Math.random() * 20 - 10,
        largura: 55 + Math.random() * 45,
        altura: 160 + Math.random() * 190,
        cor: `rgb(${20 + Math.random() * 20}, ${20 + Math.random() * 20}, ${22 + Math.random() * 20})`,
        telhadoDestruido: Math.random() > 0.4
    });
}

// Chamas Apocalípticas no Fundo
const focosDeFogo = [];
for (let i = 0; i < 40; i++) {
    focosDeFogo.push({
        x: Math.random() * TAMANHO_MAPA,
        y: 120 + Math.random() * 180,
        tamanho: Math.random() * 20 + 10
    });
}

// --- INICIALIZAÇÃO DE FASES ---
function iniciarFase1() {
    faseAtual = 1;
    jogador.x = 50;
    jogador.vida = jogador.vidaMax;
    zumbis = [];
    obstaculos = [];
    projeteis = [];
    particulas = [];
    document.getElementById('stage-title').innerText = "FASE 1: CIDADE EM RUÍNAS";

    // Obstáculos destruíveis (Barricadas de Entulho)
    for (let x = 500; x < TAMANHO_MAPA - 400; x += 550) {
        obstaculos.push({
            x: x,
            y: 280,
            largura: 42,
            altura: 55,
            vida: 180,
            vidaMax: 180
        });
    }

    // Inimigos com Formas e Tamanhos Variados
    for (let x = 380; x < TAMANHO_MAPA - 200; x += 160) {
        let rand = Math.random();
        if (rand < 0.45) {
            // Zumbi Comum
            zumbis.push({
                x: x, y: 280, largura: 32, altura: 55, vel: 1.3,
                vida: 60, vidaMax: 60, dano: 12, tipo: 'comum',
                corPele: '#4b6148', corRoupa: '#3d3d3d', passo: Math.random() * 10
            });
        } else if (rand < 0.75) {
            // Zumbi Rápido / Rastejante
            zumbis.push({
                x: x, y: 298, largura: 28, altura: 37, vel: 2.3,
                vida: 40, vidaMax: 40, dano: 8, tipo: 'rapido',
                corPele: '#637a54', corRoupa: '#524336', passo: Math.random() * 10
            });
        } else {
            // Zumbi Brutamontes (Grande)
            zumbis.push({
                x: x, y: 255, largura: 48, altura: 80, vel: 0.7,
                vida: 220, vidaMax: 220, dano: 28, tipo: 'tanque',
                corPele: '#2d3b2b', corRoupa: '#222222', passo: Math.random() * 10
            });
        }
    }
}

function iniciarFase2() {
    faseAtual = 2;
    jogador.x = 60;
    cameraX = 0;
    zumbis = [];
    obstaculos = [];
    projeteis = [];
    projeteisChefe = [];
    document.getElementById('stage-title').innerText = "FASE 2: CONFRONTO COM O CHEFE MUTANTE";

    // Criar Zumbi Chefe Imponente e Grotesco
    chefe = {
        x: 620,
        y: 195,
        largura: 95,
        altura: 140,
        vida: 1600,
        vidaMax: 1600,
        vel: 1.1,
        cdAtaque: 0,
        estado: 'normal', // 'normal', 'investida', 'canalizando'
        timerEstado: 0,
        passo: 0
    };
}

// --- SISTEMA DE TIRO E PARTÍCULAS ---
function atirar() {
    if (jogador.cooldownTiro > 0) return;

    const arma = armas[jogador.armaAtual];
    const direcao = jogador.viradoDireita ? 1 : -1;
    const canoX = jogador.x + (jogador.viradoDireita ? jogador.largura + 6 : -6);
    const canoY = jogador.y + 22;

    // Criar Projetil
    projeteis.push({
        x: canoX,
        y: canoY,
        vx: direcao * arma.velBala,
        vy: (Math.random() - 0.5) * 0.4, // leve dispersão
        raio: arma.tamanhoBala,
        dano: arma.dano,
        cor: arma.corBala,
        rastro: arma.rastroCor,
        tipoArma: jogador.armaAtual
    });

    // Muzzle Flash (Brilho do Tiro)
    criarFlash(canoX, canoY, arma.flashSize, arma.corBala);

    // Faíscas de Disparo
    for (let i = 0; i < 6; i++) {
        particulas.push({
            x: canoX,
            y: canoY,
            vx: direcao * (Math.random() * 4 + 2),
            vy: (Math.random() - 0.5) * 3,
            vida: 1,
            decay: Math.random() * 0.1 + 0.08,
            cor: arma.corBala,
            tamanho: Math.random() * 3 + 1
        });
    }

    // Aplicação de Recuo
    jogador.x -= direcao * arma.recuo;
    jogador.cooldownTiro = arma.cooldownMax;
}

function criarFlash(x, y, tamanho, cor) {
    particulas.push({
        x: x, y: y,
        vx: 0, vy: 0,
        vida: 1,
        decay: 0.25,
        cor: cor,
        tamanho: tamanho,
        isFlash: true
    });
}

function criarImpacto(x, y, cor, quantidade = 8) {
    for (let i = 0; i < quantidade; i++) {
        particulas.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            vida: 1,
            decay: Math.random() * 0.08 + 0.05,
            cor: cor,
            tamanho: Math.random() * 4 + 2
        });
    }
}

// --- LÓGICA DE ATUALIZAÇÃO ---
function update() {
    if (gameOver || jogoVencido) return;
    gameTime++;

    if (jogador.cooldownTiro > 0) jogador.cooldownTiro--;

    // Movimentação do Jogador
    let movendo = false;
    if (keys['a'] || keys['arrowleft']) {
        jogador.x -= jogador.velocidade;
        jogador.viradoDireita = false;
        movendo = true;
    }
    if (keys['d'] || keys['arrowright']) {
        jogador.x += jogador.velocidade;
        jogador.viradoDireita = true;
        movendo = true;
    }
    if (movendo) jogador.passoAnimacao += 0.2;

    if ((keys[' '] || keys['w'] || keys['arrowup']) && jogador.noChao) {
        jogador.velY = jogador.forcaPulo;
        jogador.noChao = false;
    }

    if (keys['j']) atirar();

    // Aplicação da Gravidade
    jogador.velY += jogador.gravidade;
    jogador.y += jogador.velY;

    // Solo
    if (jogador.y >= 277) {
        jogador.y = 277;
        jogador.velY = 0;
        jogador.noChao = true;
    }

    // Limites de Tela e Transição de Fase
    if (jogador.x < 0) jogador.x = 0;

    if (faseAtual === 1) {
        if (jogador.x > TAMANHO_MAPA - jogador.largura) {
            iniciarFase2();
        }
        // Câmera
        cameraX = jogador.x - 200;
        if (cameraX < 0) cameraX = 0;
        if (cameraX > TAMANHO_MAPA - canvas.width) cameraX = TAMANHO_MAPA - canvas.width;
    } else {
        cameraX = 0;
        if (jogador.x > canvas.width - jogador.largura) jogador.x = canvas.width - jogador.largura;
    }

    // Atualizar Projetéis do Jogador
    for (let i = projeteis.length - 1; i >= 0; i--) {
        let p = projeteis[i];
        p.x += p.vx;
        p.y += p.vy;

        let colidiu = false;

        // Colisão com Obstáculos
        for (let j = obstaculos.length - 1; j >= 0; j--) {
            let obs = obstaculos[j];
            if (p.x > obs.x && p.x < obs.x + obs.largura && p.y > obs.y && p.y < obs.y + obs.altura) {
                obs.vida -= p.dano;
                criarImpacto(p.x, p.y, '#aaa', 6);
                colidiu = true;
                if (obs.vida <= 0) {
                    criarImpacto(obs.x + obs.largura / 2, obs.y + obs.altura / 2, '#666', 20);
                    obstaculos.splice(j, 1);
                }
                break;
            }
        }

        // Colisão com Zumbis
        if (!colidiu) {
            for (let j = zumbis.length - 1; j >= 0; j--) {
                let z = zumbis[j];
                if (p.x > z.x && p.x < z.x + z.largura && p.y > z.y && p.y < z.y + z.altura) {
                    z.vida -= p.dano;
                    criarImpacto(p.x, p.y, '#8b0000', 8); // Sangue escuro
                    colidiu = true;
                    if (z.vida <= 0) {
                        criarImpacto(z.x + z.largura / 2, z.y + z.altura / 2, '#550000', 15);
                        zumbis.splice(j, 1);
                    }
                    break;
                }
            }
        }

        // Colisão com Chefe
        if (!colidiu && faseAtual === 2 && chefe && chefe.vida > 0) {
            if (p.x > chefe.x && p.x < chefe.x + chefe.largura && p.y > chefe.y && p.y < chefe.y + chefe.altura) {
                chefe.vida -= p.dano;
                criarImpacto(p.x, p.y, '#990000', 10);
                colidiu = true;
                if (chefe.vida <= 0) {
                    jogoVencido = true;
                    document.getElementById('overlay-victory').classList.remove('hidden');
                }
            }
        }

        // Destruir projeto fora da câmera
        if (colidiu || p.x < cameraX - 50 || p.x > cameraX + canvas.width + 50) {
            projeteis.splice(i, 1);
        }
    }

    // Atualizar Obstáculos Colisão do Jogador
    for (let obs of obstaculos) {
        if (jogador.x + jogador.largura > obs.x && jogador.x < obs.x + obs.largura &&
            jogador.y + jogador.altura > obs.y) {
            if (jogador.x < obs.x) jogador.x = obs.x - jogador.largura;
            else if (jogador.x > obs.x) jogador.x = obs.x + obs.largura;
        }
    }

    // Atualizar Zumbis
    for (let z of zumbis) {
        z.passo += 0.1;
        if (z.x > jogador.x + 10) z.x -= z.vel;
        else if (z.x < jogador.x - 10) z.x += z.vel;

        // Ataque ao Jogador
        if (jogador.x < z.x + z.largura && jogador.x + jogador.largura > z.x &&
            jogador.y < z.y + z.altura && jogador.y + jogador.altura > z.y) {
            causarDanoJogador(0.4);
        }
    }

    // --- COMPORTAMENTO DO CHEFE ---
    if (faseAtual === 2 && chefe && chefe.vida > 0) {
        chefe.passo += 0.08;
        chefe.cdAtaque++;

        // Movimento do Chefe em Direção ao Jogador
        if (chefe.estado === 'normal') {
            if (chefe.x > jogador.x + 80) chefe.x -= chefe.vel;
            else if (chefe.x < jogador.x - 80) chefe.x += chefe.vel;
        }

        // Habilidade Especial 1: Invocar Zumbis de Suporte
        if (chefe.cdAtaque % 280 === 0) {
            zumbis.push({
                x: chefe.x - 30, y: 280, largura: 32, altura: 55, vel: 1.5,
                vida: 70, vidaMax: 70, dano: 10, tipo: 'comum',
                corPele: '#4b6148', corRoupa: '#3d3d3d', passo: 0
            });
            criarImpacto(chefe.x, chefe.y + 50, '#ff0000', 15);
        }

        // Habilidade Especial 2: Projétil Tópico / Ácido
        if (chefe.cdAtaque % 160 === 0) {
            projeteisChefe.push({
                x: chefe.x,
                y: chefe.y + 40,
                vx: (jogador.x - chefe.x) / 45,
                vy: -4, // Arco de arremesso
                raio: 12,
                cor: '#39ff14' // Verde Ácido
            });
        }

        // Habilidade Especial 3: Investida Furiosa com pouca vida
        if (chefe.vida < chefe.vidaMax * 0.4 && chefe.cdAtaque % 300 === 0) {
            chefe.estado = 'investida';
            chefe.timerEstado = 40;
        }

        if (chefe.estado === 'investida') {
            chefe.x -= 7; // Investida rápida para a esquerda
            chefe.timerEstado--;
            if (chefe.timerEstado <= 0) chefe.estado = 'normal';
        }

        // Colisão Direta com Chefe
        if (jogador.x < chefe.x + chefe.largura && jogador.x + jogador.largura > chefe.x &&
            jogador.y < chefe.y + chefe.altura && jogador.y + jogador.altura > chefe.y) {
            causarDanoJogador(1.2);
        }
    }

    // Projetéis do Chefe
    for (let i = projeteisChefe.length - 1; i >= 0; i--) {
        let pc = projeteisChefe[i];
        pc.x += pc.vx;
        pc.y += pc.vy;
        pc.vy += 0.2; // Gravidade na bola de ácido

        // Colisão com Jogador
        if (jogador.x < pc.x + pc.raio && jogador.x + jogador.largura > pc.x - pc.raio &&
            jogador.y < pc.y + pc.raio && jogador.y + jogador.altura > pc.y - pc.raio) {
            causarDanoJogador(22);
            criarImpacto(pc.x, pc.y, '#39ff14', 12);
            projeteisChefe.splice(i, 1);
            continue;
        }

        // Colisão com o Solo
        if (pc.y >= 335) {
            criarImpacto(pc.x, 335, '#39ff14', 8);
            projeteisChefe.splice(i, 1);
        }
    }

    // Atualizar Partículas
    for (let i = particulas.length - 1; i >= 0; i--) {
        let p = particulas[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vida -= p.decay;
        if (p.vida <= 0) particulas.splice(i, 1);
    }

    // Atualizar Interface de Vida
    const healthPercent = Math.max(0, (jogador.vida / jogador.vidaMax) * 100);
    document.getElementById('player-health-bar').style.width = healthPercent + '%';
    document.getElementById('player-health-text').innerText = `${Math.ceil(jogador.vida)} / ${jogador.vidaMax}`;
}

function causarDanoJogador(qtd) {
    jogador.vida -= qtd;
    if (jogador.vida <= 0) {
        jogador.vida = 0;
        gameOver = true;
        document.getElementById('overlay-gameover').classList.remove('hidden');
    }
}

// --- RENDERIZAÇÃO DO JOGO ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    // --- 1. PLANO DE FUNDO APOCALÍPTICO ---
    // Prédios destruídos em tom cinzento
    for (let p of prediosFundo) {
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x, 335 - p.altura, p.largura, p.altura);

        // Detalhes de destruição / rachaduras
        ctx.fillStyle = '#0f0f11';
        if (p.telhadoDestruido) {
            ctx.beginPath();
            ctx.moveTo(p.x, 335 - p.altura);
            ctx.lineTo(p.x + p.largura / 2, 335 - p.altura + 25);
            ctx.lineTo(p.x + p.largura, 335 - p.altura);
            ctx.fill();
        }

        // Janelas escuras quebradas
        for (let jx = p.x + 6; jx < p.x + p.largura - 10; jx += 14) {
            for (let jy = 335 - p.altura + 20; jy < 310; jy += 22) {
                if ((jx + jy) % 3 !== 0) ctx.fillRect(jx, jy, 7, 10);
            }
        }
    }

    // Efeito de Fogo nos Prédios do Fundo
    for (let f of focosDeFogo) {
        let oscilacao = Math.sin(gameTime * 0.1 + f.x) * 4;
        let grad = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, f.tamanho + oscilacao);
        grad.addColorStop(0, 'rgba(255, 120, 0, 0.8)');
        grad.addColorStop(0.5, 'rgba(255, 30, 0, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.tamanho + oscilacao, 0, Math.PI * 2);
        ctx.fill();
    }

    // Solo Decomposto / Asfalto Destruído
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 335, TAMANHO_MAPA + 800, 115);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 335, TAMANHO_MAPA + 800, 4); // Linha do solo

    // --- 2. OBSTÁCULOS (BARRICADAS DE ENTULHO) ---
    for (let obs of obstaculos) {
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(obs.x, obs.y, obs.largura, obs.altura);
        
        // Detalhes de vigas de ferro e blocos
        ctx.fillStyle = '#222';
        ctx.fillRect(obs.x + 5, obs.y + 10, 12, 12);
        ctx.fillRect(obs.x + 22, obs.y + 30, 15, 10);

        // Barra de Vida do Obstáculo
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(obs.x, obs.y - 10, obs.largura, 5);
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(obs.x, obs.y - 10, obs.largura * (obs.vida / obs.vidaMax), 5);
    }

    // --- 3. ZUMBIS VARIADOS ---
    for (let z of zumbis) {
        desenharZumbi(z);
    }

    // --- 4. CHEFE FINAL IMPONENTE ---
    if (faseAtual === 2 && chefe) {
        desenharChefe(chefe);
    }

    // --- 5. PERSONAGEM PRINCIPAL (HERÓI) ---
    desenharJogador(jogador);

    // --- 6. PROJETÉIS E MELHORIAS DE TIRO ---
    for (let p of projeteis) {
        // Rastro Estilizado de Alta Velocidade
        let rastroX = p.x - p.vx * 2.5;
        let grad = ctx.createLinearGradient(p.x, p.y, rastroX, p.y);
        grad.addColorStop(0, p.cor);
        grad.addColorStop(1, 'transparent');

        ctx.strokeStyle = grad;
        ctx.lineWidth = p.raio * 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(rastroX, p.y);
        ctx.stroke();

        // Núcleo da Bala
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }

    // Projetéis de Ácido do Chefe
    for (let pc of projeteisChefe) {
        ctx.fillStyle = pc.cor;
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pc.x, pc.y, pc.raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // --- 7. PARTÍCULAS E EFECTS ---
    for (let p of particulas) {
        ctx.globalAlpha = p.vida;
        ctx.fillStyle = p.cor;
        if (p.isFlash) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(p.x, p.y, p.tamanho, p.tamanho);
        }
        ctx.globalAlpha = 1.0;
    }

    ctx.restore();
}

// --- DESENHO DETALHADO DO JOGADOR ---
function desenharJogador(j) {
    ctx.save();
    ctx.translate(j.x + j.largura / 2, j.y);
    if (!j.viradoDireita) ctx.scale(-1, 1);

    const dir = 1;
    const offsetPasso = Math.sin(j.passoAnimacao) * 8;

    // Perneira / Pernas (Roupa Esfarrapada)
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 6;
    // Perna Esquerda
    ctx.beginPath();
    ctx.moveTo(-4, 32);
    ctx.lineTo(-6 - offsetPasso, 56);
    ctx.stroke();
    // Perna Direita
    ctx.beginPath();
    ctx.moveTo(4, 32);
    ctx.lineTo(6 + offsetPasso, 56);
    ctx.stroke();

    // Tronco / Roupa Rasgada
    ctx.fillStyle = '#3a4b53'; // Camisa rasgada cinza-azulada
    ctx.fillRect(-10, 16, 20, 22);

    // Rasgos na Roupa
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-6, 22, 5, 8);
    ctx.fillRect(2, 30, 6, 4);

    // Cabeça e Pele
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.arc(0, 8, 9, 0, Math.PI * 2);
    ctx.fill();

    // Cabelos Longos e Desgrenhados
    ctx.fillStyle = '#1c1917'; // Cabelo escuro eshefado
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.quadraticCurveTo(-14, 15, -10, 28);
    ctx.quadraticCurveTo(-4, 12, 0, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(-4, 18, -6, 32);
    ctx.quadraticCurveTo(4, 15, 6, 2);
    ctx.fill();

    // Braços e Armas
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 5;
    
    // Braço Segurando a Arma
    ctx.beginPath();
    ctx.moveTo(-2, 20);
    ctx.lineTo(12, 22);
    ctx.stroke();

    // Arma
    if (j.armaAtual === 'pistola') {
        ctx.fillStyle = '#111';
        ctx.fillRect(10, 18, 12, 6);
        ctx.fillRect(10, 22, 4, 6);
    } else {
        // Arma Pesada
        ctx.fillStyle = '#222';
        ctx.fillRect(8, 15, 22, 10);
        ctx.fillStyle = '#ff4500';
        ctx.fillRect(18, 17, 4, 6); // Detalhe Laranja
    }

    ctx.restore();
}

// --- DESENHO DETALHADO DOS ZUMBIS ---
function desenharZumbi(z) {
    ctx.save();
    ctx.translate(z.x + z.largura / 2, z.y);

    const balanco = Math.sin(z.passo) * 5;

    // Pernas Decompostas
    ctx.strokeStyle = '#1f241e';
    ctx.lineWidth = z.tipo === 'tanque' ? 9 : 5;
    ctx.beginPath();
    ctx.moveTo(-6, z.altura * 0.55);
    ctx.lineTo(-8 + balanco, z.altura);
    ctx.moveTo(6, z.altura * 0.55);
    ctx.lineTo(8 - balanco, z.altura);
    ctx.stroke();

    // Tronco Esfarrapado
    ctx.fillStyle = z.corRoupa;
    ctx.fillRect(-z.largura * 0.4, z.altura * 0.25, z.largura * 0.8, z.altura * 0.35);

    // Cabeça
    ctx.fillStyle = z.corPele;
    ctx.beginPath();
    ctx.arc(0, z.altura * 0.15, z.largura * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // Boca Decomposta com Dentes Podres
    ctx.fillStyle = '#111';
    ctx.fillRect(-6, z.altura * 0.16, 12, 6);

    // Dentes Podres
    ctx.fillStyle = '#cccc88';
    ctx.fillRect(-5, z.altura * 0.16, 2, 3);
    ctx.fillRect(-1, z.altura * 0.16, 2, 3);
    ctx.fillRect(3, z.altura * 0.16, 2, 3);

    // Olhos Fundos
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-5, z.altura * 0.1, 3, 3);

    // Braços Zumbi Esticados
    ctx.strokeStyle = z.corPele;
    ctx.lineWidth = z.tipo === 'tanque' ? 7 : 4;
    ctx.beginPath();
    ctx.moveTo(-4, z.altura * 0.3);
    ctx.lineTo(-z.largura * 0.8, z.altura * 0.35 + balanco);
    ctx.stroke();

    // Barra de Vida
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-z.largura / 2, -12, z.largura, 5);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(-z.largura / 2, -12, z.largura * (z.vida / z.vidaMax), 5);

    ctx.restore();
}

// --- DESENHO DO ZUMBI CHEFE IMPONENTE E GROTESCO ---
function desenharChefe(c) {
    ctx.save();
    ctx.translate(c.x + c.largura / 2, c.y);

    const pulsacao = Math.sin(gameTime * 0.1) * 3;

    // Sombra de Poder
    ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, c.altura, c.largura, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pernas Musculosas Gigantes
    ctx.fillStyle = '#2b1b1b';
    ctx.fillRect(-30, c.altura * 0.6, 22, c.altura * 0.4);
    ctx.fillRect(8, c.altura * 0.6, 22, c.altura * 0.4);

    // Tronco Humanoide Musculoso e Grotesco
    ctx.fillStyle = c.estado === 'investida' ? '#a31c1c' : '#571c1c';
    ctx.beginPath();
    ctx.moveTo(-c.largura * 0.5 - pulsacao, c.altura * 0.2);
    ctx.lineTo(c.largura * 0.5 + pulsacao, c.altura * 0.2);
    ctx.lineTo(c.largura * 0.3, c.altura * 0.65);
    ctx.lineTo(-c.largura * 0.3, c.altura * 0.65);
    ctx.closePath();
    ctx.fill();

    // Veias Mutantes Brilhantes
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-15, c.altura * 0.3);
    ctx.lineTo(0, c.altura * 0.5);
    ctx.lineTo(15, c.altura * 0.35);
    ctx.stroke();

    // Cabeça Grotesca
    ctx.fillStyle = '#3b1212';
    ctx.beginPath();
    ctx.arc(0, c.altura * 0.12, 22, 0, Math.PI * 2);
    ctx.fill();

    // Mandíbula Enorme e Dentes Podres Amarelados
    ctx.fillStyle = '#0a0505';
    ctx.fillRect(-14, c.altura * 0.12, 28, 14);

    ctx.fillStyle = '#e6e68a'; // Dentes pontiagudos
    for (let dx = -12; dx < 12; dx += 5) {
        ctx.fillRect(dx, c.altura * 0.12, 3, 5);
        ctx.fillRect(dx + 2, c.altura * 0.18, 3, 5);
    }

    // Olhos Vermelhos Brilhantes
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 8;
    ctx.fillRect(-10, c.altura * 0.07, 6, 6);
    ctx.fillRect(4, c.altura * 0.07, 6, 6);
    ctx.shadowBlur = 0;

    // Braços Gigantes com Garras
    ctx.fillStyle = '#421515';
    ctx.fillRect(-c.largura * 0.6, c.altura * 0.22, 18, c.altura * 0.45);
    ctx.fillRect(c.largura * 0.6 - 18, c.altura * 0.22, 18, c.altura * 0.45);

    ctx.restore();
}

// --- FUNÇÃO REINICIAR ---
function reiniciarJogo() {
    gameOver = false;
    jogoVencido = false;
    document.getElementById('overlay-gameover').classList.add('hidden');
    document.getElementById('overlay-victory').classList.add('hidden');
    selecionarArma('pistola');
    iniciarFase1();
}

// --- LOOP PRINCIPAL DO JOGO ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicializar
iniciarFase1();
gameLoop();
zombie_game/script.js
Exibindo zombie_game/script.js.