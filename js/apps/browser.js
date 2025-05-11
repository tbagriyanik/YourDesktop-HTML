/**
 * Web Browser Application
 * A simple web browser similar to Internet Explorer
 */
(function() {
    'use strict';
    
    // Application state
    let windowId = null;
    let iframe = null;
    let addressBar = null;
    let currentUrl = 'about:blank';
    let history = [];
    let historyIndex = -1;
    const MAX_HISTORY = 50;
    const DEFAULT_URL = 'https://www.bing.com/';
    
    // Initialize the application
    function init() {
        // Nothing to do on init, app will be initialized when opened
    }
    
    // Open the browser
    function open(initialUrl) {
        // If already open, just focus the window
        if (windowId !== null) {
            WindowManager.activateWindow(windowId);
            if (initialUrl) {
                navigateTo(initialUrl);
            }
            return;
        }
        
        // Create the window content
        const content = createWindowContent();
        
        // Create the window
        windowId = WindowManager.createWindow({
            title: Translations.get('browser'),
            icon: 'assets/icons/browser.svg',
            appName: 'browser',
            width: 800,
            height: 600,
            x: 50,
            y: 50,
            content: content,
            className: 'browser-window',
            onClose: handleClose,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onUpdate: updateTranslations
        });
        
        // Set up event handlers
        attachEventHandlers();
        
        // Navigate to initial URL
        navigateTo(initialUrl || DEFAULT_URL);
    }
    
    // Create window content
    function createWindowContent() {
        return `
            <div class="browser-toolbar">
                <div class="browser-btn browser-btn-back" title="${Translations.get('back')}">
                    <svg viewBox="0 0 24 24">
                        <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                    </svg>
                </div>
                <div class="browser-btn browser-btn-forward" title="${Translations.get('forward')}">
                    <svg viewBox="0 0 24 24">
                        <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
                    </svg>
                </div>
                <div class="browser-btn browser-btn-reload" title="${Translations.get('reload')}">
                    <svg viewBox="0 0 24 24">
                        <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                    </svg>
                </div>
                <div class="browser-btn browser-btn-home" title="${Translations.get('home')}">
                    <svg viewBox="0 0 24 24">
                        <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
                    </svg>
                </div>
                <div class="browser-address-bar">
                    <input type="text" class="browser-url-input" placeholder="Enter URL">
                </div>
                <div class="browser-btn browser-btn-go" title="${Translations.get('go')}">
                    <svg viewBox="0 0 24 24">
                        <path d="M2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12M17,12L12,7V10H8V14H12V17L17,12Z" />
                    </svg>
                </div>
            </div>
            
            <div class="browser-content">
                <iframe class="browser-iframe" src="about:blank" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
                <div class="browser-loading-overlay">
                    <div class="browser-loading-spinner"></div>
                    <div class="browser-loading-text" data-translate="loading">${Translations.get('loading')}</div>
                </div>
            </div>
            
            <div class="browser-statusbar">
                <div class="browser-status-text"></div>
            </div>
        `;
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Get references to elements
        iframe = windowContent.querySelector('.browser-iframe');
        addressBar = windowContent.querySelector('.browser-url-input');
        const backBtn = windowContent.querySelector('.browser-btn-back');
        const forwardBtn = windowContent.querySelector('.browser-btn-forward');
        const reloadBtn = windowContent.querySelector('.browser-btn-reload');
        const homeBtn = windowContent.querySelector('.browser-btn-home');
        const goBtn = windowContent.querySelector('.browser-btn-go');
        const statusText = windowContent.querySelector('.browser-status-text');
        
        // Navigation buttons
        backBtn.addEventListener('click', goBack);
        forwardBtn.addEventListener('click', goForward);
        reloadBtn.addEventListener('click', reload);
        homeBtn.addEventListener('click', goHome);
        
        // Address bar and navigation
        addressBar.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                navigateTo(this.value);
            }
        });
        
        goBtn.addEventListener('click', function() {
            navigateTo(addressBar.value);
        });
        
        // Set up iframe loading events
        iframe.addEventListener('load', handleIframeLoad);
        
        // Show loading status
        iframe.addEventListener('loadstart', function() {
            windowContent.querySelector('.browser-loading-overlay').classList.add('active');
            statusText.textContent = Translations.get('loading') + '...';
        });
        
        iframe.addEventListener('loadend', function() {
            windowContent.querySelector('.browser-loading-overlay').classList.remove('active');
            statusText.textContent = '';
        });
    }
    
    // Navigate to a URL
    function navigateTo(url) {
        if (!url) return;
        
        // Add http:// if no protocol is specified
        if (!url.startsWith('http://') && !url.startsWith('https://') && url !== 'about:blank') {
            url = 'https://' + url;
        }
        
        // Update the address bar
        if (addressBar) {
            addressBar.value = url;
        }
        
        // Update iframe src
        if (iframe) {
            try {
                // Add to history first
                if (currentUrl !== 'about:blank') {
                    // If we're not at the end of history, truncate forward history
                    if (historyIndex >= 0 && historyIndex < history.length - 1) {
                        history = history.slice(0, historyIndex + 1);
                    }
                    
                    // Add current URL to history
                    history.push(currentUrl);
                    historyIndex = history.length - 1;
                    
                    // Limit history size
                    if (history.length > MAX_HISTORY) {
                        history.shift();
                        historyIndex--;
                    }
                }
                
                // Navigate iframe
                iframe.src = url;
                currentUrl = url;
                
                // Update window title
                WindowManager.updateWindowTitle(windowId, `${Translations.get('browser')} - ${url}`);
                
                // Update navigation buttons
                updateNavigationState();
            } catch (error) {
                console.error('Error navigating to URL:', error);
                showErrorPage(url, error.message);
            }
        }
    }
    
    // Handle iframe load completion
    function handleIframeLoad() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Hide loading overlay
        windowContent.querySelector('.browser-loading-overlay').classList.remove('active');
        
        try {
            // Update title with page title if possible
            if (iframe.contentDocument && iframe.contentDocument.title) {
                const pageTitle = iframe.contentDocument.title;
                WindowManager.updateWindowTitle(windowId, `${pageTitle} - ${Translations.get('browser')}`);
            } else {
                WindowManager.updateWindowTitle(windowId, `${Translations.get('browser')} - ${currentUrl}`);
            }
        } catch (e) {
            // Cross-origin issues might prevent access to contentDocument
            WindowManager.updateWindowTitle(windowId, `${Translations.get('browser')} - ${currentUrl}`);
        }
    }
    
    // Go back in history
    function goBack() {
        if (historyIndex > 0) {
            historyIndex--;
            const prevUrl = history[historyIndex];
            // Don't add to history when using back button
            if (iframe) {
                iframe.src = prevUrl;
                currentUrl = prevUrl;
                
                if (addressBar) {
                    addressBar.value = prevUrl;
                }
                
                // Update window title
                WindowManager.updateWindowTitle(windowId, `${Translations.get('browser')} - ${prevUrl}`);
                
                // Update navigation buttons
                updateNavigationState();
            }
        }
    }
    
    // Go forward in history
    function goForward() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            const nextUrl = history[historyIndex];
            // Don't add to history when using forward button
            if (iframe) {
                iframe.src = nextUrl;
                currentUrl = nextUrl;
                
                if (addressBar) {
                    addressBar.value = nextUrl;
                }
                
                // Update window title
                WindowManager.updateWindowTitle(windowId, `${Translations.get('browser')} - ${nextUrl}`);
                
                // Update navigation buttons
                updateNavigationState();
            }
        }
    }
    
    // Reload current page
    function reload() {
        if (iframe && currentUrl) {
            iframe.src = currentUrl;
        }
    }
    
    // Go to home page
    function goHome() {
        navigateTo(DEFAULT_URL);
    }
    
    // Update back/forward buttons state
    function updateNavigationState() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const backBtn = windowContent.querySelector('.browser-btn-back');
        const forwardBtn = windowContent.querySelector('.browser-btn-forward');
        
        // Update back button
        if (historyIndex > 0) {
            backBtn.classList.remove('disabled');
        } else {
            backBtn.classList.add('disabled');
        }
        
        // Update forward button
        if (historyIndex < history.length - 1) {
            forwardBtn.classList.remove('disabled');
        } else {
            forwardBtn.classList.add('disabled');
        }
    }
    
    // Show an error page when navigation fails
    function showErrorPage(url, error) {
        if (!iframe) return;
        
        const errorHtml = `
            <html>
            <head>
                <title>Error</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f8f8f8;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                    }
                    .error-container {
                        max-width: 600px;
                        margin: 50px auto;
                        background: white;
                        border-radius: 5px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        padding: 20px;
                    }
                    h1 {
                        color: #e74c3c;
                    }
                    .url {
                        word-break: break-all;
                        padding: 10px;
                        background: #f5f5f5;
                        border-radius: 3px;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>Cannot display the webpage</h1>
                    <p>The page you are trying to view cannot be shown because:</p>
                    <ul>
                        <li>The website might be experiencing issues</li>
                        <li>There might be a typo in the address</li>
                        <li>Your internet connection might be experiencing problems</li>
                    </ul>
                    <p>The URL you tried to visit:</p>
                    <div class="url">${url}</div>
                    <p>Technical information: ${error || 'Unknown error'}</p>
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob([errorHtml], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
    }
    
    // Handle window close
    function handleClose() {
        windowId = null;
        iframe = null;
        addressBar = null;
        currentUrl = 'about:blank';
        history = [];
        historyIndex = -1;
    }
    
    // Handle window focus
    function handleFocus() {
        // Re-focus address bar or iframe if needed
    }
    
    // Handle window blur
    function handleBlur() {
        // Nothing specific needed
    }
    
    // Update translations
    function updateTranslations() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Update translatable elements
        Translations.updateElements(windowContent);
        
        // Update window title
        WindowManager.updateWindowTitle(windowId, `${Translations.get('browser')} - ${currentUrl}`);
    }
    
    // Public API
    window.BrowserApp = {
        init: init,
        open: open
    };
})();