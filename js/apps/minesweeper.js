/**
 * Minesweeper Game
 * A classic minesweeper implementation
 */
(function() {
    'use strict';
    
    // Game state
    let windowId = null;
    let gameGrid = [];
    let gridSize = 9; // Default to beginner level
    let mineCount = 10;
    let flagCount = 0;
    let gameStarted = false;
    let gameOver = false;
    let timer = 0;
    let timerInterval = null;
    let firstClick = true;
    
    // Difficulty levels
    const LEVELS = {
        beginner: { size: 9, mines: 10 },
        intermediate: { size: 16, mines: 40 },
        expert: { size: 16, mines: 99 } // Modified to fit better on screen (original is 30x16 with 99 mines)
    };
    
    // Cell state constants
    const CELL = {
        HIDDEN: 0,
        REVEALED: 1,
        FLAGGED: 2,
        MINE: 9
    };
    
    // Initialize the app
    function init() {
        // Nothing to do here, app will be initialized when opened
    }
    
    // Open the Minesweeper application
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
            title: Translations.get('minesweeper'),
            icon: 'assets/icons/minesweeper.svg',
            appName: 'minesweeper',
            width: 400,
            height: 450,
            x: 100,
            y: 100,
            content: content,
            className: 'game-window minesweeper-window',
            onClose: handleClose,
            onFocus: handleFocus,
            onUpdate: updateTranslations
        });
        
        // Set up event handlers
        attachEventHandlers();
        
        // Initialize game
        initGame();
    }
    
    // Create the window content HTML
    function createWindowContent() {
        return `
            <div class="game-container minesweeper-container">
                <div class="game-controls">
                    <div class="game-info">
                        <div class="game-score" id="minesweeper-flags">010</div>
                        <div class="minesweeper-face">😊</div>
                        <div class="game-time" id="minesweeper-timer">000</div>
                    </div>
                </div>
                
                <div class="minesweeper-grid" style="--grid-size: ${gridSize}">
                    <!-- Grid cells will be generated dynamically -->
                </div>
                
                <div class="game-status" id="minesweeper-status"></div>
                
                <div class="game-levels">
                    <div class="game-level active" data-level="beginner" data-translate="easy">${Translations.get('easy')}</div>
                    <div class="game-level" data-level="intermediate" data-translate="medium">${Translations.get('medium')}</div>
                    <div class="game-level" data-level="expert" data-translate="hard">${Translations.get('hard')}</div>
                </div>
            </div>
        `;
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Face button to restart game
        const faceButton = windowContent.querySelector('.minesweeper-face');
        faceButton.addEventListener('click', restartGame);
        
        // Level selection
        const levelButtons = windowContent.querySelectorAll('.game-level');
        levelButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all level buttons
                levelButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Set difficulty level
                const level = this.dataset.level;
                setDifficulty(level);
                
                // Restart game
                restartGame();
            });
        });
    }
    
    // Initialize the game grid
    function initGame() {
        // Set up difficulty
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update grid size in CSS
        const gridElement = windowContent.querySelector('.minesweeper-grid');
        gridElement.style.setProperty('--grid-size', gridSize);
        
        // Initialize empty grid
        gameGrid = [];
        for (let y = 0; y < gridSize; y++) {
            const row = [];
            for (let x = 0; x < gridSize; x++) {
                row.push({
                    x: x,
                    y: y,
                    isMine: false,
                    adjacentMines: 0,
                    state: CELL.HIDDEN
                });
            }
            gameGrid.push(row);
        }
        
        // Reset game state
        flagCount = 0;
        gameStarted = false;
        gameOver = false;
        firstClick = true;
        timer = 0;
        
        // Clear timer if it exists
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Update UI elements
        updateFlagsDisplay();
        updateTimerDisplay();
        updateStatusDisplay('');
        
        // Set face to smile
        const faceElement = windowContent.querySelector('.minesweeper-face');
        faceElement.textContent = '😊';
        
        // Create grid cells
        createGridCells();
    }
    
    // Create the grid cells in the DOM
    function createGridCells() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const gridElement = windowContent.querySelector('.minesweeper-grid');
        gridElement.innerHTML = '';
        
        // Create cell elements
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cellElement = document.createElement('div');
                cellElement.className = 'minesweeper-cell';
                cellElement.dataset.x = x;
                cellElement.dataset.y = y;
                
                // Add event listeners
                cellElement.addEventListener('click', handleCellClick);
                cellElement.addEventListener('contextmenu', handleCellRightClick);
                
                gridElement.appendChild(cellElement);
            }
        }
    }
    
    // Place mines on the grid, avoiding the first clicked cell
    function placeMines(excludeX, excludeY) {
        let minesPlaced = 0;
        
        while (minesPlaced < mineCount) {
            const x = Math.floor(Math.random() * gridSize);
            const y = Math.floor(Math.random() * gridSize);
            
            // Skip the first clicked cell and any cell that already has a mine
            if ((x === excludeX && y === excludeY) || gameGrid[y][x].isMine) {
                continue;
            }
            
            // Place a mine
            gameGrid[y][x].isMine = true;
            minesPlaced++;
        }
        
        // Calculate adjacent mines for each cell
        calculateAdjacentMines();
    }
    
    // Calculate the number of adjacent mines for each cell
    function calculateAdjacentMines() {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (gameGrid[y][x].isMine) continue;
                
                let count = 0;
                
                // Check all 8 adjacent cells
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        // Check if adjacent cell is within bounds
                        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                            if (gameGrid[ny][nx].isMine) {
                                count++;
                            }
                        }
                    }
                }
                
                gameGrid[y][x].adjacentMines = count;
            }
        }
    }
    
    // Handle cell click
    function handleCellClick(e) {
        e.preventDefault();
        
        if (gameOver) return;
        
        const x = parseInt(e.target.dataset.x);
        const y = parseInt(e.target.dataset.y);
        
        // Handle first click
        if (firstClick) {
            firstClick = false;
            placeMines(x, y);
            startTimer();
        }
        
        // If cell is already revealed or flagged, do nothing
        if (gameGrid[y][x].state === CELL.REVEALED || gameGrid[y][x].state === CELL.FLAGGED) {
            return;
        }
        
        // Reveal the cell
        revealCell(x, y);
        
        // Update UI
        updateGridDisplay();
        
        // Check win condition
        checkWinCondition();
    }
    
    // Handle cell right-click (flag)
    function handleCellRightClick(e) {
        e.preventDefault();
        
        if (gameOver) return;
        
        const x = parseInt(e.target.dataset.x);
        const y = parseInt(e.target.dataset.y);
        
        // If cell is already revealed, do nothing
        if (gameGrid[y][x].state === CELL.REVEALED) {
            return;
        }
        
        // Toggle flag state
        if (gameGrid[y][x].state === CELL.FLAGGED) {
            gameGrid[y][x].state = CELL.HIDDEN;
            flagCount--;
        } else {
            gameGrid[y][x].state = CELL.FLAGGED;
            flagCount++;
        }
        
        // Start timer if first click
        if (firstClick) {
            firstClick = false;
            placeMines(x, y);
            startTimer();
        }
        
        // Update UI
        updateGridDisplay();
        updateFlagsDisplay();
    }
    
    // Reveal a cell
    function revealCell(x, y) {
        const cell = gameGrid[y][x];
        
        // If cell is already revealed or flagged, do nothing
        if (cell.state === CELL.REVEALED || cell.state === CELL.FLAGGED) {
            return;
        }
        
        // Mark cell as revealed
        cell.state = CELL.REVEALED;
        
        // Check if cell is a mine
        if (cell.isMine) {
            // Game over!
            handleGameOver(false);
            return;
        }
        
        // If cell has no adjacent mines, reveal all adjacent cells
        if (cell.adjacentMines === 0) {
            // Reveal all adjacent cells recursively
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    // Check if adjacent cell is within bounds
                    if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                        revealCell(nx, ny);
                    }
                }
            }
        }
    }
    
    // Update the grid display to match the game state
    function updateGridDisplay() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const cells = windowContent.querySelectorAll('.minesweeper-cell');
        
        cells.forEach(cellElement => {
            const x = parseInt(cellElement.dataset.x);
            const y = parseInt(cellElement.dataset.y);
            const cell = gameGrid[y][x];
            
            // Reset cell classes
            cellElement.className = 'minesweeper-cell';
            cellElement.textContent = '';
            
            // Apply appropriate styling based on cell state
            if (cell.state === CELL.REVEALED) {
                cellElement.classList.add('revealed');
                
                if (cell.isMine) {
                    cellElement.classList.add('mine');
                } else if (cell.adjacentMines > 0) {
                    cellElement.textContent = cell.adjacentMines;
                    // Add color class based on number
                    cellElement.classList.add(`number-${cell.adjacentMines}`);
                }
            } else if (cell.state === CELL.FLAGGED) {
                cellElement.classList.add('flagged');
            }
        });
    }
    
    // Check if the player has won
    function checkWinCondition() {
        let hiddenCells = 0;
        
        // Count hidden cells
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (gameGrid[y][x].state !== CELL.REVEALED && !gameGrid[y][x].isMine) {
                    hiddenCells++;
                }
            }
        }
        
        // If no hidden non-mine cells remain, player wins
        if (hiddenCells === 0) {
            handleGameOver(true);
        }
    }
    
    // Handle game over
    function handleGameOver(isWin) {
        gameOver = true;
        
        // Stop the timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update face
        const faceElement = windowContent.querySelector('.minesweeper-face');
        faceElement.textContent = isWin ? '😎' : '😵';
        
        // Update status
        updateStatusDisplay(isWin ? Translations.get('youWin') : Translations.get('gameOver'));
        
        // If loss, reveal all mines
        if (!isWin) {
            revealAllMines();
        } else {
            // If win, flag all remaining mines
            flagAllMines();
        }
    }
    
    // Reveal all mines when game is lost
    function revealAllMines() {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (gameGrid[y][x].isMine) {
                    gameGrid[y][x].state = CELL.REVEALED;
                }
            }
        }
        
        // Update grid display
        updateGridDisplay();
    }
    
    // Flag all mines when game is won
    function flagAllMines() {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (gameGrid[y][x].isMine && gameGrid[y][x].state !== CELL.FLAGGED) {
                    gameGrid[y][x].state = CELL.FLAGGED;
                    flagCount++;
                }
            }
        }
        
        // Update grid display and flag count
        updateGridDisplay();
        updateFlagsDisplay();
    }
    
    // Start the game timer
    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        gameStarted = true;
        timer = 0;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timer++;
            updateTimerDisplay();
            
            // Cap at 999 seconds
            if (timer >= 999) {
                clearInterval(timerInterval);
            }
        }, 1000);
    }
    
    // Update the timer display
    function updateTimerDisplay() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const timerElement = windowContent.querySelector('#minesweeper-timer');
        timerElement.textContent = timer.toString().padStart(3, '0');
    }
    
    // Update the flags display
    function updateFlagsDisplay() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const flagsElement = windowContent.querySelector('#minesweeper-flags');
        const remainingFlags = mineCount - flagCount;
        flagsElement.textContent = remainingFlags.toString().padStart(3, '0');
    }
    
    // Update the status display
    function updateStatusDisplay(message) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const statusElement = windowContent.querySelector('#minesweeper-status');
        statusElement.textContent = message;
    }
    
    // Set difficulty level
    function setDifficulty(level) {
        if (LEVELS[level]) {
            gridSize = LEVELS[level].size;
            mineCount = LEVELS[level].mines;
            
            // Update grid size in CSS
            const windowContent = WindowManager.getWindowContentElement(windowId);
            if (windowContent) {
                const gridElement = windowContent.querySelector('.minesweeper-grid');
                gridElement.style.setProperty('--grid-size', gridSize);
            }
        }
    }
    
    // Restart the game
    function restartGame() {
        // Stop timer if running
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Initialize new game
        initGame();
    }
    
    // Handle window close
    function handleClose() {
        // Stop timer if running
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Reset state
        windowId = null;
        gameGrid = [];
        gameStarted = false;
        gameOver = false;
        
        return true;
    }
    
    // Handle window focus
    function handleFocus() {
        // Nothing to do here for now
    }
    
    // Update translations
    function updateTranslations() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update all translatable elements
        Translations.updateElements(windowContent);
        
        // Update window title
        WindowManager.updateWindowTitle(windowId, Translations.get('minesweeper'));
        
        // Update status if game is over
        if (gameOver) {
            const faceElement = windowContent.querySelector('.minesweeper-face');
            const isWin = faceElement.textContent === '😎';
            updateStatusDisplay(isWin ? Translations.get('youWin') : Translations.get('gameOver'));
        }
    }
    
    // Public API
    window.MinesweeperApp = {
        init: init,
        open: open
    };
})();
