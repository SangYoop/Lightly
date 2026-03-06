-- Urban Fresh Database Schema
-- Created: 2026-03-06

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SPOTS (거점 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    district TEXT,
    pickup_guide TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    order_deadline TIME NOT NULL DEFAULT '10:00',
    pickup_time TIME NOT NULL DEFAULT '11:30',
    coordinates JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active spots
CREATE INDEX idx_spots_active ON spots(is_active);

-- ============================================
-- 2. COLLECTIONS (메뉴 및 영양 데이터)
-- ============================================
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_no TEXT NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 9900,
    calories INTEGER NOT NULL,
    protein_g INTEGER NOT NULL,
    carbs_g INTEGER NOT NULL,
    fat_g INTEGER NOT NULL,
    ingredients JSONB NOT NULL,
    tags JSONB,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active collections
CREATE INDEX idx_collections_active ON collections(is_active);

-- ============================================
-- 3. SUPPLEMENTS (주간 건강기능식품)
-- ============================================
CREATE TABLE IF NOT EXISTS supplements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme TEXT NOT NULL,
    title TEXT NOT NULL,
    nutrients JSONB,
    provided_week DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for current week supplements
CREATE INDEX idx_supplements_week ON supplements(provided_week);
CREATE INDEX idx_supplements_theme ON supplements(theme);

-- ============================================
-- 4. INVENTORY (거점별 실시간 재고)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    remain_qty INTEGER NOT NULL DEFAULT 0,
    cutoff_time TIME NOT NULL DEFAULT '10:00',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(spot_id, collection_id)
);

-- Indexes for inventory queries
CREATE INDEX idx_inventory_spot ON inventory(spot_id);
CREATE INDEX idx_inventory_collection ON inventory(collection_id);
CREATE INDEX idx_inventory_qty ON inventory(remain_qty);

-- ============================================
-- 5. ORDERS (주문 이력 및 실시간 트래킹)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID,
    spot_id UUID NOT NULL REFERENCES spots(id),
    collection_id UUID NOT NULL REFERENCES collections(id),
    status TEXT NOT NULL CHECK (status IN ('crafting', 'on_the_way', 'arrived', 'completed', 'cancelled')),
    pickup_code TEXT NOT NULL,
    qr_code TEXT NOT NULL,
    pickup_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order queries
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_spot ON orders(spot_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_spots_updated_at BEFORE UPDATE ON spots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplements_updated_at BEFORE UPDATE ON supplements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'URB-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ language 'plpgsql';

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- ============================================
-- Enable RLS
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public read access for spots, collections, supplements, inventory
CREATE POLICY "Public read access for spots" ON spots FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for collections" ON collections FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for supplements" ON supplements FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for inventory" ON inventory FOR SELECT USING (true);

-- Users can read their own orders
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (true);

-- Users can create orders
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE spots IS '오피스 거점 정보 테이블';
COMMENT ON TABLE collections IS '메뉴 컬렉션 및 영양 정보 테이블';
COMMENT ON TABLE supplements IS '주간 건강기능식품 정보 테이블';
COMMENT ON TABLE inventory IS '거점별 실시간 재고 테이블';
COMMENT ON TABLE orders IS '주문 이력 및 실시간 트래킹 테이블';
