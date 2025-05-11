/**
 * File Explorer Application
 * A simple file explorer similar to Windows Explorer
 */
(function() {
    'use strict';
    
    // Application state
    let windowId = null;
    let currentPath = '/';
    let selectedItem = null;
    let viewMode = 'icons';  // icons, details, list
    
    // Virtual file system structure
    const fileSystem = {
        'C:': {
            type: 'drive',
            icon: 'assets/icons/drive.svg',
            children: {
                'Users': {
                    type: 'folder',
                    icon: 'assets/icons/folder.svg',
                    children: {
                        'User': {
                            type: 'folder',
                            icon: 'assets/icons/folder-user.svg',
                            children: {
                                'Desktop': {
                                    type: 'folder',
                                    icon: 'assets/icons/folder-desktop.svg',
                                    children: {}
                                },
                                'Documents': {
                                    type: 'folder',
                                    icon: 'assets/icons/folder-documents.svg',
                                    children: {
                                        'readme.txt': {
                                            type: 'file',
                                            icon: 'assets/icons/file-text.svg',
                                            size: '2 KB',
                                            created: '2023-01-15'
                                        },
                                        'report.docx': {
                                            type: 'file',
                                            icon: 'assets/icons/file-word.svg',
                                            size: '15 KB',
                                            created: '2023-02-10'
                                        }
                                    }
                                },
                                'Pictures': {
                                    type: 'folder',
                                    icon: 'assets/icons/folder-pictures.svg',
                                    children: {
                                        'vacation.jpg': {
                                            type: 'file',
                                            icon: 'assets/icons/file-image.svg',
                                            size: '1.5 MB',
                                            created: '2023-03-20'
                                        },
                                        'family.jpg': {
                                            type: 'file',
                                            icon: 'assets/icons/file-image.svg',
                                            size: '2.2 MB',
                                            created: '2023-03-25'
                                        }
                                    }
                                },
                                'Music': {
                                    type: 'folder',
                                    icon: 'assets/icons/folder-music.svg',
                                    children: {
                                        'song.mp3': {
                                            type: 'file',
                                            icon: 'assets/icons/file-audio.svg',
                                            size: '3.5 MB',
                                            created: '2023-04-05'
                                        }
                                    }
                                },
                                'Downloads': {
                                    type: 'folder',
                                    icon: 'assets/icons/folder-download.svg',
                                    children: {}
                                }
                            }
                        }
                    }
                },
                'Program Files': {
                    type: 'folder',
                    icon: 'assets/icons/folder-program.svg',
                    children: {
                        'Windows Simulator': {
                            type: 'folder',
                            icon: 'assets/icons/folder-app.svg',
                            children: {
                                'simulator.exe': {
                                    type: 'file',
                                    icon: 'assets/icons/file-exe.svg',
                                    size: '25 MB',
                                    created: '2023-01-01'
                                },
                                'readme.txt': {
                                    type: 'file',
                                    icon: 'assets/icons/file-text.svg',
                                    size: '4 KB',
                                    created: '2023-01-01'
                                }
                            }
                        }
                    }
                },
                'Windows': {
                    type: 'folder',
                    icon: 'assets/icons/folder-windows.svg',
                    children: {
                        'System32': {
                            type: 'folder',
                            icon: 'assets/icons/folder-system.svg',
                            children: {}
                        }
                    }
                }
            }
        },
        'D:': {
            type: 'drive',
            icon: 'assets/icons/drive.svg',
            children: {
                'Backup': {
                    type: 'folder',
                    icon: 'assets/icons/folder.svg',
                    children: {}
                }
            }
        }
    };
    
    // Initialize the explorer
    function init() {
        // Nothing to do here, app will be initialized when opened
    }
    
    // Open the file explorer
    function open(path) {
        // If already open, just focus the window
        if (windowId !== null) {
            WindowManager.activateWindow(windowId);
            if (path) {
                navigateTo(path);
            }
            return;
        }
        
        // Create the window content
        const content = createWindowContent();
        
        // Create the window
        windowId = WindowManager.createWindow({
            title: Translations.get('fileExplorer'),
            icon: 'assets/icons/explorer.svg',
            appName: 'fileExplorer',
            width: 800,
            height: 500,
            x: 80,
            y: 80,
            content: content,
            className: 'explorer-window',
            onClose: handleClose,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onUpdate: updateTranslations
        });
        
        // Setup event handlers
        attachEventHandlers();
        
        // Navigate to initial path or default
        navigateTo(path || 'C:');
    }
    
    // Create the window content
    function createWindowContent() {
        return `
            <div class="explorer-toolbar">
                <div class="explorer-nav-buttons">
                    <button class="explorer-btn explorer-btn-back" title="${Translations.get('back')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                        </svg>
                    </button>
                    <button class="explorer-btn explorer-btn-forward" title="${Translations.get('forward')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
                        </svg>
                    </button>
                    <button class="explorer-btn explorer-btn-up" title="${Translations.get('up')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z" />
                        </svg>
                    </button>
                </div>
                
                <div class="explorer-address-bar">
                    <span class="explorer-address-label">${Translations.get('address')}:</span>
                    <input type="text" class="explorer-address-input" value="C:">
                </div>
                
                <div class="explorer-search-bar">
                    <span class="explorer-search-label">${Translations.get('search')}:</span>
                    <input type="text" class="explorer-search-input" placeholder="${Translations.get('searchPrompt')}">
                </div>
            </div>
            
            <div class="explorer-main">
                <div class="explorer-sidebar">
                    <div class="explorer-sidebar-section">
                        <div class="explorer-sidebar-header">${Translations.get('favorites')}</div>
                        <div class="explorer-sidebar-item" data-path="C:/Users/User/Desktop">
                            <img src="assets/icons/folder-desktop.svg" class="explorer-sidebar-icon" alt="">
                            <span>${Translations.get('desktop')}</span>
                        </div>
                        <div class="explorer-sidebar-item" data-path="C:/Users/User/Documents">
                            <img src="assets/icons/folder-documents.svg" class="explorer-sidebar-icon" alt="">
                            <span>${Translations.get('documents')}</span>
                        </div>
                        <div class="explorer-sidebar-item" data-path="C:/Users/User/Downloads">
                            <img src="assets/icons/folder-download.svg" class="explorer-sidebar-icon" alt="">
                            <span>${Translations.get('downloads')}</span>
                        </div>
                        <div class="explorer-sidebar-item" data-path="C:/Users/User/Pictures">
                            <img src="assets/icons/folder-pictures.svg" class="explorer-sidebar-icon" alt="">
                            <span>${Translations.get('pictures')}</span>
                        </div>
                        <div class="explorer-sidebar-item" data-path="C:/Users/User/Music">
                            <img src="assets/icons/folder-music.svg" class="explorer-sidebar-icon" alt="">
                            <span>${Translations.get('music')}</span>
                        </div>
                    </div>
                    
                    <div class="explorer-sidebar-section">
                        <div class="explorer-sidebar-header">${Translations.get('devices')}</div>
                        <div class="explorer-sidebar-item" data-path="C:">
                            <img src="assets/icons/drive.svg" class="explorer-sidebar-icon" alt="">
                            <span>${Translations.get('localDisk')} (C:)</span>
                        </div>
                        <div class="explorer-sidebar-item" data-path="D:">
                            <img src="assets/icons/drive.svg" class="explorer-sidebar-icon" alt="">
                            <span>${Translations.get('localDisk')} (D:)</span>
                        </div>
                    </div>
                </div>
                
                <div class="explorer-content">
                    <div class="explorer-view-options">
                        <button class="explorer-btn explorer-view-btn" data-view="icons" title="${Translations.get('largeIcons')}">
                            <svg viewBox="0 0 24 24">
                                <path d="M3,3H11V11H3V3M3,13H11V21H3V13M13,3H21V11H13V3M13,13H21V21H13V13Z" />
                            </svg>
                        </button>
                        <button class="explorer-btn explorer-view-btn" data-view="list" title="${Translations.get('list')}">
                            <svg viewBox="0 0 24 24">
                                <path d="M3,4H21V8H3V4M3,10H21V14H3V10M3,16H21V20H3V16Z" />
                            </svg>
                        </button>
                        <button class="explorer-btn explorer-view-btn" data-view="details" title="${Translations.get('details')}">
                            <svg viewBox="0 0 24 24">
                                <path d="M3,3H21V7H3V3M3,9H21V13H3V9M3,15H21V19H3V15Z" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="explorer-items-container">
                        <!-- Items will be loaded here -->
                    </div>
                </div>
            </div>
            
            <div class="explorer-statusbar">
                <div class="explorer-status-info">0 items</div>
            </div>
        `;
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Navigation buttons
        const backBtn = windowContent.querySelector('.explorer-btn-back');
        const forwardBtn = windowContent.querySelector('.explorer-btn-forward');
        const upBtn = windowContent.querySelector('.explorer-btn-up');
        
        backBtn.addEventListener('click', goBack);
        forwardBtn.addEventListener('click', goForward);
        upBtn.addEventListener('click', goUp);
        
        // Address bar
        const addressInput = windowContent.querySelector('.explorer-address-input');
        addressInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                navigateTo(this.value);
            }
        });
        
        // View options
        const viewButtons = windowContent.querySelectorAll('.explorer-view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                changeViewMode(this.dataset.view);
            });
        });
        
        // Sidebar items
        const sidebarItems = windowContent.querySelectorAll('.explorer-sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', function() {
                navigateTo(this.dataset.path);
            });
        });
    }
    
    // Navigate to a path
    function navigateTo(path) {
        // Normalize path
        path = normalizePath(path);
        
        // Get the folder at the path
        const folder = getItemAtPath(path);
        
        if (folder && (folder.type === 'folder' || folder.type === 'drive')) {
            currentPath = path;
            
            // Update address bar
            const windowContent = WindowManager.getWindowContentElement(windowId);
            if (windowContent) {
                const addressInput = windowContent.querySelector('.explorer-address-input');
                addressInput.value = path;
            }
            
            // Update window title
            const pathParts = path.split('/');
            const title = pathParts[pathParts.length - 1] || path;
            WindowManager.updateWindowTitle(windowId, `${title} - ${Translations.get('fileExplorer')}`);
            
            // Display folder contents
            displayFolderContents(folder);
        } else {
            // Handle invalid path - show error or revert to previous path
            alert(`${Translations.get('invalidPath')}: ${path}`);
        }
    }
    
    // Display folder contents
    function displayFolderContents(folder) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const itemsContainer = windowContent.querySelector('.explorer-items-container');
        itemsContainer.innerHTML = '';
        
        // Set the active view mode
        const viewButtons = windowContent.querySelectorAll('.explorer-view-btn');
        viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewMode);
        });
        
        // Add appropriate class for the view mode
        itemsContainer.className = 'explorer-items-container';
        itemsContainer.classList.add(`explorer-view-${viewMode}`);
        
        // Get folder contents
        const children = folder.children || {};
        const items = Object.keys(children).map(name => ({
            name: name,
            ...children[name]
        }));
        
        // Sort items (folders first, then files)
        items.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        
        // Create items
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = `explorer-item explorer-item-${item.type}`;
            itemEl.dataset.name = item.name;
            
            // Different HTML structure based on view mode
            if (viewMode === 'icons') {
                itemEl.innerHTML = `
                    <div class="explorer-item-icon">
                        <img src="${item.icon}" alt="">
                    </div>
                    <div class="explorer-item-name">${item.name}</div>
                `;
            } else if (viewMode === 'list') {
                itemEl.innerHTML = `
                    <div class="explorer-item-icon">
                        <img src="${item.icon}" alt="">
                    </div>
                    <div class="explorer-item-name">${item.name}</div>
                `;
            } else if (viewMode === 'details') {
                itemEl.innerHTML = `
                    <div class="explorer-item-row">
                        <div class="explorer-item-cell explorer-item-icon">
                            <img src="${item.icon}" alt="">
                        </div>
                        <div class="explorer-item-cell explorer-item-name">${item.name}</div>
                        <div class="explorer-item-cell explorer-item-type">${item.type}</div>
                        <div class="explorer-item-cell explorer-item-size">${item.size || ''}</div>
                        <div class="explorer-item-cell explorer-item-date">${item.created || ''}</div>
                    </div>
                `;
            }
            
            // Item events
            itemEl.addEventListener('click', function(e) {
                selectItem(this);
            });
            
            itemEl.addEventListener('dblclick', function(e) {
                openItem(item);
            });
            
            itemEl.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                selectItem(this);
                showItemContextMenu(e.clientX, e.clientY, item);
            });
            
            itemsContainer.appendChild(itemEl);
        });
        
        // Update status bar
        const statusInfo = windowContent.querySelector('.explorer-status-info');
        statusInfo.textContent = `${items.length} ${Translations.get('items')}`;
    }
    
    // Select an item
    function selectItem(itemEl) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Clear previous selection
        const selectedItems = windowContent.querySelectorAll('.explorer-item.selected');
        selectedItems.forEach(item => {
            item.classList.remove('selected');
        });
        
        // Set new selection
        itemEl.classList.add('selected');
        selectedItem = itemEl.dataset.name;
    }
    
    // Open an item (navigate to folder or open file)
    function openItem(item) {
        if (item.type === 'folder' || item.type === 'drive') {
            // Navigate to folder
            navigateTo(`${currentPath}/${item.name}`.replace(/\/+/g, '/'));
        } else {
            // For files, perform an action based on file type
            const extension = item.name.split('.').pop().toLowerCase();
            
            switch (extension) {
                case 'txt':
                    // Open text files in Notepad
                    NotepadApp.open();
                    break;
                case 'docx':
                    // Perhaps show a message that this would open in Word
                    alert(`${item.name} would open in Microsoft Word`);
                    break;
                case 'jpg':
                case 'jpeg':
                case 'png':
                    // Open image files in Paint
                    PaintApp.open();
                    break;
                case 'mp3':
                    // Show message about media player
                    alert(`${item.name} would open in Media Player`);
                    break;
                case 'exe':
                    // Show message about running program
                    alert(`Running ${item.name}...`);
                    break;
                default:
                    alert(`No application associated with ${extension} files.`);
            }
        }
    }
    
    // Show context menu for an item
    function showItemContextMenu(x, y, item) {
        const menuItems = [
            {
                text: Translations.get('open'),
                action: function() {
                    openItem(item);
                }
            }
        ];
        
        if (item.type === 'file') {
            menuItems.push(
                { isSeparator: true },
                {
                    text: Translations.get('edit'),
                    action: function() {
                        // Open editable files in Notepad
                        NotepadApp.open();
                    }
                }
            );
        }
        
        menuItems.push(
            { isSeparator: true },
            {
                text: Translations.get('copy'),
                action: function() {
                    console.log(`Copy ${item.name}`);
                }
            },
            {
                text: Translations.get('cut'),
                action: function() {
                    console.log(`Cut ${item.name}`);
                }
            },
            { isSeparator: true },
            {
                text: Translations.get('delete'),
                action: function() {
                    console.log(`Delete ${item.name}`);
                    // In a real implementation, would remove from the virtual filesystem
                }
            },
            {
                text: Translations.get('rename'),
                action: function() {
                    console.log(`Rename ${item.name}`);
                }
            },
            { isSeparator: true },
            {
                text: Translations.get('properties'),
                action: function() {
                    showProperties(item);
                }
            }
        );
        
        ContextMenuManager.showMenu(menuItems, x, y);
    }
    
    // Show properties dialog for an item
    function showProperties(item) {
        alert(`Properties for ${item.name}\nType: ${item.type}\nSize: ${item.size || 'N/A'}\nCreated: ${item.created || 'N/A'}`);
    }
    
    // Go up one level in directory hierarchy
    function goUp() {
        const pathParts = currentPath.split('/');
        if (pathParts.length > 1) {
            pathParts.pop(); // Remove last part
            const parentPath = pathParts.join('/');
            navigateTo(parentPath || '/');
        }
    }
    
    // Go back in navigation history
    function goBack() {
        // Not fully implemented, would need history tracking
        console.log('Go back');
    }
    
    // Go forward in navigation history
    function goForward() {
        // Not fully implemented, would need history tracking
        console.log('Go forward');
    }
    
    // Change the view mode
    function changeViewMode(mode) {
        if (['icons', 'list', 'details'].includes(mode)) {
            viewMode = mode;
            
            // Refresh the current view
            const folder = getItemAtPath(currentPath);
            if (folder) {
                displayFolderContents(folder);
            }
        }
    }
    
    // Normalize path format
    function normalizePath(path) {
        // Replace backslashes with forward slashes
        path = path.replace(/\\/g, '/');
        
        // Remove trailing slash except for root
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        return path;
    }
    
    // Get item at a specific path
    function getItemAtPath(path) {
        path = normalizePath(path);
        const parts = path.split('/').filter(part => part.length > 0);
        
        if (parts.length === 0) {
            // Root - return all drives
            return { type: 'root', children: fileSystem };
        }
        
        // Start with the file system root
        let current = fileSystem;
        
        // Handle C: or D: as first part
        if (parts[0].endsWith(':')) {
            const drive = parts[0];
            if (!current[drive]) {
                return null;  // Drive not found
            }
            current = current[drive];
            parts.shift();
        } else {
            // If path doesn't start with a drive, it's invalid
            return null;
        }
        
        // Traverse the path
        for (const part of parts) {
            if (!current.children || !current.children[part]) {
                return null;  // Item not found
            }
            current = current.children[part];
        }
        
        return current;
    }
    
    // Handle window close
    function handleClose() {
        windowId = null;
        currentPath = '/';
        selectedItem = null;
    }
    
    // Handle window focus
    function handleFocus() {
        // Not needed for this application
    }
    
    // Handle window blur
    function handleBlur() {
        // Not needed for this application
    }
    
    // Update translations
    function updateTranslations() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update translatable elements
        Translations.updateElements(windowContent);
        
        // Update window title based on current path
        const pathParts = currentPath.split('/');
        const title = pathParts[pathParts.length - 1] || currentPath;
        WindowManager.updateWindowTitle(windowId, `${title} - ${Translations.get('fileExplorer')}`);
    }
    
    // Public API
    window.FileExplorerApp = {
        init: init,
        open: open
    };
})();