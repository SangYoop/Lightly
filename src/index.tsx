import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'
import { createSupabaseClient } from './lib/supabase'
import { getUser } from './lib/auth'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

app.use('/static/*', serveStatic({ root: './public' }))

// Auth APIs
app.post('/api/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    const supabase = createSupabaseClient(c.env)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    })
    
    if (error) throw error
    
    return c.json({ 
      user: data.user,
      session: data.session 
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    const supabase = createSupabaseClient(c.env)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    return c.json({ 
      user: data.user,
      session: data.session 
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

app.post('/api/auth/logout', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env)
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

app.get('/api/auth/user', async (c) => {
  try {
    const user = await getUser(c)
    
    if (!user) {
      return c.json({ user: null })
    }
    
    return c.json({ user })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

app.get('/api/spots', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env)
    
    const { data: spots, error } = await supabase
      .from('spots')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    
    // Transform DB format to frontend format
    const transformedSpots = spots.map(spot => ({
      id: spot.id,
      name: spot.name,
      address: spot.address,
      district: spot.district,
      status: 'open',
      orderDeadline: spot.order_deadline,
      orderDeadlineISO: new Date(new Date().toDateString() + ` ${spot.order_deadline}:00 GMT+0900`).toISOString(),
      pickupTime: spot.pickup_time,
      coordinates: spot.coordinates,
      pickupDetails: {
        location: spot.pickup_location,
        description: spot.pickup_guide,
        guide: '스마트 락커에 표시된 픽업 코드를 입력하시면 자동으로 문이 열립니다.',
        image: spot.image_url || '/static/images/pickup-default.jpg'
      }
    }))
    
    return c.json({ spots: transformedSpots })
  } catch (error) {
    console.error('Failed to fetch spots:', error)
    return c.json({ error: 'Failed to fetch spots' }, 500)
  }
})

// API: Get collections by spot (Supabase)
app.get('/api/collections/:spotId', async (c) => {
  try {
    const spotId = c.req.param('spotId')
    const supabase = createSupabaseClient(c.env)
    
    // Get spot
    const { data: spot, error: spotError } = await supabase
      .from('spots')
      .select('*')
      .eq('id', spotId)
      .eq('is_active', true)
      .single()
    
    if (spotError) {
      return c.json({ error: 'Spot not found' }, 404)
    }
    
    // Get collections with inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select(`
        remain_qty,
        collections (
          id,
          theme_no,
          title,
          tagline,
          description,
          price,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          ingredients,
          tags,
          image_url
        )
      `)
      .eq('spot_id', spotId)
      .order('collections(theme_no)')
    
    if (inventoryError) throw inventoryError
    
    // Get supplements for each collection
    const { data: supplements } = await supabase
      .from('supplements')
      .select('theme, title, nutrients')
      .eq('is_active', true)
    
    // Theme mapping: name to number
    const themeMap: Record<string, string> = {
      'Sharp': '01',
      'Vital': '02',
      'Calm': '03'
    }
    
    // Transform to frontend format
    const collections = inventory.map((item: any) => {
      // Find supplement by matching theme name
      const supplement = supplements?.find(s => themeMap[s.theme] === item.collections.theme_no)
      
      return {
        id: item.collections.id,
        number: item.collections.theme_no,
        name: item.collections.title,
        tagline: item.collections.tagline,
        description: item.collections.description,
        unitsLeft: item.remain_qty,
        price: item.collections.price,
        image: item.collections.image_url || `/static/images/${item.collections.id}.jpg`,
        ingredients: item.collections.ingredients,
        nutrition: {
          calories: item.collections.calories,
          protein: item.collections.protein_g,
          carbs: item.collections.carbs_g,
          fat: item.collections.fat_g
        },
        tags: item.collections.tags,
        supplement: supplement ? `이번 주 웰니스: ${supplement.title}` : '이번 주 웰니스: 포함됨'
      }
    })
    
    const transformedSpot = {
      id: spot.id,
      name: spot.name,
      address: spot.address,
      district: spot.district,
      status: 'open',
      orderDeadline: spot.order_deadline,
      orderDeadlineISO: new Date(new Date().toDateString() + ` ${spot.order_deadline}:00 GMT+0900`).toISOString(),
      pickupTime: spot.pickup_time,
      coordinates: spot.coordinates,
      pickupDetails: {
        location: spot.pickup_location,
        description: spot.pickup_guide,
        guide: '스마트 락커에 표시된 픽업 코드를 입력하시면 자동으로 문이 열립니다.',
        image: spot.image_url || '/static/images/pickup-default.jpg'
      }
    }
    
    return c.json({ 
      spot: transformedSpot,
      collections,
      orderDeadline: transformedSpot.orderDeadlineISO,
      pickupTime: spot.pickup_time
    })
  } catch (error) {
    console.error('Failed to fetch collections:', error)
    return c.json({ error: 'Failed to fetch collections' }, 500)
  }
})

// API: Create order (Supabase with Auth)
app.post('/api/orders', async (c) => {
  try {
    const body = await c.req.json()
    const supabase = createSupabaseClient(c.env)
    
    // Get authenticated user
    const user = await getUser(c)
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    // Generate pickup code
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString()
    
    // Get spot pickup location
    const { data: spot } = await supabase
      .from('spots')
      .select('pickup_location')
      .eq('id', body.spotId)
      .single()
    
    // Create order with authenticated user ID
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        spot_id: body.spotId,
        collection_id: body.collectionId,
        status: 'crafting',
        pickup_code: pickupCode,
        qr_code: `URB-QR-${Date.now()}`,
        pickup_location: spot?.pickup_location || 'B1층 Urban Fresh Zone'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Transform to frontend format
    const transformedOrder = {
      id: order.order_number,
      spotId: order.spot_id,
      collectionId: order.collection_id,
      status: order.status,
      pickupCode: order.pickup_code,
      qrCode: order.qr_code,
      createdAt: order.created_at,
      pickupLocation: order.pickup_location
    }
    
    return c.json({ order: transformedOrder })
  } catch (error) {
    console.error('Failed to create order:', error)
    return c.json({ error: 'Failed to create order' }, 500)
  }
})

// API: Get order status (Supabase)
app.get('/api/orders/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId')
    const supabase = createSupabaseClient(c.env)
    
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        spots (name, pickup_location),
        collections (title, theme_no)
      `)
      .eq('order_number', orderId)
      .single()
    
    if (error) {
      return c.json({ error: 'Order not found' }, 404)
    }
    
    // Transform to frontend format
    const transformedOrder = {
      id: order.order_number,
      spotId: order.spot_id,
      collectionId: order.collection_id,
      status: order.status,
      pickupCode: order.pickup_code,
      qrCode: order.qr_code,
      createdAt: order.created_at,
      pickupLocation: order.pickup_location
    }
    
    return c.json({ order: transformedOrder })
  } catch (error) {
    console.error('Failed to fetch order:', error)
    return c.json({ error: 'Failed to fetch order' }, 500)
  }
})

// API: Update order status (Admin) (Supabase)
app.patch('/api/orders/:orderId/status', async (c) => {
  try {
    const orderId = c.req.param('orderId')
    const body = await c.req.json()
    const newStatus = body.status
    
    if (!['crafting', 'on_the_way', 'arrived', 'completed', 'cancelled'].includes(newStatus)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    
    const supabase = createSupabaseClient(c.env)
    
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('order_number', orderId)
      .select()
      .single()
    
    if (error) {
      return c.json({ error: 'Order not found' }, 404)
    }
    
    return c.json({ 
      order: {
        id: order.order_number,
        status: order.status,
        updatedAt: order.updated_at
      }
    })
  } catch (error) {
    console.error('Failed to update order:', error)
    return c.json({ error: 'Failed to update order' }, 500)
  }
})

// API: Get user order history (Supabase with Auth)
app.get('/api/my-rhythm', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env)
    
    // Get authenticated user
    const user = await getUser(c)
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    // Get all user orders with spot and collection details
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        order_number,
        status,
        created_at,
        spots (
          id,
          name,
          pickup_time
        ),
        collections (
          id,
          theme_no,
          title
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Separate active and completed orders
    const activeOrders = orders.filter(o => ['crafting', 'on_the_way', 'arrived'].includes(o.status))
    const completedOrders = orders.filter(o => o.status === 'completed')
    
    // Transform to frontend format
    const activeOrder = activeOrders.length > 0 ? {
      id: activeOrders[0].order_number,
      collectionId: activeOrders[0].collections.id,
      collectionName: `${activeOrders[0].collections.theme_no}. ${activeOrders[0].collections.title}`,
      spotId: activeOrders[0].spots.id,
      spotName: activeOrders[0].spots.name,
      status: activeOrders[0].status,
      pickupTime: activeOrders[0].spots.pickup_time,
      orderDate: activeOrders[0].created_at
    } : null
    
    const history = completedOrders.map(order => {
      const orderDate = new Date(order.created_at)
      const dateFormatted = `${orderDate.getMonth() + 1}월 ${orderDate.getDate()}일`
      
      return {
        id: order.order_number,
        date: orderDate.toISOString().split('T')[0],
        dateFormatted,
        collectionId: order.collections.id,
        collectionName: `${order.collections.theme_no}. ${order.collections.title}`,
        spotId: order.spots.id,
        spotName: order.spots.name,
        status: order.status,
        pickupTime: order.spots.pickup_time
      }
    })
    
    return c.json({
      user: {
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Urbanist',
        totalOrders: orders.length
      },
      activeOrder,
      history
    })
  } catch (error) {
    console.error('Failed to fetch user orders:', error)
    return c.json({ error: 'Failed to fetch user orders' }, 500)
  }
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
            <header class="px-6 pt-12 pb-8 relative">
                <!-- User Icon - Top Right -->
                <div class="absolute top-8 right-6 z-50">
                    <a href="/my-rhythm">
                        <div class="w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center hover:border-[#00FF85] transition-colors active:scale-95">
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                    </a>
                </div>
                
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
                <!-- User Icon - Top Right -->
                <div class="absolute top-6 right-6 z-50">
                    <a href="/my-rhythm">
                        <div class="w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center hover:border-[#00FF85] transition-colors active:scale-95">
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                    </a>
                </div>
                
                <div class="flex items-start justify-between pr-14">
                    <!-- Selected Spot -->
                    <div class="flex-1">
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
            
            /* Pickup Details Modal */
            .pickup-modal {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #1A1A1B;
                border-top-left-radius: 32px;
                border-top-right-radius: 32px;
                transform: translateY(100%);
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 200;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 -20px 80px rgba(0, 0, 0, 0.8);
            }
            
            .pickup-modal.open {
                transform: translateY(0);
            }
            
            .modal-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.75);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.4s;
                z-index: 199;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
            }
            
            .modal-backdrop.open {
                opacity: 1;
                pointer-events: auto;
            }
            
            .modal-image-placeholder {
                background: linear-gradient(135deg, rgba(0, 255, 133, 0.15), rgba(0, 255, 133, 0.05));
                position: relative;
                overflow: hidden;
            }
            
            .modal-image-placeholder::after {
                content: '📍 Pickup Zone';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: rgba(249, 250, 251, 0.3);
                font-size: 1.5rem;
                font-weight: 900;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <!-- User Icon - Top Right -->
        <div class="fixed top-8 right-6 z-50">
            <a href="/my-rhythm">
                <div class="w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center hover:border-[#00FF85] transition-colors active:scale-95">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                </div>
            </a>
        </div>
        
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
                    <p class="text-base text-gray-300 font-light leading-relaxed">
                        바쁜 도심 속에서 찾아낸<br>
                        오직 당신만을 위한 웰니스로<br>
                        곧 찾아갈게요.
                    </p>
                </div>
                
                <!-- Rhythm Note -->
                <div class="fade-in-up-delay-1 mb-12">
                    <div class="bg-gradient-to-br from-gray-900/40 to-gray-900/20 border border-gray-800/50 rounded-2xl p-6">
                        <div class="text-xs text-gray-600 uppercase tracking-wider mb-3 font-semibold">
                            Rhythm Note
                        </div>
                        <p class="text-sm text-gray-400 font-light leading-relaxed">
                            번거로운 선택은 어반프레시가 대신했습니다.<br>
                            당신은 그저 다가올 가장 맑은 시간을<br>
                            즐기기만 하세요.
                        </p>
                    </div>
                </div>
                
                <!-- Pulse Tracker -->
                <div class="fade-in-up-delay-2 mb-16">
                    <div class="text-xs text-gray-600 uppercase tracking-widest mb-2 font-semibold">
                        The Lifestyle Report
                    </div>
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
                                <div class="text-sm font-black neo-mint mb-1" id="menuName">--</div>
                                <div class="text-xs text-gray-500">MENU</div>
                            </div>
                            <div>
                                <div class="text-sm font-black mb-1" id="spotName">--</div>
                                <div class="text-xs text-gray-500 mb-2">SPOT</div>
                                <button id="showPickupDetailsBtn" class="text-xs neo-mint hover:underline font-semibold flex items-center justify-center gap-1 mx-auto">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    상세 위치
                                </button>
                            </div>
                            <div>
                                <div class="text-sm font-black mb-1" id="pickupTime">--</div>
                                <div class="text-xs text-gray-500">TIME</div>
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
        
        <!-- Pickup Details Modal -->
        <div class="modal-backdrop" id="modalBackdrop"></div>
        <div class="pickup-modal" id="pickupModal">
            <div class="sticky top-0 bg-[#1A1A1B] z-10 px-6 pt-6 pb-4 border-b border-gray-800">
                <div class="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6"></div>
                <button id="closeModal" class="text-gray-400 text-sm font-medium">✕ 닫기</button>
            </div>
            
            <div class="px-6 py-8">
                <!-- Spot Name Header -->
                <div class="mb-6">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Pickup Location</div>
                    <h3 id="modalSpotName" class="text-2xl font-black neo-mint mb-2">--</h3>
                </div>
                
                <!-- Image Section -->
                <div class="mb-6">
                    <div class="modal-image-placeholder aspect-video rounded-2xl mb-4 border-2 border-gray-800">
                        <img id="modalPickupImage" src="" alt="Pickup Zone" class="w-full h-full object-cover rounded-2xl opacity-0" 
                             onerror="this.style.display='none'" onload="this.style.opacity='1'">
                    </div>
                </div>
                
                <!-- Description Section -->
                <div class="mb-6">
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 neo-mint mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <div>
                            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">상세 안내</div>
                            <p id="modalPickupDescription" class="text-sm text-gray-300 font-light leading-relaxed">
                                픽업 위치 정보를 불러오는 중...
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Guide Section -->
                <div class="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-[#00FF85]/20 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                        <div class="text-2xl">🔐</div>
                        <div>
                            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">픽업 방법</div>
                            <p id="modalPickupGuide" class="text-sm text-gray-300 font-light leading-relaxed">
                                --
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script src="/static/order-success.js"></script>
    </body>
    </html>
  `)
})

// My Rhythm Page
app.get('/my-rhythm', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="theme-color" content="#1A1A1B">
        <title>Urban Fresh - My Rhythm</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-tap-highlight-color: transparent;
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
            
            .neo-mint-bg {
                background: #00FF85;
            }
            
            /* Active Order Card */
            .active-order-card {
                background: linear-gradient(135deg, rgba(0, 255, 133, 0.1), rgba(0, 255, 133, 0.05));
                border: 2px solid rgba(0, 255, 133, 0.3);
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
            
            /* History Card */
            .history-card {
                background: rgba(249, 250, 251, 0.04);
                border: 2px solid rgba(249, 250, 251, 0.08);
                transition: all 0.3s ease;
            }
            
            .history-card:active {
                transform: scale(0.98);
                border-color: rgba(0, 255, 133, 0.3);
            }
            
            /* Back Button */
            .back-button {
                transition: all 0.3s ease;
            }
            
            .back-button:active {
                transform: translateX(-4px);
            }
            
            /* Status Badge */
            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            
            .status-crafting {
                background: rgba(0, 255, 133, 0.1);
                color: #00FF85;
                border: 1px solid rgba(0, 255, 133, 0.3);
            }
            
            .status-completed {
                background: rgba(249, 250, 251, 0.05);
                color: #9CA3AF;
                border: 1px solid rgba(249, 250, 251, 0.1);
            }
        </style>
    </head>
    <body>
        <div class="min-h-screen">
            
            <!-- Header -->
            <header class="px-6 pt-8 pb-6 border-b border-gray-800/50">
                <div class="flex items-center justify-between mb-6">
                    <a href="/dashboard" class="back-button">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </a>
                    <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">My Page</div>
                </div>
                
                <div>
                    <h1 class="text-3xl font-black mb-2">
                        My <span class="neo-mint">Rhythm</span>
                    </h1>
                    <p class="text-sm text-gray-400 font-light">
                        당신만의 리듬을 확인하세요
                    </p>
                </div>
            </header>
            
            <!-- Main Content -->
            <main class="px-6 py-8">
                
                <!-- User Info -->
                <div class="mb-8">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-12 h-12 rounded-full border-2 border-[#00FF85] flex items-center justify-center">
                            <svg class="w-6 h-6 neo-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 id="userName" class="text-xl font-black">Urbanist님</h2>
                            <p class="text-xs text-gray-500"><span id="totalOrders">0</span>번의 웰니스를 선택하셨어요</p>
                        </div>
                    </div>
                </div>
                
                <!-- Active Order Card -->
                <div id="activeOrderSection" class="mb-8" style="display: none;">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Active Order</div>
                    <div class="active-order-card rounded-2xl p-6">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <div class="text-lg font-black neo-mint mb-1" id="activeCollectionName">--</div>
                                <div class="text-xs text-gray-400" id="activeSpotName">--</div>
                            </div>
                            <div class="status-badge status-crafting">
                                <div class="w-2 h-2 rounded-full bg-[#00FF85]"></div>
                                <span id="activeStatus">Crafting</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-gray-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>픽업 시간: <span id="activePickupTime" class="neo-mint font-semibold">--</span></span>
                        </div>
                    </div>
                </div>
                
                <!-- Order History -->
                <div>
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Order History</div>
                    <div class="space-y-3" id="historyContainer">
                        <!-- Loading -->
                        <div class="text-center py-12">
                            <div class="inline-block w-8 h-8 border-4 border-gray-800 border-t-[#00FF85] rounded-full animate-spin"></div>
                            <p class="mt-4 text-sm text-gray-500">히스토리 불러오는 중...</p>
                        </div>
                    </div>
                </div>
                
            </main>
            
        </div>
        
        <script src="/static/my-rhythm.js"></script>
    </body>
    </html>
  `)
})

// Login/Signup Page
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="theme-color" content="#1A1A1B">
        <title>Urban Fresh - Login</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-tap-highlight-color: transparent;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #1A1A1B;
                color: #F9FAFB;
                -webkit-font-smoothing: antialiased;
            }
            
            .neo-mint {
                color: #00FF85;
            }
            
            .neo-mint-bg {
                background: #00FF85;
            }
            
            .input-field {
                background: rgba(249, 250, 251, 0.04);
                border: 2px solid rgba(249, 250, 251, 0.1);
                transition: all 0.2s;
            }
            
            .input-field:focus {
                background: rgba(249, 250, 251, 0.06);
                border-color: #00FF85;
                outline: none;
            }
            
            .tab-button {
                padding: 12px 24px;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
                color: #6B7280;
            }
            
            .tab-button.active {
                color: #00FF85;
                border-bottom-color: #00FF85;
            }
        </style>
    </head>
    <body>
        <div class="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            <div class="max-w-md w-full">
                <!-- Logo/Header -->
                <div class="text-center mb-12">
                    <h1 class="text-5xl font-black mb-3">
                        Urban<br><span class="neo-mint">Fresh</span>
                    </h1>
                    <p class="text-sm text-gray-400">프리미엄 오피스 웰니스 딜리버리</p>
                </div>
                
                <!-- Tabs -->
                <div class="flex border-b border-gray-800 mb-8">
                    <button class="tab-button active flex-1" id="loginTab">로그인</button>
                    <button class="tab-button flex-1" id="signupTab">회원가입</button>
                </div>
                
                <!-- Login Form -->
                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">이메일</label>
                        <input type="email" id="loginEmail" 
                               class="input-field w-full px-4 py-3 rounded-xl text-white"
                               placeholder="your@email.com" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">비밀번호</label>
                        <input type="password" id="loginPassword" 
                               class="input-field w-full px-4 py-3 rounded-xl text-white"
                               placeholder="••••••••" required>
                    </div>
                    <div id="loginError" class="text-red-400 text-sm hidden"></div>
                    <button type="submit" 
                            class="w-full py-4 bg-[#00FF85] text-[#1A1A1B] rounded-full font-black text-lg">
                        로그인
                    </button>
                </form>
                
                <!-- Signup Form (Hidden) -->
                <form id="signupForm" class="space-y-4 hidden">
                    <div>
                        <label class="block text-sm font-medium mb-2">이름</label>
                        <input type="text" id="signupName" 
                               class="input-field w-full px-4 py-3 rounded-xl text-white"
                               placeholder="홍길동" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">이메일</label>
                        <input type="email" id="signupEmail" 
                               class="input-field w-full px-4 py-3 rounded-xl text-white"
                               placeholder="your@email.com" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">비밀번호 (최소 6자)</label>
                        <input type="password" id="signupPassword" 
                               class="input-field w-full px-4 py-3 rounded-xl text-white"
                               placeholder="••••••••" required minlength="6">
                    </div>
                    <div id="signupError" class="text-red-400 text-sm hidden"></div>
                    <button type="submit" 
                            class="w-full py-4 bg-[#00FF85] text-[#1A1A1B] rounded-full font-black text-lg">
                        회원가입
                    </button>
                </form>
                
                <!-- Back to Home -->
                <div class="text-center mt-8">
                    <a href="/" class="text-sm text-gray-500 hover:text-[#00FF85] transition-colors">
                        ← 홈으로 돌아가기
                    </a>
                </div>
            </div>
        </div>
        
        <script src="/static/auth.js"></script>
        <script>
            // Tab switching
            const loginTab = document.getElementById('loginTab');
            const signupTab = document.getElementById('signupTab');
            const loginForm = document.getElementById('loginForm');
            const signupForm = document.getElementById('signupForm');
            
            loginTab.addEventListener('click', function() {
                loginTab.classList.add('active');
                signupTab.classList.remove('active');
                loginForm.classList.remove('hidden');
                signupForm.classList.add('hidden');
            });
            
            signupTab.addEventListener('click', function() {
                signupTab.classList.add('active');
                loginTab.classList.remove('active');
                signupForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            });
            
            // Login form submission
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const errorEl = document.getElementById('loginError');
                
                errorEl.classList.add('hidden');
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.session) {
                        // Save session
                        localStorage.setItem('urban_fresh_session', JSON.stringify(data.session));
                        
                        // Redirect
                        const redirectTo = localStorage.getItem('redirect_after_login') || '/';
                        localStorage.removeItem('redirect_after_login');
                        window.location.href = redirectTo;
                    } else {
                        errorEl.textContent = data.error || '로그인에 실패했습니다.';
                        errorEl.classList.remove('hidden');
                    }
                } catch (error) {
                    errorEl.textContent = '네트워크 오류가 발생했습니다.';
                    errorEl.classList.remove('hidden');
                }
            });
            
            // Signup form submission
            signupForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const name = document.getElementById('signupName').value;
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;
                const errorEl = document.getElementById('signupError');
                
                errorEl.classList.add('hidden');
                
                try {
                    const response = await fetch('/api/auth/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password, name })
                    });
                    
                    const data = await response.json();
                    
                    if (data.session) {
                        // Save session
                        localStorage.setItem('urban_fresh_session', JSON.stringify(data.session));
                        
                        // Redirect
                        const redirectTo = localStorage.getItem('redirect_after_login') || '/';
                        localStorage.removeItem('redirect_after_login');
                        window.location.href = redirectTo;
                    } else {
                        errorEl.textContent = data.error || '회원가입에 실패했습니다.';
                        errorEl.classList.remove('hidden');
                    }
                } catch (error) {
                    errorEl.textContent = '네트워크 오류가 발생했습니다.';
                    errorEl.classList.remove('hidden');
                }
            });
        </script>
    </body>
    </html>
  `)
})

export default app
