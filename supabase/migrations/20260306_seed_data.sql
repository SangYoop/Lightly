-- Urban Fresh Seed Data
-- Created: 2026-03-06

-- ============================================
-- SPOTS (거점 정보)
-- ============================================
INSERT INTO spots (name, address, district, pickup_guide, pickup_location, image_url, order_deadline, pickup_time, coordinates) VALUES
(
    '드림플러스 강남',
    '서울특별시 강남구 테헤란로 311',
    '강남',
    '드림플러스 강남 B1층 로비, 엘리베이터 우측 어반프레시 전용 픽업 스테이션에 준비되어 있습니다.',
    'B1층 로비',
    '/static/images/pickup-dreamplus.jpg',
    '10:00',
    '11:30',
    '{"lat": 37.5012, "lng": 127.0396}'::jsonb
),
(
    '한국과학기술회관 역삼',
    '서울특별시 강남구 테헤란로 7길 22',
    '역삼',
    '한국과학기술회관 1층 메인 로비 입구, 안내데스크 맞은편 어반프레시 전용 픽업 스테이션에 준비되어 있습니다.',
    '1층 메인 로비',
    '/static/images/pickup-kstc.jpg',
    '10:00',
    '11:30',
    '{"lat": 37.4986, "lng": 127.0329}'::jsonb
);

-- ============================================
-- COLLECTIONS (메뉴 및 영양 데이터)
-- ============================================
INSERT INTO collections (theme_no, title, tagline, description, price, calories, protein_g, carbs_g, fat_g, ingredients, tags, image_url) VALUES
(
    '01',
    'Sharp',
    'Focused Energy',
    '집중력과 에너지가 필요한 오후를 위한 선택',
    9900,
    520,
    42,
    48,
    18,
    '["퀴노아", "그릴드 치킨", "아보카도", "방울토마토", "레몬 드레싱"]'::jsonb,
    '["고단백", "저당"]'::jsonb,
    '/static/images/sharp.jpg'
),
(
    '02',
    'Vital',
    'Fresh Balance',
    '신선한 재료로 완성한 완벽한 영양 밸런스',
    9900,
    480,
    38,
    52,
    14,
    '["케일", "연어", "고구마", "브로콜리", "참깨 드레싱"]'::jsonb,
    '["오메가3", "항산화"]'::jsonb,
    '/static/images/vital.jpg'
),
(
    '03',
    'Calm',
    'Gentle Comfort',
    '부드럽고 편안한 한 끼, 스트레스 없는 식사',
    9900,
    420,
    28,
    58,
    12,
    '["현미", "두부", "버섯", "시금치", "된장 드레싱"]'::jsonb,
    '["저칼로리", "식이섬유"]'::jsonb,
    '/static/images/calm.jpg'
);

-- ============================================
-- SUPPLEMENTS (주간 건강기능식품)
-- ============================================
-- Get current week's Monday
DO $$
DECLARE
    current_week_start DATE;
BEGIN
    current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
    
    INSERT INTO supplements (theme, title, nutrients, provided_week) VALUES
    (
        'Sharp',
        '활력 비타민 B 콤플렉스 스틱 1포',
        '{"비타민 B1": "10mg", "비타민 B6": "5mg", "비타민 B12": "100mcg"}'::jsonb,
        current_week_start
    ),
    (
        'Vital',
        '면역력 프로폴리스 추출물 캡슐 1정',
        '{"프로폴리스": "500mg", "비타민 C": "100mg"}'::jsonb,
        current_week_start
    ),
    (
        'Calm',
        '숙면 마그네슘 + 감태 혼합정 1정',
        '{"마그네슘": "200mg", "감태 추출물": "100mg"}'::jsonb,
        current_week_start
    );
END $$;

-- ============================================
-- INVENTORY (거점별 실시간 재고)
-- ============================================
-- Get spot and collection IDs first, then insert inventory
DO $$
DECLARE
    spot1_id UUID;
    spot2_id UUID;
    sharp_id UUID;
    vital_id UUID;
    calm_id UUID;
BEGIN
    -- Get spot IDs
    SELECT id INTO spot1_id FROM spots WHERE name = '드림플러스 강남';
    SELECT id INTO spot2_id FROM spots WHERE name = '한국과학기술회관 역삼';
    
    -- Get collection IDs
    SELECT id INTO sharp_id FROM collections WHERE theme_no = '01';
    SELECT id INTO vital_id FROM collections WHERE theme_no = '02';
    SELECT id INTO calm_id FROM collections WHERE theme_no = '03';
    
    -- Insert inventory for spot 1
    INSERT INTO inventory (spot_id, collection_id, remain_qty, cutoff_time) VALUES
    (spot1_id, sharp_id, 12, '10:00'),
    (spot1_id, vital_id, 8, '10:00'),
    (spot1_id, calm_id, 15, '10:00');
    
    -- Insert inventory for spot 2
    INSERT INTO inventory (spot_id, collection_id, remain_qty, cutoff_time) VALUES
    (spot2_id, sharp_id, 10, '10:00'),
    (spot2_id, vital_id, 12, '10:00'),
    (spot2_id, calm_id, 14, '10:00');
END $$;

-- ============================================
-- SAMPLE ORDERS (주문 이력)
-- ============================================
DO $$
DECLARE
    spot1_id UUID;
    sharp_id UUID;
    vital_id UUID;
    calm_id UUID;
    temp_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Temporary user ID
BEGIN
    -- Get IDs
    SELECT id INTO spot1_id FROM spots WHERE name = '드림플러스 강남';
    SELECT id INTO sharp_id FROM collections WHERE theme_no = '01';
    SELECT id INTO vital_id FROM collections WHERE theme_no = '02';
    SELECT id INTO calm_id FROM collections WHERE theme_no = '03';
    
    -- Insert sample orders
    INSERT INTO orders (order_number, user_id, spot_id, collection_id, status, pickup_code, qr_code, pickup_location, created_at) VALUES
    (
        'URB-20260305001',
        temp_user_id,
        spot1_id,
        sharp_id,
        'completed',
        '7845',
        'URB-20260305001',
        'B1층 Urban Fresh Zone',
        '2026-03-05 11:30:00+09'
    ),
    (
        'URB-20260304001',
        temp_user_id,
        spot1_id,
        vital_id,
        'completed',
        '9234',
        'URB-20260304001',
        'B1층 Urban Fresh Zone',
        '2026-03-04 11:30:00+09'
    ),
    (
        'URB-20260303001',
        temp_user_id,
        spot1_id,
        calm_id,
        'completed',
        '5678',
        'URB-20260303001',
        'B1층 Urban Fresh Zone',
        '2026-03-03 11:30:00+09'
    );
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Uncomment to verify data insertion

-- SELECT COUNT(*) as spots_count FROM spots;
-- SELECT COUNT(*) as collections_count FROM collections;
-- SELECT COUNT(*) as supplements_count FROM supplements;
-- SELECT COUNT(*) as inventory_count FROM inventory;
-- SELECT COUNT(*) as orders_count FROM orders;

-- SELECT 
--     s.name as spot_name,
--     c.title as collection_name,
--     i.remain_qty
-- FROM inventory i
-- JOIN spots s ON i.spot_id = s.id
-- JOIN collections c ON i.collection_id = c.id
-- ORDER BY s.name, c.theme_no;
