/**
 * Snake Game
 * A classic Snake game implementation
 */
(function() {
    'use strict';
    
    // Game state
    let windowId = null;
    let canvas = null;
    let ctx = null;
    let snake = [];
    let food = { x: 0, y: 0 };
    let direction = 'right';
    let nextDirection = 'right';
    let gameOver = false;
    let paused = false;
    let score = 0;
    let gridSize = 20;
    let speed = 150; // milliseconds per move
    let gameLoop = null;
    
    // Difficulty levels
    const SPEEDS = {
        easy: 180,
        medium: 130,
        hard: 80
    };
    
    // Initialize the app
    function init() {
        // Nothing to do here, app will be initialized when opened
    }
    
    // Open the Snake application
    function open() {
        // If already open, just focus the window
        if (windowId !== null) {
            WindowManager.activateWindow(windowId);
            return;
        }
        
        // Create window content
        const content = createWindowContent();
        
        // Create the window
        windowId = WindowManager.createWindow({
            title: Translations.get('snake'),
            icon: 'assets/icons/snake.svg',
            appName: 'snake',
            width: 500,
            height: 550,
            x: 150,
            y: 100,
            content: content,
            className: 'game-window snake-window',
            onClose: handleClose,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onUpdate: updateTranslations
        });
        
        // Initialize the canvas
        initCanvas();
        
        // Set up event handlers
        attachEventHandlers();
        
        // Start the game
        initGame();
    }
    
    // Create the window content HTML
    function createWindowContent() {
        return `
            <div class="game-container snake-container">
                <div class="game-controls">
                    <div class="game-info">
                        <div class="game-score" id="snake-score">0</div>
                        <div class="game-button" id="snake-new-game" data-translate="newGame">${Translations.get('newGame')}</div>
                        <div class="game-button" id="snake-pause" data-translate="pause">${Translations.get('pause')}</div>
                    </div>
                </div>
                
                <canvas class="snake-canvas" width="400" height="400"></canvas>
                
                <div class="game-status" id="snake-status"></div>
                
                <div class="snake-controls">
                    <div class="snake-direction-controls">
                        <div class="snake-direction-button" data-direction="up" style="grid-column: 2; grid-row: 1;">
                            <svg viewBox="0 0 24 24">
                                <path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
                            </svg>
                        </div>
                        <div class="snake-direction-button" data-direction="left" style="grid-column: 1; grid-row: 2;">
                            <svg viewBox="0 0 24 24">
                                <path d="M15.41,16.59L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.59Z" />
                            </svg>
                        </div>
                        <div class="snake-direction-button" data-direction="right" style="grid-column: 3; grid-row: 2;">
                            <svg viewBox="0 0 24 24">
                                <path d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z" />
                            </svg>
                        </div>
                        <div class="snake-direction-button" data-direction="down" style="grid-column: 2; grid-row: 3;">
                            <svg viewBox="0 0 24 24">
                                <path d="M7.41,8.59L12,13.17L16.59,8.59L18,10L12,16L6,10L7.41,8.59Z" />
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="game-levels">
                    <div class="game-level active" data-speed="easy" data-translate="easy">${Translations.get('easy')}</div>
                    <div class="game-level" data-speed="medium" data-translate="medium">${Translations.get('medium')}</div>
                    <div class="game-level" data-speed="hard" data-translate="hard">${Translations.get('hard')}</div>
                </div>
            </div>
        `;
    }
    
    // Initialize the canvas
    function initCanvas() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        canvas = windowContent.querySelector('.snake-canvas');
        ctx = canvas.getContext('2d');
        
        // Calculate cell size
        const cellSize = canvas.width / gridSize;
        
        // Set initial canvas style
        canvas.style.backgroundColor = '#222';
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // New game button
        const newGameButton = windowContent.querySelector('#snake-new-game');
        newGameButton.addEventListener('click', initGame);
        
        // Pause button
        const pauseButton = windowContent.querySelector('#snake-pause');
        pauseButton.addEventListener('click', togglePause);
        
        // Direction buttons
        const directionButtons = windowContent.querySelectorAll('.snake-direction-button');
        directionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const newDirection = this.dataset.direction;
                changeDirection(newDirection);
            });
        });
        
        // Keyboard control
        document.addEventListener('keydown', handleKeyDown);
        
        // Speed/level selection
        const levelButtons = windowContent.querySelectorAll('.game-level');
        levelButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all level buttons
                levelButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Set speed
                const speedLevel = this.dataset.speed;
                if (SPEEDS[speedLevel]) {
                    speed = SPEEDS[speedLevel];
                    
                    // If game is running, restart with new speed
                    if (gameLoop) {
                        clearInterval(gameLoop);
                        startGameLoop();
                    }
                }
            });
        });
    }
    
    // Initialize a new game
    function initGame() {
        // Clear any existing game loop
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        
        // Reset game state
        snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        direction = 'right';
        nextDirection = 'right';
        gameOver = false;
        paused = false;
        score = 0;
        
        // Generate initial food
        generateFood();
        
        // Reset UI
        updateScore();
        updateStatusDisplay('');
        
        // Update pause button text
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (windowContent) {
            const pauseButton = windowContent.querySelector('#snake-pause');
            pauseButton.textContent = Translations.get('pause');
        }
        
        // Draw initial state
        draw();
        
        // Start game loop
        startGameLoop();
    }
    
    // Start the game loop
    function startGameLoop() {
        gameLoop = setInterval(() => {
            if (!gameOver && !paused) {
                update();
                draw();
            }
        }, speed);
    }
    
    // Update game state
    function update() {
        // Update direction
        direction = nextDirection;
        
        // Calculate new head position
        const head = { x: snake[0].x, y: snake[0].y };
        
        switch (direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // Check for collisions
        if (checkCollision(head)) {
            gameOver = true;
            updateStatusDisplay(Translations.get('gameOver'));
            return;
        }
        
        // Add new head to snake
        snake.unshift(head);
        
        // Check if food was eaten
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score += 10;
            updateScore();
            
            // Generate new food
            generateFood();
        } else {
            // Remove tail if food wasn't eaten
            snake.pop();
        }
    }
    
    // Draw the game
    function draw() {
        const cellSize = canvas.width / gridSize;
        
        // Clear canvas
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid (optional, for visual reference)
        drawGrid(cellSize);
        
        // Draw snake
        ctx.fillStyle = '#4CAF50';
        snake.forEach((segment, index) => {
            // Draw snake segment
            ctx.fillRect(
                segment.x * cellSize,
                segment.y * cellSize,
                cellSize,
                cellSize
            );
            
            // Add darker border
            ctx.strokeStyle = '#388E3C';
            ctx.strokeRect(
                segment.x * cellSize,
                segment.y * cellSize,
                cellSize,
                cellSize
            );
            
            // Draw eyes on head
            if (index === 0) {
                drawSnakeHead(segment, cellSize);
            }
        });
        
        // Draw food
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(
            food.x * cellSize + cellSize / 2,
            food.y * cellSize + cellSize / 2,
            cellSize / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw pause overlay if paused
        if (paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Translations.get('paused'), canvas.width / 2, canvas.height / 2);
        }
        
        // Draw game over overlay if game is over
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Translations.get('gameOver'), canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '20px Arial';
            ctx.fillText(`${Translations.get('score')}: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        }
    }
    
    // Draw grid lines
    function drawGrid(cellSize) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= gridSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= gridSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(canvas.width, y * cellSize);
            ctx.stroke();
        }
    }
    
    // Draw the snake's head with eyes
    function drawSnakeHead(head, cellSize) {
        ctx.fillStyle = '#fff';
        
        // Draw eyes based on direction
        switch (direction) {
            case 'up':
                // Left eye
                ctx.beginPath();
                ctx.arc(
                    head.x * cellSize + cellSize * 0.3,
                    head.y * cellSize + cellSize * 0.3,
                    cellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // Right eye
                ctx.beginPath();
                ctx.arc(
                    head.x * cellSize + cellSize * 0.7,
                    head.y * cellSize + cellSize * 0.3,
                    cellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                break;
                
            case 'down':
                // Left eye
                ctx.beginPath();
                ctx.arc(
                    head.x * cellSize + cellSize * 0.3,
                    head.y * cellSize + cellSize * 0.7,
                    cellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // Right eye
                ctx.beginPath();
                ctx.arc(
                    head.x * cellSize + cellSize * 0.7,
                    head.y * cellSize + cellSize * 0.7,
                    cellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                break;
                
            case 'left':
                // Top eye
                ctx.beginPath();
                ctx.arc(
                    head.x * cellSize + cellSize * 0.3,
                    head.y * cellSize + cellSize * 0.3,
                    cellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // Bottom eye
                ctx.beginPath();
                ctx.arc(
                    head.x * cellSize + cellSize * 0.3,
                    head.y * cellSize + cellSize * 0.7,
                    cellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                break;
                
            case 'right':
                // Top eye
                ctx.beginPath();
                ctx.arc(
                    head.x * cellSize + cellSize * 0.7,
                    head.y * cellSize + cellSize * 0.3,
                    cellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // Bottom eye
                ctx.beginPath();
                ctx.arc(
                    head.x * cellSize + cellSize * 0.7,
                    head.y * cellSize + cellSize * 0.7,
                    cellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                break;
        }
    }
    
    // Generate food at a random position
    function generateFood() {
        let validPosition = false;
        let newFood = { x: 0, y: 0 };
        
        // Keep generating positions until a valid one is found
        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };
            
            // Check if position overlaps with snake
            validPosition = !snake.some(segment => 
                segment.x === newFood.x && segment.y === newFood.y
            );
        }
        
        food = newFood;
    }
    
    // Check for collisions with walls or snake body
    function checkCollision(position) {
        // Check wall collision
        if (
            position.x < 0 ||
            position.y < 0 ||
            position.x >= gridSize ||
            position.y >= gridSize
        ) {
            return true;
        }
        
        // Check self collision (skip the last segment as it will be removed)
        for (let i = 0; i < snake.length - 1; i++) {
            if (snake[i].x === position.x && snake[i].y === position.y) {
                return true;
            }
        }
        
        return false;
    }
    
    // Change the snake's direction
    function changeDirection(newDirection) {
        // Prevent 180-degree turns
        if (
            (direction === 'up' && newDirection === 'down') ||
            (direction === 'down' && newDirection === 'up') ||
            (direction === 'left' && newDirection === 'right') ||
            (direction === 'right' && newDirection === 'left')
        ) {
            return;
        }
        
        nextDirection = newDirection;
    }
    
    // Handle keyboard input
    function handleKeyDown(e) {
        // Only handle keys if the window is active
        if (!WindowManager.isWindowActive(windowId)) {
            return;
        }
        
        // Game controls
        switch (e.key) {
            case 'ArrowUp':
                changeDirection('up');
                e.preventDefault();
                break;
                
            case 'ArrowDown':
                changeDirection('down');
                e.preventDefault();
                break;
                
            case 'ArrowLeft':
                changeDirection('left');
                e.preventDefault();
                break;
                
            case 'ArrowRight':
                changeDirection('right');
                e.preventDefault();
                break;
                
            case ' ': // Space bar
                togglePause();
                e.preventDefault();
                break;
                
            case 'r': // Restart
                initGame();
                e.preventDefault();
                break;
        }
    }
    
    // Toggle pause state
    function togglePause() {
        if (gameOver) return;
        
        paused = !paused;
        
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (windowContent) {
            const pauseButton = windowContent.querySelector('#snake-pause');
            pauseButton.textContent = paused ? Translations.get('resume') : Translations.get('pause');
        }
        
        draw();
    }
    
    // Update score display
    function updateScore() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const scoreElement = windowContent.querySelector('#snake-score');
        scoreElement.textContent = score;
    }
    
    // Update status display
    function updateStatusDisplay(message) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const statusElement = windowContent.querySelector('#snake-status');
        statusElement.textContent = message;
    }
    
    // Handle window close
    function handleClose() {
        // Stop game loop
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', handleKeyDown);
        
        // Reset state
        windowId = null;
        canvas = null;
        ctx = null;
        
        return true;
    }
    
    // Handle window focus
    function handleFocus() {
        // Nothing specific to do here
    }
    
    // Handle window blur
    function handleBlur() {
        // Pause the game when window loses focus
        if (!paused && !gameOver) {
            togglePause();
        }
    }
    
    // Update translations
    function updateTranslations() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update all translatable elements
        Translations.updateElements(windowContent);
        
        // Update window title
        WindowManager.updateWindowTitle(windowId, Translations.get('snake'));
        
        // Update pause button based on state
        const pauseButton = windowContent.querySelector('#snake-pause');
        if (pauseButton) {
            pauseButton.textContent = paused ? Translations.get('resume') : Translations.get('pause');
        }
        
        // Update status if game is over
        if (gameOver) {
            updateStatusDisplay(Translations.get('gameOver'));
        }
        
        // Redraw canvas for any text elements
        if (canvas && ctx) {
            draw();
        }
    }
    
    // Public API
    window.SnakeApp = {
        init: init,
        open: open
    };
})();
