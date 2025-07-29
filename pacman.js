// Game setup
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

// Assets
let blueGhostImage, orangeGhostImage, pinkGhostImage, redGhostImage;
let pacmanUpImage, pacmanDownImage, pacmanLeftImage, pacmanRightImage;
let wallImage;

// Game variables
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O       bpo       O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X     P     X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
const movementSpeed = tileSize / 8;
let score = 0;
let lives = 3;
let gameOver = false;
let nextDirection = null;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    loadImages();
    loadMap();
    for (let ghost of ghosts.values()) {
        ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
    }
    gameLoop();
    document.addEventListener("keyup", handleInput);
};

// Load assets
function loadImages() {
    wallImage = new Image(); wallImage.src = "./images/wall.png";
    blueGhostImage = new Image(); blueGhostImage.src = "./images/blueGhost.png";
    orangeGhostImage = new Image(); orangeGhostImage.src = "./images/orangeGhost.png";
    pinkGhostImage = new Image(); pinkGhostImage.src = "./images/pinkGhost.png";
    redGhostImage = new Image(); redGhostImage.src = "./images/redGhost.png";
    pacmanUpImage = new Image(); pacmanUpImage.src = "./images/pacmanUp.png";
    pacmanDownImage = new Image(); pacmanDownImage.src = "./images/pacmanDown.png";
    pacmanLeftImage = new Image(); pacmanLeftImage.src = "./images/pacmanLeft.png";
    pacmanRightImage = new Image(); pacmanRightImage.src = "./images/pacmanRight.png";
}

// Build game map
function loadMap() {
    walls.clear(); foods.clear(); ghosts.clear();
    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const char = tileMap[r][c];
            const x = c * tileSize;
            const y = r * tileSize;
            if (char === 'X') walls.add(new Block(wallImage, x, y, tileSize, tileSize));
            else if (char === 'b') ghosts.add(new Block(blueGhostImage, x, y, tileSize, tileSize));
            else if (char === 'o') ghosts.add(new Block(orangeGhostImage, x, y, tileSize, tileSize));
            else if (char === 'p') ghosts.add(new Block(pinkGhostImage, x, y, tileSize, tileSize));
            else if (char === 'r') ghosts.add(new Block(redGhostImage, x, y, tileSize, tileSize));
            else if (char === 'P') pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            else if (char === ' ') foods.add(new Block(null, x + 14, y + 14, 4, 4));
        }
    }
}

// Game loop
function gameLoop() {
    if (!gameOver) {
        move();
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        draw(); // Final frame
    }
}

// Drawing
function draw() {
    context.clearRect(0, 0, board.width, board.height);

    // Draw entities
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    for (let ghost of ghosts.values()) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }
    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }

    // Draw food
    context.fillStyle = "white";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    // Score display
    context.fillStyle = "white";
    context.font = "bold 16px sans-serif";
    context.fillText(gameOver ? "Game Over: " + score : `Lives: ${lives}  Score: ${score}`, tileSize, tileSize);
}

// Movement
function move() {
    if (nextDirection) {
        pacman.updateDirection(nextDirection);
        if (pacman.direction === nextDirection) nextDirection = null;
    }

    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;
    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    for (let ghost of ghosts.values()) {
        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;

        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
            }
        }

        if (collision(ghost, pacman)) {
            lives--;
            if (lives === 0) {
                gameOver = true;
                return;
            }
            resetPositions();
        }
    }

    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    foods.delete(foodEaten);

    if (foods.size === 0) {
        loadMap();
        resetPositions();
    }
}

// Input handling
function handleInput(e) {
    if (gameOver) {
        loadMap();
        resetPositions();
        lives = 3;
        score = 0;
        gameOver = false;
        gameLoop();
        return;
    }

    const dirMap = {
        "ArrowUp": "U", "KeyW": "U",
        "ArrowDown": "D", "KeyS": "D",
        "ArrowLeft": "L", "KeyA": "L",
        "ArrowRight": "R", "KeyD": "R"
    };

    const dir = dirMap[e.code];
    if (dir) {
        nextDirection = dir;
        updatePacmanImage(dir);
    }
}

function updatePacmanImage(dir) {
    if (dir === 'U') pacman.image = pacmanUpImage;
    else if (dir === 'D') pacman.image = pacmanDownImage;
    else if (dir === 'L') pacman.image = pacmanLeftImage;
    else if (dir === 'R') pacman.image = pacmanRightImage;
}

// Reset
function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    for (let ghost of ghosts.values()) {
        ghost.reset();
        ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
    }
}

// Collision detection
function collision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Velocity helper
function getVelocityFromDirection(dir) {
    if (dir === 'U') return [0, -movementSpeed];
    if (dir === 'D') return [0, movementSpeed];
    if (dir === 'L') return [-movementSpeed, 0];
    if (dir === 'R') return [movementSpeed, 0];
    return [0, 0];
}

// Block class
class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.startX = x;
        this.startY = y;

        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(dir) {
        const [vx, vy] = getVelocityFromDirection(dir);
        const testX = this.x + vx;
        const testY = this.y + vy;

        let temp = new Block(null, testX, testY, this.width, this.height);
        for (let wall of walls.values()) {
            if (collision(temp, wall)) return;
        }

        this.direction = dir;
        this.velocityX = vx;
        this.velocityY = vy;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }
}
