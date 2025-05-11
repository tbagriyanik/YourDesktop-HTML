/**
 * Taskbar Manager
 * Manages the taskbar, pinned apps, running applications and system tray
 */
(function() {
    'use strict';
    
    // DOM elements
    const taskbarAppsElement = document.getElementById('taskbar-apps');
    const startButtonElement = document.getElementById('start-button');
    
    // State
    let taskbarWindows = [];
    let pinnedApps = [];
    
    // Initialize taskbar
    function init() {
        // Set the system time initially
        updateClock();
        
        // Update clock every minute
        setInterval(updateClock, 60000);
        
        // Add default pinned apps
        setupPinnedApps();
        
        // Add event listeners for system tray icons
        setupSystemTrayEvents();
    }
    
    // Set up system tray events (volume, clock, etc.)
    function setupSystemTrayEvents() {
        // Volume control click opens sound settings
        const volumeControl = document.getElementById('volume-control');
        if (volumeControl) {
            volumeControl.addEventListener('click', function() {
                // Open settings app with sound section
                if (typeof SettingsApp !== 'undefined') {
                    SettingsApp.openToSection('sound');
                }
            });
        }
        
        // Clock click opens time & date settings
        const clock = document.getElementById('clock');
        if (clock) {
            clock.addEventListener('click', function() {
                // Open settings app with time section
                if (typeof SettingsApp !== 'undefined') {
                    SettingsApp.openToSection('time');
                }
            });
        }
    }
    
    // Set up default pinned apps
    function setupPinnedApps() {
        pinnedApps = [
            {
                name: 'notepad',
                icon: 'assets/icons/notepad.svg',
                action: function() { NotepadApp.open(); }
            },
            {
                name: 'settings',
                icon: 'assets/icons/settings.svg',
                action: function() { SettingsApp.open(); }
            },
            {
                name: 'browser',
                icon: 'assets/icons/browser.svg',
                action: function() { BrowserApp.open(); }
            },
            {
                name: 'fileExplorer',
                icon: 'assets/icons/explorer.svg',
                action: function() { FileExplorerApp.open(); }
            }
        ];
        
        // Create pinned app buttons
        renderPinnedApps();
    }
    
    // Render pinned apps
    function renderPinnedApps() {
        // Clear current pinned apps
        const pinnedElements = taskbarAppsElement.querySelectorAll('.taskbar-app.pinned');
        pinnedElements.forEach(el => {
            if (!el.classList.contains('running')) {
                el.remove();
            }
        });
        
        // Add pinned apps that aren't already running
        pinnedApps.forEach(app => {
            // Check if the app is already running
            const isRunning = taskbarWindows.some(win => win.name === app.name);
            
            // If not running, add pinned button
            if (!isRunning) {
                const appButton = document.createElement('div');
                appButton.className = 'taskbar-app pinned';
                appButton.setAttribute('data-app', app.name);
                appButton.innerHTML = `
                    <img src="${app.icon}" class="taskbar-app-icon" alt="">
                    <span class="taskbar-app-name" data-translate="${app.name}">${Translations.get(app.name)}</span>
                `;
                
                // Add click event
                appButton.addEventListener('click', app.action);
                
                // Add context menu for pinned app
                appButton.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    showTaskbarItemContextMenu(e.clientX, e.clientY, app);
                });
                
                taskbarAppsElement.appendChild(appButton);
            }
        });
    }
    
    // Add a window to the taskbar
    function addWindow(id, title, icon, appName) {
        // Create taskbar button
        const appButton = document.createElement('div');
        appButton.className = 'taskbar-app running';
        appButton.setAttribute('data-window-id', id);
        
        // If this is a pinned app, add pinned class
        const isPinned = appName && pinnedApps.some(app => app.name === appName);
        if (isPinned) {
            appButton.classList.add('pinned');
            
            // Remove the existing pinned button if it exists
            const existingPinned = taskbarAppsElement.querySelector(`.taskbar-app.pinned[data-app="${appName}"]`);
            if (existingPinned && !existingPinned.classList.contains('running')) {
                existingPinned.remove();
            }
            
            appButton.setAttribute('data-app', appName);
        }
        
        appButton.innerHTML = `
            <img src="${icon}" class="taskbar-app-icon" alt="">
            <span class="taskbar-app-name">${title}</span>
        `;
        
        // Add click event to toggle window
        appButton.addEventListener('click', function() {
            toggleWindow(id);
        });
        
        // Add context menu for running app
        appButton.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showTaskbarItemContextMenu(e.clientX, e.clientY, { windowId: id, name: appName });
        });
        
        // Add to taskbar
        taskbarAppsElement.appendChild(appButton);
        
        // Store window info
        taskbarWindows.push({
            id: id,
            title: title,
            icon: icon,
            element: appButton,
            name: appName
        });
    }
    
    // Toggle window state when taskbar button is clicked
    function toggleWindow(id) {
        // Check if window is active
        if (WindowManager.isWindowActive(id)) {
            // If active, minimize it
            WindowManager.minimizeWindow(id);
        } else {
            // If not active, activate it
            WindowManager.activateWindow(id);
        }
    }
    
    // Activate a window in the taskbar
    function activateWindow(id) {
        // Update taskbar button
        taskbarWindows.forEach(win => {
            if (win.id === id) {
                win.element.classList.add('active');
            } else {
                win.element.classList.remove('active');
            }
        });
    }
    
    // Deactivate a window in the taskbar
    function deactivateWindow(id) {
        const window = taskbarWindows.find(win => win.id === id);
        if (window) {
            window.element.classList.remove('active');
        }
    }
    
    // Remove a window from the taskbar
    function removeWindow(id) {
        const windowIndex = taskbarWindows.findIndex(win => win.id === id);
        if (windowIndex === -1) return;
        
        const window = taskbarWindows[windowIndex];
        
        // If this was a pinned app, restore the pinned button
        if (window.name && pinnedApps.some(app => app.name === window.name)) {
            // Already handled by renderPinnedApps
        } else {
            // Remove the button
            window.element.remove();
        }
        
        // Remove from our array
        taskbarWindows.splice(windowIndex, 1);
        
        // Re-render pinned apps
        renderPinnedApps();
    }
    
    // Update window information in the taskbar
    function updateWindow(id, title, icon) {
        const window = taskbarWindows.find(win => win.id === id);
        if (!window) return;
        
        // Update title
        if (title) {
            window.title = title;
            const titleEl = window.element.querySelector('.taskbar-app-name');
            if (titleEl) {
                titleEl.textContent = title;
            }
        }
        
        // Update icon
        if (icon) {
            window.icon = icon;
            const iconEl = window.element.querySelector('.taskbar-app-icon');
            if (iconEl) {
                iconEl.src = icon;
            }
        }
    }
    
    // Update the clock in the taskbar
    function updateClock() {
        const clockElement = document.getElementById('clock');
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
    
    // Show context menu for taskbar items
    function showTaskbarItemContextMenu(x, y, item) {
        const menuItems = [];
        
        // If this is a window
        if (item.windowId) {
            const id = item.windowId;
            
            // Window actions
            menuItems.push({
                text: Translations.get('restore'),
                action: function() {
                    WindowManager.activateWindow(id);
                }
            });
            
            menuItems.push({
                text: Translations.get('minimize'),
                action: function() {
                    WindowManager.minimizeWindow(id);
                }
            });
            
            menuItems.push({
                text: Translations.get('maximize'),
                action: function() {
                    WindowManager.maximizeWindow(id);
                }
            });
            
            menuItems.push({ isSeparator: true });
            
            menuItems.push({
                text: Translations.get('close'),
                action: function() {
                    WindowManager.closeWindow(id);
                }
            });
            
            // If this is also a pinned app or can be pinned
            if (item.name) {
                menuItems.push({ isSeparator: true });
                
                // Check if already pinned
                const isPinned = pinnedApps.some(app => app.name === item.name);
                
                if (isPinned) {
                    menuItems.push({
                        text: Translations.get('unpinFromTaskbar'),
                        action: function() {
                            unpinApp(item.name);
                        }
                    });
                } else {
                    menuItems.push({
                        text: Translations.get('pinToTaskbar'),
                        action: function() {
                            pinApp(item);
                        }
                    });
                }
            }
        } 
        // If this is just a pinned app
        else if (item.name) {
            menuItems.push({
                text: Translations.get('open') + ' ' + Translations.get(item.name),
                action: item.action
            });
            
            menuItems.push({ isSeparator: true });
            
            menuItems.push({
                text: Translations.get('unpinFromTaskbar'),
                action: function() {
                    unpinApp(item.name);
                }
            });
        }
        
        ContextMenuManager.showMenu(menuItems, x, y);
    }
    
    // Pin an app to the taskbar
    function pinApp(app) {
        // Check if already pinned
        if (!pinnedApps.some(a => a.name === app.name)) {
            pinnedApps.push({
                name: app.name,
                icon: app.icon || getIconForWindow(app.windowId),
                action: app.action || function() {
                    // If we don't have a direct action, activate the window if it exists
                    if (app.windowId) {
                        WindowManager.activateWindow(app.windowId);
                    }
                }
            });
            
            // Re-render pinned apps
            renderPinnedApps();
            
            // Save pinned apps to storage
            savePinnedApps();
        }
    }
    
    // Unpin an app from the taskbar
    function unpinApp(appName) {
        // Remove from pinned apps
        const index = pinnedApps.findIndex(app => app.name === appName);
        if (index !== -1) {
            pinnedApps.splice(index, 1);
            
            // Re-render pinned apps
            renderPinnedApps();
            
            // Save pinned apps to storage
            savePinnedApps();
        }
    }
    
    // Get icon for a window
    function getIconForWindow(windowId) {
        const window = taskbarWindows.find(win => win.id === windowId);
        return window ? window.icon : null;
    }
    
    // Save pinned apps to storage
    function savePinnedApps() {
        const settings = Storage.getSettings();
        settings.pinnedApps = pinnedApps.map(app => ({
            name: app.name,
            icon: app.icon
        }));
        Storage.saveSettings(settings);
    }
    
    // Load pinned apps from storage
    function loadPinnedApps() {
        const settings = Storage.getSettings();
        if (settings.pinnedApps && settings.pinnedApps.length) {
            // Map stored apps to our format with appropriate actions
            settings.pinnedApps.forEach(app => {
                // Find corresponding action for the app name
                let action = null;
                
                switch (app.name) {
                    case 'notepad':
                        action = function() { NotepadApp.open(); };
                        break;
                    case 'paint':
                        action = function() { PaintApp.open(); };
                        break;
                    case 'minesweeper':
                        action = function() { MinesweeperApp.open(); };
                        break;
                    case 'snake':
                        action = function() { SnakeApp.open(); };
                        break;
                    case 'tetris':
                        action = function() { TetrisApp.open(); };
                        break;
                    case 'settings':
                        action = function() { SettingsApp.open(); };
                        break;
                }
                
                if (action) {
                    pinnedApps.push({
                        name: app.name,
                        icon: app.icon,
                        action: action
                    });
                }
            });
            
            // Render pinned apps
            renderPinnedApps();
        }
    }
    
    // Public API
    window.TaskbarManager = {
        init: init,
        addWindow: addWindow,
        activateWindow: activateWindow,
        deactivateWindow: deactivateWindow,
        removeWindow: removeWindow,
        updateWindow: updateWindow,
        updateClock: updateClock
    };
})();
