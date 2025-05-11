/**
 * Calculator Application
 * A simple calculator application
 */
(function() {
    'use strict';
    
    // Application state
    let windowId = null;
    let currentExpression = '';
    let lastResult = null;
    let errorState = false;
    
    // Calculator buttons configuration
    const buttons = [
        { label: 'C', type: 'clear', action: clearAll },
        { label: '←', type: 'delete', action: deleteLastChar },
        { label: '%', type: 'operator', action: () => appendToExpression('%') },
        { label: '÷', type: 'operator', action: () => appendToExpression('/') },
        
        { label: '7', type: 'number', action: () => appendToExpression('7') },
        { label: '8', type: 'number', action: () => appendToExpression('8') },
        { label: '9', type: 'number', action: () => appendToExpression('9') },
        { label: '×', type: 'operator', action: () => appendToExpression('*') },
        
        { label: '4', type: 'number', action: () => appendToExpression('4') },
        { label: '5', type: 'number', action: () => appendToExpression('5') },
        { label: '6', type: 'number', action: () => appendToExpression('6') },
        { label: '−', type: 'operator', action: () => appendToExpression('-') },
        
        { label: '1', type: 'number', action: () => appendToExpression('1') },
        { label: '2', type: 'number', action: () => appendToExpression('2') },
        { label: '3', type: 'number', action: () => appendToExpression('3') },
        { label: '+', type: 'operator', action: () => appendToExpression('+') },
        
        { label: '±', type: 'negate', action: negateLastNumber },
        { label: '0', type: 'number', action: () => appendToExpression('0') },
        { label: '.', type: 'number', action: () => appendToExpression('.') },
        { label: '=', type: 'equals', action: calculateResult }
    ];
    
    // Initialize the application
    function init() {
        // Register with the window manager
        WindowManager.registerApplication('calculator', {
            title: 'Calculator',
            icon: 'assets/icons/calculator.svg',
            appName: 'calculator',
            width: 300,
            height: 400,
            minWidth: 260,
            minHeight: 350,
            onCreate: function(id) {
                windowId = id;
                createWindowContent();
                attachEventHandlers();
            },
            onClose: handleClose,
            onFocus: handleFocus,
            onBlur: handleBlur
        });
    }
    
    // Open the application
    function open() {
        if (windowId === null) {
            // Create a new calculator window using the registered app
            windowId = WindowManager.createAppWindow('calculator');
        } else {
            WindowManager.activateWindow(windowId);
        }
    }
    
    // Create window content
    function createWindowContent() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        windowContent.innerHTML = `
            <div class="calculator">
                <div class="calculator-display">
                    <div class="calculator-expression"></div>
                    <div class="calculator-result">0</div>
                </div>
                <div class="calculator-buttons">
                    ${buttons.map(button => `
                        <button class="calculator-button calculator-button-${button.type}" data-button="${button.label}">
                            ${button.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Attach event handlers
    function attachEventHandlers() {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        // Attach button click handlers
        const buttonElements = windowContent.querySelectorAll('.calculator-button');
        buttonElements.forEach(button => {
            const buttonLabel = button.getAttribute('data-button');
            const buttonConfig = buttons.find(b => b.label === buttonLabel);
            
            if (buttonConfig) {
                button.addEventListener('click', buttonConfig.action);
            }
        });
        
        // Attach keyboard event handler
        document.addEventListener('keydown', handleKeyDown);
    }
    
    // Handle keyboard input
    function handleKeyDown(e) {
        // Only handle keys when calculator is active
        if (WindowManager.isWindowActive(windowId)) {
            e.preventDefault();
            
            if (e.key >= '0' && e.key <= '9') {
                appendToExpression(e.key);
            } else if (e.key === '.') {
                appendToExpression('.');
            } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
                appendToExpression(e.key);
            } else if (e.key === 'Enter') {
                calculateResult();
            } else if (e.key === 'Escape') {
                clearAll();
            } else if (e.key === 'Backspace') {
                deleteLastChar();
            }
        }
    }
    
    // Append character to expression
    function appendToExpression(char) {
        if (errorState) {
            clearAll();
        }
        
        // If we have a result and start with a number, clear the expression
        if (lastResult !== null && (char >= '0' && char <= '9')) {
            currentExpression = '';
            lastResult = null;
        }
        
        // Check if we're appending an operator after a result
        if (lastResult !== null && (char === '+' || char === '-' || char === '*' || char === '/')) {
            currentExpression = lastResult + char;
            lastResult = null;
        } else {
            currentExpression += char;
        }
        
        updateDisplay();
    }
    
    // Clear all
    function clearAll() {
        currentExpression = '';
        lastResult = null;
        errorState = false;
        updateDisplay();
    }
    
    // Delete last character
    function deleteLastChar() {
        if (errorState) {
            clearAll();
            return;
        }
        
        if (lastResult !== null) {
            // If we're showing a result, clear everything
            clearAll();
        } else {
            currentExpression = currentExpression.slice(0, -1);
            updateDisplay();
        }
    }
    
    // Negate the last number in the expression
    function negateLastNumber() {
        if (errorState) {
            clearAll();
            return;
        }
        
        if (lastResult !== null) {
            // If we're showing a result, negate it
            currentExpression = (-lastResult).toString();
            lastResult = null;
            updateDisplay();
            return;
        }
        
        // Find the last number in the expression
        const match = currentExpression.match(/(-?\d*\.?\d+)$/);
        if (match) {
            const lastNumber = match[0];
            const position = currentExpression.lastIndexOf(lastNumber);
            const negatedNumber = (parseFloat(lastNumber) * -1).toString();
            
            currentExpression = currentExpression.substring(0, position) + negatedNumber;
            updateDisplay();
        }
    }
    
    // Calculate result
    function calculateResult() {
        if (errorState || currentExpression === '') {
            return;
        }
        
        try {
            // Replace % with /100
            let expression = currentExpression.replace(/(\d+)%/g, '($1/100)');
            
            // Evaluate the expression
            lastResult = eval(expression);
            
            // Handle division by zero and other errors
            if (!isFinite(lastResult)) {
                errorState = true;
                updateDisplay("Error");
                return;
            }
            
            updateDisplay();
        } catch (e) {
            errorState = true;
            updateDisplay("Error");
        }
    }
    
    // Update the display
    function updateDisplay(errorMessage) {
        const windowContent = WindowManager.getWindowContentElement(windowId);
        if (!windowContent) return;
        
        const expressionElement = windowContent.querySelector('.calculator-expression');
        const resultElement = windowContent.querySelector('.calculator-result');
        
        if (errorState && errorMessage) {
            expressionElement.textContent = currentExpression;
            resultElement.textContent = errorMessage;
            return;
        }
        
        expressionElement.textContent = currentExpression;
        
        if (lastResult !== null) {
            resultElement.textContent = lastResult;
        } else if (currentExpression === '') {
            resultElement.textContent = '0';
        } else {
            resultElement.textContent = currentExpression;
        }
    }
    
    // Handle window close
    function handleClose() {
        windowId = null;
        currentExpression = '';
        lastResult = null;
        errorState = false;
        
        // Remove keyboard event handler
        document.removeEventListener('keydown', handleKeyDown);
    }
    
    // Handle window focus
    function handleFocus() {
        // Not needed
    }
    
    // Handle window blur
    function handleBlur() {
        // Not needed
    }
    
    // Initialize and export public API
    init();
    
    window.CalculatorApp = {
        open: open
    };
})();