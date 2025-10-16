const canvas = document.querySelector("#tetris");
const scoreboard = document.querySelector("#score");
const timerDisplay = document.querySelector("#time");
const startButton = document.querySelector("#start-button");
const overlay = document.querySelector("#game-overlay");
const toast = document.querySelector("#toast");
const ctx = canvas.getContext("2d");

// Mobile Control Buttons
const leftBtn = document.querySelector("#left-btn");
const rightBtn = document.querySelector("#right-btn");
const downBtn = document.querySelector("#down-btn");
const rotateBtn = document.querySelector("#rotate-btn");


const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

const SHAPES = [
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]], // L
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]], // J
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]], // Z
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
];

const COLORS = [
    null, "var(--color-1)", "var(--color-2)", "var(--color-3)",
    "var(--color-4)", "var(--color-5)", "var(--color-6)", "var(--color-7)",
];

let pieceObj = null;
let grid = generateGrid();
let score = 0;
let lastTime = 0;
let fallCounter = 0;
let fallSpeed = 1000;
let animationFrameId = null;
let gameTimer = null;
let gameStartTime = 0;
let isGameOver = false;

// ... (All functions from generateGrid to collision remain the same)

function generateGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function generateRandomPiece() {
    const ran = Math.floor(Math.random() * SHAPES.length);
    return {
        piece: SHAPES[ran],
        colorIndex: ran + 1,
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[ran][0].length / 2),
        y: 0,
    };
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    clearInterval(gameTimer);
    showToast("Game Over! Final Score: " + score);
    overlay.style.opacity = 1;
    overlay.style.pointerEvents = "auto";
}

function startGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    clearInterval(gameTimer);
    isGameOver = false;

    overlay.style.opacity = 0;
    overlay.style.pointerEvents = "none";
    
    score = 0;
    grid = generateGrid();
    pieceObj = generateRandomPiece();
    scoreboard.innerHTML = score;
    fallSpeed = 1000;
    gameStartTime = Date.now();

    startTimers();
    gameLoop(0);
}

function startTimers() {
    gameTimer = setInterval(() => {
        if (isGameOver) return;
        const elapsedTime = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
        const seconds = String(elapsedTime % 60).padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;

        if (elapsedTime > 0 && elapsedTime % 30 === 0 && fallSpeed > 200) {
            fallSpeed -= 100;
        }
    }, 1000);
}

function gameLoop(time = 0) {
    if (isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    fallCounter += deltaTime;
    if (fallCounter > fallSpeed) {
        moveDown();
        fallCounter = 0;
    }

    renderGrid();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function checkGrid() {
    let rowsCleared = 0;
    for (let i = grid.length - 1; i >= 0; i--) {
        if (grid[i].every(cell => cell !== 0)) {
            rowsCleared++;
            grid.splice(i, 1);
            grid.unshift(Array(COLS).fill(0));
            i++;
        }
    }
    if (rowsCleared > 0) {
        score += rowsCleared * 10 * rowsCleared;
    }
    scoreboard.innerHTML = score;
}

function renderGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid.forEach((row, i) => {
        row.forEach((cell, j) => {
            if (cell) {
                renderBlock(j, i, COLORS[cell]);
            }
        });
    });
    if (pieceObj) {
        renderPiece();
    }
}

function renderPiece() {
    const { piece, x, y, colorIndex } = pieceObj;
    piece.forEach((row, i) => {
        row.forEach((cell, j) => {
            if (cell === 1) {
                renderBlock(x + j, y + i, COLORS[colorIndex]);
            }
        });
    });
}

function renderBlock(x, y, color) {
    const baseColor = getComputedStyle(document.documentElement).getPropertyValue(color.slice(4, -1)).trim();
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y);
    ctx.lineTo(x, y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x, y + 1);
    ctx.lineTo(x + 1, y);
    ctx.closePath();
    ctx.fill();
}


function moveDown() {
    if (!pieceObj) return;
    if (!collision(pieceObj.x, pieceObj.y + 1)) {
        pieceObj.y++;
    } else {
        pieceObj.piece.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 1) {
                    let p = pieceObj.x + j;
                    let q = pieceObj.y + i;
                    if (q >= 0) grid[q][p] = pieceObj.colorIndex;
                }
            });
        });
        
        if (pieceObj.y < 1) {
            gameOver();
            return;
        }
        
        checkGrid();
        pieceObj = generateRandomPiece();
    }
}

function moveLeft() {
    if (pieceObj && !collision(pieceObj.x - 1, pieceObj.y)) {
        pieceObj.x--;
    }
}

function moveRight() {
    if (pieceObj && !collision(pieceObj.x + 1, pieceObj.y)) {
        pieceObj.x++;
    }
}

function rotate() {
    if (!pieceObj) return;
    const { piece } = pieceObj;
    const rotated = piece[0].map((_, colIndex) => piece.map(row => row[colIndex]).reverse());
    
    if (!collision(pieceObj.x, pieceObj.y, rotated)) {
        pieceObj.piece = rotated;
    }
}

function collision(x, y, rotatedPiece = pieceObj.piece) {
    for (let i = 0; i < rotatedPiece.length; i++) {
        for (let j = 0; j < rotatedPiece[i].length; j++) {
            if (rotatedPiece[i][j] === 1) {
                let p = x + j;
                let q = y + i;
                if (p < 0 || p >= COLS || q >= ROWS || (q >= 0 && grid[q][p] > 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Event Listeners
startButton.addEventListener("click", startGame);

// Keyboard Controls
document.addEventListener("keydown", (e) => {
    if (isGameOver) return;
    if (e.code === "ArrowDown") {
        moveDown();
        fallCounter = 0;
    }
    else if (e.code === "ArrowLeft") moveLeft();
    else if (e.code === "ArrowRight") moveRight();
    else if (e.code === "ArrowUp") rotate();
});

// Mobile Button Controls
leftBtn.addEventListener("click", () => { if (!isGameOver) moveLeft(); });
rightBtn.addEventListener("click", () => { if (!isGameOver) moveRight(); });
rotateBtn.addEventListener("click", () => { if (!isGameOver) rotate(); });
downBtn.addEventListener("click", () => {
    if (!isGameOver) {
        moveDown();
        fallCounter = 0;
    }
});