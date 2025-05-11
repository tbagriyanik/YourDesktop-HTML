/**
 * Translations System
 * Handles multi-language support for the application
 */
(function() {
    'use strict';
    
    // Available languages
    const LANGUAGES = ['en', 'tr'];
    
    // Current language
    let currentLanguage = 'en';
    
    // Translation dictionaries
    const translations = {
        // English translations
        en: {
            // System
            reload: 'Reload',
            refresh: 'Refresh',
            open: 'Open',
            close: 'Close',
            minimize: 'Minimize',
            maximize: 'Maximize',
            restore: 'Restore',
            delete: 'Delete',
            rename: 'Rename',
            properties: 'Properties',
            view: 'View',
            sort: 'Sort',
            sortByName: 'By Name',
            sortByType: 'By Type',
            sortByDate: 'By Date',
            new: 'New',
            folder: 'Folder',
            textDocument: 'Text Document',
            largeIcons: 'Large Icons',
            mediumIcons: 'Medium Icons',
            smallIcons: 'Small Icons',
            changeWallpaper: 'Change Wallpaper',
            pinToTaskbar: 'Pin to Taskbar',
            unpinFromTaskbar: 'Unpin from Taskbar',
            power: 'Reload',
            restart: 'Restart',
            shutdown: 'Shut Down',
            sleep: 'Sleep',
            restarting: 'Restarting...',
            shuttingDown: 'Shutting down...',
            restartMessage: 'Windows is restarting...',
            shutdownMessage: 'Windows is shutting down...',
            clickToWake: 'Click to wake',
            
            // Settings categories
            settings: 'Settings',
            appearance: 'Appearance',
            personalization: 'Personalization',
            language: 'Language',
            sound: 'Sound',
            time: 'Time & Date',
            
            // Settings options
            wallpaper: 'Wallpaper',
            theme: 'Theme',
            chooseWallpaper: 'Choose a wallpaper',
            chooseTheme: 'Choose a theme',
            chooseLanguage: 'Choose a language',
            volume: 'Volume',
            timeFormat: 'Time format',
            format12h: '12-hour',
            format24h: '24-hour',
            apply: 'Apply',
            cancel: 'Cancel',
            
            // App names
            notepad: 'Notepad',
            paint: 'Paint',
            minesweeper: 'Minesweeper',
            snake: 'Snake',
            tetris: 'Tetris',
            dbViewer: 'Database Viewer',
            browser: 'Internet Explorer',
            fileExplorer: 'File Explorer',
            computer: 'Computer',
            documents: 'My Documents',
            
            // Notepad
            file: 'File',
            edit: 'Edit',
            view: 'View',
            format: 'Format',
            help: 'Help',
            new: 'New',
            open: 'Open',
            save: 'Save',
            saveAs: 'Save As',
            fileName: 'File name',
            saveAsType: 'Save as type',
            textFiles: 'Text Files',
            allFiles: 'All Files',
            print: 'Print',
            exit: 'Exit',
            undo: 'Undo',
            redo: 'Redo',
            cut: 'Cut',
            copy: 'Copy',
            paste: 'Paste',
            find: 'Find',
            findNext: 'Find Next',
            replace: 'Replace',
            selectAll: 'Select All',
            timeDate: 'Time/Date',
            wordWrap: 'Word Wrap',
            font: 'Font',
            about: 'About',
            
            // Paint
            brushes: 'Brushes',
            shapes: 'Shapes',
            colors: 'Colors',
            size: 'Size',
            pencil: 'Pencil',
            brush: 'Brush',
            eraser: 'Eraser',
            line: 'Line',
            rectangle: 'Rectangle',
            ellipse: 'Ellipse',
            clear: 'Clear',
            
            // Games
            newGame: 'New Game',
            pause: 'Pause',
            resume: 'Resume',
            score: 'Score',
            level: 'Level',
            gameOver: 'Game Over',
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
            restart: 'Restart',
            
            // Minesweeper
            flags: 'Flags',
            mines: 'Mines',
            
            // Snake
            speed: 'Speed',
            
            // Tetris
            lines: 'Lines',
            next: 'Next',
            
            // Database Viewer
            stores: 'Stores',
            files: 'Files',
            apps: 'Apps',
            users: 'Users',
            system: 'System',
            add: 'Add',
            edit: 'Edit',
            clear: 'Clear All'
        },
        
        // Turkish translations
        tr: {
            // System
            refresh: 'Yenile',
            open: 'Aç',
            close: 'Kapat',
            minimize: 'Simge Durumuna Küçült',
            maximize: 'Ekranı Kapla',
            restore: 'Önceki Boyuta Getir',
            delete: 'Sil',
            rename: 'Yeniden Adlandır',
            properties: 'Özellikler',
            view: 'Görünüm',
            sort: 'Sırala',
            sortByName: 'Ada Göre',
            sortByType: 'Türe Göre',
            sortByDate: 'Tarihe Göre',
            new: 'Yeni',
            folder: 'Klasör',
            textDocument: 'Metin Belgesi',
            largeIcons: 'Büyük Simgeler',
            mediumIcons: 'Orta Simgeler',
            smallIcons: 'Küçük Simgeler',
            changeWallpaper: 'Duvar Kağıdını Değiştir',
            pinToTaskbar: 'Görev Çubuğuna Sabitle',
            unpinFromTaskbar: 'Görev Çubuğundan Çıkar',
            power: 'Yeniden Yükle',
            restart: 'Yeniden Başlat',
            shutdown: 'Kapat',
            sleep: 'Uyku',
            restarting: 'Yeniden başlatılıyor...',
            shuttingDown: 'Kapatılıyor...',
            restartMessage: 'Windows yeniden başlatılıyor...',
            shutdownMessage: 'Windows kapatılıyor...',
            clickToWake: 'Uyandırmak için tıklayın',
            
            // Settings categories
            settings: 'Ayarlar',
            appearance: 'Görünüm',
            personalization: 'Kişiselleştirme',
            language: 'Dil',
            sound: 'Ses',
            time: 'Saat ve Tarih',
            
            // Settings options
            wallpaper: 'Duvar Kağıdı',
            theme: 'Tema',
            chooseWallpaper: 'Duvar kağıdı seçin',
            chooseTheme: 'Tema seçin',
            chooseLanguage: 'Dil seçin',
            volume: 'Ses Seviyesi',
            timeFormat: 'Saat biçimi',
            format12h: '12 saat',
            format24h: '24 saat',
            apply: 'Uygula',
            cancel: 'İptal',
            
            // App names
            notepad: 'Not Defteri',
            paint: 'Paint',
            minesweeper: 'Mayın Tarlası',
            snake: 'Yılan',
            tetris: 'Tetris',
            dbViewer: 'Veritabanı Görüntüleyici',
            browser: 'Internet Explorer',
            fileExplorer: 'Dosya Gezgini',
            computer: 'Bilgisayar',
            documents: 'Belgelerim',
            
            // Notepad
            file: 'Dosya',
            edit: 'Düzen',
            format: 'Biçim',
            help: 'Yardım',
            new: 'Yeni',
            open: 'Aç',
            save: 'Kaydet',
            saveAs: 'Farklı Kaydet',
            fileName: 'Dosya adı',
            saveAsType: 'Farklı kaydet türü',
            textFiles: 'Metin Dosyaları',
            allFiles: 'Tüm Dosyalar',
            print: 'Yazdır',
            exit: 'Çıkış',
            undo: 'Geri Al',
            redo: 'Yinele',
            cut: 'Kes',
            copy: 'Kopyala',
            paste: 'Yapıştır',
            find: 'Bul',
            findNext: 'Sonrakini Bul',
            replace: 'Değiştir',
            selectAll: 'Tümünü Seç',
            timeDate: 'Saat/Tarih',
            wordWrap: 'Sözcük Kaydırma',
            font: 'Yazı Tipi',
            
            // Paint
            brushes: 'Fırçalar',
            shapes: 'Şekiller',
            colors: 'Renkler',
            size: 'Boyut',
            pencil: 'Kalem',
            brush: 'Fırça',
            eraser: 'Silgi',
            line: 'Çizgi',
            rectangle: 'Dikdörtgen',
            ellipse: 'Elips',
            clear: 'Temizle',
            
            // Games
            newGame: 'Yeni Oyun',
            pause: 'Duraklat',
            resume: 'Devam Et',
            score: 'Skor',
            level: 'Seviye',
            gameOver: 'Oyun Bitti',
            easy: 'Kolay',
            medium: 'Orta',
            hard: 'Zor',
            restart: 'Yeniden Başlat',
            
            // Minesweeper
            flags: 'Bayraklar',
            mines: 'Mayınlar',
            
            // Snake
            speed: 'Hız',
            
            // Tetris
            lines: 'Çizgiler',
            next: 'Sonraki',
            
            // Database Viewer
            stores: 'Depolar',
            files: 'Dosyalar',
            apps: 'Uygulamalar',
            users: 'Kullanıcılar',
            system: 'Sistem',
            add: 'Ekle',
            edit: 'Düzenle',
            clear: 'Tümünü Temizle'
        }
    };
    
    // Initialize translations
    function init() {
        // Try to get language from settings
        if (typeof Storage !== 'undefined' && Storage.getSettings) {
            const settings = Storage.getSettings();
            if (settings && settings.language) {
                setLanguage(settings.language);
            }
        }
        
        // Update all elements with translations
        updateElements(document);
    }
    
    // Set the current language
    function setLanguage(lang, skipSave = false) {
        // Verify language exists
        if (LANGUAGES.includes(lang)) {
            currentLanguage = lang;
            
            // Save to settings if Storage is available and skipSave is false
            if (!skipSave && typeof Storage !== 'undefined' && Storage.saveSettings) {
                const settings = Storage.getSettings();
                settings.language = lang;
                
                // This callback pattern breaks the circular dependency
                setTimeout(() => {
                    Storage.saveSettings(settings);
                }, 0);
            }
            
            return true;
        }
        return false;
    }
    
    // Get a translation for a key
    function get(key) {
        // Check if translation exists
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            return translations[currentLanguage][key];
        }
        
        // Fallback to English
        if (translations['en'] && translations['en'][key]) {
            return translations['en'][key];
        }
        
        // Return the key itself if no translation found
        return key;
    }
    
    // Update all translatable elements in a container
    function updateElements(container) {
        // Find all elements with data-translate attribute
        const translatableElements = container.querySelectorAll('[data-translate]');
        
        translatableElements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (key) {
                element.textContent = get(key);
            }
        });
    }
    
    // Get available languages
    function getLanguages() {
        return LANGUAGES.slice();
    }
    
    // Get current language
    function getCurrentLanguage() {
        return currentLanguage;
    }
    
    // Public API
    window.Translations = {
        init: init,
        setLanguage: setLanguage,
        get: get,
        updateElements: updateElements,
        getLanguages: getLanguages,
        getCurrentLanguage: getCurrentLanguage
    };
})();
