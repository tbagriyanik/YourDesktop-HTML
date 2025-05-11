/**
 * Context Menu Manager
 * Handles right-click context menus throughout the system
 */
(function() {
    'use strict';
    
    // DOM element for context menu
    const contextMenuElement = document.getElementById('context-menu');
    
    // State
    let activeSubmenu = null;
    
    // Initialize context menu system
    function init() {
        // Attach global event listeners
        document.addEventListener('click', function(e) {
            // Close context menu when clicking elsewhere
            if (!e.target.closest('#context-menu')) {
                hideAllMenus();
            }
        });
        
        document.addEventListener('contextmenu', function(e) {
            // If not inside a specific context menu area, hide all menus
            if (!e.target.closest('.desktop-icon') && 
                !e.target.closest('#desktop') && 
                !e.target.closest('.taskbar-app') && 
                !e.target.closest('.app-item')) {
                hideAllMenus();
            }
        });
        
        // Handle keyboard navigation
        document.addEventListener('keydown', function(e) {
            // ESC to close menus
            if (e.key === 'Escape') {
                hideAllMenus();
            }
        });
    }
    
    // Show a context menu
    function showMenu(items, x, y, parentMenu = null) {
        // If this is a main menu (not submenu), hide any existing menus
        if (!parentMenu) {
            hideAllMenus();
        }
        
        // Create menu element if needed
        let menuElement = contextMenuElement;
        if (parentMenu) {
            // This is a submenu, create a new element
            menuElement = document.createElement('div');
            menuElement.className = 'desktop-context-menu submenu';
            document.body.appendChild(menuElement);
            
            // Store reference to the submenu
            activeSubmenu = menuElement;
        }
        
        // Clear current content
        menuElement.innerHTML = '';
        
        // Create menu items
        items.forEach(item => {
            if (item.isSeparator) {
                // Create separator
                const separator = document.createElement('div');
                separator.className = 'desktop-context-menu-separator';
                menuElement.appendChild(separator);
            } else {
                // Create menu item
                const menuItem = document.createElement('div');
                menuItem.className = 'desktop-context-menu-item';
                
                // Check if item is disabled
                if (item.disabled) {
                    menuItem.classList.add('disabled');
                }
                
                // Create item content
                let itemContent = item.text;
                
                // Add icon if provided
                if (item.icon) {
                    itemContent = `<img src="${item.icon}" class="menu-icon" alt=""> ${itemContent}`;
                }
                
                // Add arrow if has submenu
                if (item.hasSubmenu) {
                    itemContent += ' <span class="submenu-arrow">▶</span>';
                }
                
                menuItem.innerHTML = itemContent;
                
                // Add event listeners
                if (!item.disabled) {
                    if (item.hasSubmenu) {
                        // Handle hover for submenu
                        menuItem.addEventListener('mouseenter', function() {
                            // Position submenu next to this item
                            const rect = menuItem.getBoundingClientRect();
                            showMenu(item.submenu, rect.right, rect.top, menuElement);
                        });
                        
                        // Handle mouseleave
                        menuItem.addEventListener('mouseleave', function(e) {
                            // Check if mouse moved towards submenu
                            if (activeSubmenu) {
                                const submenuRect = activeSubmenu.getBoundingClientRect();
                                if (e.clientX >= submenuRect.left && 
                                    e.clientY >= submenuRect.top && 
                                    e.clientY <= submenuRect.bottom) {
                                    // Mouse is moving to submenu, don't close it
                                    return;
                                }
                            }
                            
                            // Hide submenu
                            if (activeSubmenu) {
                                activeSubmenu.remove();
                                activeSubmenu = null;
                            }
                        });
                    } else {
                        // Handle normal click for action
                        menuItem.addEventListener('click', function() {
                            if (item.action) {
                                item.action();
                            }
                            hideAllMenus();
                        });
                    }
                }
                
                menuElement.appendChild(menuItem);
            }
        });
        
        // Position the menu
        positionMenu(menuElement, x, y);
        
        // Show the menu
        menuElement.classList.remove('hidden');
    }
    
    // Position a menu element on screen
    function positionMenu(menuElement, x, y) {
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Reset position to ensure proper size calculation
        menuElement.style.left = '0px';
        menuElement.style.top = '0px';
        
        // Temporarily make visible but hidden to measure dimensions
        menuElement.style.visibility = 'hidden';
        menuElement.classList.remove('hidden');
        
        // Get menu dimensions
        const menuWidth = menuElement.offsetWidth;
        const menuHeight = menuElement.offsetHeight;
        
        // Calculate position, ensuring menu appears at the cursor
        let posX = x;
        let posY = y;
        
        // Ensure menu is within viewport
        if (posX + menuWidth > viewportWidth) {
            posX = x - menuWidth; // Show to the left of the cursor if no room on right
            // If still outside viewport, constrain to viewport edge
            if (posX < 0) {
                posX = 0;
            }
        }
        
        if (posY + menuHeight > viewportHeight) {
            posY = y - menuHeight; // Show above the cursor if no room below
            // If still outside viewport, constrain to viewport edge
            if (posY < 0) {
                posY = 0;
            }
        }
        
        // Apply position
        menuElement.style.left = posX + 'px';
        menuElement.style.top = posY + 'px';
        menuElement.style.visibility = 'visible';
    }
    
    // Hide all menus
    function hideAllMenus() {
        // Hide main menu
        contextMenuElement.classList.add('hidden');
        
        // Remove any submenus
        const submenus = document.querySelectorAll('.desktop-context-menu.submenu');
        submenus.forEach(submenu => {
            submenu.remove();
        });
        
        activeSubmenu = null;
    }
    
    // Public API
    window.ContextMenuManager = {
        init: init,
        showMenu: showMenu,
        hideAllMenus: hideAllMenus
    };
})();
