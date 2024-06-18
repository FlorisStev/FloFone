

document.addEventListener('DOMContentLoaded', () => {   
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    }
});

/**
 * Registers a new user.
 * This function is triggered when the registration form is submitted.
 * It prevents the default form submission, collects form data,
 * checks if passwords match, and sends a POST request to the server to register the user.
 * If successful, it logs in the user automatically.
 */
function registerUser(event) {
    event.preventDefault();
    const form = document.getElementById('register-form');
    const formData = new FormData(form);
    const userDetails = Object.fromEntries(formData.entries());

    // Check if passwords match
    if (userDetails.password !== userDetails['repeat-password']) {
        alert('Passwords do not match!');
        return;
    }

    // Register the user
    fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userDetails)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        alert(data.message);
        loginAfterRegister(userDetails.email, userDetails.password);
    })
    .catch(error => console.error('Error:', error));
}

/**
 * Logs in a user after successful registration.
 * This function is called after the user is registered to automatically log them in.
 * It sends a POST request with the user's email and password to the server to obtain a JWT token.
 * If successful, it stores the token in localStorage and redirects the user to the index page.
 */
function loginAfterRegister(email, password) {
    fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        localStorage.setItem('token', data.token);
        window.location.href = 'index.html';
    })
    .catch(error => console.error('Error:', error));
}

/**
 * Logs in a user.
 * This function is triggered when the login form is submitted.
 * It prevents the default form submission, collects form data,
 * and sends a POST request to the server to log in the user.
 * If successful, it stores the JWT token in localStorage and redirects the user to the index page.
 */
function loginUser(event) {
    event.preventDefault();
    const form = document.getElementById('login-form');
    const formData = new FormData(form);
    const loginDetails = Object.fromEntries(formData.entries());

    fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginDetails)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        localStorage.setItem('token', data.token);
        window.location.href = 'index.html';
    })
    .catch(error => console.error('Error:', error));
}

/**
 * Logs out the user.
 * This function is called when the user clicks the logout button.
 * It removes the JWT token from localStorage and redirects the user to the login page.
 */
function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

/**
 * Retrieves the JWT token from localStorage.
 * This function is used to get the stored JWT token for authentication purposes.
 * @returns {string} The JWT token.
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Checks if the user is logged in.
 * This function checks if there is a JWT token stored in localStorage.
 * @returns {boolean} True if the user is logged in, false otherwise.
 */
function isLoggedIn() {
    return !!getToken();
}
