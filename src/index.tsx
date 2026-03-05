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
    status: 'open',
    availableUntil: '18:00',
    coordinates: { lat: 37.5012, lng: 127.0396 }
  },
  {
    id: 'kstc-yeoksam',
    name: '한국과학기술회관 역삼',
    address: '서울특별시 강남구 테헤란로 7길 22',
    status: 'open',
    availableUntil: '18:00',
    coordinates: { lat: 37.4986, lng: 127.0329 }
  }
]

// API: Get available spots
app.get('/api/spots', (c) => {
  return c.json({ spots: spotsData })
})

// Main page: Spot Selector
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Urban Fresh - Select Your Coordinate</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
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
            }
            
            .neo-mint {
                color: #00FF85;
            }
            
            .neo-mint-bg {
                background: #00FF85;
            }
            
            .spot-card {
                background: rgba(249, 250, 251, 0.03);
                border: 1px solid rgba(249, 250, 251, 0.08);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .spot-card:hover {
                background: rgba(0, 255, 133, 0.05);
                border-color: #00FF85;
                transform: translateY(-4px);
                box-shadow: 0 20px 40px rgba(0, 255, 133, 0.1);
            }
            
            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #00FF85;
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.5;
                }
            }
            
            .bento-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            @media (max-width: 768px) {
                .bento-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="min-h-screen flex flex-col items-center justify-center p-6">
            <!-- Header -->
            <div class="w-full max-w-4xl mb-12 text-center">
                <h1 class="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
                    Select Your <span class="neo-mint">Coordinate</span>
                </h1>
                <p class="text-gray-400 text-lg">주문을 픽업할 거점을 선택하세요</p>
            </div>
            
            <!-- Spot Grid -->
            <div class="w-full max-w-4xl bento-grid" id="spotsContainer">
                <!-- Loading state -->
                <div class="text-center text-gray-500 py-12 col-span-full">
                    <div class="inline-block w-8 h-8 border-4 border-gray-700 border-t-neo-mint rounded-full animate-spin"></div>
                    <p class="mt-4">거점 정보를 불러오는 중...</p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="mt-16 text-center text-gray-600 text-sm">
                <p>Urban Fresh © 2026 · High-End Deli Service</p>
            </div>
        </div>
        
        <script src="/static/spot-selector.js"></script>
    </body>
    </html>
  `)
})

// Dashboard page (placeholder)
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Urban Fresh - Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background: #1A1A1B;
                color: #F9FAFB;
            }
        </style>
    </head>
    <body class="min-h-screen flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-4xl font-bold mb-4">Dashboard</h1>
            <p class="text-gray-400 mb-8">선택한 거점: <span id="selectedSpot" class="text-green-400"></span></p>
            <a href="/" class="text-blue-400 hover:underline">← 거점 다시 선택</a>
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
