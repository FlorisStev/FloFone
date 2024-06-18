

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Fetch user data to verify if the user is an admin
    fetchWithAuth(`${BASE_URL}/api/user`)
        .then(response => response.json())
        .then(user => {
            if (!user.isAdmin) {
                document.body.innerHTML = ''; // Show a blank screen immediately
                window.location.href = 'index.html'; // Redirect to home page if not an admin
            } else {
                loadUsers(); // Load users if the user is an admin
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            window.location.href = 'login.html'; // Redirect to login page on error
        });
});

/**
 * Loads the list of users.
 * Fetches user data from the server and displays it in the user table.
 */
function loadUsers() {
    fetchWithAuth(`${BASE_URL}/api/users`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('user-table-body');
            tableBody.innerHTML = ''; // Clear existing content

            data.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><a href="userDetails.html?userId=${user.id}">${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.isAdmin}</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading users:', error));
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
 * Logs out the user.
 * This function removes the JWT token from localStorage and redirects the user to the login page.
 */
function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

/**
 * Refreshes the JWT token.
 * This function sends a POST request to the server to refresh the JWT token.
 * If successful, it updates the token in localStorage.
 * If the refresh fails, it redirects the user to the login page.
 * @returns {Promise<string>} A promise that resolves to the new token.
 */
function refreshToken() {
    const token = getToken();
    return fetch(`${BASE_URL}/api/refresh-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            setToken(data.token);
            return data.token;
        } else {
            throw new Error('Token refresh failed');
        }
    })
    .catch(error => {
        console.error('Error refreshing token:', error);
        window.location.href = 'login.html'; // Redirect to login page if refresh fails
    });
}

/**
 * Fetches data from the server with authentication.
 * This function includes the JWT token in the request headers.
 * If the token is expired, it attempts to refresh the token and retry the request.
 * @param {string} url - The URL to fetch data from.
 * @param {object} [options={}] - Optional fetch options.
 * @returns {Promise<Response>} The fetch response.
 */
function fetchWithAuth(url, options = {}) {
    const token = getToken();
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    return fetch(url, options)
    .then(response => {
        if (response.status === 403) {
            return refreshToken().then(newToken => {
                options.headers['Authorization'] = `Bearer ${newToken}`;
                return fetch(url, options);
            });
        }
        return response;
    });
}

/**
 * Stores the JWT token in localStorage.
 * This function is used to save the JWT token after login or token refresh.
 * @param {string} token - The JWT token to be stored.
 */
function setToken(token) {
    localStorage.setItem('token', token);
}
