(function() {
    'use strict';
    
    const userName = document.getElementById('userName');
    const totalOrders = document.getElementById('totalOrders');
    const activeOrderSection = document.getElementById('activeOrderSection');
    const activeCollectionName = document.getElementById('activeCollectionName');
    const activeSpotName = document.getElementById('activeSpotName');
    const activeStatus = document.getElementById('activeStatus');
    const activePickupTime = document.getElementById('activePickupTime');
    const historyContainer = document.getElementById('historyContainer');
    
    const statusLabels = {
        'crafting': 'Crafting',
        'on_the_way': 'On the Way',
        'arrived': 'Arrived',
        'completed': 'Completed'
    };
    
    async function init() {
        try {
            const response = await fetch('/api/my-rhythm');
            const data = await response.json();
            
            if (data.user) {
                userName.textContent = data.user.name + '님';
                totalOrders.textContent = data.user.totalOrders;
            }
            
            if (data.activeOrder) {
                renderActiveOrder(data.activeOrder);
            }
            
            if (data.history && data.history.length > 0) {
                renderHistory(data.history);
            } else {
                historyContainer.innerHTML = '<div class="text-center py-12"><p class="text-sm text-gray-500">아직 주문 내역이 없습니다</p></div>';
            }
            
        } catch (error) {
            historyContainer.innerHTML = '<div class="text-center py-12"><p class="text-sm text-red-500">데이터를 불러올 수 없습니다</p></div>';
        }
    }
    
    // Render active order
    function renderActiveOrder(order) {
        activeOrderSection.style.display = 'block';
        activeCollectionName.textContent = order.collectionName;
        activeSpotName.textContent = order.spotName;
        activeStatus.textContent = statusLabels[order.status] || order.status;
        activePickupTime.textContent = order.pickupTime + ' AM';
    }
    
    // Render order history
    function renderHistory(history) {
        let html = '';
        
        history.forEach(function(order) {
            html += '<div class="history-card rounded-xl p-5">';
            html += '  <div class="flex items-start justify-between mb-3">';
            html += '    <div>';
            html += '      <div class="text-base font-black mb-1">' + order.collectionName + '</div>';
            html += '      <div class="text-xs text-gray-500">' + order.spotName + '</div>';
            html += '    </div>';
            html += '    <div class="status-badge status-completed">';
            html += '      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">';
            html += '        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>';
            html += '      </svg>';
            html += '      <span>Completed</span>';
            html += '    </div>';
            html += '  </div>';
            html += '  <div class="flex items-center gap-4 text-xs text-gray-400">';
            html += '    <div class="flex items-center gap-1">';
            html += '      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">';
            html += '        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>';
            html += '      </svg>';
            html += '      <span>' + order.dateFormatted + '</span>';
            html += '    </div>';
            html += '    <div class="flex items-center gap-1">';
            html += '      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">';
            html += '        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>';
            html += '      </svg>';
            html += '      <span>' + order.pickupTime + ' 픽업</span>';
            html += '    </div>';
            html += '  </div>';
            html += '</div>';
        });
        
        historyContainer.innerHTML = html;
    }
    
    // Initialize
    init();
    
})();
