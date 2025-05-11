/**
 * Desktop Manager
 * Handles desktop icons, right-click context menu, and desktop interactions
 */
(function() {
    'use strict';
    
    // DOM elements
    const desktop = document.getElementById('desktop');
    
    // State
    let icons = [];
    let selectedIcon = null;
    let iconGrid = [];
    let iconSize = 80; // Width of icon
    let iconHeight = 90; // Height of icon including text
    
    // Initialize desktop
    function init() {
        // Clear any existing content
        desktop.innerHTML = '';
        
        // Set up desktop event listeners
        setupEventListeners();
        
        // Remove the grid layout from CSS and use our own positioning
        desktop.style.display = 'block';
        
        // Calculate icon grid based on desktop size
        calculateIconGrid();
        
        // When window is resized, recalculate the grid
        window.addEventListener('resize', function() {
            calculateIconGrid();
            repositionIcons();
        });
    }
    
    // Set up desktop event listeners
    function setupEventListeners() {
        // Desktop click
        desktop.addEventListener('click', function(e) {
            // If clicked directly on desktop (not an icon), clear selection
            if (e.target === desktop) {
                clearIconSelection();
            }
        });
        
        // Desktop right-click for context menu
        desktop.addEventListener('contextmenu', function(e) {
            if (e.target === desktop || e.target.closest('.desktop-icon') || 
                e.target.closest('.desktop-icon-img') || e.target.closest('.desktop-icon-name')) {
                e.preventDefault();
                
                let targetIcon = null;
                // Check if the right-click target is the icon or any of its children
                if (e.target.closest('.desktop-icon')) {
                    targetIcon = e.target.closest('.desktop-icon');
                    // Select the icon if right-clicked
                    selectIcon(targetIcon);
                } else {
                    clearIconSelection();
                }
                
                // Show desktop context menu
                showDesktopContextMenu(e.clientX, e.clientY, targetIcon);
            }
        });
        
        // Desktop global click to clear context menu
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#context-menu')) {
                ContextMenuManager.hideAllMenus();
            }
        });
    }
    
    // Calculate icon grid based on desktop size
    function calculateIconGrid() {
        const desktopWidth = desktop.clientWidth;
        const desktopHeight = desktop.clientHeight;
        
        // Calculate grid columns and rows
        const columns = Math.floor(desktopWidth / iconSize);
        const rows = Math.floor(desktopHeight / iconHeight);
        
        // Initialize grid
        iconGrid = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                iconGrid.push({
                    x: x * iconSize,
                    y: y * iconHeight,
                    occupied: false
                });
            }
        }
    }
    
    // Create desktop icons
    function createIcons(iconList) {
        // Clear existing icons
        icons = [];
        desktop.innerHTML = '';
        
        // Create new icons
        iconList.forEach(iconInfo => {
            // Create icon element
            const iconEl = document.createElement('div');
            iconEl.className = 'desktop-icon';
            iconEl.setAttribute('data-name', iconInfo.name);
            iconEl.innerHTML = `
                <img src="${iconInfo.icon}" class="desktop-icon-img" alt="${iconInfo.displayName}">
                <div class="desktop-icon-name" data-translate="${iconInfo.name}">${Translations.get(iconInfo.name) || iconInfo.displayName}</div>
            `;
            
            // Find a free position in the grid
            const position = findFreeGridPosition();
            if (position) {
                iconEl.style.left = position.x + 'px';
                iconEl.style.top = position.y + 'px';
                position.occupied = true;
                
                // Store icon data
                icons.push({
                    element: iconEl,
                    name: iconInfo.name,
                    displayName: iconInfo.displayName,
                    icon: iconInfo.icon,
                    action: iconInfo.action,
                    position: position
                });
                
                // Add to desktop
                desktop.appendChild(iconEl);
                
                // Attach event listeners
                attachIconEvents(iconEl, iconInfo.action);
            }
        });
    }
    
    // Find free position in the grid
    function findFreeGridPosition() {
        const freePosition = iconGrid.find(pos => !pos.occupied);
        return freePosition;
    }
    
    // Reposition icons when desktop size changes
    function repositionIcons() {
        // Recalculate the grid
        calculateIconGrid();
        
        // Reposition existing icons
        icons.forEach((icon, index) => {
            // Find a new position
            if (index < iconGrid.length) {
                const position = iconGrid[index];
                icon.element.style.left = position.x + 'px';
                icon.element.style.top = position.y + 'px';
                position.occupied = true;
                icon.position = position;
            }
        });
    }
    
    // Attach events to icon
    function attachIconEvents(iconEl, action) {
        // Single click to select
        iconEl.addEventListener('click', function(e) {
            e.stopPropagation();
            selectIcon(iconEl);
        });
        
        // Double click to open
        iconEl.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            if (typeof action === 'function') {
                try {
                    action();
                } catch (err) {
                    console.error('Error executing icon action:', err);
                }
            }
        });
        
        // Right-click for context menu
        iconEl.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showDesktopContextMenu(e.clientX, e.clientY, this);
            selectIcon(this);
        });
        
        // Also attach events to the icon image and text
        const iconImg = iconEl.querySelector('.desktop-icon-img');
        const iconName = iconEl.querySelector('.desktop-icon-name');
        
        if (iconImg) {
            iconImg.addEventListener('click', function(e) {
                e.stopPropagation();
                selectIcon(iconEl);
            });
            
            iconImg.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                if (typeof action === 'function') {
                    try {
                        action();
                    } catch (err) {
                        console.error('Error executing icon action from image:', err);
                    }
                }
            });
            
            iconImg.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showDesktopContextMenu(e.clientX, e.clientY, iconEl);
                selectIcon(iconEl);
            });
        }
        
        if (iconName) {
            iconName.addEventListener('click', function(e) {
                e.stopPropagation();
                selectIcon(iconEl);
            });
            
            iconName.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                if (typeof action === 'function') {
                    try {
                        action();
                    } catch (err) {
                        console.error('Error executing icon action from name:', err);
                    }
                }
            });
            
            iconName.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showDesktopContextMenu(e.clientX, e.clientY, iconEl);
                selectIcon(iconEl);
            });
        }
        
        // Make icons draggable
        makeIconDraggable(iconEl);
    }
    
    // Make icon draggable
    function makeIconDraggable(iconEl) {
        let isDragging = false;
        let startX, startY;
        let originalLeft, originalTop;
        
        // Start drag on main icon element
        iconEl.addEventListener('mousedown', function(e) {
            if (e.button === 0) { // Left mouse button
                startDrag(e.clientX, e.clientY);
                e.preventDefault();
            }
        });
        
        iconEl.addEventListener('touchstart', function(e) {
            const touch = e.touches[0];
            startDrag(touch.clientX, touch.clientY);
            e.preventDefault();
        });
        
        // Also enable dragging from the icon image and text
        const iconImg = iconEl.querySelector('.desktop-icon-img');
        const iconName = iconEl.querySelector('.desktop-icon-name');
        
        if (iconImg) {
            iconImg.addEventListener('mousedown', function(e) {
                if (e.button === 0) { // Left mouse button
                    startDrag(e.clientX, e.clientY);
                    e.preventDefault();
                }
            });
            
            iconImg.addEventListener('touchstart', function(e) {
                const touch = e.touches[0];
                startDrag(touch.clientX, touch.clientY);
                e.preventDefault();
            });
        }
        
        if (iconName) {
            iconName.addEventListener('mousedown', function(e) {
                if (e.button === 0) { // Left mouse button
                    startDrag(e.clientX, e.clientY);
                    e.preventDefault();
                }
            });
            
            iconName.addEventListener('touchstart', function(e) {
                const touch = e.touches[0];
                startDrag(touch.clientX, touch.clientY);
                e.preventDefault();
            });
        }
        
        function startDrag(clientX, clientY) {
            isDragging = true;
            startX = clientX;
            startY = clientY;
            originalLeft = parseInt(iconEl.style.left) || 0;
            originalTop = parseInt(iconEl.style.top) || 0;
            
            // Select the icon being dragged
            selectIcon(iconEl);
            
            // Add dragging class
            iconEl.classList.add('dragging');
            
            // Add global move and up handlers
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('mouseup', handleUp);
            document.addEventListener('touchend', handleUp);
        }
        
        function handleMove(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            iconEl.style.left = (originalLeft + dx) + 'px';
            iconEl.style.top = (originalTop + dy) + 'px';
        }
        
        function handleTouchMove(e) {
            if (!isDragging) return;
            
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            iconEl.style.left = (originalLeft + dx) + 'px';
            iconEl.style.top = (originalTop + dy) + 'px';
        }
        
        function handleUp() {
            if (!isDragging) return;
            
            // Remove dragging class
            iconEl.classList.remove('dragging');
            
            // Find the closest grid position
            const iconRect = iconEl.getBoundingClientRect();
            const desktopRect = desktop.getBoundingClientRect();
            const relativeX = iconRect.left - desktopRect.left;
            const relativeY = iconRect.top - desktopRect.top;
            
            // Find the new grid position
            const newPosition = findClosestGridPosition(relativeX, relativeY);
            if (newPosition) {
                // Mark old position as unoccupied
                const icon = icons.find(i => i.element === iconEl);
                if (icon && icon.position) {
                    icon.position.occupied = false;
                }
                
                // Update icon position
                iconEl.style.left = newPosition.x + 'px';
                iconEl.style.top = newPosition.y + 'px';
                newPosition.occupied = true;
                
                // Update icon data
                if (icon) {
                    icon.position = newPosition;
                }
            }
            
            // Clean up
            isDragging = false;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchend', handleUp);
        }
    }
    
    // Find closest grid position
    function findClosestGridPosition(x, y) {
        let closestPos = null;
        let closestDist = Infinity;
        
        iconGrid.forEach(pos => {
            if (!pos.occupied) {
                const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPos = pos;
                }
            }
        });
        
        return closestPos;
    }
    
    // Select an icon
    function selectIcon(iconEl) {
        // Clear previous selection
        clearIconSelection();
        
        // Select new icon
        iconEl.classList.add('selected');
        selectedIcon = iconEl;
    }
    
    // Clear icon selection
    function clearIconSelection() {
        if (selectedIcon) {
            selectedIcon.classList.remove('selected');
            selectedIcon = null;
        }
        
        const selectedIcons = desktop.querySelectorAll('.desktop-icon.selected');
        selectedIcons.forEach(icon => {
            icon.classList.remove('selected');
        });
    }
    
    // Show desktop context menu
    function showDesktopContextMenu(x, y, targetIcon) {
        const menuItems = [];
        
        // If an icon is right-clicked
        if (targetIcon) {
            const iconName = targetIcon.getAttribute('data-name');
            const icon = icons.find(i => i.name === iconName);
            
            if (icon) {
                // Select the icon if it's not already selected
                if (!targetIcon.classList.contains('selected')) {
                    clearIconSelection();
                    selectIcon(targetIcon);
                }
                
                // Icon-specific actions
                menuItems.push({
                    text: Translations.get('open'),
                    action: icon.action
                });
                
                menuItems.push({ isSeparator: true });
                
                menuItems.push({
                    text: Translations.get('rename'),
                    action: function() {
                        // Functionality to be implemented
                        console.log('Rename icon:', iconName);
                    }
                });
                
                menuItems.push({
                    text: Translations.get('properties'),
                    action: function() {
                        // Show properties dialog - to be implemented
                        console.log('Show properties for:', iconName);
                    }
                });
                
                menuItems.push({ isSeparator: true });
            }
        }
        
        // Common desktop actions
        menuItems.push({
            text: Translations.get('refresh'),
            action: function() {
                // Refresh desktop
                repositionIcons();
            }
        });
        
        menuItems.push({ isSeparator: true });
        
        menuItems.push({
            text: Translations.get('view'),
            hasSubmenu: true,
            submenu: [
                {
                    text: Translations.get('largeIcons'),
                    action: function() {
                        // Change icon size
                        iconSize = 100;
                        iconHeight = 120;
                        calculateIconGrid();
                        repositionIcons();
                    }
                },
                {
                    text: Translations.get('mediumIcons'),
                    action: function() {
                        // Change icon size
                        iconSize = 80;
                        iconHeight = 90;
                        calculateIconGrid();
                        repositionIcons();
                    }
                },
                {
                    text: Translations.get('smallIcons'),
                    action: function() {
                        // Change icon size
                        iconSize = 60;
                        iconHeight = 70;
                        calculateIconGrid();
                        repositionIcons();
                    }
                }
            ]
        });
        
        menuItems.push({
            text: Translations.get('sort'),
            hasSubmenu: true,
            submenu: [
                {
                    text: Translations.get('sortByName'),
                    action: function() {
                        // Sort icons by name functionality
                        console.log('Sort icons by name');
                    }
                },
                {
                    text: Translations.get('sortByType'),
                    action: function() {
                        // Sort icons by type functionality
                        console.log('Sort icons by type');
                    }
                },
                {
                    text: Translations.get('sortByDate'),
                    action: function() {
                        // Sort icons by date functionality
                        console.log('Sort icons by date');
                    }
                }
            ]
        });
        
        menuItems.push({
            text: Translations.get('new'),
            hasSubmenu: true,
            submenu: [
                {
                    text: Translations.get('folder'),
                    action: function() {
                        // Create new folder functionality
                        console.log('Create new folder');
                    }
                },
                {
                    text: Translations.get('textDocument'),
                    action: function() {
                        // Create new text document functionality
                        console.log('Create new text document');
                    }
                }
            ]
        });
        
        menuItems.push({ isSeparator: true });
        
        menuItems.push({
            text: Translations.get('changeWallpaper'),
            action: function() {
                // Open settings app to wallpaper section
                if (typeof SettingsApp !== 'undefined') {
                    SettingsApp.openToSection('appearance');
                }
            }
        });
        
        // Show the context menu
        ContextMenuManager.showMenu(menuItems, x, y);
    }
    
    // Public API
    window.DesktopManager = {
        init: init,
        createIcons: createIcons,
        repositionIcons: repositionIcons
    };
})();
