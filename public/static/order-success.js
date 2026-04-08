(function() {
    'use strict';
    
    const orderId = localStorage.getItem('currentOrderId');
    
    let currentStatus = 'crafting';
    let pollInterval;
    let spotData = null;
    let orderData = null;
    
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
    
    // Pickup details modal
    const showPickupDetailsBtn = document.getElementById('showPickupDetailsBtn');
    const pickupModal = document.getElementById('pickupModal');
    const closeModalBtn = document.getElementById('closeModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    
    // Admin controls
    const adminPanel = document.getElementById('adminPanel');
    const adminStatus = document.getElementById('adminStatus');
    const nextStatusBtn = document.getElementById('nextStatusBtn');
    
    // Initialize
    async function init() {
        console.log('🚀 Order Success Page Initialized');
        console.log('Order ID:', orderId);
        
        // Load order data first to get collection info
        if (orderId) {
            await loadOrderData();
        }
        
        // Set order meta info
        if (orderData) {
            // Set menu name from collection data
            if (orderData.collection) {
                const collectionName = orderData.collection.title || orderData.collection.name;
                const collectionNumber = orderData.collection.theme_no || '';
                menuName.textContent = collectionNumber ? `${collectionNumber}. ${collectionName}` : collectionName;
                console.log('✓ Menu name set:', menuName.textContent);
            }
            
            // Set spot name
            if (orderData.spot) {
                spotName.textContent = orderData.spot.name;
                console.log('✓ Spot name set:', spotName.textContent);
            }
            
            // Set pickup time (11:30 AM default)
            pickupTimeEl.textContent = '11:30:00 AM';
            console.log('✓ Pickup time set');
            
            // Set pickup info if available
            if (orderData.pickupCode) {
                pickupCode.textContent = orderData.pickupCode;
            }
            if (orderData.qrCode) {
                qrCodeDisplay.textContent = 'QR: ' + orderData.qrCode;
            }
            if (orderData.pickupLocation) {
                pickupLocation.textContent = orderData.pickupLocation;
            }
            
            // Set initial status
            if (orderData.status) {
                updateStatus(orderData.status);
            }
        } else {
            console.warn('⚠️ No order data found');
        }
        
        // Pickup details modal setup
        setupPickupDetailsModal();
        
        // Start polling for status updates
        if (orderId) {
            startPolling();
        }
        
        // Admin controls
        setupAdminControls();
    }
    
    // Load order data from API
    async function loadOrderData() {
        try {
            console.log('📦 Loading order data...');
            const response = await fetch('/api/orders/' + orderId);
            const data = await response.json();
            
            if (data.order) {
                orderData = data.order;
                console.log('✓ Order data loaded:', orderData);
            } else {
                console.error('❌ No order in response:', data);
            }
        } catch (error) {
            console.error('❌ Failed to load order data:', error);
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
            'position: fixed; inset: 0; background: #98FFD8; z-index: 9999; ' +
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
    
    // Pickup details modal setup
    function setupPickupDetailsModal() {
        if (!showPickupDetailsBtn || !pickupModal || !closeModalBtn || !modalBackdrop) {
            return;
        }
        
        showPickupDetailsBtn.addEventListener('click', function() {
            if (!orderData || !orderData.spot || !orderData.spot.pickupDetails) {
                alert('픽업 위치 정보를 불러올 수 없습니다.');
                return;
            }
            
            // Populate modal with spot-specific data
            const modalImage = document.getElementById('modalPickupImage');
            const modalDescription = document.getElementById('modalPickupDescription');
            const modalGuide = document.getElementById('modalPickupGuide');
            const modalSpotName = document.getElementById('modalSpotName');
            
            if (modalSpotName) modalSpotName.textContent = orderData.spot.name;
            if (modalImage) modalImage.src = orderData.spot.pickupDetails.image;
            if (modalDescription) modalDescription.textContent = orderData.spot.pickupDetails.description;
            if (modalGuide) modalGuide.textContent = orderData.spot.pickupDetails.guide;
            
            // Show modal
            pickupModal.classList.add('open');
            modalBackdrop.classList.add('open');
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
        });
        
        function closeModal() {
            pickupModal.classList.remove('open');
            modalBackdrop.classList.remove('open');
            document.body.style.overflow = '';
        }
        
        closeModalBtn.addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', closeModal);
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
