(function() {
    'use strict';
    
    const spotsContainer = document.getElementById('spotsContainer');
    
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
            showError('거점 정보를 불러오는데 실패했습니다.');
        }
    }
    
    // Render spot cards (Mobile-First Design)
    function renderSpots(spots) {
        spotsContainer.innerHTML = spots.map(spot => `
            <div class="spot-card rounded-3xl p-6 cursor-pointer" 
                 data-spot-id="${spot.id}"
                 role="button"
                 tabindex="0"
                 aria-label="${spot.name} 선택">
                
                <!-- Status & Time Row -->
                <div class="flex items-center justify-between mb-5">
                    <div class="status-badge neo-mint">
                        <span class="status-dot"></span>
                        <span>OPEN NOW</span>
                    </div>
                    <div class="text-xs text-gray-500 font-semibold">
                        ${spot.orderDeadline} 마감 / ${spot.pickupTime} 픽업
                    </div>
                </div>
                
                <!-- Spot Name & District -->
                <div class="mb-4">
                    <div class="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                        ${spot.district}
                    </div>
                    <h2 class="text-2xl font-black leading-tight mb-2">
                        ${spot.name}
                    </h2>
                    <p class="text-sm text-gray-400 leading-relaxed">
                        ${spot.address}
                    </p>
                </div>
                
                <!-- Action Hint -->
                <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                    <span class="text-xs text-gray-600">탭하여 선택</span>
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                    </svg>
                </div>
                
            </div>
        `).join('');
        
        // Add touch handlers
        attachTouchHandlers();
    }
    
    // Attach touch-optimized handlers
    function attachTouchHandlers() {
        const cards = spotsContainer.querySelectorAll('.spot-card');
        
        cards.forEach(card => {
            // Touch events for mobile
            card.addEventListener('touchstart', handleTouchStart, { passive: true });
            card.addEventListener('touchend', handleTouchEnd, { passive: false });
            
            // Click fallback for desktop
            card.addEventListener('click', handleSpotSelection);
            
            // Keyboard accessibility
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSpotSelection.call(card, e);
                }
            });
        });
    }
    
    let touchStartTime = 0;
    
    function handleTouchStart(event) {
        touchStartTime = Date.now();
        this.style.transform = 'scale(0.98)';
    }
    
    function handleTouchEnd(event) {
        const touchDuration = Date.now() - touchStartTime;
        
        // Only trigger if touch was quick (not a scroll)
        if (touchDuration < 200) {
            event.preventDefault();
            handleSpotSelection.call(this, event);
        } else {
            this.style.transform = '';
        }
    }
    
    // Handle spot selection with haptic feedback
    function handleSpotSelection(event) {
        const spotId = this.dataset.spotId;
        
        if (!spotId) return;
        
        // Add selected animation
        this.classList.add('selected');
        
        // Haptic feedback (if available)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Save to localStorage
        localStorage.setItem('selectedSpot', spotId);
        localStorage.setItem('selectedSpotTimestamp', Date.now().toString());
        
        // Show feedback
        this.style.borderColor = '#00FF85';
        this.style.background = 'rgba(0, 255, 133, 0.08)';
        
        // Navigate after animation
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 400);
    }
    
    // Show error message (Mobile-optimized)
    function showError(message) {
        spotsContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <p class="text-gray-400 mb-6 px-4">${message}</p>
                <button onclick="location.reload()" 
                        class="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-full transition text-sm font-semibold">
                    다시 시도
                </button>
            </div>
        `;
    }
    
    // Initialize
    loadSpots();
    
})();
