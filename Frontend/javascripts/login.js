
/**
 * Toggles the visibility of the password field.
 * This function changes the password field type between 'password' and 'text',
 * and updates the inner text of the toggle element to indicate the current state.
 */
function togglePassword() {
    const passwordField = document.getElementById('password');
    const showPasswordText = document.querySelector('.show-password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        showPasswordText.innerText = 'verberg';
    } else {
        passwordField.type = 'password';
        showPasswordText.innerText = 'show';
    }
}

/**
 * Logs in the user.
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

        // Log in the user automatically after registration
        loginUserAfterRegister(userDetails.email, userDetails.password);
    })
    .catch(error => console.error('Error:', error));
}

/**
 * Logs in the user automatically after successful registration.
 * This function sends a POST request with the user's email and password to the server to obtain a JWT token.
 * If successful, it stores the token in localStorage and redirects the user to the index page.
 * 
 * @param {string} email - The email of the registered user.
 * @param {string} password - The password of the registered user.
 */
function loginUserAfterRegister(email, password) {
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

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
    }
});
