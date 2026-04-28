// Global State
let menuData = [];
let cart = [];
const DELIVERY_FEE = 20;
let currentReviewProductId = null;

// DOM Elements
const menuContainer = document.getElementById('menu-container');
const categoryBtns = document.querySelectorAll('.category-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartBadge = document.getElementById('cart-badge');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartDeliveryEl = document.getElementById('cart-delivery');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const toastContainer = document.getElementById('toast-container');
const reviewModal = document.getElementById('review-modal');
const reviewList = document.getElementById('review-list');
const reviewModalTitle = document.getElementById('review-modal-title');
const starSelector = document.getElementById('star-selector');
const selectedRatingInput = document.getElementById('selected-rating');
const reviewCommentInput = document.getElementById('review-comment');
const submitReviewBtn = document.getElementById('submit-review-btn');

// Initialize JS
document.addEventListener('DOMContentLoaded', () => {
    fetchMenu();
    setupEventListeners();
});

// Fetch and Render Menu
async function fetchMenu() {
    try {
        const response = await fetch('/menu');
        menuData = await response.json();
        renderMenu('all');
    } catch (error) {
        showToast('Failed to load menu.', 'error');
        menuContainer.innerHTML = '<p class="col-span-full text-center text-red-500">Error loading menu. Please try again later.</p>';
    }
}

function renderMenu(category) {
    menuContainer.innerHTML = '';
    const filteredMenu = category === 'all' 
        ? menuData 
        : menuData.filter(item => item.category === category);
    
    if (filteredMenu.length === 0) {
        menuContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">No items in this category.</p>';
        return;
    }

    filteredMenu.forEach(item => {
        let badgeText = '';
        let badgeIcon = '';
        if(item.category === 'burger') { badgeText = 'BURGER'; badgeIcon = '🍔'; }
        else if(item.category === 'snack') { badgeText = 'SNACK'; badgeIcon = '🍟'; }
        else if(item.category === 'drink') { badgeText = 'DRINK'; badgeIcon = '🥤'; }
        else if(item.category === 'steak') { badgeText = 'STEAK'; badgeIcon = '🥩'; }
        else if(item.category === 'spaghetti') { badgeText = 'PASTA'; badgeIcon = '🍝'; }

        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover flex flex-col group relative';
        card.innerHTML = `
            <div class="h-44 overflow-hidden relative cursor-pointer" onclick="openReviewModal(${item.id}, '${item.name}')">
                <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute top-3 left-3 bg-white px-2 py-1 rounded-full text-[10px] font-bold text-gray-800 shadow-sm flex items-center gap-1">
                    <span>${badgeIcon}</span> ${badgeText}
                </div>
            </div>
            <div class="p-4 flex flex-col flex-1 relative">
                <h3 class="text-sm md:text-base font-bold text-gray-900 leading-tight mb-2 pr-10 line-clamp-2">${item.name}</h3>
                
                <div class="mt-auto flex justify-between items-end">
                    <p class="text-[#e32e2d] font-bold text-lg">฿${item.price}</p>
                    <button onclick="addToCart(${item.id})" class="absolute bottom-4 right-4 w-8 h-8 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white flex items-center justify-center transition-colors shadow-sm ml-auto">
                        <i class="fa-solid fa-plus text-sm text-gray-800"></i>
                    </button>
                </div>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}

// Event Listeners
function setupEventListeners() {
    // Category Tabs
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            categoryBtns.forEach(b => {
                b.classList.remove('bg-[#e32e2d]', 'text-white');
                b.classList.add('bg-white', 'text-gray-700');
            });
            e.target.classList.remove('bg-white', 'text-gray-700');
            e.target.classList.add('bg-[#e32e2d]', 'text-white');
            
            const category = e.target.getAttribute('data-category');
            renderMenu(category);
        });
    });

    checkoutBtn.addEventListener('click', processCheckout);

    // Star rating highlight logic
    const stars = starSelector.querySelectorAll('i');
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const val = this.getAttribute('data-rating');
            updateStarsUI(val);
        });
        star.addEventListener('mouseout', function() {
            const currentVal = selectedRatingInput.value;
            updateStarsUI(currentVal);
        });
        star.addEventListener('click', function() {
            const val = this.getAttribute('data-rating');
            selectedRatingInput.value = val;
            updateStarsUI(val);
        });
    });

    submitReviewBtn.addEventListener('click', submitReview);
}

function updateStarsUI(val) {
    const stars = starSelector.querySelectorAll('i');
    stars.forEach(star => {
        if (star.getAttribute('data-rating') <= val) {
            star.classList.replace('text-gray-300', 'text-yellow-400');
        } else {
            star.classList.replace('text-yellow-400', 'text-gray-300');
        }
    });
}

// Cart Logic
function toggleCart() {
    cartDrawer.classList.toggle('hidden');
}

function addToCart(productId) {
    const product = menuData.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
    showToast(`Added ${product.name} to cart`);
}

function updateCartQuantity(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += delta;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        updateCartUI();
    }
}

function updateCartUI() {
    // Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        cartBadge.textContent = totalItems > 99 ? '99+' : totalItems;
        cartBadge.classList.remove('hidden');
    } else {
        cartBadge.classList.add('hidden');
    }

    // Render items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="text-center text-gray-500 py-10 flex flex-col items-center"><i class="fa-solid fa-basket-shopping text-4xl mb-4 text-gray-300"></i><p>Your cart is empty.</p></div>';
        cartSubtotalEl.textContent = '0';
        cartDeliveryEl.textContent = '0';
        cartTotalEl.textContent = '0';
        checkoutBtn.disabled = true;
        return;
    }

    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const li = document.createElement('div');
        li.className = 'flex justify-between items-center py-4 border-b border-gray-100 last:border-0';
        li.innerHTML = `
            <div class="flex items-center flex-1">
                <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded object-cover mr-3">
                <div class="flex-1">
                    <h4 class="font-semibold text-sm line-clamp-2">${item.name}</h4>
                    <p class="text-orange-600 font-medium text-sm">฿${item.price}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border">
                <button onclick="updateCartQuantity(${item.id}, -1)" class="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded text-sm"><i class="fa-solid fa-minus text-xs"></i></button>
                <span class="w-6 text-center text-sm font-semibold">${item.quantity}</span>
                <button onclick="updateCartQuantity(${item.id}, 1)" class="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded text-sm"><i class="fa-solid fa-plus text-xs"></i></button>
            </div>
        `;
        cartItemsContainer.appendChild(li);
    });

    cartSubtotalEl.textContent = subtotal.toLocaleString();
    cartDeliveryEl.textContent = DELIVERY_FEE;
    cartTotalEl.textContent = (subtotal + DELIVERY_FEE).toLocaleString();
    checkoutBtn.disabled = false;
}

// Checkout Form Submission
async function processCheckout() {
    if (cart.length === 0) return;

    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...';

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderData = {
        cart: cart,
        total_price: subtotal + DELIVERY_FEE
    };

    try {
        const response = await fetch('/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            cart = [];
            updateCartUI();
            toggleCart();
            showToast('Order completed successfully! 🎉');
        } else {
            showToast('Checkout failed. Please try again.', 'error');
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = 'Checkout';
        }
    } catch (err) {
        showToast('Network error.', 'error');
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Checkout';
    }
}

// Review Logic
async function openReviewModal(productId, productName) {
    currentReviewProductId = productId;
    reviewModalTitle.textContent = `Reviews - ${productName}`;
    reviewModal.classList.remove('hidden');
    
    // Reset form
    selectedRatingInput.value = 0;
    updateStarsUI(0);
    reviewCommentInput.value = '';
    
    // Fetch reviews
    reviewList.innerHTML = '<div class="text-center text-gray-500 py-10"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i><p>Loading reviews...</p></div>';
    
    try {
        const response = await fetch(`/reviews/${productId}`);
        const data = await response.json();
        
        renderReviews(data.reviews, data.stats);
    } catch (err) {
        reviewList.innerHTML = '<div class="text-center text-red-500 py-4">Failed to load reviews.</div>';
    }
}

function renderReviews(reviews, stats) {
    if (reviews.length === 0) {
        reviewList.innerHTML = '<div class="text-center text-gray-500 py-6"><i class="fa-regular fa-comment-dots text-4xl mb-3 text-gray-300"></i><p>No reviews yet. Be the first to review!</p></div>';
        return;
    }
    
    let html = `
        <div class="flex items-center gap-4 mb-6 bg-orange-50 p-4 rounded-lg">
            <div class="text-4xl font-bold text-orange-600">${Number(stats.avg_rating).toFixed(1)}</div>
            <div>
                <div class="text-sm text-gray-600 mb-1">Average Rating</div>
                <div class="text-xs text-gray-500">Based on ${stats.count} reviews</div>
            </div>
        </div>
        <div class="space-y-4">
    `;
    
    reviews.forEach(review => {
        let starsHtml = '';
        for(let i=1; i<=5; i++) {
            starsHtml += `<i class="fa-solid fa-star ${i <= review.rating ? 'text-yellow-400' : 'text-gray-300'} text-xs"></i>`;
        }
        
        const date = new Date(review.created_at).toLocaleDateString();
        
        html += `
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex">${starsHtml}</div>
                    <span class="text-xs text-gray-400">${date}</span>
                </div>
                <p class="text-gray-700 text-sm whitespace-pre-line">${review.comment || '<span class="italic text-gray-400">No comment</span>'}</p>
            </div>
        `;
    });
    
    html += '</div>';
    reviewList.innerHTML = html;
}

function closeReviewModal() {
    reviewModal.classList.add('hidden');
    currentReviewProductId = null;
}

async function submitReview() {
    const rating = selectedRatingInput.value;
    const comment = reviewCommentInput.value.trim();
    
    if (rating == 0) {
        showToast('Please select a star rating', 'error');
        return;
    }
    
    const payload = {
        product_id: currentReviewProductId,
        rating: parseInt(rating),
        comment: comment
    };
    
    submitReviewBtn.disabled = true;
    submitReviewBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    try {
        const response = await fetch('/reviews', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showToast('Review submitted successfully!');
            // Refresh menu rating counters
            fetchMenu(); 
            // Refresh reviews in modal
            const nameMatch = reviewModalTitle.textContent.replace('Reviews - ', '');
            openReviewModal(currentReviewProductId, nameMatch);
        } else {
            showToast('Failed to submit review', 'error');
        }
    } catch(err) {
        showToast('Network error', 'error');
    } finally {
        submitReviewBtn.disabled = false;
        submitReviewBtn.innerHTML = 'Submit';
    }
}

// Toast Notifications Function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    
    const icon = type === 'error' ? '<i class="fa-solid fa-circle-exclamation mr-2"></i>' : '<i class="fa-solid fa-circle-check mr-2"></i>';
    
    toast.innerHTML = `
        <div class="flex items-center font-medium">${icon} ${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
