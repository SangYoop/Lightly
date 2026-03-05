// Spot Selector Client-side Logic
// Handles fetching spots and user selection

(function() {
    'use strict';
    
    const spotsContainer = document.getElementById('spotsContainer');
    
    // Fetch spots from API
    async function loadSpots() {
        try {
            const response = await fetch('/api/spots');
            const data = await response.json();
            
            if (data.spots && data.spots.length > 0) {
                renderSpots(data.spots);
            } else {
                showError('현재 이용 가능한 거점이 없습니다.');
            }
        } catch (error) {
            console.error('Failed to load spots:', error);
            showError('거점 정보를 불러오는데 실패했습니다.');
        }
    }
    
    // Render spot cards
    function renderSpots(spots) {
        spotsContainer.innerHTML = spots.map(spot => `
            <div class="spot-card rounded-2xl p-8 cursor-pointer" 
                 data-spot-id="${spot.id}"
                 role="button"
                 tabindex="0"
                 aria-label="${spot.name} 선택">
                <div class="flex justify-between items-start mb-6">
                    <div class="status-badge text-sm font-semibold neo-mint">
                        <span class="status-dot"></span>
                        ${spot.status === 'open' ? 'OPEN' : 'CLOSED'}
                    </div>
                    <div class="text-xs text-gray-500">
                        ~${spot.availableUntil}
                    </div>
                </div>
                
                <h2 class="text-2xl font-bold mb-3">${spot.name}</h2>
                <p class="text-gray-400 text-sm mb-4">${spot.address}</p>
                
                <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                    <span class="text-xs text-gray-500">거점 코드</span>
                    <span class="text-xs font-mono neo-mint">${spot.id.toUpperCase()}</span>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        attachClickHandlers();
    }
    
    // Attach click handlers to spot cards
    function attachClickHandlers() {
        const cards = spotsContainer.querySelectorAll('.spot-card');
        
        cards.forEach(card => {
            card.addEventListener('click', handleSpotSelection);
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSpotSelection.call(card, e);
                }
            });
        });
    }
    
    // Handle spot selection
    function handleSpotSelection(event) {
        const spotId = this.dataset.spotId;
        
        if (!spotId) return;
        
        // Add visual feedback
        this.style.transform = 'scale(0.98)';
        this.style.opacity = '0.7';
        
        // Save to localStorage
        localStorage.setItem('selectedSpot', spotId);
        localStorage.setItem('selectedSpotTimestamp', Date.now().toString());
        
        // Navigate to dashboard after brief delay
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 300);
    }
    
    // Show error message
    function showError(message) {
        spotsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-red-400 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-gray-400">${message}</p>
                <button onclick="location.reload()" 
                        class="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
                    다시 시도
                </button>
            </div>
        `;
    }
    
    // Initialize on page load
    loadSpots();
    
})();
