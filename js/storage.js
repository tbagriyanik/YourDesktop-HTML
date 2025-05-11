/**
 * Storage Manager
 * Handles saving and loading user settings using LocalStorage and cookies
 */
(function() {
    'use strict';
    
    // Default settings
    const DEFAULT_SETTINGS = {
        language: 'en',
        theme: 'win7',
        wallpaper: 'default',
        timeFormat: '24h', 
        volume: 50,
        pinnedApps: []
    };
    
    // Current settings
    let settings = Object.assign({}, DEFAULT_SETTINGS);
    
    // Cookie helpers
    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + expires + '; path=/; SameSite=Strict';
    }
    
    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
                } catch (e) {
                    console.error('Error parsing cookie value:', e);
                    return null;
                }
            }
        }
        return null;
    }
    
    // Initialize storage
    function init() {
        loadSettings();
    }
    
    // Load user settings
    function loadSettings() {
        // Try LocalStorage first
        try {
            const storedSettings = localStorage.getItem('windowsSimulatorSettings');
            if (storedSettings) {
                settings = JSON.parse(storedSettings);
                applySettings();
                return;
            }
        } catch (e) {
            console.warn('LocalStorage not available, falling back to cookies');
        }
        
        // Fallback to cookies
        const cookieSettings = getCookie('windowsSimulatorSettings');
        if (cookieSettings) {
            settings = cookieSettings;
            applySettings();
            return;
        }
        
        // No settings found, use defaults
        settings = Object.assign({}, DEFAULT_SETTINGS);
        applySettings();
    }
    
    // Save user settings
    function saveSettings(newSettings) {
        // Merge with existing settings
        settings = Object.assign({}, settings, newSettings);
        
        // Apply immediately
        applySettings();
        
        // Save to LocalStorage
        try {
            localStorage.setItem('windowsSimulatorSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('LocalStorage not available, falling back to cookies');
            
            // Fallback to cookies
            setCookie('windowsSimulatorSettings', settings, 365);
        }
        
        return settings;
    }
    
    // Apply settings to the UI
    function applySettings() {
        // Apply theme
        applyTheme(settings.theme);
        
        // Apply wallpaper
        applyWallpaper(settings.wallpaper);
        
        // Set language (with skipSave=true to avoid circular dependency)
        if (typeof Translations !== 'undefined') {
            Translations.setLanguage(settings.language, true);  // true = skipSave
        }
        
        // Update language indicator if available
        const langIndicator = document.getElementById('language-indicator');
        if (langIndicator) {
            langIndicator.textContent = settings.language.toUpperCase();
        }
        
        // Update clock format if clock exists
        if (typeof TaskbarManager !== 'undefined') {
            TaskbarManager.updateClock();
        }
    }
    
    // Apply theme
    function applyTheme(theme) {
        // Remove existing theme stylesheets
        const existingThemes = document.querySelectorAll('link[href*="css/themes/"]');
        existingThemes.forEach(link => {
            link.disabled = true;
        });
        
        // Add the selected theme
        const themeLink = document.querySelector(`link[href="css/themes/${theme}.css"]`);
        if (themeLink) {
            themeLink.disabled = false;
        } else {
            // If theme link doesn't exist, create it
            const newThemeLink = document.createElement('link');
            newThemeLink.rel = 'stylesheet';
            newThemeLink.href = `css/themes/${theme}.css`;
            document.head.appendChild(newThemeLink);
        }
    }
    
    // Apply wallpaper
    function applyWallpaper(wallpaper) {
        const container = document.getElementById('windows-container');
        if (!container) return;
        
        // Create default wallpaper if none provided
        const defaultWallpaper = { id: 'default', previewUrl: 'assets/wallpapers/wallpaper.svg' };
        
        // Get all wallpapers
        let allWallpapers = [defaultWallpaper];
        
        // If SettingsApp is available, get wallpapers from it
        if (window.SettingsApp && typeof window.SettingsApp.getWallpapers === 'function') {
            try {
                const settingsWallpapers = window.SettingsApp.getWallpapers();
                if (Array.isArray(settingsWallpapers) && settingsWallpapers.length > 0) {
                    allWallpapers = settingsWallpapers;
                }
            } catch (err) {
                console.error('Error getting wallpapers from SettingsApp:', err);
            }
        }
        
        // Find the selected wallpaper details
        let wallpaperInfo = allWallpapers.find(wp => wp.id === wallpaper) || defaultWallpaper;
        
        // If the wallpaper couldn't be found, use the default
        if (!wallpaperInfo) {
            wallpaperInfo = defaultWallpaper;
        }
        
        // Apply the wallpaper
        if (wallpaperInfo.color) {
            // It's a color wallpaper
            container.style.backgroundImage = 'none';
            container.style.backgroundColor = wallpaperInfo.color;
        } else {
            // It's an image wallpaper
            const wallpaperUrl = wallpaperInfo.previewUrl || 'assets/wallpapers/wallpaper.svg';
            container.style.backgroundImage = `url("${wallpaperUrl}")`;
            container.style.backgroundColor = '#000'; // Set a background color just in case
            
            // Force reload the background image
            const img = new Image();
            img.onload = function() {
                container.style.backgroundImage = `url("${wallpaperUrl}")`;
            };
            img.src = wallpaperUrl + '?t=' + new Date().getTime(); // Add timestamp to force reload
        }
        
        console.log('Applied wallpaper:', wallpaperInfo);
    }
    
    // Get current settings
    function getSettings() {
        return Object.assign({}, settings);
    }
    
    // Reset settings to defaults
    function resetSettings() {
        settings = Object.assign({}, DEFAULT_SETTINGS);
        saveSettings(settings);
    }
    
    // Store a value in LocalStorage
    function storeData(key, data) {
        try {
            localStorage.setItem(`windowsSimulator_${key}`, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('LocalStorage not available, falling back to cookies');
            setCookie(`windowsSimulator_${key}`, data, 365);
            return true;
        }
    }
    
    // Load a value from LocalStorage
    function loadData(key) {
        try {
            const data = localStorage.getItem(`windowsSimulator_${key}`);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('LocalStorage failed, trying cookies');
            const cookieData = getCookie(`windowsSimulator_${key}`);
            if (cookieData) {
                return cookieData;
            }
        }
        return null;
    }
    
    // Public API
    window.Storage = {
        init: init,
        loadSettings: loadSettings,
        saveSettings: saveSettings,
        getSettings: getSettings,
        resetSettings: resetSettings,
        storeData: storeData,
        loadData: loadData
    };
})();
