/**
 * FastBite Login Handler
 * Handles user authentication and session management
 */

// DOM Elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('password-toggle-icon');
const submitButton = loginForm.querySelector('button[type="submit"]');
const alertContainer = document.getElementById('alert-container');
const toastContainer = document.getElementById('toast-container');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    
    // Auto-focus username input
    usernameInput.focus();
});

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    
    // Enter key in password field submits form
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
}

/**
 * Toggle Password Visibility
 */
function togglePasswordVisibility() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    passwordToggle.className = isPassword 
        ? 'fa-solid fa-eye-slash' 
        : 'fa-solid fa-eye';
}

/**
 * Handle Login Form Submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Validation
    if (!username || !password) {
        showAlert('Please enter both username and password', 'error');
        return;
    }
    
    if (password.length < 3) {
        showAlert('Password is too short', 'error');
        return;
    }
    
    // Disable form during submission
    disableForm();
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success - store credentials and redirect
            showToast('Login successful! Redirecting...', 'success');
            
            // Add animation before redirect
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 500);
        } else {
            // Failed login
            showAlert(data.error || 'Login failed. Please try again.', 'error');
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred. Please try again.', 'error');
    } finally {
        enableForm();
    }
}

/**
 * Show Alert Message
 */
function showAlert(message, type = 'error') {
    // Clear previous alerts
    alertContainer.innerHTML = '';
    
    const alertClass = type === 'error' 
        ? 'bg-red-100 border-red-300 text-red-800' 
        : 'bg-green-100 border-green-300 text-green-800';
    
    const icon = type === 'error' 
        ? 'fa-circle-exclamation' 
        : 'fa-circle-check';
    
    const alert = document.createElement('div');
    alert.className = `${alertClass} border-2 rounded-lg p-4 flex items-center space-x-3`;
    alert.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-dismiss success alerts
    if (type === 'success') {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    
    const icon = type === 'error' 
        ? '<i class="fa-solid fa-circle-exclamation mr-2"></i>' 
        : '<i class="fa-solid fa-circle-check mr-2"></i>';
    
    toast.innerHTML = `
        <div class="flex items-center font-medium">${icon} ${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Disable Form During Submission
 */
function disableForm() {
    usernameInput.disabled = true;
    passwordInput.disabled = true;
    submitButton.disabled = true;
    
    // Change button appearance
    const submitIcon = document.getElementById('submit-icon');
    submitIcon.className = 'fa-solid fa-spinner fa-spin';
}

/**
 * Enable Form After Submission
 */
function enableForm() {
    usernameInput.disabled = false;
    passwordInput.disabled = false;
    submitButton.disabled = false;
    
    // Restore button appearance
    const submitIcon = document.getElementById('submit-icon');
    submitIcon.className = 'fa-solid fa-arrow-right';
}
