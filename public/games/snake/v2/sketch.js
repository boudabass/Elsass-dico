let snake;
let scl = 20;
let food;

function setup() {
    createCanvas(800, 600);
    frameRate(10);
    
    snake = new Snake(scl * 3, scl * 3);

    if (window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
    }
}

function draw() {
    background(20);

    snake.death();
    snake.update();
    snake.edges();
    snake.show();
}

function keyPressed() {
    if (keyCode === UP_ARROW && snake.vel.y === 0) {
        snake.dir(0, -1);
    } else if (keyCode === DOWN_ARROW && snake.vel.y === 0) {
        snake.dir(0, 1);
    } else if (keyCode === LEFT_ARROW && snake.vel.x === 0) {
        snake.dir(-1, 0);
    } else if (keyCode === RIGHT_ARROW && snake.vel.x === 0) {
        snake.dir(1, 0);
    }
}