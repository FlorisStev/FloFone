
/**
 * Event listener for DOMContentLoaded to initialize the page.
 * Calls updateNavLinks to set up the navigation links and loadProducts to display the products.
 */
document.addEventListener('DOMContentLoaded', () => {
    updateNavLinks();
    loadProducts();
});

/**
 * Updates the navigation links based on the user's authentication status.
 * If the user is logged in, it fetches user data to determine if the user is an admin
 * and updates the navigation links accordingly.
 * If the user is not logged in, it shows login and register links.
 */
function updateNavLinks() {
    const navLinks = document.getElementById('nav-links');
    const token = getToken();

    if (token) {
        fetchWithAuth(`${BASE_URL}/api/user`)
            .then(response => response.json())
            .then(user => {
                let dropdownContent = `
                    <div class="dropdown">
                        <a href="javascript:void(0)" class="dropbtn">Mijn account</a>
                        <div class="dropdown-content">
                `;
                if (user.isAdmin) {
                    dropdownContent += `<a href="dashboard.html">Dashboard</a>`;
                }
                dropdownContent += `
                            <a href="javascript:logoutUser()">Uitloggen</a>
                        </div>
                    </div>
                `;
                navLinks.innerHTML += dropdownContent;
            })
            .catch(error => console.error('Error fetching user data:', error));
    } else {
        navLinks.innerHTML += '<a href="login.html">Login</a> <a href="register.html">Register</a>';
    }
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
 * Stores the JWT token in localStorage.
 * This function is used to save the JWT token after login or token refresh.
 * @param {string} token - The JWT token to be stored.
 */
function setToken(token) {
    localStorage.setItem('token', token);
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
 * Adds a product to the user's cart.
 * This function sends a POST request to the server to add the specified product to the cart.
 * @param {number} productId - The ID of the product to add to the cart.
 */
function addToCart(productId) {
    const token = getToken();
    if (!token) {
        alert('Je moet inloggen om producten aan de winkelwagen toe te voegen.');
        return;
    }

    fetchWithAuth(`${BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity: 1 })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add product to cart');
        }
        alert('Product toegevoegd aan winkelwagen');
    })
    .catch(error => console.error('Error adding product to cart:', error));
}

/**
 * Logs out the user.
 * This function removes the JWT token from localStorage and redirects the user to the login page.
 */
function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
