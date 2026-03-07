// Toss Payments Widget Integration (SDK v2)
// Reference: https://docs.tosspayments.com/sdk/v2/js#토스페이먼츠-초기화하기

// Initialize payment on page load
async function initializePayment() {
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
        const tossPayments = TossPayments(paymentInfo.clientKey);
        
        // Request payment using SDK v2 method
        await tossPayments.requestPayment({
            method: 'CARD', // 카드 결제
            amount: {
                currency: 'KRW',
                value: paymentInfo.amount
            },
            orderId: paymentInfo.orderId,
            orderName: paymentInfo.orderName,
            successUrl: window.location.origin + '/payment-success',
            failUrl: window.location.origin + '/payment-fail',
            customerEmail: paymentInfo.customerEmail,
            customerName: paymentInfo.customerName
        });
        
    } catch (error) {
        console.error('Payment initialization failed:', error);
        alert('결제 초기화에 실패했습니다: ' + error.message);
        window.location.href = '/dashboard';
    }
}

// Run on page load
initializePayment();
