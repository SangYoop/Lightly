import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Data structure for spots (will be moved to Supabase later)
const spotsData = [
  {
    id: 'dreamplus-gangnam',
    name: '드림플러스 강남',
    address: '서울특별시 강남구 테헤란로 311',
    district: '강남',
    status: 'open',
    availableUntil: '18:00',
    orderDeadline: '2026-03-05T18:00:00+09:00',
    coordinates: { lat: 37.5012, lng: 127.0396 }
  },
  {
    id: 'kstc-yeoksam',
    name: '한국과학기술회관 역삼',
    address: '서울특별시 강남구 테헤란로 7길 22',
    district: '역삼',
    status: 'open',
    availableUntil: '18:00',
    orderDeadline: '2026-03-05T18:00:00+09:00',
    coordinates: { lat: 37.4986, lng: 127.0329 }
  }
]

// Collections data structure
const collectionsData = [
  {
    id: 'sharp',
    number: '01',
    name: 'Sharp',
    tagline: 'Focused Energy',
    description: '집중력과 에너지가 필요한 오후를 위한 선택',
    unitsLeft: 12,
    price: 18900,
    image: '/static/images/sharp.jpg',
    ingredients: ['퀴노아', '그릴드 치킨', '아보카도', '방울토마토', '레몬 드레싱'],
    nutrition: {
      calories: 520,
      protein: 42,
      carbs: 48,
      fat: 18
    },
    tags: ['고단백', '저당']
  },
  {
    id: 'vital',
    number: '02',
    name: 'Vital',
    tagline: 'Fresh Balance',
    description: '신선한 재료로 완성한 완벽한 영양 밸런스',
    unitsLeft: 8,
    price: 16900,
    image: '/static/images/vital.jpg',
    ingredients: ['케일', '연어', '고구마', '브로콜리', '참깨 드레싱'],
    nutrition: {
      calories: 480,
      protein: 38,
      carbs: 52,
      fat: 14
    },
    tags: ['오메가3', '항산화']
  },
  {
    id: 'calm',
    number: '03',
    name: 'Calm',
    tagline: 'Gentle Comfort',
    description: '부드럽고 편안한 한 끼, 스트레스 없는 식사',
    unitsLeft: 15,
    price: 15900,
    image: '/static/images/calm.jpg',
    ingredients: ['현미', '두부', '버섯', '시금치', '된장 드레싱'],
    nutrition: {
      calories: 420,
      protein: 28,
      carbs: 58,
      fat: 12
    },
    tags: ['저칼로리', '식이섬유']
  }
]

// In-memory order storage (simulate database)
const orders = new Map()

// API: Get available spots
app.get('/api/spots', (c) => {
  return c.json({ spots: spotsData })
})

// API: Get collections by spot
app.get('/api/collections/:spotId', (c) => {
  const spotId = c.req.param('spotId')
  const spot = spotsData.find(s => s.id === spotId)
  
  if (!spot) {
    return c.json({ error: 'Spot not found' }, 404)
  }
  
  return c.json({ 
    spot,
    collections: collectionsData,
    orderDeadline: spot.orderDeadline
  })
})

// API: Create order (simulate)
app.post('/api/orders', async (c) => {
  const body = await c.req.json()
  const orderId = 'URB-' + Date.now().toString(36).toUpperCase()
  
  const order = {
    id: orderId,
    spotId: body.spotId || 'dreamplus-gangnam',
    collectionId: body.collectionId,
    status: 'crafting',
    pickupCode: Math.floor(1000 + Math.random() * 9000).toString(),
    qrCode: orderId,
    createdAt: new Date().toISOString(),
    pickupLocation: 'B1층 Urban Fresh Zone'
  }
  
  orders.set(orderId, order)
  
  return c.json({ order })
})

// API: Get order status
app.get('/api/orders/:orderId', (c) => {
  const orderId = c.req.param('orderId')
  const order = orders.get(orderId)
  
  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }
  
  return c.json({ order })
})

// API: Update order status (Admin)
app.patch('/api/orders/:orderId/status', async (c) => {
  const orderId = c.req.param('orderId')
  const order = orders.get(orderId)
  
  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }
  
  const body = await c.req.json()
  const newStatus = body.status
  
  if (!['crafting', 'on_the_way', 'arrived'].includes(newStatus)) {
    return c.json({ error: 'Invalid status' }, 400)
  }
  
  order.status = newStatus
  order.updatedAt = new Date().toISOString()
  
  orders.set(orderId, order)
  
  return c.json({ order })
})

// Main page: Spot Selector (Mobile-First)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="theme-color" content="#1A1A1B">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <title>Urban Fresh</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-tap-highlight-color: transparent;
            }
            
            html, body {
                height: 100%;
                overflow-x: hidden;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #1A1A1B;
                color: #F9FAFB;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            .neo-mint {
                color: #00FF85;
            }
            
            .neo-mint-bg {
                background: #00FF85;
            }
            
            /* Bold Header Typography */
            .main-title {
                font-size: clamp(3rem, 12vw, 5rem);
                font-weight: 900;
                line-height: 0.9;
                letter-spacing: -0.04em;
            }
            
            .subtitle {
                font-size: clamp(0.875rem, 3.5vw, 1rem);
            }
            
            /* Mobile-First Spot Card */
            .spot-card {
                background: rgba(249, 250, 251, 0.04);
                border: 2px solid rgba(249, 250, 251, 0.1);
                transition: all 0.2s ease-out;
                touch-action: manipulation;
                position: relative;
                overflow: hidden;
            }
            
            .spot-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(0, 255, 133, 0.1), transparent);
                transition: left 0.5s;
            }
            
            .spot-card:active {
                transform: scale(0.98);
                border-color: #00FF85;
            }
            
            .spot-card.selected::before {
                left: 100%;
            }
            
            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.5px;
            }
            
            .status-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #00FF85;
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.6;
                    transform: scale(1.1);
                }
            }
            
            /* Loading spinner */
            .spinner {
                border: 3px solid rgba(249, 250, 251, 0.1);
                border-top-color: #00FF85;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                animation: spin 0.8s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* Safe area for notch devices */
            .safe-top {
                padding-top: env(safe-area-inset-top);
            }
            
            .safe-bottom {
                padding-bottom: env(safe-area-inset-bottom);
            }
            
            /* Backdrop blur effect */
            .backdrop-blur {
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
        </style>
    </head>
    <body>
        <!-- Mobile-First Layout -->
        <div class="min-h-screen flex flex-col safe-top safe-bottom">
            
            <!-- Header - Bold & Impactful -->
            <header class="px-6 pt-12 pb-8">
                <div class="flex items-center justify-between mb-8">
                    <div class="text-xs text-gray-500 tracking-widest uppercase font-semibold">Step 1 of 3</div>
                    <div class="text-xs text-gray-500 font-medium">Urban Fresh</div>
                </div>
                <h1 class="main-title mb-4">
                    Pick<br>Your<br><span class="neo-mint">Spot</span>
                </h1>
                <p class="subtitle text-gray-400 font-medium">
                    픽업할 오피스 거점을 선택하세요
                </p>
            </header>
            
            <!-- Spots List - Full Screen Mobile -->
            <main class="flex-1 px-6 pb-8">
                <div class="space-y-5" id="spotsContainer">
                    <!-- Loading state -->
                    <div class="flex flex-col items-center justify-center py-16">
                        <div class="spinner"></div>
                        <p class="mt-4 text-sm text-gray-500">거점 불러오는 중...</p>
                    </div>
                </div>
            </main>
            
            <!-- Bottom Navigation Hint -->
            <footer class="px-6 py-6 border-t border-gray-800/50">
                <div class="flex items-center justify-center gap-2.5">
                    <div class="w-2 h-2 rounded-full neo-mint-bg"></div>
                    <div class="w-2 h-2 rounded-full bg-gray-700"></div>
                    <div class="w-2 h-2 rounded-full bg-gray-700"></div>
                </div>
            </footer>
            
        </div>
        
        <script src="/static/spot-selector.js"></script>
    </body>
    </html>
  `)
})

// Dashboard page (Collection Grid - Mobile-First)
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="theme-color" content="#1A1A1B">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <title>Urban Fresh - Collections</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-tap-highlight-color: transparent;
            }
            
            html, body {
                height: 100%;
                overflow-x: hidden;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #1A1A1B;
                color: #F9FAFB;
                -webkit-font-smoothing: antialiased;
                padding-bottom: 100px; /* Space for floating button */
            }
            
            .neo-mint {
                color: #00FF85;
            }
            
            .neo-mint-bg {
                background: #00FF85;
            }
            
            /* Collection Card */
            .collection-card {
                background: rgba(249, 250, 251, 0.04);
                border: 2px solid rgba(249, 250, 251, 0.08);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                touch-action: manipulation;
            }
            
            .collection-card:active {
                transform: scale(0.98);
                border-color: #00FF85;
            }
            
            /* Image Placeholder with Gradient */
            .image-placeholder {
                background: linear-gradient(135deg, rgba(0, 255, 133, 0.1), rgba(0, 255, 133, 0.02));
                position: relative;
                overflow: hidden;
            }
            
            .image-placeholder::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 60%;
                height: 60%;
                background: radial-gradient(circle, rgba(0, 255, 133, 0.2), transparent);
            }
            
            /* Timer Pulse Animation */
            .timer-pulse {
                animation: pulse-border 2s ease-in-out infinite;
            }
            
            @keyframes pulse-border {
                0%, 100% {
                    border-color: rgba(0, 255, 133, 0.3);
                }
                50% {
                    border-color: rgba(0, 255, 133, 0.6);
                }
            }
            
            /* Floating Button */
            .floating-button {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: calc(100% - 48px);
                max-width: 400px;
                z-index: 50;
                box-shadow: 0 20px 60px rgba(0, 255, 133, 0.3);
            }
            
            /* Drawer */
            .drawer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #1A1A1B;
                border-top-left-radius: 24px;
                border-top-right-radius: 24px;
                transform: translateY(100%);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 100;
                max-height: 85vh;
                overflow-y: auto;
            }
            
            .drawer.open {
                transform: translateY(0);
            }
            
            .drawer-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
                z-index: 99;
            }
            
            .drawer-backdrop.open {
                opacity: 1;
                pointer-events: auto;
            }
            
            /* Safe area */
            .safe-bottom {
                padding-bottom: env(safe-area-inset-bottom);
            }
        </style>
    </head>
    <body>
        <!-- Header with Spot & Timer -->
        <header class="sticky top-0 z-40 bg-gradient-to-b from-[#1A1A1B] to-transparent backdrop-blur-sm">
            <div class="px-6 pt-8 pb-4">
                <div class="flex items-start justify-between">
                    <!-- Selected Spot -->
                    <div>
                        <div class="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Pickup at</div>
                        <h2 id="spotName" class="text-lg font-black">로딩 중...</h2>
                    </div>
                    
                    <!-- Real-time Timer -->
                    <div class="text-right timer-pulse border-2 border-[#00FF85]/30 rounded-xl px-3 py-2">
                        <div class="text-xs text-gray-500 mb-0.5 font-medium">마감까지</div>
                        <div id="countdown" class="text-sm font-black neo-mint">--:--:--</div>
                    </div>
                </div>
            </div>
        </header>
        
        <!-- Collections Grid -->
        <main class="px-6 pt-4 pb-8">
            <div class="mb-6">
                <div class="text-xs text-gray-500 tracking-widest uppercase font-semibold mb-3">Step 2 of 3</div>
                <h1 class="text-4xl font-black mb-2 leading-tight">
                    The<br><span class="neo-mint">Collection</span>
                </h1>
                <p class="text-sm text-gray-400">오늘의 신선한 메뉴를 선택하세요</p>
            </div>
            
            <div class="space-y-5" id="collectionsContainer">
                <!-- Loading -->
                <div class="text-center py-12">
                    <div class="inline-block w-8 h-8 border-4 border-gray-800 border-t-[#00FF85] rounded-full animate-spin"></div>
                    <p class="mt-4 text-sm text-gray-500">메뉴 불러오는 중...</p>
                </div>
            </div>
        </main>
        
        <!-- Floating Button (Hidden initially) -->
        <button id="reviewButton" class="floating-button bg-[#00FF85] text-[#1A1A1B] py-4 rounded-full font-black text-base hidden">
            Review Your Collection
        </button>
        
        <!-- Drawer (Slide-up Detail View) -->
        <div class="drawer-backdrop" id="drawerBackdrop"></div>
        <div class="drawer safe-bottom" id="drawer">
            <div class="sticky top-0 bg-[#1A1A1B] z-10 px-6 pt-6 pb-4">
                <div class="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6"></div>
                <button id="closeDrawer" class="text-gray-400 text-sm font-medium">← 닫기</button>
            </div>
            <div id="drawerContent" class="px-6 pb-8">
                <!-- Dynamic content -->
            </div>
        </div>
        
        <script src="/static/dashboard.js"></script>
    </body>
    </html>
  `)
})

// Order Success Page - The Lifestyle Report
app.get('/order-success', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="theme-color" content="#1A1A1B">
        <title>Urban Fresh - Order Confirmed</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #1A1A1B;
                color: #F9FAFB;
                min-height: 100vh;
                overflow-x: hidden;
            }
            
            .neo-mint {
                color: #00FF85;
            }
            
            /* Fade In Animation */
            .fade-in-up {
                animation: fadeInUp 1s ease-out forwards;
                opacity: 0;
            }
            
            .fade-in-up-delay-1 {
                animation: fadeInUp 1s ease-out 0.3s forwards;
                opacity: 0;
            }
            
            .fade-in-up-delay-2 {
                animation: fadeInUp 1s ease-out 0.6s forwards;
                opacity: 0;
            }
            
            .fade-in-up-delay-3 {
                animation: fadeInUp 1s ease-out 0.9s forwards;
                opacity: 0;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Pulse Tracker */
            .pulse-line {
                position: relative;
                height: 2px;
                background: rgba(249, 250, 251, 0.1);
            }
            
            .pulse-progress {
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                background: #00FF85;
                width: 33.33%;
                box-shadow: 0 0 20px rgba(0, 255, 133, 0.5);
            }
            
            .pulse-wave {
                animation: pulseWave 2s ease-in-out infinite;
            }
            
            @keyframes pulseWave {
                0%, 100% {
                    box-shadow: 0 0 20px rgba(0, 255, 133, 0.5);
                }
                50% {
                    box-shadow: 0 0 40px rgba(0, 255, 133, 0.8);
                }
            }
            
            .pulse-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #1A1A1B;
                border: 2px solid rgba(249, 250, 251, 0.2);
                transition: all 0.3s;
            }
            
            .pulse-dot.active {
                background: #00FF85;
                border-color: #00FF85;
                box-shadow: 0 0 20px rgba(0, 255, 133, 0.6);
                animation: pulseDot 2s ease-in-out infinite;
            }
            
            @keyframes pulseDot {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.2);
                }
            }
            
            /* Button Line Art Style */
            .btn-line-art {
                border: 1.5px solid rgba(249, 250, 251, 0.2);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .btn-line-art:active {
                border-color: #00FF85;
                background: rgba(0, 255, 133, 0.05);
                transform: scale(0.98);
            }
        </style>
    </head>
    <body>
        <div class="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            
            <!-- Main Content - Magazine Layout -->
            <div class="max-w-md w-full text-center">
                
                <!-- Headline -->
                <div class="fade-in-up mb-8">
                    <h1 class="text-6xl font-black mb-6 leading-tight tracking-tighter">
                        The<br>Urban<br><span class="neo-mint">Standard.</span>
                    </h1>
                </div>
                
                <!-- Sub-text -->
                <div class="fade-in-up-delay-1 mb-12">
                    <p class="text-base text-gray-400 font-light leading-relaxed">
                        바쁜 도심 속에서 찾아낸<br>
                        오직 당신만을 위한 웰니스로<br>
                        곧 찾아갈게요.
                    </p>
                </div>
                
                <!-- Pulse Tracker -->
                <div class="fade-in-up-delay-2 mb-16">
                    <div class="text-xs text-gray-600 uppercase tracking-widest mb-6 font-semibold">
                        Current Status
                    </div>
                    
                    <!-- Progress Line -->
                    <div class="pulse-line mb-6">
                        <div class="pulse-progress pulse-wave" id="progressBar" style="width: 33.33%;"></div>
                    </div>
                    
                    <!-- Status Dots -->
                    <div class="flex justify-between items-center relative">
                        <div class="flex-1 text-center">
                            <div class="pulse-dot active mx-auto mb-2" id="statusCrafting"></div>
                            <div class="text-xs font-semibold neo-mint">Crafting</div>
                        </div>
                        <div class="flex-1 text-center">
                            <div class="pulse-dot mx-auto mb-2" id="statusOnTheWay"></div>
                            <div class="text-xs text-gray-600">On the Way</div>
                        </div>
                        <div class="flex-1 text-center">
                            <div class="pulse-dot mx-auto mb-2" id="statusArrived"></div>
                            <div class="text-xs text-gray-600">Arrived</div>
                        </div>
                    </div>
                </div>
                
                <!-- Digital Pickup Pass (Hidden initially) -->
                <div id="pickupPassCard" class="mb-12" style="display: none;">
                    <div class="bg-gradient-to-br from-gray-900 to-black border-2 border-[#00FF85] rounded-3xl p-8 text-center">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-4 font-semibold">
                            Digital Pickup Pass
                        </div>
                        <div class="mb-6">
                            <div class="text-6xl font-black neo-mint mb-2" id="pickupCode">----</div>
                            <div class="text-sm text-gray-400">픽업 코드</div>
                        </div>
                        <div class="mb-6 p-4 bg-white/5 rounded-xl">
                            <div class="text-xs text-gray-500 mb-2" id="qrCodeDisplay">QR: --</div>
                            <div class="text-xs text-gray-600">스마트 락커에서 스캔</div>
                        </div>
                        <div class="flex items-center justify-center gap-2 text-sm text-gray-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <span id="pickupLocation">--</span>
                        </div>
                    </div>
                </div>
                
                <!-- Log: Optimized Selection -->
                <div class="fade-in-up-delay-3 mb-12">
                    <div class="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
                        <div class="text-xs text-gray-600 uppercase tracking-wider mb-4 font-semibold">
                            Log: Optimized Selection
                        </div>
                        <div class="grid grid-cols-3 gap-4 text-center" id="orderMeta">
                            <div>
                                <div class="text-2xl font-black neo-mint mb-1">15</div>
                                <div class="text-xs text-gray-500">Minutes</div>
                            </div>
                            <div>
                                <div class="text-2xl font-black mb-1">480g</div>
                                <div class="text-xs text-gray-500">Protein</div>
                            </div>
                            <div>
                                <div class="text-2xl font-black mb-1" id="collectionName">--</div>
                                <div class="text-xs text-gray-500">Collection</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="fade-in-up-delay-3 space-y-4 mb-8">
                    <button class="btn-line-art w-full py-4 rounded-full text-sm font-semibold tracking-wide">
                        Add to My Calendar
                    </button>
                    <button class="btn-line-art w-full py-4 rounded-full text-sm font-semibold tracking-wide" onclick="window.location.href='/'">
                        Keep My Rhythm
                    </button>
                </div>
                
                <!-- Admin Simulator (Dev Only) -->
                <div id="adminPanel" class="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs opacity-50 hover:opacity-100 transition z-50">
                    <div class="font-bold mb-2 text-gray-400">🔧 Admin Test</div>
                    <div class="text-gray-500 mb-2">Status: <span id="adminStatus" class="text-[#00FF85]">CRAFTING</span></div>
                    <button id="nextStatusBtn" class="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold">
                        Next Status →
                    </button>
                </div>
                
            </div>
            
        </div>
        
        <script src="/static/order-success.js"></script>
    </body>
    </html>
  `)
})

export default app
