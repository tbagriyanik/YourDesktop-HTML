/**
 * Start Menu
 * Manages the Windows start menu functionality
 */
(function() {
    'use strict';
    
    // DOM elements
    const startMenuElement = document.getElementById('start-menu');
    const startButtonElement = document.getElementById('start-button');
    const appsSection = document.getElementById('apps-section');
    const powerButton = document.getElementById('power-button');
    
    // State
    let isStartMenuOpen = false;
    
    // Initialize start menu
    function init() {
        // Attach event listeners
        attachEventListeners();
        
        // Prepare the start menu content
        prepareStartMenu();
    }
    
    // Attach event listeners
    function attachEventListeners() {
        // Start button click
        startButtonElement.addEventListener('click', toggleStartMenu);
        
        // Click elsewhere to close start menu
        document.addEventListener('click', function(e) {
            if (isStartMenuOpen && 
                !startMenuElement.contains(e.target) && 
                !startButtonElement.contains(e.target)) {
                closeStartMenu();
            }
        });
        
        // Power button click - now serves as reload button
        powerButton.addEventListener('click', function() {
            // Close all open windows and reload the page
            reloadSystem();
        });
        
        // Prevent normal right-click on start menu
        startMenuElement.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Windows key to toggle start menu
            if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) {
                toggleStartMenu();
                e.preventDefault();
            }
            
            // Escape to close start menu if open
            if (e.key === 'Escape' && isStartMenuOpen) {
                closeStartMenu();
                e.preventDefault();
            }
        });
    }
    
    // Toggle start menu visibility
    function toggleStartMenu() {
        if (isStartMenuOpen) {
            closeStartMenu();
        } else {
            openStartMenu();
        }
    }
    
    // Open the start menu
    function openStartMenu() {
        // Update UI
        startMenuElement.classList.remove('hidden');
        startButtonElement.classList.add('active');
        isStartMenuOpen = true;
        
        // Update translations
        Translations.updateElements(startMenuElement);
    }
    
    // Close the start menu
    function closeStartMenu() {
        startMenuElement.classList.add('hidden');
        startButtonElement.classList.remove('active');
        isStartMenuOpen = false;
    }
    
    // Prepare the start menu content
    function prepareStartMenu() {
        // Clear existing content
        appsSection.innerHTML = '';
        
        // App definitions
        const apps = [
            {
                name: 'notepad',
                icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19,3H5C3.89,3 3,3.89 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z" fill="%234d9bec"/><path d="M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z" fill="%234d9bec"/></svg>',
                action: function() { NotepadApp.open(); closeStartMenu(); }
            },
            {
                name: 'paint',
                icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.35,10.04C18.67,6.59 15.64,4 12,4C9.11,4 6.61,5.64 5.36,8.04C2.35,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.04M19,18H6A4,4 0 0,1 2,14C2,11.56 3.78,9.54 6.17,9.08L7.76,8.79L8.32,7.26C9.19,5.16 10.92,4 12,4C14.62,4 16.88,6.1 17.32,8.71L17.5,9.74L18.97,9.96C20.55,10.19 22,12.06 22,15A3,3 0 0,1 19,18M8,13H10.55V16H13.45V13H16L12,9L8,13Z" fill="%23f34a25"/></svg>',
                action: function() { PaintApp.open(); closeStartMenu(); }
            },
            {
                name: 'minesweeper',
                icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23,13V11H21V5C21,3.9 20.1,3 19,3H17V1H15V3H9V1H7V3H5C3.9,3 3,3.9 3,5V11H1V13H3V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V13H23M19,19H5V5H19V19M7,13H9V17H7V13M15,13H17V17H15V13M7,7H9V11H7V7M15,7H17V11H15V7Z" fill="%2380cc28"/></svg>',
                action: function() { MinesweeperApp.open(); closeStartMenu(); }
            },
            {
                name: 'snake',
                icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.5,3L20.34,3.03L15,5.1L9,3L3.36,4.9C3.15,4.97 3,5.15 3,5.38V20.5A0.5,0.5 0 0,0 3.5,21L3.66,20.97L9,18.9L15,21L20.64,19.1C20.85,19.03 21,18.85 21,18.62V3.5A0.5,0.5 0 0,0 20.5,3M10,5.47L14,6.87V18.53L10,17.13V5.47M5,6.46L8,5.45V17.15L5,18.31V6.46M19,17.54L16,18.55V6.86L19,5.7V17.54Z" fill="%23e68619"/></svg>',
                action: function() { SnakeApp.open(); closeStartMenu(); }
            },
            {
                name: 'tetris',
                icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10,2H8C6.89,2 6,2.89 6,4V8C6,9.11 6.89,10 8,10H10C11.11,10 12,9.11 12,8V4C12,2.89 11.11,2 10,2M14,2H16C17.11,2 18,2.89 18,4V8C18,9.11 17.11,10 16,10H14C12.89,10 12,9.11 12,8V4C12,2.89 12.89,2 14,2M8,12H10C11.11,12 12,12.89 12,14V18C12,19.11 11.11,20 10,20H8C6.89,20 6,19.11 6,18V14C6,12.89 6.89,12 8,12M14,12H16C17.11,12 18,12.89 18,14V18C18,19.11 17.11,20 16,20H14C12.89,20 12,19.11 12,18V14C12,12.89 12.89,12 14,12Z" fill="%23a329ae"/></svg>',
                action: function() { TetrisApp.open(); closeStartMenu(); }
            },
            {
                name: 'settings',
                icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" fill="%23727272"/></svg>',
                action: function() { SettingsApp.open(); closeStartMenu(); }
            }
        ];
        
        // Create app items
        apps.forEach(app => {
            const appItem = document.createElement('div');
            appItem.className = 'app-item';
            appItem.innerHTML = `
                <img src="${app.icon}" class="app-icon" alt="">
                <span class="app-name" data-translate="${app.name}">${Translations.get(app.name)}</span>
            `;
            appItem.addEventListener('click', app.action);
            
            // Add right-click context menu
            appItem.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                showAppContextMenu(e.clientX, e.clientY, app);
            });
            
            appsSection.appendChild(appItem);
        });
        
        // Set up user name display
        document.getElementById('user-name').textContent = "User";
    }
    
    // Show context menu for an app
    function showAppContextMenu(x, y, app) {
        const menuItems = [
            {
                text: Translations.get('open'),
                action: app.action
            },
            { isSeparator: true },
            {
                text: Translations.get('pinToTaskbar'),
                action: function() {
                    // Pin the app to taskbar
                    if (typeof TaskbarManager !== 'undefined') {
                        TaskbarManager.pinApp({
                            name: app.name,
                            icon: app.icon,
                            action: function() {
                                app.action();
                            }
                        });
                    }
                    closeStartMenu();
                }
            }
        ];
        
        ContextMenuManager.showMenu(menuItems, x, y);
    }
    
    // Show power options menu
    function showPowerOptions() {
        const powerButton = document.getElementById('power-button');
        const rect = powerButton.getBoundingClientRect();
        
        const menuItems = [
            {
                text: Translations.get('restart'),
                action: function() {
                    // Simulate restart
                    showRestartDialog();
                }
            },
            {
                text: Translations.get('shutdown'),
                action: function() {
                    // Simulate shutdown
                    showShutdownDialog();
                }
            },
            {
                text: Translations.get('sleep'),
                action: function() {
                    // Simulate sleep
                    showSleepMode();
                }
            }
        ];
        
        ContextMenuManager.showMenu(menuItems, rect.left, rect.top - 100);
    }
    
    // Show a dialog when restarting
    function showRestartDialog() {
        closeStartMenu();
        
        // Create a simple dialog
        const dialog = document.createElement('div');
        dialog.className = 'system-dialog';
        dialog.innerHTML = `
            <div class="system-dialog-content">
                <div class="system-dialog-title">${Translations.get('restarting')}</div>
                <div class="system-dialog-message">${Translations.get('restartMessage')}</div>
                <div class="system-dialog-spinner"></div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // After a few seconds, reload the page
        setTimeout(function() {
            window.location.reload();
        }, 3000);
    }
    
    // Show a dialog when shutting down
    function showShutdownDialog() {
        closeStartMenu();
        
        // Create a simple dialog
        const dialog = document.createElement('div');
        dialog.className = 'system-dialog';
        dialog.innerHTML = `
            <div class="system-dialog-content">
                <div class="system-dialog-title">${Translations.get('shuttingDown')}</div>
                <div class="system-dialog-message">${Translations.get('shutdownMessage')}</div>
                <div class="system-dialog-spinner"></div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // After a few seconds, show a black screen
        setTimeout(function() {
            document.body.innerHTML = '';
            document.body.style.backgroundColor = 'black';
            
            // After another few seconds, reload the page
            setTimeout(function() {
                window.location.reload();
            }, 3000);
        }, 3000);
    }
    
    // Show sleep mode
    function showSleepMode() {
        closeStartMenu();
        
        // Create a sleep screen overlay
        const sleepScreen = document.createElement('div');
        sleepScreen.className = 'sleep-screen';
        sleepScreen.innerHTML = `
            <div class="sleep-message">${Translations.get('clickToWake')}</div>
        `;
        
        document.body.appendChild(sleepScreen);
        
        // Wake up when clicked
        sleepScreen.addEventListener('click', function() {
            sleepScreen.remove();
        });
    }
    
    // Reload the system - close all windows and refresh
    function reloadSystem() {
        closeStartMenu();
        
        // Show a quick message
        const overlay = document.createElement('div');
        overlay.className = 'system-dialog';
        overlay.innerHTML = `
            <div class="system-dialog-content">
                <div class="system-dialog-title">${Translations.get('restarting') || 'Reloading...'}</div>
                <div class="system-dialog-spinner"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Close all open windows
        if (window.WindowManager) {
            const windows = document.querySelectorAll('.window');
            windows.forEach(windowEl => {
                const id = parseInt(windowEl.dataset.windowId);
                if (!isNaN(id)) {
                    WindowManager.closeWindow(id);
                }
            });
        }
        
        // Reload the page after a short delay
        setTimeout(function() {
            window.location.reload();
        }, 1500);
    }
    
    // Public API
    window.StartMenu = {
        init: init,
        toggleStartMenu: toggleStartMenu,
        reload: reloadSystem
    };
})();
