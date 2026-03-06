// Urban Fresh - Order Success with Real-time Status Updates
// Simulates Supabase real-time subscription

(function() {
    'use strict';
    
    const orderId = localStorage.getItem('currentOrderId');
    const confirmedCollectionId = localStorage.getItem('confirmedCollection');
    
    if (!orderId) {
        console.warn('No order ID found');
    }
    
    const collectionNames = {
        'sharp': '01. Sharp',
        'vital': '02. Vital',
        'calm': '03. Calm'
    };
    
    const collectionNumbers = {
        'sharp': '01',
        'vital': '02',
        'calm': '03'
    };
    
    let currentStatus = 'crafting';
    let pollInterval;
    let spotData = null;
    
    // DOM Elements
    const menuName = document.getElementById('menuName');
    const spotName = document.getElementById('spotName');
    const pickupTimeEl = document.getElementById('pickupTime');
    const statusDots = {
        crafting: document.getElementById('statusCrafting'),
        onTheWay: document.getElementById('statusOnTheWay'),
        arrived: document.getElementById('statusArrived')
    };
    const progressBar = document.getElementById('progressBar');
    const pickupPassCard = document.getElementById('pickupPassCard');
    const pickupCode = document.getElementById('pickupCode');
    const qrCodeDisplay = document.getElementById('qrCodeDisplay');
    const pickupLocation = document.getElementById('pickupLocation');
    
    // Admin controls
    const adminPanel = document.getElementById('adminPanel');
    const adminStatus = document.getElementById('adminStatus');
    const nextStatusBtn = document.getElementById('nextStatusBtn');
    
    // Initialize
    async function init() {
        // Load spot data first
        await loadSpotData();
        
        // Set order meta info
        if (confirmedCollectionId) {
            menuName.textContent = collectionNames[confirmedCollectionId] || '--';
        }
        
        if (spotData) {
            spotName.textContent = spotData.name;
            pickupTimeEl.textContent = spotData.pickupTime + ' AM';
        }
        
        // Start polling for status updates (simulate real-time)
        if (orderId) {
            startPolling();
        }
        
        // Admin controls
        setupAdminControls();
        
        // Initial status update
        updateStatus('crafting');
    }
    
    // Load spot data
    async function loadSpotData() {
        const selectedSpotId = localStorage.getItem('selectedSpot');
        if (!selectedSpotId) return;
        
        try {
            const response = await fetch('/api/spots');
            const data = await response.json();
            
            if (data.spots) {
                spotData = data.spots.find(function(s) {
                    return s.id === selectedSpotId;
                });
            }
        } catch (error) {
            console.error('Failed to load spot data:', error);
        }
    }
    
    // Simulate real-time subscription by polling
    function startPolling() {
        // Poll every 2 seconds
        pollInterval = setInterval(async function() {
            try {
                const response = await fetch('/api/orders/' + orderId);
                const data = await response.json();
                
                if (data.order && data.order.status !== currentStatus) {
                    updateStatus(data.order.status);
                    
                    // Update pickup info
                    if (data.order.pickupCode) {
                        pickupCode.textContent = data.order.pickupCode;
                    }
                    if (data.order.qrCode) {
                        qrCodeDisplay.textContent = 'QR: ' + data.order.qrCode;
                    }
                    if (data.order.pickupLocation) {
                        pickupLocation.textContent = data.order.pickupLocation;
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000);
    }
    
    // Update status UI
    function updateStatus(newStatus) {
        currentStatus = newStatus;
        adminStatus.textContent = newStatus.toUpperCase();
        
        // Reset all dots
        Object.values(statusDots).forEach(function(dot) {
            dot.classList.remove('active');
        });
        
        // Update progress bar and activate dots
        if (newStatus === 'crafting') {
            statusDots.crafting.classList.add('active');
            progressBar.style.width = '33.33%';
        } else if (newStatus === 'on_the_way') {
            statusDots.crafting.classList.add('active');
            statusDots.onTheWay.classList.add('active');
            progressBar.style.width = '66.66%';
        } else if (newStatus === 'arrived') {
            statusDots.crafting.classList.add('active');
            statusDots.onTheWay.classList.add('active');
            statusDots.arrived.classList.add('active');
            progressBar.style.width = '100%';
            
            // Show pickup pass with flash animation
            showPickupPass();
            showFlashAnimation();
        }
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([50, 100, 50]);
        }
    }
    
    // Show pickup pass
    function showPickupPass() {
        pickupPassCard.style.display = 'block';
        pickupPassCard.style.animation = 'slideInUp 0.5s ease-out';
    }
    
    // Flash animation on arrival
    function showFlashAnimation() {
        const flash = document.createElement('div');
        flash.style.cssText = 
            'position: fixed; inset: 0; background: #00FF85; z-index: 9999; ' +
            'opacity: 0; pointer-events: none; animation: flash 0.6s ease-out;';
        
        document.body.appendChild(flash);
        
        setTimeout(function() {
            document.body.removeChild(flash);
        }, 600);
        
        // Stronger haptic
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100]);
        }
    }
    
    // Admin controls setup
    function setupAdminControls() {
        nextStatusBtn.addEventListener('click', async function() {
            if (!orderId) {
                alert('Order ID not found. Please create an order first.');
                return;
            }
            
            let nextStatus;
            if (currentStatus === 'crafting') {
                nextStatus = 'on_the_way';
            } else if (currentStatus === 'on_the_way') {
                nextStatus = 'arrived';
            } else {
                alert('Already at final status');
                return;
            }
            
            try {
                const response = await fetch('/api/orders/' + orderId + '/status', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: nextStatus })
                });
                
                const data = await response.json();
                
                if (data.order) {
                    updateStatus(data.order.status);
                }
            } catch (error) {
                console.error('Failed to update status:', error);
                alert('Failed to update status');
            }
        });
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    });
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = 
        '@keyframes flash {' +
        '  0% { opacity: 0; }' +
        '  50% { opacity: 0.4; }' +
        '  100% { opacity: 0; }' +
        '}' +
        '@keyframes slideInUp {' +
        '  from { opacity: 0; transform: translateY(30px); }' +
        '  to { opacity: 1; transform: translateY(0); }' +
        '}';
    document.head.appendChild(style);
    
    // Initialize
    init();
    
})();
