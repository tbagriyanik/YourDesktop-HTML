/**
 * Database Viewer Application
 * A simple application to view and manage the database
 */
(function() {
    'use strict';
    
    // Application state
    let windowId = null;
    let currentStore = null;
    
    // Initialize the application
    function init() {
        // Nothing specific to do here
    }
    
    // Open the application
    function open() {
        // Check if already open
        if (windowId) {
            WindowManager.activateWindow(windowId);
            return;
        }
        
        // Create window
        windowId = WindowManager.createWindow({
            title: Translations.get('dbViewer') || 'Database Viewer',
            width: 600,
            height: 450,
            icon: 'assets/icons/dbviewer.svg',
            appName: 'dbViewer',
            content: createWindowContent(),
            resizable: true,
            onClose: handleClose,
            onFocus: handleFocus
        });
        
        // Initialize the app
        attachEventHandlers();
        
        // Show files store by default
        showStore(Database.STORES.FILES);
    }
    
    // Create the window content
    function createWindowContent() {
        return `
            <div class="dbviewer-container">
                <div class="dbviewer-sidebar">
                    <div class="dbviewer-sidebar-title" data-translate="stores">Stores</div>
                    <div class="dbviewer-store-list">
                        <div class="dbviewer-store-item" data-store="${Database.STORES.FILES}" data-translate="files">Files</div>
                        <div class="dbviewer-store-item" data-store="${Database.STORES.APPS}" data-translate="apps">Apps</div>
                        <div class="dbviewer-store-item" data-store="${Database.STORES.USERS}" data-translate="users">Users</div>
                        <div class="dbviewer-store-item" data-store="${Database.STORES.SYSTEM}" data-translate="system">System</div>
                    </div>
                </div>
                <div class="dbviewer-content">
                    <div class="dbviewer-toolbar">
                        <button class="dbviewer-button" id="dbviewer-refresh" data-translate="refresh">Refresh</button>
                        <button class="dbviewer-button" id="dbviewer-add" data-translate="add">Add</button>
                        <button class="dbviewer-button" id="dbviewer-delete" data-translate="delete">Delete</button>
                        <button class="dbviewer-button" id="dbviewer-clear" data-translate="clear">Clear All</button>
                    </div>
                    <div class="dbviewer-data-container">
                        <div id="dbviewer-data" class="dbviewer-data"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Store selection
        const storeItems = windowContent.querySelectorAll('.dbviewer-store-item');
        storeItems.forEach(item => {
            item.addEventListener('click', function() {
                const store = this.dataset.store;
                showStore(store);
                
                // Update active state
                storeItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Button actions
        const refreshButton = windowContent.querySelector('#dbviewer-refresh');
        refreshButton.addEventListener('click', function() {
            if (currentStore) {
                showStore(currentStore);
            }
        });
        
        const addButton = windowContent.querySelector('#dbviewer-add');
        addButton.addEventListener('click', function() {
            if (currentStore) {
                showAddItemDialog(currentStore);
            }
        });
        
        const deleteButton = windowContent.querySelector('#dbviewer-delete');
        deleteButton.addEventListener('click', function() {
            if (currentStore) {
                const selectedItems = windowContent.querySelectorAll('.dbviewer-item.selected');
                if (selectedItems.length > 0) {
                    const confirmDelete = confirm('Delete selected items?');
                    if (confirmDelete) {
                        deleteSelectedItems(selectedItems);
                    }
                } else {
                    alert('No items selected');
                }
            }
        });
        
        const clearButton = windowContent.querySelector('#dbviewer-clear');
        clearButton.addEventListener('click', function() {
            if (currentStore) {
                const confirmClear = confirm(`Clear all items from the ${currentStore} store?`);
                if (confirmClear) {
                    Database.clearStore(currentStore)
                        .then(() => {
                            showStore(currentStore);
                        })
                        .catch(error => {
                            console.error('Error clearing store:', error);
                            alert('Error clearing store: ' + error.message);
                        });
                }
            }
        });
    }
    
    // Show data from a store
    function showStore(storeName) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const dataContainer = windowContent.querySelector('#dbviewer-data');
        dataContainer.innerHTML = '<div class="dbviewer-loading">Loading data...</div>';
        
        currentStore = storeName;
        
        Database.getAllItems(storeName)
            .then(items => {
                if (items.length === 0) {
                    dataContainer.innerHTML = '<div class="dbviewer-empty">No data in this store</div>';
                    return;
                }
                
                // Create table based on the first item's structure
                let tableHtml = '<table class="dbviewer-table">';
                
                // Table header
                tableHtml += '<thead><tr>';
                const firstItem = items[0];
                const keys = Object.keys(firstItem);
                keys.forEach(key => {
                    tableHtml += `<th>${key}</th>`;
                });
                tableHtml += '<th>Actions</th>';
                tableHtml += '</tr></thead>';
                
                // Table body
                tableHtml += '<tbody>';
                items.forEach(item => {
                    tableHtml += `<tr class="dbviewer-item" data-id="${getItemId(item, storeName)}">`;
                    keys.forEach(key => {
                        const value = item[key];
                        let displayValue = '';
                        
                        if (value === null || value === undefined) {
                            displayValue = '<em>null</em>';
                        } else if (typeof value === 'object') {
                            try {
                                displayValue = JSON.stringify(value).substring(0, 50);
                                if (JSON.stringify(value).length > 50) {
                                    displayValue += '...';
                                }
                            } catch (e) {
                                displayValue = '[Object]';
                            }
                        } else if (typeof value === 'string' && value.length > 50) {
                            displayValue = value.substring(0, 50) + '...';
                        } else {
                            displayValue = value.toString();
                        }
                        
                        tableHtml += `<td>${displayValue}</td>`;
                    });
                    tableHtml += `<td><button class="dbviewer-edit-button" data-id="${getItemId(item, storeName)}">Edit</button></td>`;
                    tableHtml += '</tr>';
                });
                tableHtml += '</tbody>';
                tableHtml += '</table>';
                
                dataContainer.innerHTML = tableHtml;
                
                // Attach click events to rows for selection
                const rows = dataContainer.querySelectorAll('.dbviewer-item');
                rows.forEach(row => {
                    row.addEventListener('click', function(e) {
                        // Don't select if clicking on the edit button
                        if (e.target.classList.contains('dbviewer-edit-button')) {
                            return;
                        }
                        
                        this.classList.toggle('selected');
                    });
                });
                
                // Attach edit button events
                const editButtons = dataContainer.querySelectorAll('.dbviewer-edit-button');
                editButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const id = this.dataset.id;
                        const item = items.find(i => getItemId(i, storeName) === id);
                        if (item) {
                            showEditItemDialog(storeName, item);
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error loading store data:', error);
                dataContainer.innerHTML = `<div class="dbviewer-error">Error loading data: ${error.message}</div>`;
            });
    }
    
    // Get an item's ID based on the store type
    function getItemId(item, storeName) {
        switch (storeName) {
            case Database.STORES.FILES:
                return item.path;
            case Database.STORES.APPS:
                return item.appId;
            case Database.STORES.USERS:
                return item.username;
            case Database.STORES.SYSTEM:
                return item.key;
            default:
                return JSON.stringify(item);
        }
    }
    
    // Delete selected items
    function deleteSelectedItems(selectedItems) {
        const promises = [];
        
        selectedItems.forEach(item => {
            const id = item.dataset.id;
            promises.push(Database.deleteItem(currentStore, id));
        });
        
        Promise.all(promises)
            .then(() => {
                showStore(currentStore);
            })
            .catch(error => {
                console.error('Error deleting items:', error);
                alert('Error deleting items: ' + error.message);
            });
    }
    
    // Show dialog to add a new item
    function showAddItemDialog(storeName) {
        let item = {};
        
        // Create default item based on store type
        switch (storeName) {
            case Database.STORES.FILES:
                item = {
                    path: '/new/file.txt',
                    name: 'file.txt',
                    content: 'New file content',
                    type: 'text',
                    parent: '/new',
                    dateCreated: new Date().toISOString(),
                    dateModified: new Date().toISOString()
                };
                break;
            case Database.STORES.APPS:
                item = {
                    appId: 'new-app',
                    data: { settings: {} },
                    created: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
                break;
            case Database.STORES.USERS:
                item = {
                    username: 'new-user',
                    data: { preferences: {} },
                    created: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                break;
            case Database.STORES.SYSTEM:
                item = {
                    key: 'new-setting',
                    value: 'setting value'
                };
                break;
        }
        
        const jsonStr = JSON.stringify(item, null, 2);
        
        // Prompt user for JSON
        const userInput = prompt('Enter item data (JSON):', jsonStr);
        
        if (userInput) {
            try {
                const newItem = JSON.parse(userInput);
                
                // Add the item to the database
                Database.addItem(storeName, newItem)
                    .then(() => {
                        showStore(storeName);
                    })
                    .catch(error => {
                        console.error('Error adding item:', error);
                        alert('Error adding item: ' + error.message);
                    });
            } catch (e) {
                alert('Invalid JSON: ' + e.message);
            }
        }
    }
    
    // Show dialog to edit an item
    function showEditItemDialog(storeName, item) {
        const jsonStr = JSON.stringify(item, null, 2);
        
        // Prompt user for JSON
        const userInput = prompt('Edit item data (JSON):', jsonStr);
        
        if (userInput) {
            try {
                const updatedItem = JSON.parse(userInput);
                
                // Update the item in the database
                Database.updateItem(storeName, updatedItem)
                    .then(() => {
                        showStore(storeName);
                    })
                    .catch(error => {
                        console.error('Error updating item:', error);
                        alert('Error updating item: ' + error.message);
                    });
            } catch (e) {
                alert('Invalid JSON: ' + e.message);
            }
        }
    }
    
    // Handle window close
    function handleClose() {
        // Reset state
        windowId = null;
        currentStore = null;
        
        return true;
    }
    
    // Handle window focus
    function handleFocus() {
        // Nothing to do here
    }
    
    // Public API
    window.DbViewerApp = {
        init: init,
        open: open
    };
})();