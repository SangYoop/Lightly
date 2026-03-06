# Urban Fresh - Supabase Database Setup

## 📋 Database Schema

### Tables

1. **spots** - 거점 정보
   - 픽업 장소, 주소, 안내 문구, 이미지 URL
   - 주문 마감 시간, 픽업 시간
   - 좌표 정보 (JSONB)

2. **collections** - 메뉴 컬렉션
   - 테마 번호, 제목, 설명
   - 영양 정보 (칼로리, 단백질, 탄수화물, 지방)
   - 재료 목록 (JSONB 배열)
   - 태그, 이미지 URL

3. **supplements** - 주간 건강기능식품
   - 테마별 영양제 정보
   - 영양 성분 (JSONB)
   - 제공 주차

4. **inventory** - 거점별 실시간 재고
   - 거점 × 컬렉션 조합
   - 남은 수량
   - 주문 마감 시간

5. **orders** - 주문 이력
   - 사용자, 거점, 컬렉션
   - 주문 상태 (crafting, on_the_way, arrived, completed, cancelled)
   - 픽업 코드, QR 코드

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### 2. Run Migrations

**Option A: Via Supabase Dashboard**
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `20260306_initial_schema.sql`
3. Run the query
4. Copy and paste the contents of `20260306_seed_data.sql`
5. Run the query

**Option B: Via Supabase CLI (if installed)**
```bash
supabase db push
```

### 3. Configure Environment Variables

Create a `.dev.vars` file in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

For production (Cloudflare Pages):
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
```

### 4. Verify Installation

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check table counts
SELECT 
    (SELECT COUNT(*) FROM spots) as spots_count,
    (SELECT COUNT(*) FROM collections) as collections_count,
    (SELECT COUNT(*) FROM supplements) as supplements_count,
    (SELECT COUNT(*) FROM inventory) as inventory_count,
    (SELECT COUNT(*) FROM orders) as orders_count;

-- Check inventory with joins
SELECT 
    s.name as spot_name,
    c.title as collection_name,
    i.remain_qty,
    i.cutoff_time
FROM inventory i
JOIN spots s ON i.spot_id = s.id
JOIN collections c ON i.collection_id = c.id
ORDER BY s.name, c.theme_no;
```

## 📊 Data Structure Examples

### Spots
```json
{
  "id": "uuid",
  "name": "드림플러스 강남",
  "address": "서울특별시 강남구 테헤란로 311",
  "pickup_guide": "B1층 로비, 엘리베이터 우측...",
  "coordinates": {"lat": 37.5012, "lng": 127.0396}
}
```

### Collections
```json
{
  "id": "uuid",
  "theme_no": "01",
  "title": "Sharp",
  "ingredients": ["퀴노아", "그릴드 치킨", "아보카도"],
  "tags": ["고단백", "저당"],
  "calories": 520,
  "protein_g": 42
}
```

### Supplements
```json
{
  "id": "uuid",
  "theme": "Sharp",
  "title": "활력 비타민 B 콤플렉스 스틱 1포",
  "nutrients": {
    "비타민 B1": "10mg",
    "비타민 B6": "5mg"
  }
}
```

## 🔐 Row Level Security (RLS)

RLS policies are enabled for all tables:

- **Public read access**: spots, collections, supplements, inventory (where is_active = true)
- **User-scoped access**: orders (users can read/create their own orders)

## 🔄 Realtime Subscriptions

Enable realtime for order tracking:

```typescript
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order status changed:', payload);
    }
  )
  .subscribe();
```

## 📝 Migration Files

- `20260306_initial_schema.sql` - Database schema and tables
- `20260306_seed_data.sql` - Initial seed data (spots, collections, supplements, inventory, sample orders)

## 🛠️ Maintenance

### Update Inventory
```sql
UPDATE inventory 
SET remain_qty = 10 
WHERE spot_id = 'uuid' AND collection_id = 'uuid';
```

### Add New Spot
```sql
INSERT INTO spots (name, address, district, pickup_guide, pickup_location, coordinates)
VALUES ('New Spot', 'Address', 'District', 'Guide', 'Location', '{"lat": 0, "lng": 0}'::jsonb);
```

### Weekly Supplement Update
```sql
-- Set current supplements as inactive
UPDATE supplements SET is_active = false;

-- Insert new week's supplements
INSERT INTO supplements (theme, title, nutrients, provided_week)
VALUES ('Sharp', '새로운 영양제', '{"성분": "용량"}'::jsonb, '2026-03-10');
```

## 🚨 Important Notes

- Always use transactions for multi-table operations
- Use indexes for frequently queried columns
- Enable RLS for production security
- Regular backup of production data
- Monitor query performance with Supabase dashboard

---

**Urban Fresh** © 2026 · Database Schema v1.0
