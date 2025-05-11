/**
 * Tetris Game
 * A classic Tetris implementation
 */
(function() {
    'use strict';
    
    // Game state
    let windowId = null;
    let board = [];
    let currentPiece = null;
    let nextPiece = null;
    let gameOver = false;
    let paused = false;
    let score = 0;
    let level = 1;
    let lines = 0;
    let gameLoop = null;
    let dropSpeed = 1000; // Base speed in milliseconds
    
    // Game constants
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const CELL_SIZE = 25;
    
    // Tetromino shapes
    const SHAPES = [
        // I
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        // J
        [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ],
        // L
        [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ],
        // O
        [
            [4, 4],
            [4, 4]
        ],
        // S
        [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ],
        // T
        [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ],
        // Z
        [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ]
    ];
    
    // Initialize the app
    function init() {
        // Nothing to do here, app will be initialized when opened
    }
    
    // Open the Tetris application
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
            title: Translations.get('tetris'),
            icon: 'assets/icons/tetris.svg',
            appName: 'tetris',
            width: 500,
            height: 600,
            x: 200,
            y: 50,
            content: content,
            className: 'game-window tetris-window',
            onClose: handleClose,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onUpdate: updateTranslations
        });
        
        // Set up event handlers
        attachEventHandlers();
        
        // Start the game
        initGame();
    }
    
    // Create the window content HTML
    function createWindowContent() {
        return `
            <div class="game-container tetris-container">
                <div class="game-controls">
                    <div class="game-info">
                        <div class="game-score" id="tetris-score">0</div>
                        <div class="game-button" id="tetris-new-game" data-translate="newGame">${Translations.get('newGame')}</div>
                        <div class="game-button" id="tetris-pause" data-translate="pause">${Translations.get('pause')}</div>
                    </div>
                </div>
                
                <div class="tetris-container">
                    <div class="tetris-board"></div>
                    
                    <div class="tetris-sidebar">
                        <div data-translate="next">${Translations.get('next')}</div>
                        <div class="tetris-next"></div>
                        
                        <div class="tetris-info">
                            <div class="tetris-label" data-translate="level">${Translations.get('level')}</div>
                            <div class="tetris-value" id="tetris-level">1</div>
                            
                            <div class="tetris-label" data-translate="lines">${Translations.get('lines')}</div>
                            <div class="tetris-value" id="tetris-lines">0</div>
                        </div>
                    </div>
                </div>
                
                <div class="game-status" id="tetris-status"></div>
                
                <div class="game-levels">
                    <div class="game-level active" data-level="1" data-translate="easy">${Translations.get('easy')}</div>
                    <div class="game-level" data-level="3" data-translate="medium">${Translations.get('medium')}</div>
                    <div class="game-level" data-level="5" data-translate="hard">${Translations.get('hard')}</div>
                </div>
            </div>
        `;
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // New game button
        const newGameButton = windowContent.querySelector('#tetris-new-game');
        newGameButton.addEventListener('click', initGame);
        
        // Pause button
        const pauseButton = windowContent.querySelector('#tetris-pause');
        pauseButton.addEventListener('click', togglePause);
        
        // Keyboard control
        document.addEventListener('keydown', handleKeyDown);
        
        // Level selection
        const levelButtons = windowContent.querySelectorAll('.game-level');
        levelButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all level buttons
                levelButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Set level
                level = parseInt(this.dataset.level) || 1;
                updateDropSpeed();
                updateLevelDisplay();
                
                // If game is running, restart with new level
                if (gameLoop) {
                    clearInterval(gameLoop);
                    startGameLoop();
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
        
        // Initialize the board
        board = [];
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < BOARD_WIDTH; x++) {
                row.push(0);
            }
            board.push(row);
        }
        
        // Reset game state
        score = 0;
        lines = 0;
        gameOver = false;
        paused = false;
        
        // Create game board in DOM
        createGameBoard();
        createNextPieceDisplay();
        
        // Generate first piece
        currentPiece = generateRandomPiece();
        nextPiece = generateRandomPiece();
        
        // Update displays
        updateScoreDisplay();
        updateLinesDisplay();
        updateLevelDisplay();
        updateStatusDisplay('');
        drawNextPiece();
        
        // Update pause button text
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (windowContent) {
            const pauseButton = windowContent.querySelector('#tetris-pause');
            pauseButton.textContent = Translations.get('pause');
        }
        
        // Start game loop
        updateDropSpeed();
        startGameLoop();
    }
    
    // Create the game board in the DOM
    function createGameBoard() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const boardElement = windowContent.querySelector('.tetris-board');
        boardElement.innerHTML = '';
        boardElement.style.gridTemplateColumns = `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`;
        boardElement.style.gridTemplateRows = `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`;
        
        // Create cells
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = 'tetris-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                boardElement.appendChild(cell);
            }
        }
    }
    
    // Create the next piece display
    function createNextPieceDisplay() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const nextDisplay = windowContent.querySelector('.tetris-next');
        nextDisplay.innerHTML = '';
        nextDisplay.style.gridTemplateColumns = `repeat(4, ${CELL_SIZE}px)`;
        nextDisplay.style.gridTemplateRows = `repeat(4, ${CELL_SIZE}px)`;
        
        // Create cells
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement('div');
                cell.className = 'tetris-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                nextDisplay.appendChild(cell);
            }
        }
    }
    
    // Start the game loop
    function startGameLoop() {
        gameLoop = setInterval(() => {
            if (!gameOver && !paused) {
                update();
            }
        }, dropSpeed);
    }
    
    // Update game state
    function update() {
        // Move current piece down
        if (!movePiece(0, 1)) {
            // If can't move down, lock piece in place
            placePiece();
            
            // Check for cleared lines
            const clearedLines = checkLines();
            if (clearedLines > 0) {
                updateScore(clearedLines);
            }
            
            // Generate new piece
            currentPiece = nextPiece;
            nextPiece = generateRandomPiece();
            drawNextPiece();
            
            // Check if game is over
            if (!isValidPosition(currentPiece.shape, currentPiece.x, currentPiece.y)) {
                gameOver = true;
                updateStatusDisplay(Translations.get('gameOver'));
                clearInterval(gameLoop);
                gameLoop = null;
            }
        }
        
        // Redraw the board
        drawBoard();
    }
    
    // Draw the board
    function drawBoard() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Clear all cells
        const cells = windowContent.querySelectorAll('.tetris-board .tetris-cell');
        cells.forEach(cell => {
            cell.className = 'tetris-cell';
        });
        
        // Draw the board
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (board[y][x] > 0) {
                    const cell = windowContent.querySelector(`.tetris-board .tetris-cell[data-x="${x}"][data-y="${y}"]`);
                    if (cell) {
                        cell.classList.add(`cell-${board[y][x]}`);
                    }
                }
            }
        }
        
        // Draw current piece
        if (currentPiece) {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x] > 0) {
                        const boardX = currentPiece.x + x;
                        const boardY = currentPiece.y + y;
                        
                        if (boardY >= 0) { // Don't draw off-screen
                            const cell = windowContent.querySelector(`.tetris-board .tetris-cell[data-x="${boardX}"][data-y="${boardY}"]`);
                            if (cell) {
                                cell.classList.add(`cell-${currentPiece.shape[y][x]}`);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Draw the next piece
    function drawNextPiece() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Clear all cells
        const cells = windowContent.querySelectorAll('.tetris-next .tetris-cell');
        cells.forEach(cell => {
            cell.className = 'tetris-cell';
        });
        
        // Center the piece
        const offsetX = Math.floor((4 - nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((4 - nextPiece.shape.length) / 2);
        
        // Draw next piece
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x] > 0) {
                    const cellX = offsetX + x;
                    const cellY = offsetY + y;
                    const cell = windowContent.querySelector(`.tetris-next .tetris-cell[data-x="${cellX}"][data-y="${cellY}"]`);
                    if (cell) {
                        cell.classList.add(`cell-${nextPiece.shape[y][x]}`);
                    }
                }
            }
        }
    }
    
    // Generate a random tetromino
    function generateRandomPiece() {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        const shape = SHAPES[shapeIndex];
        
        // Calculate start position (centered, top of board)
        const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
        const y = -1; // Start slightly off-screen
        
        return { shape, x, y };
    }
    
    // Move the current piece
    function movePiece(dx, dy) {
        const newX = currentPiece.x + dx;
        const newY = currentPiece.y + dy;
        
        if (isValidPosition(currentPiece.shape, newX, newY)) {
            currentPiece.x = newX;
            currentPiece.y = newY;
            drawBoard();
            return true;
        }
        
        return false;
    }
    
    // Rotate the current piece
    function rotatePiece() {
        const rotatedShape = rotateMatrix(currentPiece.shape);
        
        if (isValidPosition(rotatedShape, currentPiece.x, currentPiece.y)) {
            currentPiece.shape = rotatedShape;
            drawBoard();
            return true;
        }
        
        // Try wall kicks (adjust x position if rotation against wall)
        for (let dx = 1; dx <= 2; dx++) {
            // Try right
            if (isValidPosition(rotatedShape, currentPiece.x + dx, currentPiece.y)) {
                currentPiece.shape = rotatedShape;
                currentPiece.x += dx;
                drawBoard();
                return true;
            }
            
            // Try left
            if (isValidPosition(rotatedShape, currentPiece.x - dx, currentPiece.y)) {
                currentPiece.shape = rotatedShape;
                currentPiece.x -= dx;
                drawBoard();
                return true;
            }
        }
        
        return false;
    }
    
    // Rotate a matrix clockwise
    function rotateMatrix(matrix) {
        const N = matrix.length;
        const result = Array(N).fill().map(() => Array(N).fill(0));
        
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                result[x][N - 1 - y] = matrix[y][x];
            }
        }
        
        return result;
    }
    
    // Check if a position is valid for the current piece
    function isValidPosition(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] > 0) {
                    const boardX = x + col;
                    const boardY = y + row;
                    
                    // Check if out of bounds
                    if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                        return false;
                    }
                    
                    // Skip checking cells above the board
                    if (boardY < 0) continue;
                    
                    // Check if cell is already occupied
                    if (board[boardY][boardX] > 0) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    // Place the current piece on the board
    function placePiece() {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col] > 0) {
                    const boardX = currentPiece.x + col;
                    const boardY = currentPiece.y + row;
                    
                    // Skip if cell is above the board
                    if (boardY < 0) continue;
                    
                    board[boardY][boardX] = currentPiece.shape[row][col];
                }
            }
        }
    }
    
    // Check and clear completed lines
    function checkLines() {
        let linesCleared = 0;
        
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (isLineComplete(y)) {
                clearLine(y);
                linesCleared++;
                y++; // Check the same y again, since lines have moved down
            }
        }
        
        if (linesCleared > 0) {
            lines += linesCleared;
            updateLinesDisplay();
            
            // Level up every 10 lines
            if (lines >= level * 10 && level < 10) {
                level++;
                updateLevelDisplay();
                updateDropSpeed();
                restartGameLoop();
            }
        }
        
        return linesCleared;
    }
    
    // Check if a line is complete
    function isLineComplete(y) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] === 0) {
                return false;
            }
        }
        return true;
    }
    
    // Clear a line and move everything down
    function clearLine(y) {
        // Remove the line
        board.splice(y, 1);
        
        // Add a new empty line at the top
        const newRow = Array(BOARD_WIDTH).fill(0);
        board.unshift(newRow);
    }
    
    // Update the score based on cleared lines
    function updateScore(linesCleared) {
        // Classic Tetris scoring
        const linePoints = [0, 40, 100, 300, 1200];
        score += linePoints[linesCleared] * level;
        updateScoreDisplay();
    }
    
    // Update score display
    function updateScoreDisplay() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const scoreElement = windowContent.querySelector('#tetris-score');
        scoreElement.textContent = score;
    }
    
    // Update lines display
    function updateLinesDisplay() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const linesElement = windowContent.querySelector('#tetris-lines');
        linesElement.textContent = lines;
    }
    
    // Update level display
    function updateLevelDisplay() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const levelElement = windowContent.querySelector('#tetris-level');
        levelElement.textContent = level;
    }
    
    // Update status display
    function updateStatusDisplay(message) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const statusElement = windowContent.querySelector('#tetris-status');
        statusElement.textContent = message;
    }
    
    // Update drop speed based on level
    function updateDropSpeed() {
        // Formula: speed = baseSpeed * (0.8 ^ (level - 1))
        dropSpeed = Math.max(100, Math.floor(1000 * Math.pow(0.8, level - 1)));
    }
    
    // Restart the game loop with new speed
    function restartGameLoop() {
        if (gameLoop) {
            clearInterval(gameLoop);
            startGameLoop();
        }
    }
    
    // Handle keyboard input
    function handleKeyDown(e) {
        // Only handle keys if the window is active
        if (!WindowManager.isWindowActive(windowId)) {
            return;
        }
        
        if (gameOver) return;
        
        if (paused) {
            // Only allow unpausing when paused
            if (e.key === ' ' || e.key === 'p') {
                togglePause();
                e.preventDefault();
            }
            return;
        }
        
        // Game controls
        switch (e.key) {
            case 'ArrowLeft':
                movePiece(-1, 0);
                e.preventDefault();
                break;
                
            case 'ArrowRight':
                movePiece(1, 0);
                e.preventDefault();
                break;
                
            case 'ArrowDown':
                movePiece(0, 1);
                e.preventDefault();
                break;
                
            case 'ArrowUp':
            case 'x':
                rotatePiece();
                e.preventDefault();
                break;
                
            case 'z':
                // Counter-clockwise rotation (not implemented)
                e.preventDefault();
                break;
                
            case ' ': // Space bar - Hard drop
                hardDrop();
                e.preventDefault();
                break;
                
            case 'p': // Pause
                togglePause();
                e.preventDefault();
                break;
                
            case 'r': // Restart
                initGame();
                e.preventDefault();
                break;
        }
    }
    
    // Hard drop - move piece down as far as possible
    function hardDrop() {
        let dropCount = 0;
        
        // Keep moving down while valid
        while (movePiece(0, 1)) {
            dropCount++;
        }
        
        // Update score for hard drop (2 points per cell)
        score += dropCount * 2;
        updateScoreDisplay();
        
        // Force immediate update
        update();
    }
    
    // Toggle pause state
    function togglePause() {
        if (gameOver) return;
        
        paused = !paused;
        
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (windowContent) {
            const pauseButton = windowContent.querySelector('#tetris-pause');
            pauseButton.textContent = paused ? Translations.get('resume') : Translations.get('pause');
        }
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
        board = [];
        currentPiece = null;
        nextPiece = null;
        
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
        WindowManager.updateWindowTitle(windowId, Translations.get('tetris'));
        
        // Update pause button based on state
        const pauseButton = windowContent.querySelector('#tetris-pause');
        if (pauseButton) {
            pauseButton.textContent = paused ? Translations.get('resume') : Translations.get('pause');
        }
        
        // Update status if game is over
        if (gameOver) {
            updateStatusDisplay(Translations.get('gameOver'));
        }
    }
    
    // Public API
    window.TetrisApp = {
        init: init,
        open: open
    };
})();
