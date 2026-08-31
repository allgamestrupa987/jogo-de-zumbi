const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Estado do Jogo
let pontos = 0;
let abates = 0;
let gameOver = false;
const teclas = {};

// Paleta de Cores baseada na imagem enviada
const CORES = {
    asfalto: "#6e6e73",
    calcada: "#aaaaaf",
    meioFio: "#505055",
    cabelo: "#e65a8c",
    pele: "#f0c8b4",
    roupa: "#285096",
    arma: "#282828",
    zumbi: "#6e965a",
    sangue: "#b41414",
    tiro: "#ffe664"
};

// Configurações da Personagem (Cabelo Rosa)
const jogador = {
    x: 80,
    y: 300,
    largura: 45,
    altura: 60,
    velocidade: 5,
    vida: 3,
    desenhar() {
        // Cabelo Rosa (Formato Chibi)
        ctx.fillStyle = CORES.cabelo;
        ctx.beginPath();
        ctx.roundRect(this.x + 5, this.y, 35, 30, 10);
        ctx.fill();

        // Rosto
        ctx.fillStyle = CORES.pele;
        ctx.fillRect(this.x + 10, this.y + 15, 25, 15);

        // Roupa Azul
        ctx.fillStyle = CORES.roupa;
        ctx.fillRect(this.x + 10, this.y + 30, 25, 20);

        // Arma (Rifle apontado para a direita)
        ctx.fillStyle = CORES.arma;
        ctx.fillRect(this.x + 25, this.y + 38, 20, 8);
    },
    atualizar() {
        // Restrições de movimento para não sair do asfalto
        if ((teclas['ArrowUp'] || teclas['w']) && this.y > 155) this.y -= this.velocidade;
        if ((teclas['ArrowDown'] || teclas['s']) && this.y + this.altura < canvas.height - 20) this.y += this.velocidade;
        if ((teclas['ArrowLeft'] || teclas['a']) && this.x > 0) this.x -= this.velocidade;
        if ((teclas['ArrowRight'] || teclas['d']) && this.x + this.largura < canvas.width - 100) this.x += this.velocidade;
    },
    atirar() {
        tiros.push({
            x: this.x + this.largura - 5,
            y: this.y + 38,
            largura: 12,
            altura: 5,
            velocidade: 12
        });
    }
};

// Coleções de elementos na tela
let tiros = [];
let zumbis = [];

// Escutas de teclado (Input)
window.addEventListener('keydown', e => {
    teclas[e.key] = true;
    if (e.key === ' ' && !gameOver) {
        jogador.atirar();
    }
    if ((e.key === 'r' || e.key === 'R') && gameOver) {
        reiniciarJogo();
    }
});

window.addEventListener('keyup', e => {
    teclas[e.key] = false;
});

// Criador de Inimigos (Zumbis Cabeçudos)
function spawnZumbi() {
    let frequencia = Math.max(0.015, 0.035 - (abates * 0.0005));
    if (Math.random() < frequencia) {
        zumbis.push({
            x: canvas.width + Math.random() * 100,
            y: 160 + Math.random() * (canvas.height - 240),
            largura: 45,
            altura: 60,
            velocidade: 2 + Math.random() * 2
        });
    }
}

function reiniciarJogo() {
    pontos = 0;
    abates = 0;
    gameOver = false;
    tiros = [];
    zumbis = [];
    jogador.x = 80;
    jogador.y = 300;
    jogador.vida = 3;
}

// Desenha o cenário urbano estilo desenho animado
function desenharCenario() {
    // Chão / Asfalto
    ctx.fillStyle = CORES.asfalto;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calçada de fundo
    ctx.fillStyle = CORES.calcada;
    ctx.fillRect(0, 0, canvas.width, 140);

    // Guia / Meio-fio
    ctx.fillStyle = CORES.meioFio;
    ctx.fillRect(0, 140, canvas.width, 15);

    // Detalhes e rachaduras na rua
    ctx.strokeStyle = CORES.meioFio;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 300); ctx.lineTo(280, 
300);
    ctx.moveTo(550, 420); ctx.lineTo(610, 420);
    ctx.stroke();
}

function desenharZumbi(zumbi) {
    // Cabeça Grande Quadrada
    ctx.fillStyle = CORES.zumbi;
    ctx.beginPath();
    ctx.roundRect(zumbi.x + 5, zumbi.y, 35, 32, 5);
    ctx.fill();

    // Olhos Assustadores (Branco e Vermelho)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(zumbi.x + 15, zumbi.y + 12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(zumbi.x + 30, zumbi.y + 12, 5, 0, Math.PI * 2); ctx.fill();
    
    ctx.fillStyle = CORES.sangue;
    ctx.beginPath(); ctx.arc(zumbi.x + 15, zumbi.y + 12, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(zumbi.x + 30, zumbi.y + 12, 2, 0, Math.PI * 2); ctx.fill();

    // Jaleco/Roupa Cinza Rasgada
    ctx.fillStyle = "#d2d2d2";
    ctx.fillRect(zumbi.x + 10, zumbi.y + 32, 25, 20);

    // Linha de contorno (Estilo HQ/Cartoon)
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(zumbi.x + 5, zumbi.y, 35, 60, 5);
    ctx.stroke();
}

function desenharHUD() {
    // Placar de Vidas (Canto Superior Esquerdo)
    ctx.fillStyle = CORES.sangue;
    ctx.font = "28px Impact";
    ctx.textAlign = "left";
    ctx.fillText(`HP: ${jogador.vida}`, 20, 40);

    // Painel de Pontuação Vermelho (Igual à Foto)
    ctx.fillStyle = CORES.sangue;
    ctx.fillRect(canvas.width - 180, 15, 160, 40);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width - 180, 15, 160, 40);

    // Texto dos Pontos
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(pontos, canvas.width - 100, 45);

    // Instruções Inferiores
    ctx.fillStyle = "#000000";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Controles: Setas / WASD para andar • ESPAÇO para atirar", 20, canvas.height - 20);
}

// Loop de Processamento do Jogo (FPS)
function loop() {
    desenharCenario();

    if (!gameOver) {
        jogador.atualizar();
        jogador.desenhar();

        // Gerenciamento dos Tiros
        for (let i = tiros.length - 1; i >= 0; i--) {
            let t = tiros[i];
            t.x += t.velocidade;
            
            ctx.fillStyle = CORES.tiro;
            ctx.fillRect(t.x, t.y, t.largura, t.altura);

            if (t.x > canvas.width) tiros.splice(i, 1);
        }

        // Gerenciamento dos Zumbis
        spawnZumbi();
        for (let i = zumbis.length - 1; i >= 0; i--) {
            let z = zumbis[i];
            z.x -= z.velocidade;
            desenharZumbi(z);

            // Verificação de Impacto: Tiro atinge Zumbi
            for (let j = tiros.length - 1; j >= 0; j--) {
                let t = tiros[j];
                if (t.x < z.x + z.largura && t.x + t.largura > z.x && t.y < z.y + z.altura && t.y + t.altura > z.y) {
                    zumbis.splice(i, 1);
                    tiros.splice(j, 1);
                    abates++;
                    pontos += 10;
                    break;
                }
            }

            // Verificação de Impacto: Zumbi morde o jogador
            if (z && jogador.x < z.x + z.largura && jogador.x + jogador.largura > z.x && jogador.y < z.y + z.altura && jogador.y + jogador.altura > z.y) {
                zumbis.splice(i, 1);
                jogador.vida--;
                if (jogador.vida <= 0) gameOver = true;
            }

            if (z && z.x + z.largura < 0) zumbis.splice(i, 1);
        }
    } else {
        // Menu de Fim de Jogo (Game Over)
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = CORES.sangue;
        ctx.font = "50px Impact";
        ctx.textAlign = "center";
        ctx.fillText("FIM DE JOGO", canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = "#ffffff";
        ctx.font = "24px Impact";
        ctx.fillText("Pressione 'R' para Recomeçar", canvas.width / 2, canvas.height / 2 + 30);
    }

    desenharHUD();
    requestAnimationFrame(loop);
}

// Disparar o jogo
loop();