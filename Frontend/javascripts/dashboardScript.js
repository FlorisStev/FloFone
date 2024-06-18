
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    fetchUserData(token);
});

/**
 * Fetches user data to check if the user is an admin.
 * If the user is not an admin, it redirects to the home page.
 * If the user is an admin, it fetches the orders.
 * 
 * @param {string} token - The JWT token used for authentication.
 */
function fetchUserData(token) {
    fetch(`${BASE_URL}/api/user`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(user => {
        if (!user.isAdmin) {
            document.body.innerHTML = ''; // Show a blank screen immediately
            window.location.href = 'index.html'; // Redirect to home page
        } else {
            fetchOrders();
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        window.location.href = 'login.html';
    });
}

/**
 * Fetches the list of orders from the server and displays them in the orders table.
 * This function is called after verifying the user is an admin.
 */
function fetchOrders() {
    fetch(`${BASE_URL}/api/orders`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const orderTableBody = document.getElementById('order-table-body');
        orderTableBody.innerHTML = ''; // Clear existing content

        data.forEach(order => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td><a href="orderdetails.html?orderId=${order.orderId}">${order.orderId}</td>
                <td>${order.customerName}</td>
                <td>${order.customerEmail}</td>
                <td>${order.productNames}</td>
                <td>${order.totalAmount.toFixed(2)}</td>
            `;

            orderTableBody.appendChild(row);
        });
    })
    .catch(error => console.error('Error fetching orders:', error));
}

/**
 * Retrieves the JWT token from localStorage.
 * This function is used to get the stored JWT token for authentication purposes.
 * 
 * @returns {string} The JWT token.
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Logs out the user by removing the JWT token from localStorage and redirecting to the login page.
 * This function is necessary to allow the user to securely log out of the application.
 */
function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
