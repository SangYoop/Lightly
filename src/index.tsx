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
    coordinates: { lat: 37.5012, lng: 127.0396 }
  },
  {
    id: 'kstc-yeoksam',
    name: '한국과학기술회관 역삼',
    address: '서울특별시 강남구 테헤란로 7길 22',
    district: '역삼',
    status: 'open',
    availableUntil: '18:00',
    coordinates: { lat: 37.4986, lng: 127.0329 }
  }
]

// API: Get available spots
app.get('/api/spots', (c) => {
  return c.json({ spots: spotsData })
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

// Dashboard page (Mobile-First)
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="theme-color" content="#1A1A1B">
        <title>Urban Fresh - Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background: #1A1A1B;
                color: #F9FAFB;
            }
            .neo-mint {
                color: #00FF85;
            }
            .main-title {
                font-size: clamp(3rem, 12vw, 5rem);
                font-weight: 900;
                line-height: 0.9;
                letter-spacing: -0.04em;
            }
        </style>
    </head>
    <body class="min-h-screen">
        <div class="px-6 pt-12">
            <div class="flex items-center justify-between mb-8">
                <div class="text-xs text-gray-500 tracking-widest uppercase font-semibold">Step 2 of 3</div>
                <div class="text-xs text-gray-500 font-medium">Urban Fresh</div>
            </div>
            <h1 class="main-title mb-8">
                Your<br><span class="neo-mint">Collections</span>
            </h1>
            <div class="bg-gray-900/50 rounded-3xl p-6 mb-8 border border-gray-800">
                <div class="text-sm text-gray-400 mb-3 font-medium">선택한 거점</div>
                <div id="selectedSpot" class="text-xl font-bold neo-mint">로딩 중...</div>
            </div>
            <a href="/" class="text-sm text-gray-400 hover:text-gray-200 font-medium">← 거점 다시 선택</a>
        </div>
        
        <script>
            const selectedSpotId = localStorage.getItem('selectedSpot');
            if (selectedSpotId) {
                fetch('/api/spots')
                    .then(res => res.json())
                    .then(data => {
                        const spot = data.spots.find(s => s.id === selectedSpotId);
                        if (spot) {
                            document.getElementById('selectedSpot').textContent = spot.name;
                        }
                    });
            } else {
                window.location.href = '/';
            }
        </script>
    </body>
    </html>
  `)
})

export default app
