
/**
 * Loads products from the server and displays them on the page.
 * This function fetches products based on the specified category and updates the product container.
 * @param {string} category - The category of products to load. Defaults to an empty string, which loads all products.
 */
function loadProducts(category = '') {
    console.log(`Loading products for category: ${category}`);
    fetchWithAuth(`${BASE_URL}/api/products?category=${category}`)
        .then(response => response.json())
        .then(data => {
            const productContainer = document.getElementById('product-container');
            productContainer.innerHTML = ''; // Clear previous products

            data.forEach(product => {
                const productElement = document.createElement('div');
                productElement.className = 'product';
                productElement.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p>€${product.price}</p>
                    <button onclick="addToCart(${product.id})">Toevoegen aan winkelwagen</button>
                `;
                productContainer.appendChild(productElement);
            });
        })
        .catch(error => console.error('Error loading products:', error));
}

/**
 * Adds a product to the user's cart.
 * This function sends a POST request to the server to add the specified product to the cart.
 * If the user is not logged in, it displays an alert.
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
 * This script fetches the list of products from the server when the page loads,
 * and displays each product in a card format within the product container.
 * It creates a new product card for each product in the fetched data,
 * and appends it to the container, allowing users to see the products and add them to their cart.
 */
document.addEventListener('DOMContentLoaded', () => {
    fetch(`${BASE_URL}/api/products`)
        .then(response => response.json())
        .then(data => {
            const productContainer = document.getElementById('product-container');
            data.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-price">${product.price}</div>
                    <h2>${product.name}</h2>
                    <button class="product-button" onclick="addToCart(${product.id})">Voeg toe aan winkelwagen</button>
                `;
                productContainer.appendChild(productCard);
            });
        })
        .catch(error => console.error('Error loading products:', error));
});

/**
 * Adds a product to the user's cart.
 * This function sends a POST request to the server to add the specified product to the cart.
 * @param {number} productId - The ID of the product to add to the cart.
 */
function addToCart(productId) {
    fetch(`${BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity: 1 })
    })
    .then(response => response.json())
    .then(data => {
        alert('Product is toegevoegd aan de winkelwagen.');
    })
    .catch(error => console.error('Error adding product to cart:', error));
}
