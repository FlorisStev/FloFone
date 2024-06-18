

document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    } else {
        updateCartDisplay();
    }
});

/**
 * Updates the cart display with the current items in the cart.
 * Fetches the cart items from the server and updates the cart container and order summary.
 * If the cart is empty, it displays a message indicating so.
 */
function updateCartDisplay() {
    const cartContainer = document.getElementById('cart-container');
    const orderSummary = document.getElementById('order-summary');

    fetch(`${BASE_URL}/api/cart`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        cartContainer.innerHTML = ''; // Clear existing content
        orderSummary.innerHTML = ''; // Clear existing content

        let subtotal = 0;

        if (data.length === 0) {
            cartContainer.innerHTML = '<p>Winkelwagen is leeg.</p>';
            orderSummary.innerHTML = '<p>Geen producten in winkelwagen.</p>';
        } else {
            data.forEach(item => {
                subtotal += item.price * item.quantity;

                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h2>${item.name}</h2>
                        <div class="cart-item-price">€${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">Aantal: ${item.quantity}</div>
                        <button class="product-button" onclick="removeFromCart(${item.id})">Verwijderen</button>
                    </div>
                `;
                cartContainer.appendChild(cartItem);
            });

            orderSummary.innerHTML = `
                <p>Totaal exclusief verzendkosten: €${subtotal.toFixed(2)}</p>
                <p>verzendkosten: €${SHIPPINGFEE}</p>
                <p>Totaal: €${(subtotal + SHIPPINGFEE).toFixed(2)}</p>
            `;
        }
    })
    .catch(error => console.error('Error:', error));
}

/**
 * Removes an item from the cart.
 * Sends a DELETE request to the server to remove the specified item from the cart.
 * If successful, updates the cart display and shows a confirmation message.
 */
function removeFromCart(cartId) {
    fetch(`${BASE_URL}/api/cart/${cartId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to remove product from cart');
        }
        return response.json();
    })
    .then(data => {
        updateCartDisplay();
        alert('Product is verwijderd uit de winkelwagen.');
    })
    .catch(error => console.error('Error:', error));
}

/**
 * Submits an order.
 * Sends a POST request to the server with the order details to place a new order.
 * If successful, redirects the user to the dashboard and shows a confirmation message.
 */
function submitOrder() {
    const form = document.getElementById('delivery-form');
    const formData = new FormData(form);
    const orderDetails = Object.fromEntries(formData.entries());

        method: 'POST',
    fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(orderDetails)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert('Order succesvol geplaatst!');
            window.location.href = 'dashboard.html';
        }
    })
    .catch(error => console.error('Error:', error));
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
