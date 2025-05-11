/**
 * Settings Application
 * Manages system settings like theme, wallpaper, language
 */
(function() {
    'use strict';
    
    // Application state
    let windowId = null;
    let activeSection = 'appearance';
    let hasChanges = false;
    let tempSettings = {};
    
    // Available themes
    const THEMES = [
        { id: 'win7', name: 'Windows 7 Aero', previewClass: 'win7-preview' },
        { id: 'winxp', name: 'Windows XP', previewClass: 'winxp-preview' },
        { id: 'win10', name: 'Windows 10', previewClass: 'win10-preview' },
        { id: 'win11', name: 'Windows 11', previewClass: 'win11-preview' }
    ];
    
    // Available wallpapers
    const WALLPAPERS = [
        { id: 'default', name: 'Aurora', previewUrl: 'assets/wallpapers/wallpaper.svg' },
        { id: 'blue', name: 'Blue', color: '#1e78d7' },
        { id: 'green', name: 'Green', color: '#27ae60' },
        { id: 'purple', name: 'Purple', color: '#8e44ad' },
        { id: 'orange', name: 'Orange', color: '#d35400' }
    ];
    
    // Initialize the app
    function init() {
        // Nothing to do here, app will be initialized when opened
    }
    
    // Open the Settings application
    function open() {
        openToSection('appearance');
    }
    
    // Open settings to a specific section
    function openToSection(section) {
        // If already open, just focus the window and switch to section
        if (windowId !== null) {
            WindowManager.activateWindow(windowId);
            switchSection(section);
            return;
        }
        
        // Create window content
        const content = createWindowContent();
        
        // Create the window
        windowId = WindowManager.createWindow({
            title: Translations.get('settings'),
            icon: 'assets/icons/settings.svg',
            appName: 'settings',
            width: 600,
            height: 500,
            x: 100,
            y: 100,
            content: content,
            className: 'settings-window',
            onClose: handleClose,
            onFocus: handleFocus,
            onUpdate: updateTranslations
        });
        
        // Load current settings
        loadSettings();
        
        // Set up event handlers
        attachEventHandlers();
        
        // Initialize active section
        activeSection = section || 'appearance';
        switchSection(activeSection);
    }
    
    // Create the window content HTML
    function createWindowContent() {
        return `
            <div class="settings-header">
                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z' fill='white'/></svg>" class="settings-header-icon" alt="Settings">
                <div class="settings-header-title" data-translate="settings">${Translations.get('settings')}</div>
            </div>
            
            <div class="settings-nav">
                <div class="settings-nav-item" data-section="appearance" data-translate="appearance">${Translations.get('appearance')}</div>
                <div class="settings-nav-item" data-section="personalization" data-translate="personalization">${Translations.get('personalization')}</div>
                <div class="settings-nav-item" data-section="language" data-translate="language">${Translations.get('language')}</div>
                <div class="settings-nav-item" data-section="sound" data-translate="sound">${Translations.get('sound')}</div>
                <div class="settings-nav-item" data-section="time" data-translate="time">${Translations.get('time')}</div>
            </div>
            
            <div class="settings-content">
                <!-- Appearance Section -->
                <div class="settings-section" id="section-appearance">
                    <div class="settings-section-title" data-translate="appearance">${Translations.get('appearance')}</div>
                    
                    <div class="settings-item">
                        <div class="settings-item-label" data-translate="theme">${Translations.get('theme')}</div>
                        <div class="settings-item-control">
                            <select class="settings-select" id="theme-select">
                                ${THEMES.map(theme => `<option value="${theme.id}">${theme.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-item-label" data-translate="wallpaper">${Translations.get('wallpaper')}</div>
                        <div class="settings-item-control">
                            <div class="wallpaper-options">
                                ${WALLPAPERS.map(wallpaper => `
                                    <div class="wallpaper-option" data-wallpaper="${wallpaper.id}" 
                                        ${wallpaper.color ? `style="background-color: ${wallpaper.color}"` : 
                                        `style="background-image: url('${wallpaper.previewUrl}')"` }>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Personalization Section -->
                <div class="settings-section" id="section-personalization">
                    <div class="settings-section-title" data-translate="personalization">${Translations.get('personalization')}</div>
                    
                    <div class="settings-item">
                        <div class="settings-item-label" data-translate="desktopIcons">${Translations.get('desktopIcons')}</div>
                        <div class="settings-item-control">
                            <label>
                                <input type="checkbox" class="settings-checkbox" id="show-desktop-icons" checked>
                                <span data-translate="showDesktopIcons">${Translations.get('showDesktopIcons')}</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Language Section -->
                <div class="settings-section" id="section-language">
                    <div class="settings-section-title" data-translate="language">${Translations.get('language')}</div>
                    
                    <div class="settings-item">
                        <div class="settings-item-label" data-translate="chooseLanguage">${Translations.get('chooseLanguage')}</div>
                        <div class="settings-item-control">
                            <select class="settings-select" id="language-select">
                                <option value="en">English</option>
                                <option value="tr">Türkçe</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Sound Section -->
                <div class="settings-section" id="section-sound">
                    <div class="settings-section-title" data-translate="sound">${Translations.get('sound')}</div>
                    
                    <div class="settings-item">
                        <div class="settings-item-label" data-translate="volume">${Translations.get('volume')}</div>
                        <div class="settings-item-control">
                            <input type="range" min="0" max="100" value="50" class="settings-input" id="volume-control">
                        </div>
                    </div>
                </div>
                
                <!-- Time & Date Section -->
                <div class="settings-section" id="section-time">
                    <div class="settings-section-title" data-translate="time">${Translations.get('time')}</div>
                    
                    <div class="settings-item">
                        <div class="settings-item-label" data-translate="timeFormat">${Translations.get('timeFormat')}</div>
                        <div class="settings-item-control">
                            <select class="settings-select" id="time-format-select">
                                <option value="12h" data-translate="format12h">${Translations.get('format12h')}</option>
                                <option value="24h" data-translate="format24h">${Translations.get('format24h')}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-footer">
                <button class="settings-button" id="settings-cancel" data-translate="cancel">${Translations.get('cancel')}</button>
                <button class="settings-button primary" id="settings-apply" data-translate="apply">${Translations.get('apply')}</button>
            </div>
        `;
    }
    
    // Load current settings
    function loadSettings() {
        const currentSettings = Storage.getSettings();
        
        // Clone the settings to our temp object
        tempSettings = Object.assign({}, currentSettings);
        
        // Apply to UI
        updateSettingsUI();
    }
    
    // Update settings UI based on current settings
    function updateSettingsUI() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Theme select
        const themeSelect = windowContent.querySelector('#theme-select');
        if (themeSelect) {
            themeSelect.value = tempSettings.theme || 'win7';
        }
        
        // Wallpaper
        const wallpaperOptions = windowContent.querySelectorAll('.wallpaper-option');
        wallpaperOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.wallpaper === (tempSettings.wallpaper || 'default'));
        });
        
        // Language select
        const languageSelect = windowContent.querySelector('#language-select');
        if (languageSelect) {
            languageSelect.value = tempSettings.language || 'en';
        }
        
        // Volume control
        const volumeControl = windowContent.querySelector('#volume-control');
        if (volumeControl) {
            volumeControl.value = tempSettings.volume || 50;
        }
        
        // Time format
        const timeFormatSelect = windowContent.querySelector('#time-format-select');
        if (timeFormatSelect) {
            timeFormatSelect.value = tempSettings.timeFormat || '24h';
        }
        
        // Desktop icons
        const showDesktopIcons = windowContent.querySelector('#show-desktop-icons');
        if (showDesktopIcons) {
            showDesktopIcons.checked = tempSettings.showDesktopIcons !== false;
        }
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Navigation
        const navItems = windowContent.querySelectorAll('.settings-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const section = this.dataset.section;
                switchSection(section);
            });
        });
        
        // Theme select
        const themeSelect = windowContent.querySelector('#theme-select');
        themeSelect.addEventListener('change', function() {
            tempSettings.theme = this.value;
            hasChanges = true;
        });
        
        // Wallpaper selection
        const wallpaperOptions = windowContent.querySelectorAll('.wallpaper-option');
        wallpaperOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove active class from all options
                wallpaperOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                this.classList.add('active');
                
                // Update settings
                if (this.dataset.wallpaper === 'default') {
                    tempSettings.wallpaper = 'default';
                } else if (this.dataset.wallpaper) {
                    // For color wallpapers, we store the background color
                    const wallpaper = WALLPAPERS.find(w => w.id === this.dataset.wallpaper);
                    if (wallpaper && wallpaper.color) {
                        tempSettings.wallpaper = wallpaper.color;
                    } else if (wallpaper && wallpaper.previewUrl) {
                        tempSettings.wallpaper = wallpaper.previewUrl;
                    }
                }
                
                hasChanges = true;
            });
        });
        
        // Language select
        const languageSelect = windowContent.querySelector('#language-select');
        languageSelect.addEventListener('change', function() {
            tempSettings.language = this.value;
            hasChanges = true;
        });
        
        // Volume control
        const volumeControl = windowContent.querySelector('#volume-control');
        volumeControl.addEventListener('input', function() {
            tempSettings.volume = parseInt(this.value);
            hasChanges = true;
        });
        
        // Time format
        const timeFormatSelect = windowContent.querySelector('#time-format-select');
        timeFormatSelect.addEventListener('change', function() {
            tempSettings.timeFormat = this.value;
            hasChanges = true;
        });
        
        // Desktop icons
        const showDesktopIcons = windowContent.querySelector('#show-desktop-icons');
        showDesktopIcons.addEventListener('change', function() {
            tempSettings.showDesktopIcons = this.checked;
            hasChanges = true;
        });
        
        // Cancel button
        const cancelButton = windowContent.querySelector('#settings-cancel');
        cancelButton.addEventListener('click', function() {
            if (hasChanges) {
                // Reload original settings
                loadSettings();
                hasChanges = false;
            }
            
            // Close window
            WindowManager.closeWindow(windowId);
        });
        
        // Apply button
        const applyButton = windowContent.querySelector('#settings-apply');
        applyButton.addEventListener('click', function() {
            applySettings();
        });
    }
    
    // Switch to a different settings section
    function switchSection(section) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update active nav item
        const navItems = windowContent.querySelectorAll('.settings-nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        
        // Hide all sections
        const sections = windowContent.querySelectorAll('.settings-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        const selectedSection = windowContent.querySelector(`#section-${section}`);
        if (selectedSection) {
            selectedSection.style.display = 'block';
        }
        
        // Update active section
        activeSection = section;
    }
    
    // Apply the settings
    function applySettings() {
        // Save settings
        Storage.saveSettings(tempSettings);
        
        // Update UI
        if (tempSettings.language) {
            Translations.setLanguage(tempSettings.language);
        }
        
        // Reset changes flag
        hasChanges = false;
        
        // Update taskbar clock if time format changed
        if (typeof TaskbarManager !== 'undefined') {
            TaskbarManager.updateClock();
        }
        
        // Close window
        WindowManager.closeWindow(windowId);
    }
    
    // Handle window close
    function handleClose() {
        // Ask to save changes if there are any
        if (hasChanges) {
            // Simple confirm for now
            if (confirm(Translations.get('saveChanges') || 'Save changes?')) {
                applySettings();
            }
        }
        
        // Reset state
        windowId = null;
        activeSection = 'appearance';
        hasChanges = false;
        tempSettings = {};
        
        return true;
    }
    
    // Handle window focus
    function handleFocus() {
        // Nothing specific to do here
    }
    
    // Update translations
    function updateTranslations() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update all translatable elements
        Translations.updateElements(windowContent);
        
        // Update window title
        WindowManager.updateWindowTitle(windowId, Translations.get('settings'));
    }
    
    // Get wallpapers for use by other components
    function getWallpapers() {
        return WALLPAPERS;
    }
    
    // Public API
    window.SettingsApp = {
        init: init,
        open: open,
        openToSection: openToSection,
        getWallpapers: getWallpapers
    };
})();
