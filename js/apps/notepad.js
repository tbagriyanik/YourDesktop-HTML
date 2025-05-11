/**
 * Notepad Application
 * A simple text editor similar to Windows Notepad
 */
(function() {
    'use strict';
    
    // Application state
    let windowId = null;
    let isMenuOpen = false;
    let activeMenu = null;
    let activeDialog = null;
    let textContent = '';
    let filePath = null;
    let isModified = false;
    let selectionStart = 0;
    let selectionEnd = 0;
    let undoStack = [];
    let redoStack = [];
    let wordWrap = false;
    
    // Initialize the app
    function init() {
        // Nothing to do here, the app will be initialized when opened
    }
    
    // Open the Notepad application
    function open(initialContent) {
        // If already open, just focus the window
        if (windowId !== null) {
            WindowManager.activateWindow(windowId);
            return;
        }
        
        // Create window content
        const content = createWindowContent();
        
        // Create the window
        windowId = WindowManager.createWindow({
            title: 'Untitled - ' + Translations.get('notepad'),
            icon: 'assets/icons/notepad.svg',
            appName: 'notepad',
            width: 600,
            height: 400,
            x: 120,
            y: 80,
            content: content,
            className: 'notepad-window',
            onClose: handleClose,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onResize: updateTranslations
        });
        
        // Get content elements
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Set initial content if provided
        if (initialContent) {
            const textarea = windowContent.querySelector('.notepad-textarea');
            textarea.value = initialContent;
            textContent = initialContent;
        }
        
        // Attach event handlers
        attachEventHandlers();
    }
    
    // Create the window content HTML
    function createWindowContent() {
        return `
            <div class="notepad-menubar">
                <div class="notepad-menu-item" data-menu="file">
                    <span data-translate="file">${Translations.get('file')}</span>
                </div>
                <div class="notepad-menu-item" data-menu="edit">
                    <span data-translate="edit">${Translations.get('edit')}</span>
                </div>
                <div class="notepad-menu-item" data-menu="format">
                    <span data-translate="format">${Translations.get('format')}</span>
                </div>
                <div class="notepad-menu-item" data-menu="help">
                    <span data-translate="help">${Translations.get('help')}</span>
                </div>
                
                <!-- File Menu Dropdown -->
                <div class="notepad-dropdown" data-dropdown="file">
                    <div class="notepad-dropdown-item" data-command="new">
                        <span data-translate="new">${Translations.get('new')}</span>
                        <span class="notepad-shortcut">Ctrl+N</span>
                    </div>
                    <div class="notepad-dropdown-item" data-command="open">
                        <span data-translate="open">${Translations.get('open')}</span>
                        <span class="notepad-shortcut">Ctrl+O</span>
                    </div>
                    <div class="notepad-dropdown-item" data-command="save">
                        <span data-translate="save">${Translations.get('save')}</span>
                        <span class="notepad-shortcut">Ctrl+S</span>
                    </div>
                    <div class="notepad-dropdown-item" data-command="saveAs">
                        <span data-translate="saveAs">${Translations.get('saveAs')}</span>
                    </div>
                    <div class="notepad-dropdown-separator"></div>
                    <div class="notepad-dropdown-item" data-command="exit">
                        <span data-translate="exit">${Translations.get('exit')}</span>
                    </div>
                </div>
                
                <!-- Edit Menu Dropdown -->
                <div class="notepad-dropdown" data-dropdown="edit">
                    <div class="notepad-dropdown-item" data-command="undo">
                        <span data-translate="undo">${Translations.get('undo')}</span>
                        <span class="notepad-shortcut">Ctrl+Z</span>
                    </div>
                    <div class="notepad-dropdown-item" data-command="redo">
                        <span data-translate="redo">${Translations.get('redo')}</span>
                        <span class="notepad-shortcut">Ctrl+Y</span>
                    </div>
                    <div class="notepad-dropdown-separator"></div>
                    <div class="notepad-dropdown-item" data-command="cut">
                        <span data-translate="cut">${Translations.get('cut')}</span>
                        <span class="notepad-shortcut">Ctrl+X</span>
                    </div>
                    <div class="notepad-dropdown-item" data-command="copy">
                        <span data-translate="copy">${Translations.get('copy')}</span>
                        <span class="notepad-shortcut">Ctrl+C</span>
                    </div>
                    <div class="notepad-dropdown-item" data-command="paste">
                        <span data-translate="paste">${Translations.get('paste')}</span>
                        <span class="notepad-shortcut">Ctrl+V</span>
                    </div>
                    <div class="notepad-dropdown-separator"></div>
                    <div class="notepad-dropdown-item" data-command="selectAll">
                        <span data-translate="selectAll">${Translations.get('selectAll')}</span>
                        <span class="notepad-shortcut">Ctrl+A</span>
                    </div>
                    <div class="notepad-dropdown-item" data-command="timeDate">
                        <span data-translate="timeDate">${Translations.get('timeDate')}</span>
                        <span class="notepad-shortcut">F5</span>
                    </div>
                </div>
                
                <!-- Format Menu Dropdown -->
                <div class="notepad-dropdown" data-dropdown="format">
                    <div class="notepad-dropdown-item" data-command="wordWrap">
                        <span data-translate="wordWrap">${Translations.get('wordWrap')}</span>
                    </div>
                </div>
                
                <!-- Help Menu Dropdown -->
                <div class="notepad-dropdown" data-dropdown="help">
                    <div class="notepad-dropdown-item" data-command="about">
                        <span data-translate="about">${Translations.get('about')}</span>
                    </div>
                </div>
            </div>
            
            <textarea class="notepad-textarea" autocomplete="off" spellcheck="false"></textarea>
            
            <div class="notepad-statusbar">
                <div class="cursor-position">Ln 1, Col 1</div>
            </div>
            
            <div class="notepad-overlay"></div>
        `;
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Menu item click
        const menuItems = windowContent.querySelectorAll('.notepad-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', handleMenuClick);
        });
        
        // Dropdown item click
        const dropdownItems = windowContent.querySelectorAll('.notepad-dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', handleMenuItemClick);
        });
        
        // Textarea events
        const textarea = windowContent.querySelector('.notepad-textarea');
        
        // Change event for text content
        textarea.addEventListener('input', handleTextChange);
        
        // Selection change
        textarea.addEventListener('select', updateCursorPosition);
        textarea.addEventListener('click', updateCursorPosition);
        textarea.addEventListener('keyup', updateCursorPosition);
        
        // Keyboard shortcuts
        textarea.addEventListener('keydown', handleKeyDown);
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.notepad-menubar') && isMenuOpen) {
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
        const dropdown = windowContent.querySelector(`.notepad-dropdown[data-dropdown="${menuName}"]`);
        if (!dropdown) return;
        
        // Activate menu item
        const menuItem = windowContent.querySelector(`.notepad-menu-item[data-menu="${menuName}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
            
            // Position the dropdown correctly under the menu item
            const menuRect = menuItem.getBoundingClientRect();
            const windowRect = windowContent.getBoundingClientRect();
            
            // Calculate position relative to the window content
            dropdown.style.top = (menuRect.bottom - windowRect.top) + 'px';
            dropdown.style.left = (menuRect.left - windowRect.left) + 'px';
        }
        
        // Show dropdown
        dropdown.classList.add('active');
        
        // Update state
        isMenuOpen = true;
        activeMenu = menuName;
        
        // Update enabled/disabled state of menu items
        updateMenuState();
    }
    
    // Close the current menu
    function closeMenu() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Hide all dropdowns
        const dropdowns = windowContent.querySelectorAll('.notepad-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
        
        // Deactivate menu items
        const menuItems = windowContent.querySelectorAll('.notepad-menu-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Update state
        isMenuOpen = false;
        activeMenu = null;
    }
    
    // Update enabled/disabled state of menu items
    function updateMenuState() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const textarea = windowContent.querySelector('.notepad-textarea');
        const hasSelection = textarea.selectionStart !== textarea.selectionEnd;
        
        // Undo/Redo state
        const undoItem = windowContent.querySelector('.notepad-dropdown-item[data-command="undo"]');
        const redoItem = windowContent.querySelector('.notepad-dropdown-item[data-command="redo"]');
        
        if (undoItem) {
            if (undoStack.length === 0) {
                undoItem.classList.add('disabled');
            } else {
                undoItem.classList.remove('disabled');
            }
        }
        
        if (redoItem) {
            if (redoStack.length === 0) {
                redoItem.classList.add('disabled');
            } else {
                redoItem.classList.remove('disabled');
            }
        }
        
        // Cut/Copy state
        const cutItem = windowContent.querySelector('.notepad-dropdown-item[data-command="cut"]');
        const copyItem = windowContent.querySelector('.notepad-dropdown-item[data-command="copy"]');
        
        if (cutItem) {
            if (!hasSelection) {
                cutItem.classList.add('disabled');
            } else {
                cutItem.classList.remove('disabled');
            }
        }
        
        if (copyItem) {
            if (!hasSelection) {
                copyItem.classList.add('disabled');
            } else {
                copyItem.classList.remove('disabled');
            }
        }
        
        // Word wrap state
        const wordWrapItem = windowContent.querySelector('.notepad-dropdown-item[data-command="wordWrap"]');
        if (wordWrapItem) {
            if (wordWrap) {
                wordWrapItem.classList.add('checked');
            } else {
                wordWrapItem.classList.remove('checked');
            }
        }
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
                newDocument();
                break;
            case 'open':
                openDocument();
                break;
            case 'save':
                saveDocument();
                break;
            case 'saveAs':
                saveDocumentAs();
                break;
            case 'exit':
                WindowManager.closeWindow(windowId);
                break;
            case 'undo':
                undo();
                break;
            case 'redo':
                redo();
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
            case 'selectAll':
                const windowContent = WindowManager.getWindowContentElement(windowId);
                if (windowContent) {
                    const textarea = windowContent.querySelector('.notepad-textarea');
                    textarea.select();
                    updateCursorPosition();
                }
                break;
            case 'timeDate':
                insertDateTime();
                break;
            case 'wordWrap':
                toggleWordWrap();
                break;
            case 'about':
                showAboutDialog();
                break;
        }
    }
    
    // Create a new document
    function newDocument() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Check if the current document has unsaved changes
        if (isModified) {
            // Ask user to save changes
            // For now, just create a new document without asking
        }
        
        // Clear the textarea
        const textarea = windowContent.querySelector('.notepad-textarea');
        textarea.value = '';
        
        // Update state
        textContent = '';
        filePath = null;
        isModified = false;
        undoStack = [];
        redoStack = [];
        
        // Update window title
        WindowManager.updateWindowTitle(windowId, 'Untitled - ' + Translations.get('notepad'));
    }
    
    // Open a document
    function openDocument() {
        // For now, we'll simulate opening a document
        // In a real application, we would prompt the user to select a file
        
        // Check if the current document has unsaved changes
        if (isModified) {
            // Ask user to save changes
            // For now, just open a new document without asking
        }
        
        // Create a file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        
        // Handle file selection
        input.onchange = function(e) {
            if (e.target.files.length === 0) return;
            
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const windowContent = WindowManager.getWindowContentElement(windowId);
                if (!windowContent) return;
                
                // Set textarea content
                const textarea = windowContent.querySelector('.notepad-textarea');
                textarea.value = e.target.result;
                
                // Update state
                textContent = e.target.result;
                filePath = file.name;
                isModified = false;
                undoStack = [];
                redoStack = [];
                
                // Update window title
                WindowManager.updateWindowTitle(windowId, filePath + ' - ' + Translations.get('notepad'));
                
                // Update cursor position
                updateCursorPosition();
            };
            
            reader.readAsText(file);
        };
        
        // Trigger file picker
        input.click();
    }
    
    // Save the current document
    function saveDocument() {
        if (filePath) {
            // Save to existing file
            saveDocumentAs();
        } else {
            // No file path yet, prompt for save location
            saveDocumentAs();
        }
    }
    
    // Save the document with a new name
    function saveDocumentAs() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Show a Save As dialog
        showSaveDialog(function(fileName) {
            if (!fileName) return; // User cancelled
            
            // If no extension is provided, add .txt
            if (!fileName.includes('.')) {
                fileName += '.txt';
            }
            
            const textarea = windowContent.querySelector('.notepad-textarea');
            
            // Create a download link
            const blob = new Blob([textarea.value], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            
            downloadLink.href = url;
            downloadLink.download = fileName;
            
            // Append to body, click, and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Update file path and modified status
            filePath = fileName;
            isModified = false;
            updateWindowTitle();
            
            // Revoke the object URL
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
        });
    }
    
    // Show a save dialog
    function showSaveDialog(callback) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Create dialog overlay
        const dialogOverlay = document.createElement('div');
        dialogOverlay.className = 'notepad-dialog-overlay';
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'notepad-dialog save-dialog';
        
        // Create dialog content
        dialog.innerHTML = `
            <div class="dialog-header">
                <div class="dialog-title">${Translations.get('saveAs')}</div>
                <div class="dialog-close">×</div>
            </div>
            <div class="dialog-content">
                <div class="dialog-label">${Translations.get('fileName')}:</div>
                <input type="text" class="dialog-input" value="${filePath || 'untitled.txt'}">
                <div class="dialog-label">${Translations.get('saveAsType')}:</div>
                <select class="dialog-select">
                    <option value="txt">${Translations.get('textFiles')} (*.txt)</option>
                    <option value="all">${Translations.get('allFiles')} (*.*)</option>
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
            const fileName = fileNameInput.value.trim();
            if (fileName) {
                closeDialog();
                callback(fileName);
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
                const fileName = fileNameInput.value.trim();
                if (fileName) {
                    closeDialog();
                    callback(fileName);
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
    
    // Show about dialog
    function showAboutDialog() {
        // Create a dialog
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Create an about dialog element
        const aboutDialog = document.createElement('div');
        aboutDialog.className = 'notepad-dialog';
        aboutDialog.id = 'about-dialog';
        aboutDialog.innerHTML = `
            <div class="notepad-dialog-header">
                <span>About Notepad</span>
                <span class="notepad-dialog-close">&times;</span>
            </div>
            <div class="notepad-dialog-content">
                <p>Windows Simulator - Notepad</p>
                <p>A simple text editor created with HTML, CSS, and JavaScript.</p>
            </div>
            <div class="notepad-dialog-footer">
                <button class="notepad-dialog-button primary" data-result="ok">OK</button>
            </div>
        `;
        
        // Add to the window
        windowContent.appendChild(aboutDialog);
        
        // Get overlay
        const overlay = windowContent.querySelector('.notepad-overlay');
        
        // Show the dialog
        aboutDialog.classList.add('active');
        overlay.classList.add('active');
        
        // Add close button event
        const closeBtn = aboutDialog.querySelector('.notepad-dialog-close');
        closeBtn.addEventListener('click', function() {
            aboutDialog.remove();
            overlay.classList.remove('active');
        });
        
        // Add OK button event
        const okBtn = aboutDialog.querySelector('[data-result="ok"]');
        okBtn.addEventListener('click', function() {
            aboutDialog.remove();
            overlay.classList.remove('active');
        });
        
        activeDialog = 'about';
    }
    
    // Insert date and time at cursor position
    function insertDateTime() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const textarea = windowContent.querySelector('.notepad-textarea');
        
        // Get current date and time
        const now = new Date();
        const dateTime = now.toLocaleString();
        
        // Get cursor position
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        
        // Insert date time at cursor position
        textarea.value = textarea.value.substring(0, startPos) + 
                        dateTime + 
                        textarea.value.substring(endPos);
        
        // Set cursor position after inserted text
        textarea.selectionStart = textarea.selectionEnd = startPos + dateTime.length;
        
        // Register change
        handleTextChange();
    }
    
    // Toggle word wrap
    function toggleWordWrap() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Toggle state
        wordWrap = !wordWrap;
        
        // Update textarea style
        const textarea = windowContent.querySelector('.notepad-textarea');
        textarea.style.whiteSpace = wordWrap ? 'normal' : 'pre-wrap';
        
        // Update menu state
        updateMenuState();
    }
    
    // Handle text change event
    function handleTextChange() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const textarea = windowContent.querySelector('.notepad-textarea');
        
        // Check if the content has changed
        if (textContent !== textarea.value) {
            // Add to undo stack
            addToUndoStack();
            
            // Update state
            textContent = textarea.value;
            isModified = true;
            
            // Update window title to show modified status
            updateWindowTitle();
        }
        
        // Update cursor position
        updateCursorPosition();
    }
    
    // Handle keyboard shortcuts
    function handleKeyDown(e) {
        // Get key combination
        const isCtrl = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();
        
        // Handle shortcuts
        if (isCtrl) {
            switch (key) {
                case 'n':
                    e.preventDefault();
                    executeCommand('new');
                    break;
                case 'o':
                    e.preventDefault();
                    executeCommand('open');
                    break;
                case 's':
                    e.preventDefault();
                    if (e.shiftKey) {
                        executeCommand('saveAs');
                    } else {
                        executeCommand('save');
                    }
                    break;
                case 'z':
                    e.preventDefault();
                    executeCommand('undo');
                    break;
                case 'y':
                    e.preventDefault();
                    executeCommand('redo');
                    break;
                case 'a':
                    e.preventDefault();
                    executeCommand('selectAll');
                    break;
            }
        } else if (e.key === 'F5') {
            e.preventDefault();
            executeCommand('timeDate');
        } else if (e.key === 'Escape') {
            if (isMenuOpen) {
                e.preventDefault();
                closeMenu();
            }
        }
    }
    
    // Update cursor position display
    function updateCursorPosition() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const textarea = windowContent.querySelector('.notepad-textarea');
        const cursorPosition = windowContent.querySelector('.cursor-position');
        
        // Get cursor position
        const cursorPos = textarea.selectionStart;
        
        // Calculate line and column
        const lines = textarea.value.substring(0, cursorPos).split('\n');
        const lineNumber = lines.length;
        const columnNumber = lines[lines.length - 1].length + 1;
        
        // Update position display
        cursorPosition.textContent = `Ln ${lineNumber}, Col ${columnNumber}`;
        
        // Update selection state
        selectionStart = textarea.selectionStart;
        selectionEnd = textarea.selectionEnd;
        
        // Update menu state if menu is open
        if (isMenuOpen) {
            updateMenuState();
        }
    }
    
    // Add current state to undo stack
    function addToUndoStack() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const textarea = windowContent.querySelector('.notepad-textarea');
        
        // Add current state to undo stack
        undoStack.push({
            text: textContent,
            selectionStart: selectionStart,
            selectionEnd: selectionEnd
        });
        
        // Clear redo stack when making a new change
        redoStack = [];
        
        // Limit stack size
        if (undoStack.length > 100) {
            undoStack.shift();
        }
    }
    
    // Undo the last change
    function undo() {
        if (undoStack.length === 0) return;
        
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const textarea = windowContent.querySelector('.notepad-textarea');
        
        // Save current state to redo stack
        redoStack.push({
            text: textarea.value,
            selectionStart: textarea.selectionStart,
            selectionEnd: textarea.selectionEnd
        });
        
        // Restore previous state
        const prevState = undoStack.pop();
        textarea.value = prevState.text;
        textarea.selectionStart = prevState.selectionStart;
        textarea.selectionEnd = prevState.selectionEnd;
        
        // Update state
        textContent = textarea.value;
        selectionStart = textarea.selectionStart;
        selectionEnd = textarea.selectionEnd;
        
        // Update cursor position
        updateCursorPosition();
        
        // Update modified status
        isModified = undoStack.length > 0;
        updateWindowTitle();
    }
    
    // Redo the last undone change
    function redo() {
        if (redoStack.length === 0) return;
        
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const textarea = windowContent.querySelector('.notepad-textarea');
        
        // Save current state to undo stack
        undoStack.push({
            text: textarea.value,
            selectionStart: textarea.selectionStart,
            selectionEnd: textarea.selectionEnd
        });
        
        // Restore next state
        const nextState = redoStack.pop();
        textarea.value = nextState.text;
        textarea.selectionStart = nextState.selectionStart;
        textarea.selectionEnd = nextState.selectionEnd;
        
        // Update state
        textContent = textarea.value;
        selectionStart = textarea.selectionStart;
        selectionEnd = textarea.selectionEnd;
        
        // Update cursor position
        updateCursorPosition();
        
        // Update modified status
        isModified = true;
        updateWindowTitle();
    }
    
    // Update window title based on current state
    function updateWindowTitle() {
        let title = (filePath || 'Untitled');
        
        // Add modified indicator
        if (isModified) {
            title = '*' + title;
        }
        
        // Add app name
        title += ' - ' + Translations.get('notepad');
        
        // Update window title
        WindowManager.updateWindowTitle(windowId, title);
    }
    
    // Handle window close
    function handleClose() {
        // Check if the document has unsaved changes
        if (isModified) {
            // Ask user to save changes
            // For now, just close without asking
        }
        
        // Clean up
        windowId = null;
        textContent = '';
        filePath = null;
        isModified = false;
        undoStack = [];
        redoStack = [];
        
        return true;
    }
    
    // Handle window focus
    function handleFocus() {
        // Nothing specific to do here
    }
    
    // Handle window blur
    function handleBlur() {
        // Close any open menu
        if (isMenuOpen) {
            closeMenu();
        }
    }
    
    // Update translations
    function updateTranslations() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update all translatable elements
        Translations.updateElements(windowContent);
        
        // Update window title
        updateWindowTitle();
    }
    
    // Public API
    window.NotepadApp = {
        init: init,
        open: open
    };
})();