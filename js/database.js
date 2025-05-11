/**
 * Database Manager
 * Handles client-side database operations using IndexedDB
 */
(function() {
    'use strict';

    // Database configuration
    const DB_NAME = 'windowsSimDB';
    const DB_VERSION = 1;
    
    // Store names
    const STORES = {
        FILES: 'files',
        APPS: 'apps',
        USERS: 'users',
        SYSTEM: 'system'
    };
    
    // Database connection
    let db = null;
    
    // Initialize the database
    function init() {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }
            
            // Check if IndexedDB is supported
            if (!window.indexedDB) {
                const error = new Error('Your browser doesn\'t support IndexedDB');
                console.error(error);
                reject(error);
                return;
            }
            
            // Open the database
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);
            
            // Handle database upgrade (called when the database is created or version is changed)
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                
                // Create object stores (similar to tables in SQL databases)
                if (!db.objectStoreNames.contains(STORES.FILES)) {
                    const filesStore = db.createObjectStore(STORES.FILES, { keyPath: 'path' });
                    filesStore.createIndex('parent', 'parent', { unique: false });
                    filesStore.createIndex('name', 'name', { unique: false });
                    filesStore.createIndex('type', 'type', { unique: false });
                }
                
                if (!db.objectStoreNames.contains(STORES.APPS)) {
                    const appsStore = db.createObjectStore(STORES.APPS, { keyPath: 'appId' });
                    appsStore.createIndex('created', 'created', { unique: false });
                }
                
                if (!db.objectStoreNames.contains(STORES.USERS)) {
                    const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'username' });
                    usersStore.createIndex('created', 'created', { unique: false });
                    usersStore.createIndex('lastLogin', 'lastLogin', { unique: false });
                }
                
                if (!db.objectStoreNames.contains(STORES.SYSTEM)) {
                    db.createObjectStore(STORES.SYSTEM, { keyPath: 'key' });
                }
            };
            
            // Handle success
            request.onsuccess = function(event) {
                db = event.target.result;
                console.log('Database initialized successfully');
                resolve(db);
            };
            
            // Handle error
            request.onerror = function(event) {
                const error = new Error('Database error: ' + event.target.error);
                console.error(error);
                reject(error);
            };
        });
    }
    
    // Add a new item to a store
    function addItem(storeName, item) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(item);
                
                request.onsuccess = function() {
                    resolve(item);
                };
                
                request.onerror = function(event) {
                    reject(new Error('Error adding item: ' + event.target.error));
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Update an existing item in a store
    function updateItem(storeName, item) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(item);
                
                request.onsuccess = function() {
                    resolve(item);
                };
                
                request.onerror = function(event) {
                    reject(new Error('Error updating item: ' + event.target.error));
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Get an item from a store by its key
    function getItem(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            try {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);
                
                request.onsuccess = function() {
                    resolve(request.result);
                };
                
                request.onerror = function(event) {
                    reject(new Error('Error getting item: ' + event.target.error));
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Delete an item from a store by its key
    function deleteItem(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);
                
                request.onsuccess = function() {
                    resolve();
                };
                
                request.onerror = function(event) {
                    reject(new Error('Error deleting item: ' + event.target.error));
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Get all items from a store
    function getAllItems(storeName) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            try {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                
                request.onsuccess = function() {
                    resolve(request.result);
                };
                
                request.onerror = function(event) {
                    reject(new Error('Error getting all items: ' + event.target.error));
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Get items from a store by index
    function getItemsByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            try {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(value);
                
                request.onsuccess = function() {
                    resolve(request.result);
                };
                
                request.onerror = function(event) {
                    reject(new Error('Error getting items by index: ' + event.target.error));
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Clear all items from a store
    function clearStore(storeName) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                
                request.onsuccess = function() {
                    resolve();
                };
                
                request.onerror = function(event) {
                    reject(new Error('Error clearing store: ' + event.target.error));
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Add a file to the files store
    function addFile(filePath, content, type = 'text') {
        const pathParts = filePath.split('/');
        const fileName = pathParts.pop();
        const parentPath = pathParts.join('/');
        
        const file = {
            path: filePath,
            name: fileName,
            content: content,
            type: type,
            parent: parentPath,
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString()
        };
        
        return addItem(STORES.FILES, file);
    }
    
    // Get a file from the files store
    function getFile(filePath) {
        return getItem(STORES.FILES, filePath);
    }
    
    // Update a file in the files store
    function updateFile(filePath, content) {
        return getFile(filePath)
            .then(file => {
                if (!file) {
                    throw new Error('File not found');
                }
                
                file.content = content;
                file.dateModified = new Date().toISOString();
                
                return updateItem(STORES.FILES, file);
            });
    }
    
    // Delete a file from the files store
    function deleteFile(filePath) {
        return deleteItem(STORES.FILES, filePath);
    }
    
    // Get all files in a directory
    function getFilesInDirectory(directoryPath) {
        if (!directoryPath.endsWith('/')) {
            directoryPath += '/';
        }
        
        return getItemsByIndex(STORES.FILES, 'parent', directoryPath);
    }
    
    // Create a directory in the files store
    function createDirectory(directoryPath) {
        if (!directoryPath.endsWith('/')) {
            directoryPath += '/';
        }
        
        const pathParts = directoryPath.split('/');
        pathParts.pop(); // Remove empty string after last '/'
        const dirName = pathParts.pop();
        const parentPath = pathParts.join('/');
        
        const directory = {
            path: directoryPath,
            name: dirName,
            type: 'directory',
            parent: parentPath,
            content: null,
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString()
        };
        
        return addItem(STORES.FILES, directory);
    }
    
    // Save app data to the apps store
    function saveAppData(appId, data) {
        return getItem(STORES.APPS, appId)
            .then(existingApp => {
                const app = existingApp || {
                    appId: appId,
                    created: new Date().toISOString(),
                    data: {}
                };
                
                app.data = data;
                app.lastUpdated = new Date().toISOString();
                
                return updateItem(STORES.APPS, app);
            });
    }
    
    // Get app data from the apps store
    function getAppData(appId) {
        return getItem(STORES.APPS, appId)
            .then(app => app ? app.data : null);
    }
    
    // Save a system setting to the system store
    function saveSystemSetting(key, value) {
        const setting = {
            key: key,
            value: value
        };
        
        return getItem(STORES.SYSTEM, key)
            .then(existingSetting => {
                if (existingSetting) {
                    return updateItem(STORES.SYSTEM, setting);
                } else {
                    return addItem(STORES.SYSTEM, setting);
                }
            });
    }
    
    // Get a system setting from the system store
    function getSystemSetting(key) {
        return getItem(STORES.SYSTEM, key)
            .then(setting => setting ? setting.value : null);
    }
    
    // Save user data to the users store
    function saveUserData(username, userData) {
        return getItem(STORES.USERS, username)
            .then(existingUser => {
                const user = existingUser || {
                    username: username,
                    created: new Date().toISOString(),
                    data: {}
                };
                
                user.data = userData;
                user.lastLogin = new Date().toISOString();
                
                return updateItem(STORES.USERS, user);
            });
    }
    
    // Get user data from the users store
    function getUserData(username) {
        return getItem(STORES.USERS, username)
            .then(user => user ? user.data : null);
    }
    
    // Public API
    window.Database = {
        init: init,
        STORES: STORES,
        addItem: addItem,
        updateItem: updateItem,
        getItem: getItem,
        deleteItem: deleteItem,
        getAllItems: getAllItems,
        getItemsByIndex: getItemsByIndex,
        clearStore: clearStore,
        addFile: addFile,
        getFile: getFile,
        updateFile: updateFile,
        deleteFile: deleteFile,
        getFilesInDirectory: getFilesInDirectory,
        createDirectory: createDirectory,
        saveAppData: saveAppData,
        getAppData: getAppData,
        saveSystemSetting: saveSystemSetting,
        getSystemSetting: getSystemSetting,
        saveUserData: saveUserData,
        getUserData: getUserData
    };
})();