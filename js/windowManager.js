/**
 * Window Manager
 * Manages creation, movement, resizing, and z-index of windows
 */
(function() {
    'use strict';
    
    // DOM element for window area
    const windowsArea = document.getElementById('windows-area');
    
    // State
    let windows = [];
    let activeWindowId = null;
    let nextWindowId = 1;
    let draggedWindow = null;
    let dragOffset = { x: 0, y: 0 };
    let resizingWindow = null;
    let resizeDirection = null;
    let resizeStartRect = null;
    let resizeStartPos = { x: 0, y: 0 };
    
    // Initialize window manager
    function init() {
        // Global mouse event to handle window dragging and resizing
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Touch events for mobile support
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
    }
    
    // Create a new window
    function createWindow(options) {
        const id = nextWindowId++;
        const defaults = {
            id: id,
            title: 'Window',
            icon: null,
            appName: '', // App name for icon click functionality
            width: 600,
            height: 400,
            minWidth: 300,
            minHeight: 200,
            x: 50 + (windows.length * 20) % 200,
            y: 50 + (windows.length * 20) % 150,
            resizable: true,
            minimizable: true,
            maximizable: true,
            closable: true,
            className: '',
            content: '',
            onClose: null,
            onFocus: null,
            onBlur: null
        };
        
        // Merge defaults with provided options
        const windowOptions = Object.assign({}, defaults, options);
        
        // Create window element
        const windowEl = document.createElement('div');
        windowEl.className = `window ${windowOptions.className}`;
        windowEl.id = `window-${id}`;
        windowEl.dataset.windowId = id;
        windowEl.style.width = `${windowOptions.width}px`;
        windowEl.style.height = `${windowOptions.height}px`;
        windowEl.style.left = `${windowOptions.x}px`;
        windowEl.style.top = `${windowOptions.y}px`;
        
        // Window HTML structure
        windowEl.innerHTML = `
            <div class="window-titlebar">
                <div class="window-title">
                    ${windowOptions.icon ? `<img src="${windowOptions.icon}" class="window-title-icon window-title-icon-clickable" alt="" data-app="${windowOptions.appName || ''}">` : ''}
                    <span class="window-title-text">${windowOptions.title}</span>
                </div>
                <div class="window-controls">
                    ${windowOptions.minimizable ? '<button class="window-control minimize"><svg viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"></rect></svg></button>' : ''}
                    ${windowOptions.maximizable ? '<button class="window-control maximize"><svg viewBox="0 0 10 10"><rect width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"></rect></svg></button>' : ''}
                    ${windowOptions.closable ? '<button class="window-control close"><svg viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.2"></line><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.2"></line></svg></button>' : ''}
                </div>
            </div>
            <div class="window-content">${windowOptions.content}</div>
        `;
        
        // Add resize handles if window is resizable
        if (windowOptions.resizable) {
            const resizeHandles = [
                'top', 'right', 'bottom', 'left',
                'top-left', 'top-right', 'bottom-right', 'bottom-left'
            ];
            
            resizeHandles.forEach(direction => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${direction}`;
                handle.dataset.direction = direction;
                windowEl.appendChild(handle);
            });
        }
        
        // Add the window to the DOM
        windowsArea.appendChild(windowEl);
        
        // Attach event listeners
        attachWindowEvents(windowEl, id);
        
        // Store window data
        const windowData = {
            id: id,
            element: windowEl,
            options: windowOptions,
            isMinimized: false,
            isMaximized: false,
            normalRect: {
                x: windowOptions.x,
                y: windowOptions.y,
                width: windowOptions.width,
                height: windowOptions.height
            }
        };
        
        windows.push(windowData);
        
        // Activate the new window
        activateWindow(id);
        
        // Add opening animation class
        windowEl.classList.add('opening');
        setTimeout(() => {
            windowEl.classList.remove('opening');
        }, 300);
        
        // Add to taskbar
        if (TaskbarManager) {
            TaskbarManager.addWindow(id, windowOptions.title, windowOptions.icon);
        }
        
        // Return the window ID
        return id;
    }
    
    // Attach events to window elements
    function attachWindowEvents(windowEl, id) {
        // Focus window on click
        windowEl.addEventListener('mousedown', function(e) {
            activateWindow(id);
        });
        windowEl.addEventListener('touchstart', function(e) {
            activateWindow(id);
        });
        
        // Add click handler for window icon
        const iconEl = windowEl.querySelector('.window-title-icon-clickable');
        if (iconEl) {
            iconEl.addEventListener('click', function(e) {
                e.stopPropagation();
                if (this.dataset.app) {
                    // Get the app name and open a new instance
                    const appName = this.dataset.app;
                    
                    // Try to create a window using the registered app
                    if (registeredApps[appName]) {
                        createAppWindow(appName);
                    } else {
                        // Fallback to old method for compatibility
                        switch(appName) {
                            case 'calculator':
                                if (window.CalculatorApp) CalculatorApp.open();
                                break;
                            case 'notepad':
                                if (window.NotepadApp) NotepadApp.open();
                                break;
                            case 'paint':
                                if (window.PaintApp) PaintApp.open();
                                break;
                            case 'browser':
                                if (window.BrowserApp) BrowserApp.open();
                                break;
                            case 'fileExplorer':
                                if (window.FileExplorerApp) FileExplorerApp.open();
                                break;
                            case 'settings':
                                if (window.SettingsApp) SettingsApp.open();
                                break;
                            case 'minesweeper':
                                if (window.MinesweeperApp) MinesweeperApp.open();
                                break;
                            case 'snake':
                                if (window.SnakeApp) SnakeApp.open();
                                break;
                            case 'tetris':
                                if (window.TetrisApp) TetrisApp.open();
                                break;
                            case 'dbViewer':
                                if (window.DbViewerApp) DbViewerApp.open();
                                break;
                        }
                    }
                }
            });
        }
        
        // Titlebar drag
        const titlebar = windowEl.querySelector('.window-titlebar');
        titlebar.addEventListener('mousedown', function(e) {
            // Only handle left button drag on titlebar (not on controls)
            if (e.button === 0 && !e.target.closest('.window-control')) {
                startWindowDrag(id, e.clientX, e.clientY);
                e.preventDefault();
            }
        });
        titlebar.addEventListener('touchstart', function(e) {
            // Don't drag if touching controls
            if (!e.target.closest('.window-control')) {
                const touch = e.touches[0];
                startWindowDrag(id, touch.clientX, touch.clientY);
                e.preventDefault();
            }
        });
        
        // Double click titlebar to maximize/restore
        titlebar.addEventListener('dblclick', function(e) {
            // Don't maximize if double clicking controls
            if (!e.target.closest('.window-control')) {
                toggleMaximize(id);
            }
        });
        
        // Window controls
        const minimizeBtn = windowEl.querySelector('.window-control.minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', function() {
                minimizeWindow(id);
            });
        }
        
        const maximizeBtn = windowEl.querySelector('.window-control.maximize');
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', function() {
                toggleMaximize(id);
            });
        }
        
        const closeBtn = windowEl.querySelector('.window-control.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeWindow(id);
            });
        }
        
        // Resize handle events
        const resizeHandles = windowEl.querySelectorAll('.resize-handle');
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', function(e) {
                startWindowResize(id, handle.dataset.direction, e.clientX, e.clientY);
                e.preventDefault();
                e.stopPropagation();
            });
            
            handle.addEventListener('touchstart', function(e) {
                const touch = e.touches[0];
                startWindowResize(id, handle.dataset.direction, touch.clientX, touch.clientY);
                e.preventDefault();
                e.stopPropagation();
            });
        });
    }
    
    // Start window drag operation
    function startWindowDrag(id, clientX, clientY) {
        // Get window data
        const windowData = getWindowById(id);
        if (!windowData || windowData.isMaximized) return;
        
        const windowEl = windowData.element;
        const rect = windowEl.getBoundingClientRect();
        
        draggedWindow = windowData;
        dragOffset = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    // Start window resize operation
    function startWindowResize(id, direction, clientX, clientY) {
        // Get window data
        const windowData = getWindowById(id);
        if (!windowData || windowData.isMaximized) return;
        
        const windowEl = windowData.element;
        const rect = windowEl.getBoundingClientRect();
        
        resizingWindow = windowData;
        resizeDirection = direction;
        resizeStartRect = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        };
        resizeStartPos = {
            x: clientX,
            y: clientY
        };
    }
    
    // Handle mouse move for dragging and resizing
    function handleMouseMove(e) {
        // Handle window dragging
        if (draggedWindow) {
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            moveWindow(draggedWindow.id, x, y);
        }
        
        // Handle window resizing
        if (resizingWindow) {
            const dx = e.clientX - resizeStartPos.x;
            const dy = e.clientY - resizeStartPos.y;
            resizeWindow(resizingWindow.id, resizeDirection, dx, dy);
        }
    }
    
    // Handle touch move for dragging and resizing
    function handleTouchMove(e) {
        if (draggedWindow || resizingWindow) {
            e.preventDefault(); // Prevent scrolling while dragging
            const touch = e.touches[0];
            
            // Handle window dragging
            if (draggedWindow) {
                const x = touch.clientX - dragOffset.x;
                const y = touch.clientY - dragOffset.y;
                moveWindow(draggedWindow.id, x, y);
            }
            
            // Handle window resizing
            if (resizingWindow) {
                const dx = touch.clientX - resizeStartPos.x;
                const dy = touch.clientY - resizeStartPos.y;
                resizeWindow(resizingWindow.id, resizeDirection, dx, dy);
            }
        }
    }
    
    // Handle mouse up to end dragging and resizing
    function handleMouseUp() {
        if (draggedWindow) {
            // Update the normal position in case the window is later unmaximized
            draggedWindow.normalRect.x = parseInt(draggedWindow.element.style.left);
            draggedWindow.normalRect.y = parseInt(draggedWindow.element.style.top);
            draggedWindow = null;
        }
        
        if (resizingWindow) {
            // Update the normal size in case the window is later unmaximized
            resizingWindow.normalRect.width = parseInt(resizingWindow.element.style.width);
            resizingWindow.normalRect.height = parseInt(resizingWindow.element.style.height);
            resizingWindow.normalRect.x = parseInt(resizingWindow.element.style.left);
            resizingWindow.normalRect.y = parseInt(resizingWindow.element.style.top);
            resizingWindow = null;
            resizeDirection = null;
        }
    }
    
    // Handle touch end to end dragging and resizing
    function handleTouchEnd() {
        handleMouseUp(); // Reuse the same logic
    }
    
    // Move a window to new coordinates
    function moveWindow(id, x, y) {
        const windowData = getWindowById(id);
        if (!windowData) return;
        
        // Make sure the window stays within visible area (at least partially)
        const windowWidth = parseInt(windowData.element.style.width);
        const windowHeight = parseInt(windowData.element.style.height);
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Ensure at least 100px of the window is always accessible
        x = Math.max(-windowWidth + 100, Math.min(x, viewportWidth - 100));
        y = Math.max(0, Math.min(y, viewportHeight - 50)); // Keep titlebar accessible
        
        windowData.element.style.left = `${x}px`;
        windowData.element.style.top = `${y}px`;
    }
    
    // Resize a window
    function resizeWindow(id, direction, dx, dy) {
        const windowData = getWindowById(id);
        if (!windowData) return;
        
        const el = windowData.element;
        const rect = resizeStartRect;
        const minWidth = windowData.options.minWidth;
        const minHeight = windowData.options.minHeight;
        
        let newLeft = rect.left;
        let newTop = rect.top;
        let newWidth = rect.width;
        let newHeight = rect.height;
        
        // Adjust size/position based on resize direction
        if (direction.includes('right')) {
            newWidth = Math.max(minWidth, rect.width + dx);
        }
        if (direction.includes('bottom')) {
            newHeight = Math.max(minHeight, rect.height + dy);
        }
        
        if (direction.includes('left')) {
            const possibleWidth = rect.width - dx;
            if (possibleWidth >= minWidth) {
                newWidth = possibleWidth;
                newLeft = rect.left + dx;
            }
        }
        
        if (direction.includes('top')) {
            const possibleHeight = rect.height - dy;
            if (possibleHeight >= minHeight) {
                newHeight = possibleHeight;
                newTop = rect.top + dy;
            }
        }
        
        // Apply the new size and position
        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;
        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
    }
    
    // Activate a window (bring to front)
    function activateWindow(id) {
        // If this window is already active, do nothing
        if (activeWindowId === id) return;
        
        // Deactivate the current active window
        if (activeWindowId !== null) {
            const oldActiveWindow = getWindowById(activeWindowId);
            if (oldActiveWindow) {
                oldActiveWindow.element.classList.remove('active');
                // Call onBlur callback if provided
                if (oldActiveWindow.options.onBlur) {
                    oldActiveWindow.options.onBlur();
                }
            }
        }
        
        // Activate the new window
        const newActiveWindow = getWindowById(id);
        if (newActiveWindow) {
            // Restore from minimized state if needed
            if (newActiveWindow.isMinimized) {
                restoreWindow(id);
            }
            
            // Update active state
            newActiveWindow.element.classList.add('active');
            activeWindowId = id;
            
            // Update taskbar
            if (TaskbarManager) {
                TaskbarManager.activateWindow(id);
            }
            
            // Bring to front
            windows.forEach(win => {
                win.element.style.zIndex = (win.id === id) ? 10 : 5;
            });
            
            // Call onFocus callback if provided
            if (newActiveWindow.options.onFocus) {
                newActiveWindow.options.onFocus();
            }
        }
    }
    
    // Minimize a window
    function minimizeWindow(id) {
        const windowData = getWindowById(id);
        if (!windowData) return;
        
        windowData.element.classList.add('minimized');
        windowData.isMinimized = true;
        
        // Activate another window if possible
        if (activeWindowId === id) {
            // Find highest visible window
            const visibleWindows = windows.filter(win => !win.isMinimized && win.id !== id);
            if (visibleWindows.length > 0) {
                activateWindow(visibleWindows[visibleWindows.length - 1].id);
            } else {
                activeWindowId = null;
            }
        }
        
        // Update taskbar
        if (TaskbarManager) {
            TaskbarManager.deactivateWindow(id);
        }
    }
    
    // Restore a window from minimized state
    function restoreWindow(id) {
        const windowData = getWindowById(id);
        if (!windowData || !windowData.isMinimized) return;
        
        windowData.element.classList.remove('minimized');
        windowData.isMinimized = false;
    }
    
    // Maximize a window
    function maximizeWindow(id) {
        const windowData = getWindowById(id);
        if (!windowData || windowData.isMaximized) return;
        
        // Save current position and size
        const rect = windowData.element.getBoundingClientRect();
        windowData.normalRect = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
        
        // Update maximize button to show restore icon
        const maximizeBtn = windowData.element.querySelector('.window-control.maximize');
        if (maximizeBtn) {
            maximizeBtn.innerHTML = '<svg viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"></rect><rect x="5" y="5" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1"></rect></svg>';
            maximizeBtn.classList.remove('maximize');
            maximizeBtn.classList.add('restore');
        }
        
        // Maximize the window
        windowData.element.style.left = '0';
        windowData.element.style.top = '0';
        windowData.element.style.width = '100%';
        windowData.element.style.height = `calc(100% - 40px)`; // Subtract taskbar height
        windowData.isMaximized = true;
    }
    
    // Restore a window from maximized state
    function restoreFromMaximized(id) {
        const windowData = getWindowById(id);
        if (!windowData || !windowData.isMaximized) return;
        
        // Update restore button to show maximize icon
        const restoreBtn = windowData.element.querySelector('.window-control.restore');
        if (restoreBtn) {
            restoreBtn.innerHTML = '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"></rect></svg>';
            restoreBtn.classList.remove('restore');
            restoreBtn.classList.add('maximize');
        }
        
        // Restore the window to its previous position and size
        windowData.element.style.left = `${windowData.normalRect.x}px`;
        windowData.element.style.top = `${windowData.normalRect.y}px`;
        windowData.element.style.width = `${windowData.normalRect.width}px`;
        windowData.element.style.height = `${windowData.normalRect.height}px`;
        windowData.isMaximized = false;
    }
    
    // Toggle between maximized and restored states
    function toggleMaximize(id) {
        const windowData = getWindowById(id);
        if (!windowData) return;
        
        if (windowData.isMaximized) {
            restoreFromMaximized(id);
        } else {
            maximizeWindow(id);
        }
    }
    
    // Close a window
    function closeWindow(id) {
        const windowIndex = windows.findIndex(win => win.id === id);
        if (windowIndex === -1) return;
        
        const windowData = windows[windowIndex];
        
        // Call onClose callback if provided
        if (windowData.options.onClose) {
            const shouldClose = windowData.options.onClose();
            // If callback returns false, abort closing
            if (shouldClose === false) return;
        }
        
        // Remove from DOM
        windowData.element.remove();
        
        // Remove from windows array
        windows.splice(windowIndex, 1);
        
        // Update active window if needed
        if (activeWindowId === id) {
            // Find highest visible window
            const visibleWindows = windows.filter(win => !win.isMinimized);
            if (visibleWindows.length > 0) {
                activateWindow(visibleWindows[visibleWindows.length - 1].id);
            } else {
                activeWindowId = null;
            }
        }
        
        // Remove from taskbar
        if (TaskbarManager) {
            TaskbarManager.removeWindow(id);
        }
    }
    
    // Get window data by ID
    function getWindowById(id) {
        return windows.find(win => win.id === id);
    }
    
    // Update window title
    function updateWindowTitle(id, title) {
        const windowData = getWindowById(id);
        if (!windowData) return;
        
        // Update window title element
        const titleElement = windowData.element.querySelector('.window-title-text');
        if (titleElement) {
            titleElement.textContent = title;
        }
        
        // Update taskbar entry
        if (TaskbarManager) {
            TaskbarManager.updateWindow(id, title);
        }
        
        // Update options
        windowData.options.title = title;
    }
    
    // Update all windows (for translation updates, etc.)
    function updateAllWindows() {
        windows.forEach(win => {
            // Call update method if window has one
            if (win.options.onUpdate) {
                win.options.onUpdate();
            }
        });
    }
    
    // Check if a window is active
    function isWindowActive(id) {
        return activeWindowId === id;
    }
    
    // Get content element of a window
    function getWindowContentElement(id) {
        const windowData = getWindowById(id);
        if (!windowData) return null;
        
        return windowData.element.querySelector('.window-content');
    }
    
    // Application registry
    const registeredApps = {};
    
    // Register an application with the window manager
    function registerApplication(appName, options) {
        registeredApps[appName] = options;
    }
    
    // Create a window from a registered application
    function createAppWindow(appName) {
        const appOptions = registeredApps[appName];
        if (!appOptions) {
            console.error('Application not registered:', appName);
            return null;
        }
        
        // Create the window with the registered options
        return createWindow(appOptions);
    }
    
    // Public API
    window.WindowManager = {
        init: init,
        createWindow: createWindow,
        activateWindow: activateWindow,
        minimizeWindow: minimizeWindow,
        restoreWindow: restoreWindow,
        maximizeWindow: maximizeWindow,
        restoreFromMaximized: restoreFromMaximized,
        toggleMaximize: toggleMaximize,
        closeWindow: closeWindow,
        updateWindowTitle: updateWindowTitle,
        isWindowActive: isWindowActive,
        getWindowContentElement: getWindowContentElement,
        updateAllWindows: updateAllWindows,
        registerApplication: registerApplication,
        createAppWindow: createAppWindow
    };
})();
