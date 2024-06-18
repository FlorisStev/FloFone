

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Fetch user details and orders if the user is authenticated
    fetch(`${BASE_URL}/api/user/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        displayUserDetails(data);
        loadUserOrders(userId);
    })
    .catch(error => console.error('Error fetching user details:', error));
});

/**
 * Displays user details on the page.
 * Sets the user information in the relevant HTML elements and adds event listeners for admin toggle and user deletion.
 * @param {object} user - The user object containing user details.
 */
function displayUserDetails(user) {
    document.getElementById('username').textContent = user.name;
    document.getElementById('email').textContent = user.email;
    document.getElementById('admin').checked = user.isAdmin;

    document.getElementById('admin').addEventListener('change', function() {
        toggleAdmin(user.id, this.checked);
    });

    document.getElementById('delete-user-button').addEventListener('click', function() {
        deleteUser(user.id);
    });
}

/**
 * Loads the orders for a specific user.
 * Fetches the user's orders from the server and displays them on the page.
 * @param {string} userId - The ID of the user whose orders are to be loaded.
 */
function loadUserOrders(userId) {
    fetch(`${BASE_URL}/api/user/${userId}/orders`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        displayUserOrders(data);
    })
    .catch(error => console.error('Error loading user orders:', error));
}

/**
 * Displays user orders on the page.
 * Generates HTML content for each order and appends it to the order details container.
 * @param {Array} orders - An array of order objects.
 */
function displayUserOrders(orders) {
    const container = document.getElementById('order-details-container');
    container.innerHTML = ''; // Clear existing content

    if (orders.length === 0) {
        container.innerHTML = '<p>No orders found for this user.</p>';
        return;
    }

    orders.forEach(order => {
        const orderHTML = `
            <div class="order-summary">
                <h2>Order Number <span>#${order.orderId}</span></h2>
                <div class="order-info">
                    <div class="order-section">
                        <h3>Items Summary</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Aantal</th>
                                    <th>Prijs</th>
                                    <th>Total Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.products.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>x ${item.quantity}</td>
                                        <td>€${item.price.toFixed(2)}</td>
                                        <td>€${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="order-section">
                        <h3>Gebruiker en bestelling details</h3>
                        <p><strong>Gebruikersnaam:</strong> ${order.customerName}</p>
                        <p><strong>E-mailadres:</strong> ${order.customerEmail}</p>
                        <p><strong>Aanmaakdatum:</strong> ${order.orderDate}</p>
                        <p><strong>Adres:</strong> ${order.address}, ${order.city}, ${order.state}, ${order.postcode}, ${order.country}</p>
                    </div>
                    <div class="order-section">
                        <h3>Order Summary</h3>
                        <p><strong>Aanmaakdatum:</strong> ${order.orderDate}</p>
                        <p><strong>Totaal exclusief verzendkosten:</strong> €${order.products.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</p>
                        <p><strong>Verzendkosten:</strong> €${SHIPPINGFEE}</p>
                        <p><strong>Totaal:</strong> €${order.products.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += orderHTML;
    });
}

/**
 * Toggles the admin status of a user.
 * Sends a PATCH request to update the user's admin status on the server.
 * @param {string} userId - The ID of the user whose admin status is to be updated.
 * @param {boolean} isAdmin - The new admin status.
 */
function toggleAdmin(userId, isAdmin) {
    fetch(`${BASE_URL}/api/user/${userId}/admin`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ isAdmin })
    })
    .then(response => {
        if (!response.ok) {
            alert('Failed to update admin status');
        }
    })
    .catch(error => console.error('Error updating admin status:', error));
}

/**
 * Deletes a user.
 * Sends a DELETE request to the server to delete the specified user.
 * @param {string} userId - The ID of the user to delete.
 */
function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    fetch(`${BASE_URL}/api/user/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => {
        if (!response.ok) {
            alert('Failed to delete user');
            return;
        }
        alert('User deleted successfully');
        window.location.href = 'users.html';
    })
    .catch(error => console.error('Error deleting user:', error));
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
