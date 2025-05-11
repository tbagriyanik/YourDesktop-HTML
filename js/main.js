/**
 * Windows 7 Desktop Simulator
 * Main module - initializes the desktop environment
 */
(function() {
    'use strict';

    // DOM elements
    const desktopElement = document.getElementById('desktop');
    const taskbarElement = document.getElementById('taskbar');
    const startButtonElement = document.getElementById('start-button');
    const startMenuElement = document.getElementById('start-menu');
    const clockElement = document.getElementById('clock');
    const languageIndicatorElement = document.getElementById('language-indicator');
    
    // State
    let isStartMenuOpen = false;
    
    // Initialize all components
    function init() {
        // Load user settings from storage
        Storage.loadSettings();
        
        // Initialize the database
        Database.init()
            .then(() => {
                console.log('Database initialized successfully');
                // You could load additional data from the database here
                return Database.getSystemSetting('lastLogin');
            })
            .then(lastLogin => {
                if (lastLogin) {
                    console.log('Last login:', new Date(lastLogin));
                }
                // Store the current login time
                return Database.saveSystemSetting('lastLogin', new Date().toISOString());
            })
            .catch(error => {
                console.error('Database initialization error:', error);
            });
            
        // Set initial language
        const currentLang = Storage.getSettings().language || 'en';
        Translations.setLanguage(currentLang);
        updateLanguageIndicator(currentLang);
        
        // Initialize all managers
        WindowManager.init();
        DesktopManager.init();
        TaskbarManager.init();
        ContextMenuManager.init();
        
        // Initialize applications
        NotepadApp.init();
        PaintApp.init();
        MinesweeperApp.init();
        SnakeApp.init();
        TetrisApp.init();
        SettingsApp.init();
        DbViewerApp.init();
        
        // Attach event listeners
        attachEventListeners();
        
        // Update clock
        updateClock();
        setInterval(updateClock, 1000);
        
        // Create desktop icons
        createDesktopIcons();
    }
    
    // Attach global event listeners
    function attachEventListeners() {
        // Start button click
        startButtonElement.addEventListener('click', toggleStartMenu);
        
        // Close start menu when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (isStartMenuOpen && 
                !startMenuElement.contains(e.target) && 
                !startButtonElement.contains(e.target)) {
                closeStartMenu();
            }
        });
        
        // Language indicator click
        languageIndicatorElement.addEventListener('click', toggleLanguage);
        
        // Prevent context menu on taskbar and start menu
        taskbarElement.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        startMenuElement.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Windows key or Ctrl+Esc to toggle start menu
            if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) {
                toggleStartMenu();
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
        startMenuElement.classList.remove('hidden');
        isStartMenuOpen = true;
        
        // Populate start menu
        populateStartMenu();
    }
    
    // Close the start menu
    function closeStartMenu() {
        startMenuElement.classList.add('hidden');
        isStartMenuOpen = false;
    }
    
    // Populate the start menu with applications
    function populateStartMenu() {
        const appsSection = document.getElementById('apps-section');
        
        // Clear existing apps
        appsSection.innerHTML = '';
        
        // App definitions
        const apps = [
            {
                name: 'notepad',
                icon: 'assets/icons/notepad.svg',
                action: function() { NotepadApp.open(); closeStartMenu(); }
            },
            {
                name: 'paint',
                icon: 'assets/icons/paint.svg',
                action: function() { PaintApp.open(); closeStartMenu(); }
            },
            {
                name: 'minesweeper',
                icon: 'assets/icons/minesweeper.svg',
                action: function() { MinesweeperApp.open(); closeStartMenu(); }
            },
            {
                name: 'snake',
                icon: 'assets/icons/snake.svg',
                action: function() { SnakeApp.open(); closeStartMenu(); }
            },
            {
                name: 'tetris',
                icon: 'assets/icons/tetris.svg',
                action: function() { TetrisApp.open(); closeStartMenu(); }
            },
            {
                name: 'dbViewer',
                icon: 'assets/icons/dbviewer.svg',
                action: function() { DbViewerApp.open(); closeStartMenu(); }
            },
            {
                name: 'browser',
                icon: 'assets/icons/browser.svg',
                action: function() { BrowserApp.open(); closeStartMenu(); }
            },
            {
                name: 'fileExplorer',
                icon: 'assets/icons/explorer.svg',
                action: function() { FileExplorerApp.open(); closeStartMenu(); }
            },
            {
                name: 'calculator',
                icon: 'assets/icons/calculator.svg',
                action: function() { CalculatorApp.open(); closeStartMenu(); }
            },
            {
                name: 'settings',
                icon: 'assets/icons/settings.svg',
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
            appsSection.appendChild(appItem);
        });
        
        // Update all translations in the start menu
        Translations.updateElements(startMenuElement);
    }
    
    // Create desktop icons
    function createDesktopIcons() {
        const desktopApps = [
            {
                name: 'computer',
                displayName: 'Computer',
                icon: 'assets/icons/computer.svg',
                action: function() { FileExplorerApp.open('C:'); }
            },
            {
                name: 'documents',
                displayName: 'My Documents',
                icon: 'assets/icons/folder-documents.svg',
                action: function() { FileExplorerApp.open('C:/Users/User/Documents'); }
            },
            {
                name: 'notepad',
                displayName: 'Notepad',
                icon: 'assets/icons/notepad.svg',
                action: function() { NotepadApp.open(); }
            },
            {
                name: 'paint',
                displayName: 'Paint',
                icon: 'assets/icons/paint.svg',
                action: function() { PaintApp.open(); }
            },
            {
                name: 'minesweeper',
                displayName: 'Minesweeper',
                icon: 'assets/icons/minesweeper.svg',
                action: function() { MinesweeperApp.open(); }
            },
            {
                name: 'dbViewer',
                displayName: 'Database Viewer',
                icon: 'assets/icons/dbviewer.svg',
                action: function() { DbViewerApp.open(); }
            },
            {
                name: 'browser',
                displayName: 'Internet Explorer',
                icon: 'assets/icons/browser.svg',
                action: function() { BrowserApp.open(); }
            },
            {
                name: 'calculator',
                displayName: 'Calculator',
                icon: 'assets/icons/calculator.svg',
                action: function() { CalculatorApp.open(); }
            },
            {
                name: 'fileExplorer',
                displayName: 'File Explorer',
                icon: 'assets/icons/explorer.svg',
                action: function() { FileExplorerApp.open(); }
            },
            {
                name: 'settings',
                displayName: 'Settings',
                icon: 'assets/icons/settings.svg',
                action: function() { SettingsApp.open(); }
            }
        ];
        
        DesktopManager.createIcons(desktopApps);
    }
    
    // Update the clock in the taskbar
    function updateClock() {
        const now = new Date();
        const settings = Storage.getSettings();
        const format = settings.timeFormat || '24h';
        
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let timeString = '';
        
        if (format === '12h') {
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // Convert 0 to 12
            timeString = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
        } else {
            timeString = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
        }
        
        clockElement.textContent = timeString;
    }
    
    // Toggle between available languages
    function toggleLanguage() {
        const currentLang = Storage.getSettings().language || 'en';
        const newLang = currentLang === 'en' ? 'tr' : 'en';
        
        // Update settings
        const settings = Storage.getSettings();
        settings.language = newLang;
        Storage.saveSettings(settings);
        
        // Update UI
        Translations.setLanguage(newLang);
        updateLanguageIndicator(newLang);
        
        // Update all translations in the DOM
        Translations.updateElements(document);
        
        // Update any open windows
        WindowManager.updateAllWindows();
    }
    
    // Update the language indicator in the taskbar
    function updateLanguageIndicator(lang) {
        languageIndicatorElement.textContent = lang.toUpperCase();
    }
    
    // Public API
    window.WindowsSimulator = {
        init: init
    };
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
})();
