/**
 * Paint Application
 * A simple drawing application similar to Windows Paint
 */
(function() {
    'use strict';
    
    // Application state
    let windowId = null;
    let canvas = null;
    let ctx = null;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let tool = 'pencil';
    let lineWidth = 3;
    let color = '#000000';
    let fillShape = false;
    let currentShape = null;
    let shapeStartX = 0;
    let shapeStartY = 0;
    let isMenuOpen = false;
    let activeMenu = null;
    let activeDialog = null;
    let fileName = 'untitled.jpg';
    
    // Initialize the app
    function init() {
        // Nothing to do here, app will be initialized when opened
    }
    
    // Open the Paint application
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
            title: Translations.get('paint'),
            icon: 'assets/icons/paint.svg',
            appName: 'paint',
            width: 800,
            height: 600,
            x: 50,
            y: 50,
            content: content,
            className: 'paint-window',
            onClose: handleClose,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onUpdate: updateTranslations
        });
        
        // Initialize the canvas
        initCanvas();
        
        // Set up event handlers
        attachEventHandlers();
    }
    
    // Create the window content HTML
    function createWindowContent() {
        return `
            <div class="paint-menubar">
                <div class="paint-menu-item" data-menu="file">
                    <span data-translate="file">${Translations.get('file')}</span>
                </div>
                
                <!-- File Menu Dropdown -->
                <div class="paint-dropdown" data-dropdown="file">
                    <div class="paint-dropdown-item" data-command="new">
                        <span data-translate="new">${Translations.get('new')}</span>
                    </div>
                    <div class="paint-dropdown-item" data-command="open">
                        <span data-translate="open">${Translations.get('open')}</span>
                    </div>
                    <div class="paint-dropdown-item" data-command="save">
                        <span data-translate="save">${Translations.get('save')}</span>
                    </div>
                    <div class="paint-dropdown-separator"></div>
                    <div class="paint-dropdown-item" data-command="exit">
                        <span data-translate="exit">${Translations.get('exit')}</span>
                    </div>
                </div>
                
                <div class="paint-menu-item" data-menu="edit">
                    <span data-translate="edit">${Translations.get('edit')}</span>
                </div>
                
                <!-- Edit Menu Dropdown -->
                <div class="paint-dropdown" data-dropdown="edit">
                    <div class="paint-dropdown-item" data-command="undo">
                        <span data-translate="undo">${Translations.get('undo')}</span>
                    </div>
                    <div class="paint-dropdown-item" data-command="cut">
                        <span data-translate="cut">${Translations.get('cut')}</span>
                    </div>
                    <div class="paint-dropdown-item" data-command="copy">
                        <span data-translate="copy">${Translations.get('copy')}</span>
                    </div>
                    <div class="paint-dropdown-item" data-command="paste">
                        <span data-translate="paste">${Translations.get('paste')}</span>
                    </div>
                </div>
            </div>
            
            <div class="paint-toolbar">
                <div class="paint-toolbar-section">
                    <div class="paint-tool" data-tool="pencil" title="${Translations.get('pencil')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87L20.71,7.04M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                        </svg>
                    </div>
                    <div class="paint-tool" data-tool="brush" title="${Translations.get('brush')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21C8.41,21 10,19.41 10,17C10,15.61 9.53,14 7,14Z" />
                        </svg>
                    </div>
                    <div class="paint-tool" data-tool="eraser" title="${Translations.get('eraser')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z" />
                        </svg>
                    </div>
                </div>
                
                <div class="paint-toolbar-section">
                    <div class="paint-tool" data-tool="line" title="${Translations.get('line')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M19,13H5V11H19V13Z" />
                        </svg>
                    </div>
                    <div class="paint-tool" data-tool="rectangle" title="${Translations.get('rectangle')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M4,6V19H20V6H4M18,17H6V8H18V17Z" />
                        </svg>
                    </div>
                    <div class="paint-tool" data-tool="ellipse" title="${Translations.get('ellipse')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                    </div>
                </div>
                
                <div class="paint-toolbar-section">
                    <div class="paint-tool" data-tool="clear" title="${Translations.get('clear')}">
                        <svg viewBox="0 0 24 24">
                            <path d="M19.36,2.72L20.78,4.14L15.06,9.85C16.13,11.39 16.28,13.24 15.38,14.44L9.06,8.12C10.26,7.22 12.11,7.37 13.65,8.44L19.36,2.72M5.93,17.57C3.92,15.56 2.69,13.16 2.35,10.92L7.23,8.83L14.67,16.27L12.58,21.15C10.34,20.81 7.94,19.58 5.93,17.57Z" />
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="paint-options">
                <div class="paint-option">
                    <span class="paint-option-label" data-translate="size">${Translations.get('size')}</span>
                    <input type="range" class="paint-option-control paint-size-input" min="1" max="20" value="3">
                </div>
                
                <div class="paint-option">
                    <label>
                        <input type="checkbox" class="paint-fill-checkbox">
                        <span data-translate="fill">Fill</span>
                    </label>
                </div>
                
                <div class="paint-colors">
                    <div class="paint-color active" style="background-color: #000000" data-color="#000000"></div>
                    <div class="paint-color" style="background-color: #FF0000" data-color="#FF0000"></div>
                    <div class="paint-color" style="background-color: #00FF00" data-color="#00FF00"></div>
                    <div class="paint-color" style="background-color: #0000FF" data-color="#0000FF"></div>
                    <div class="paint-color" style="background-color: #FFFF00" data-color="#FFFF00"></div>
                    <div class="paint-color" style="background-color: #FF00FF" data-color="#FF00FF"></div>
                    <div class="paint-color" style="background-color: #00FFFF" data-color="#00FFFF"></div>
                    <div class="paint-color" style="background-color: #FFFFFF" data-color="#FFFFFF"></div>
                </div>
            </div>
            
            <div class="paint-canvas-container">
                <canvas class="paint-canvas"></canvas>
            </div>
            
            <div class="paint-statusbar">
                <div class="paint-coordinates">x: 0, y: 0</div>
                <div class="paint-canvas-size">800x600</div>
            </div>
            
            <div class="paint-overlay"></div>
        `;
    }
    
    // Initialize the canvas
    function initCanvas() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        canvas = windowContent.querySelector('.paint-canvas');
        ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 800;
        canvas.height = 500;
        
        // Set initial canvas style
        canvas.style.backgroundColor = 'white';
        
        // Clear the canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update canvas size display
        const canvasSizeElement = windowContent.querySelector('.paint-canvas-size');
        canvasSizeElement.textContent = `${canvas.width}x${canvas.height}`;
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Menu item click
        const menuItems = windowContent.querySelectorAll('.paint-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', handleMenuClick);
        });
        
        // Dropdown item click
        const dropdownItems = windowContent.querySelectorAll('.paint-dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', handleMenuItemClick);
        });
        
        // Tool selection
        const toolElements = windowContent.querySelectorAll('.paint-tool');
        toolElements.forEach(toolElement => {
            toolElement.addEventListener('click', function() {
                // Remove active class from all tools
                toolElements.forEach(el => el.classList.remove('active'));
                
                // Add active class to selected tool
                this.classList.add('active');
                
                // Set current tool
                tool = this.dataset.tool;
                
                // Special case for clear tool
                if (tool === 'clear') {
                    clearCanvas();
                    // Reset to previous tool
                    tool = 'pencil';
                    this.classList.remove('active');
                    windowContent.querySelector('[data-tool="pencil"]').classList.add('active');
                }
            });
        });
        
        // Activate pencil tool by default
        windowContent.querySelector('[data-tool="pencil"]').classList.add('active');
        
        // Line width control
        const sizeInput = windowContent.querySelector('.paint-size-input');
        sizeInput.addEventListener('change', function() {
            lineWidth = parseInt(this.value);
        });
        
        // Fill checkbox
        const fillCheckbox = windowContent.querySelector('.paint-fill-checkbox');
        fillCheckbox.addEventListener('change', function() {
            fillShape = this.checked;
        });
        
        // Color selection
        const colorElements = windowContent.querySelectorAll('.paint-color');
        colorElements.forEach(colorElement => {
            colorElement.addEventListener('click', function() {
                // Remove active class from all colors
                colorElements.forEach(el => el.classList.remove('active'));
                
                // Add active class to selected color
                this.classList.add('active');
                
                // Set current color
                color = this.dataset.color;
            });
        });
        
        // Canvas mouse events
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);
        
        // Track mouse coordinates
        canvas.addEventListener('mousemove', updateCoordinates);
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.paint-menubar') && isMenuOpen) {
                closeMenu();
            }
        });
    }
    
    // Handle menu click
    function handleMenuClick(e) {
        const menu = e.currentTarget.dataset.menu;
        if (!menu) return;
        
        // Toggle the menu
        if (activeMenu === menu) {
            closeMenu();
        } else {
            openMenu(menu);
        }
    }
    
    // Open a menu
    function openMenu(menuName) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Close any open menu
        closeMenu();
        
        // Open the new menu
        const dropdown = windowContent.querySelector(`.paint-dropdown[data-dropdown="${menuName}"]`);
        if (!dropdown) return;
        
        // Activate menu item
        const menuItem = windowContent.querySelector(`.paint-menu-item[data-menu="${menuName}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
            
            // Position the dropdown below the menu item
            const menuRect = menuItem.getBoundingClientRect();
            const windowRect = windowContent.getBoundingClientRect();
            
            dropdown.style.top = (menuRect.bottom - windowRect.top) + 'px';
            dropdown.style.left = (menuRect.left - windowRect.left) + 'px';
        }
        
        // Show dropdown
        dropdown.classList.add('active');
        
        // Update state
        isMenuOpen = true;
        activeMenu = menuName;
    }
    
    // Close the current menu
    function closeMenu() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Hide all dropdowns
        const dropdowns = windowContent.querySelectorAll('.paint-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
        
        // Deactivate menu items
        const menuItems = windowContent.querySelectorAll('.paint-menu-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Update state
        isMenuOpen = false;
        activeMenu = null;
    }
    
    // Handle menu item click
    function handleMenuItemClick(e) {
        const command = e.currentTarget.dataset.command;
        if (!command) return;
        
        // Close the menu
        closeMenu();
        
        // Execute the command
        executeCommand(command);
    }
    
    // Execute a command
    function executeCommand(command) {
        switch (command) {
            case 'new':
                clearCanvas();
                break;
            case 'open':
                openImage();
                break;
            case 'save':
                saveImage();
                break;
            case 'exit':
                WindowManager.closeWindow(windowId);
                break;
            case 'undo':
                // To be implemented
                break;
            case 'cut':
                // To be implemented
                break;
            case 'copy':
                // To be implemented
                break;
            case 'paste':
                // To be implemented
                break;
        }
    }
    
    // Open an image
    function openImage() {
        // Create a file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        // Handle file selection
        input.onchange = function(e) {
            if (e.target.files.length === 0) return;
            
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Create a new image object
                const img = new Image();
                img.onload = function() {
                    // Clear the canvas
                    clearCanvas();
                    
                    // Draw the image on the canvas
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Update filename
                    fileName = file.name;
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        };
        
        // Trigger file picker
        input.click();
    }
    
    // Handle mouse down on canvas
    function handleMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        isDrawing = true;
        lastX = x;
        lastY = y;
        
        // For shape tools, store starting point
        if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
            shapeStartX = x;
            shapeStartY = y;
            // Create a copy of the canvas for redrawing
            currentShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } else {
            // For freehand tools, start drawing
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    }
    
    // Handle mouse move on canvas
    function handleMouseMove(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Different behavior based on the selected tool
        switch (tool) {
            case 'pencil':
                drawLine(lastX, lastY, x, y);
                lastX = x;
                lastY = y;
                break;
                
            case 'brush':
                drawBrush(lastX, lastY, x, y);
                lastX = x;
                lastY = y;
                break;
                
            case 'eraser':
                erase(x, y);
                lastX = x;
                lastY = y;
                break;
                
            case 'line':
                // Restore previous state and draw the shape preview
                ctx.putImageData(currentShape, 0, 0);
                drawLine(shapeStartX, shapeStartY, x, y);
                break;
                
            case 'rectangle':
                // Restore previous state and draw the shape preview
                ctx.putImageData(currentShape, 0, 0);
                drawRectangle(shapeStartX, shapeStartY, x, y);
                break;
                
            case 'ellipse':
                // Restore previous state and draw the shape preview
                ctx.putImageData(currentShape, 0, 0);
                drawEllipse(shapeStartX, shapeStartY, x, y);
                break;
        }
    }
    
    // Handle mouse up on canvas
    function handleMouseUp() {
        isDrawing = false;
        currentShape = null;
    }
    
    // Handle mouse leave canvas
    function handleMouseLeave() {
        isDrawing = false;
    }
    
    // Handle touch start on canvas
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    // Handle touch move on canvas
    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    // Handle touch end on canvas
    function handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup');
        canvas.dispatchEvent(mouseEvent);
    }
    
    // Update coordinates display
    function updateCoordinates(e) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        
        const coordinatesElement = windowContent.querySelector('.paint-coordinates');
        coordinatesElement.textContent = `x: ${x}, y: ${y}`;
    }
    
    // Draw a line between two points
    function drawLine(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    
    // Draw with brush tool
    function drawBrush(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
    
    // Erase at the specified position
    function erase(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, lineWidth * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    }
    
    // Draw a rectangle
    function drawRectangle(x1, y1, x2, y2) {
        ctx.beginPath();
        const width = x2 - x1;
        const height = y2 - y1;
        
        if (fillShape) {
            ctx.fillStyle = color;
            ctx.fillRect(x1, y1, width, height);
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.strokeRect(x1, y1, width, height);
        }
    }
    
    // Draw an ellipse
    function drawEllipse(x1, y1, x2, y2) {
        ctx.beginPath();
        
        // Calculate center and radius
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radiusX = Math.abs(x2 - x1) / 2;
        const radiusY = Math.abs(y2 - y1) / 2;
        
        // Draw ellipse
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        
        // Fill or stroke based on fillShape setting
        if (fillShape) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
    }
    
    // Clear the canvas
    function clearCanvas() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Save the image as JPG
    function saveImage() {
        if (!canvas) return;
        
        // Show save dialog
        showSaveDialog(function(saveFileName) {
            if (!saveFileName) return; // User cancelled
            
            // If no extension is provided, add .jpg
            if (!saveFileName.toLowerCase().endsWith('.jpg') && 
                !saveFileName.toLowerCase().endsWith('.jpeg')) {
                saveFileName += '.jpg';
            }
            
            // Convert canvas to data URL
            const dataURL = canvas.toDataURL('image/jpeg', 0.9);
            
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = dataURL;
            downloadLink.download = saveFileName;
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Update filename
            fileName = saveFileName;
        });
    }
    
    // Show save dialog
    function showSaveDialog(callback) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Create dialog overlay
        const dialogOverlay = document.createElement('div');
        dialogOverlay.className = 'paint-dialog-overlay';
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'paint-dialog save-dialog';
        
        // Create dialog content
        dialog.innerHTML = `
            <div class="dialog-header">
                <div class="dialog-title">${Translations.get('saveAs')}</div>
                <div class="dialog-close">×</div>
            </div>
            <div class="dialog-content">
                <div class="dialog-label">${Translations.get('fileName')}:</div>
                <input type="text" class="dialog-input" value="${fileName || 'untitled.jpg'}">
                <div class="dialog-label">${Translations.get('saveAsType')}:</div>
                <select class="dialog-select">
                    <option value="jpg">JPEG Image (*.jpg)</option>
                </select>
            </div>
            <div class="dialog-buttons">
                <button class="dialog-button" id="save-button">${Translations.get('save')}</button>
                <button class="dialog-button" id="cancel-button">${Translations.get('cancel')}</button>
            </div>
        `;
        
        // Add dialog to overlay and overlay to window
        dialogOverlay.appendChild(dialog);
        windowContent.appendChild(dialogOverlay);
        
        // Focus the filename input
        const fileNameInput = dialog.querySelector('.dialog-input');
        fileNameInput.focus();
        fileNameInput.select();
        
        // Store active dialog
        activeDialog = dialogOverlay;
        
        // Handle save button click
        const saveButton = dialog.querySelector('#save-button');
        saveButton.addEventListener('click', function() {
            const saveFileName = fileNameInput.value.trim();
            if (saveFileName) {
                closeDialog();
                callback(saveFileName);
            } else {
                fileNameInput.focus();
            }
        });
        
        // Handle cancel button click
        const cancelButton = dialog.querySelector('#cancel-button');
        cancelButton.addEventListener('click', function() {
            closeDialog();
            callback(null);
        });
        
        // Handle dialog close
        const closeButton = dialog.querySelector('.dialog-close');
        closeButton.addEventListener('click', function() {
            closeDialog();
            callback(null);
        });
        
        // Handle Enter key in filename input
        fileNameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const saveFileName = fileNameInput.value.trim();
                if (saveFileName) {
                    closeDialog();
                    callback(saveFileName);
                }
            } else if (e.key === 'Escape') {
                closeDialog();
                callback(null);
            }
        });
    }
    
    // Close the active dialog
    function closeDialog() {
        if (activeDialog) {
            activeDialog.remove();
            activeDialog = null;
        }
    }
    
    // Handle window close
    function handleClose() {
        // Reset state
        windowId = null;
        canvas = null;
        ctx = null;
        isDrawing = false;
        lastX = 0;
        lastY = 0;
        tool = 'pencil';
        lineWidth = 3;
        color = '#000000';
        fillShape = false;
        currentShape = null;
        
        return true;
    }
    
    // Handle window focus
    function handleFocus() {
        // Nothing to do here for now
    }
    
    // Handle window blur
    function handleBlur() {
        // Cancel any ongoing drawing
        isDrawing = false;
    }
    
    // Update translations
    function updateTranslations() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update all translatable elements
        Translations.updateElements(windowContent);
        
        // Update window title
        WindowManager.updateWindowTitle(windowId, Translations.get('paint'));
        
        // Update tool tooltips
        const toolElements = windowContent.querySelectorAll('.paint-tool');
        toolElements.forEach(toolElement => {
            const toolName = toolElement.dataset.tool;
            if (toolName) {
                toolElement.title = Translations.get(toolName);
            }
        });
    }
    
    // Public API
    window.PaintApp = {
        init: init,
        open: open
    };
})();
