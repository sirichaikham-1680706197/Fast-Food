document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    fetchTopProducts();
    fetchOrders();
});

async function fetchStats() {
    try {
        const response = await fetch('/admin/stats');
        const data = await response.json();
        
        const container = document.getElementById('kpi-container');
        
        const topMenuName = data.top_menu ? data.top_menu.name : 'N/A';
        const topMenuSold = data.top_menu ? `${data.top_menu.total_sold} sold` : '';
        
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex items-center">
                <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <i class="fa-solid fa-receipt text-2xl"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Orders</p>
                    <p class="text-2xl font-bold text-gray-900">${data.total_orders}</p>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex items-center">
                <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                    <i class="fa-solid fa-money-bill-wave text-2xl"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                    <p class="text-2xl font-bold text-gray-900">฿${Number(data.total_revenue).toLocaleString()}</p>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex items-center">
                <div class="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                    <i class="fa-solid fa-fire text-2xl"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Top Output</p>
                    <p class="text-lg font-bold text-gray-900 leading-tight">${topMenuName}</p>
                    <p class="text-xs text-gray-500">${topMenuSold}</p>
                </div>
            </div>
        `;
    } catch (error) {
        showToast('Error loading stats', 'error');
    }
}

let chartInstance = null;
async function fetchTopProducts() {
    try {
        const response = await fetch('/admin/top-products');
        const data = await response.json();
        
        const labels = data.map(item => item.name.length > 15 ? item.name.substring(0,15)+'...' : item.name);
        const values = data.map(item => item.total_sold);
        
        const ctx = document.getElementById('topProductsChart').getContext('2d');
        
        if(chartInstance) chartInstance.destroy();
        
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Units Sold',
                    data: values,
                    backgroundColor: 'rgba(249, 115, 22, 0.7)',
                    borderColor: 'rgba(234, 88, 12, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
        
    } catch (error) {
        console.error(error);
    }
}

async function fetchOrders() {
    try {
        const response = await fetch('/orders');
        const orders = await response.json();
        const tbody = document.getElementById('orders-tbody');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-10 text-center text-gray-500">No orders found.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleString();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-orange-600">฿${order.total_price.toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showToast('Error loading orders', 'error');
    }
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    
    const icon = type === 'error' ? '<i class="fa-solid fa-circle-exclamation mr-2"></i>' : '<i class="fa-solid fa-circle-check mr-2"></i>';
    
    toast.innerHTML = `<div class="flex items-center font-medium">${icon} ${message}</div>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
