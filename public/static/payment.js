// Toss Payments SDK v2 Integration
// Reference: https://docs.tosspayments.com/sdk/v2/js

// Wait for TossPayments SDK to load
function waitForTossPayments() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof TossPayments !== 'undefined') {
            resolve();
            return;
        }
        
        // Wait up to 10 seconds
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds (100 * 100ms)
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (typeof TossPayments !== 'undefined') {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('Toss Payments SDK 로드 시간 초과'));
            }
        }, 100);
    });
}

// Initialize payment on page load
async function initializePayment() {
    try {
        // Wait for SDK to load first
        await waitForTossPayments();
        console.log('✓ Toss Payments SDK loaded successfully');
    } catch (error) {
        console.error('SDK loading failed:', error);
        alert('결제 시스템을 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        return;
    }
    // Get order info from URL params
    const params = new URLSearchParams(window.location.search);
    const collectionId = params.get('collectionId');
    const spotId = params.get('spotId');
    
    if (!collectionId || !spotId) {
        alert('주문 정보가 없습니다.');
        window.location.href = '/dashboard';
        return;
    }
    
    // Get auth session
    const session = JSON.parse(localStorage.getItem('urban_fresh_session') || 'null');
    if (!session || !session.access_token) {
        alert('로그인이 필요합니다.');
        localStorage.setItem('redirect_after_login', window.location.href);
        window.location.href = '/login';
        return;
    }
    
    try {
        // Create order first (without payment)
        const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + session.access_token
            },
            body: JSON.stringify({
                spotId,
                collectionId
            })
        });
        
        const orderData = await orderResponse.json();
        
        if (!orderData.order) {
            throw new Error('주문 생성 실패: ' + JSON.stringify(orderData));
        }
        
        const orderId = orderData.order.id;
        const amount = 9900; // Fixed price
        const orderName = 'Urban Fresh Collection';
        
        // Request payment info
        const paymentResponse = await fetch('/api/payment/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + session.access_token
            },
            body: JSON.stringify({
                orderId,
                amount,
                orderName
            })
        });
        
        const paymentInfo = await paymentResponse.json();
        
        if (!paymentInfo.clientKey) {
            throw new Error('결제 정보를 가져오지 못했습니다: ' + JSON.stringify(paymentInfo));
        }
        
        console.log('Payment initialized:', {
            orderId,
            amount,
            customerName: paymentInfo.customerName
        });
        
        // Load Toss Payments SDK v2
        // Check if SDK is loaded
        if (typeof TossPayments === 'undefined') {
            throw new Error('Toss Payments SDK가 로드되지 않았습니다. 페이지를 새로고침하세요.');
        }
        
        console.log('TossPayments SDK loaded:', typeof TossPayments);
        
        // Initialize Toss Payments
        const tossPayments = TossPayments(paymentInfo.clientKey);
        console.log('TossPayments initialized');
        
        // Initialize payment window (결제창)
        const payment = tossPayments.payment();
        console.log('Payment window initialized');
        
        // Request payment using Payment Window API
        await payment.requestPayment({
            method: 'CARD', // 카드 결제
            amount: {
                currency: 'KRW',
                value: paymentInfo.amount
            },
            orderId: paymentInfo.orderId,
            orderName: paymentInfo.orderName,
            successUrl: window.location.origin + '/payment-success',
            failUrl: window.location.origin + '/payment-fail',
            customerEmail: paymentInfo.customerEmail || 'customer@example.com',
            customerName: paymentInfo.customerName || '고객'
        });
        
    } catch (error) {
        console.error('Payment initialization failed:', error);
        alert('결제 초기화에 실패했습니다: ' + error.message);
        window.location.href = '/dashboard';
    }
}

// Run on page load
initializePayment();
