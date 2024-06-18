

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    if (orderId) {
        loadOrderDetails(orderId);
    } else {
        document.getElementById('order-details-container').innerText = 'No order ID provided.';
    }
});

/**
 * Loads the details of a specific order.
 * Fetches the order details from the server and updates the DOM to display the order information.
 * @param {string} orderId - The ID of the order to load.
 */
function loadOrderDetails(orderId) {
    fetchWithAuth(`${BASE_URL}/api/order/${orderId}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('order-details-container');
            container.innerHTML = ''; // Clear existing content

            if (data.error) {
                container.innerHTML = `<p>${data.error}</p>`;
                return;
            }

            const orderHTML = `
                <div class="order-summary">
                    <h2>Bestellingnummer <span>#${data.orderId}</span></h2>
                    <div class="order-info">
                        <div class="order-section">
                            <h3>Producten overzicht</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Hoeveelheid</th>
                                        <th>Prijs</th>
                                        <th>Totaal prijs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.products.map(item => `
                                        <tr>
                                            <td><input type="text" value="${item.name}" disabled class="editable product-name"></td>
                                            <td><input type="number" value="${item.quantity}" disabled class="editable product-quantity"></td>
                                            <td>€<input type="number" value="${item.price.toFixed(2)}" disabled class="editable product-price"></td>
                                            <td>€${(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="order-section">
                            <h3>Gebruiker en bestelling details</h3>
                            <p><strong>Gebruikersnaam:</strong> <input type="text" value="${data.customerName}" disabled class="editable customer-name"></p>
                            <p><strong>E-mailadres:</strong> <input type="text" value="${data.customerEmail}" disabled class="editable customer-email"></p>
                            <p><strong>Aanmaakdatum:</strong> ${data.orderDate}</p>
                            <p><strong>Adres:</strong> <input type="text" value="${data.address}" disabled class="editable address"></p>
                            <p><strong>Stad:</strong> <input type="text" value="${data.city}" disabled class="editable city"></p>
                            <p><strong>Provincie:</strong> <input type="text" value="${data.state}" disabled class="editable state"></p>
                            <p><strong>Postcode:</strong> <input type="text" value="${data.postcode}" disabled class="editable postcode"></p>
                            <p><strong>Land:</strong> <input type="text" value="${data.country}" disabled class="editable country"></p>
                        </div>
                        <div class="order-section">
                            <h3>Betaald</h3>
                            <p><strong>Subtotal:</strong> €${data.products.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</p>
                            <p><strong>Verzendkosten:</strong> €${SHIPPINGFEE}</p>
                            <p><strong>Totaal:</strong> €${data.products.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</p>
                        </div>
                    </div>
                    <button id="edit-order-button" class="button-edit" onclick="toggleEdit(true)">Bewerk bestelling</button>
                    <button id="save-order-button" class="button-save" onclick="saveOrder(${data.orderId})" style="display:none;">Opslaan</button>
                    <button id="delete-order-button" class="button-delete" onclick="deleteOrder(${data.orderId})">Verwijder Bestelling</button>
                </div>
            `;

            container.innerHTML = orderHTML;
        })
        .catch(error => console.error('Error loading order details:', error));
}

/**
 * Toggles the edit mode for the order details.
 * Enables or disables the input fields based on the edit mode.
 * @param {boolean} editMode - If true, enables edit mode; otherwise, disables it.
 */
function toggleEdit(editMode) {
    const inputs = document.querySelectorAll('.editable');
    inputs.forEach(input => {
        input.disabled = !editMode;
    });
    document.getElementById('edit-order-button').style.display = editMode ? 'none' : 'inline-block';
    document.getElementById('save-order-button').style.display = editMode ? 'inline-block' : 'none';
}

/**
 * Saves the updated order details.
 * Collects the updated order details from the input fields and sends a PUT request to the server.
 * @param {string} orderId - The ID of the order to save.
 */
function saveOrder(orderId) {
    const updatedData = {
        products: [],
        customerName: document.querySelector('.customer-name').value,
        customerEmail: document.querySelector('.customer-email').value,
        address: document.querySelector('.address').value,
        city: document.querySelector('.city').value,
        state: document.querySelector('.state').value,
        postcode: document.querySelector('.postcode').value,
        country: document.querySelector('.country').value,
    };

    const productNames = document.querySelectorAll('.product-name');
    const productQuantities = document.querySelectorAll('.product-quantity');
    const productPrices = document.querySelectorAll('.product-price');

    for (let i = 0; i < productNames.length; i++) {
        updatedData.products.push({
            name: productNames[i].value,
            quantity: parseInt(productQuantities[i].value),
            price: parseFloat(productPrices[i].value),
        });
    }

    fetchWithAuth(`${BASE_URL}/api/order/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        alert('Order updated successfully!');
        toggleEdit(false);
        loadOrderDetails(orderId);
    })
    .catch(error => console.error('Error updating order:', error));
}

/**
 * Deletes the specified order.
 * Sends a DELETE request to the server to delete the order.
 * @param {string} orderId - The ID of the order to delete.
 */
function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) {
        return;
    }

    fetchWithAuth(`${BASE_URL}/api/order/${orderId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        alert('Order deleted successfully!');
        window.location.href = 'dashboard.html'; // Redirect to dashboard
    })
    .catch(error => console.error('Error deleting order:', error));
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