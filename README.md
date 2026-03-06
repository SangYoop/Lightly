# Urban Fresh 🥗

## Project Overview
- **Name**: Urban Fresh
- **Goal**: 도심 직장인을 위한 '주문 후 제작' 기반 하이엔드 델리 서비스
- **Core Features**: 3-Tap 주문 시스템 (거점 선택 → 컬렉션 선택 → 결제 확정)

## 📱 URLs
- **Development**: https://3000-i4eawevu93jl9scwhit4j-cbeee0f9.sandbox.novita.ai
- **API Endpoints**: 
  - `/api/spots` - 거점 목록
  - `/api/collections/:spotId` - 거점별 메뉴 컬렉션
- **GitHub**: (미설정)

## 🎨 Design System
### High-Contrast Minimal
- **Deep Slate**: `#1A1A1B` (배경)
- **Neo-Mint**: `#00FF85` (포인트/강조/CTA)
- **Off-White**: `#F9FAFB` (텍스트/기본 배경)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300 (Light), 400, 600, 700, 800, 900 (Black)
- **Style**: 대담한 산세리프, 타이트한 letter-spacing

### Layout Philosophy
- **Mobile-First**: 모바일 우선 설계
- **Touch-Optimized**: 터치 인터랙션 최적화
- **Magazine Editorial**: 잡지 편집 스타일 레이아웃

## 🏗️ Data Architecture
### Spot 데이터 구조
```typescript
{
  id: string,
  name: string,
  address: string,
  district: string,
  status: 'open' | 'closed',
  availableUntil: string,
  orderDeadline: string (ISO 8601),
  coordinates: { lat, lng }
}
```

### Collection 데이터 구조
```typescript
{
  id: string,
  number: string,  // "01", "02", "03"
  name: string,
  tagline: string,
  description: string,
  unitsLeft: number,
  price: number,
  ingredients: string[],
  nutrition: { calories, protein, carbs, fat },
  tags: string[]
}
```

### Storage Services
- **현재**: In-memory Array (하드코딩)
- **계획**: Supabase PostgreSQL 마이그레이션 예정

## 🚀 완성된 3-Tap 플로우

### **Step 1: Spot Selector**
**화면**: `/`
- ✅ 2개 거점 선택 카드
- ✅ 대담한 타이포그래피 ("Pick Your Spot")
- ✅ 터치 최적화 인터랙션
- ✅ localStorage 상태 저장
- ✅ 자동 Dashboard 이동

### **Step 2: The Collection Grid**
**화면**: `/dashboard`
- ✅ Sticky 헤더 (거점명 + 실시간 타이머)
- ✅ 3가지 컬렉션 카드 (Sharp, Vital, Calm)
- ✅ Bento Grid 레이아웃
- ✅ Slide-up Drawer (영양 정보, 재료)
- ✅ "Confirm & Reserve" Neo-Mint 버튼
- ✅ 잔여 수량 표시

### **Step 3: The Lifestyle Report**
**화면**: `/order-success`
- ✅ "Connecting to the kitchen" 로딩 애니메이션
- ✅ 잡지 스타일 레이아웃
- ✅ "The Urban Standard" 헤드라인
- ✅ 페이드인 애니메이션 (staggered)
- ✅ Pulse Tracker (Crafting → On the Way → Arrived)
- ✅ Log: Optimized Selection (메타데이터)
- ✅ "Add to My Calendar", "Keep My Rhythm" 버튼

## 📋 Currently Completed Features
✅ **3-Tap 주문 플로우 완성**
- Step 1: 거점 선택
- Step 2: 메뉴 컬렉션 선택
- Step 3: 주문 확정 및 성공 화면

✅ **모바일 우선 디자인**
- 원-핸드 조작 최적화
- 터치 인터랙션 (햅틱 피드백)
- Safe area 지원 (노치 디바이스)

✅ **실시간 기능**
- 카운트다운 타이머 (주문 마감까지)
- Pulse Tracker 애니메이션
- 재고 수량 표시

✅ **하이엔드 UX**
- 부드러운 페이드인 애니메이션
- 로딩 상태 피드백
- 잡지 편집 스타일 레이아웃
- Line art 버튼 스타일

## 🔄 Features Not Yet Implemented
❌ Supabase 데이터베이스 연동  
❌ 실제 결제 시스템 (PG 연동)  
❌ 주문 히스토리  
❌ 푸시 알림  
❌ 실제 이미지 업로드 (현재 플레이스홀더)  
❌ 배송 추적 실시간 업데이트  
❌ 캘린더 연동 (Add to Calendar)  

## 🎯 User Journey (완성)

### 1️⃣ 거점 선택
1. 메인 페이지 진입
2. "Pick Your Spot" 확인
3. 드림플러스 강남 or 한국과학기술회관 역삼 선택
4. localStorage에 저장
5. 자동으로 `/dashboard` 이동

### 2️⃣ 메뉴 선택
1. 선택한 거점 이름 표시
2. 주문 마감까지 실시간 타이머 확인
3. 3가지 컬렉션 중 선택 (Sharp, Vital, Calm)
4. 카드 탭 → Drawer 슬라이드업
5. 영양 정보, 재료 확인
6. "Confirm & Reserve" 버튼 클릭

### 3️⃣ 주문 확정
1. "Connecting to the kitchen" 로딩 (2.5초)
2. `/order-success` 이동
3. "The Urban Standard" 헤드라인 페이드인
4. 웰니스 메시지 표시
5. Pulse Tracker에서 "Crafting" 상태 확인
6. 메타데이터 (15분, 480g, 컬렉션명) 확인
7. "Keep My Rhythm" 클릭 → 홈으로

## 🛠️ Tech Stack
- **Framework**: Hono (Cloudflare Workers/Pages)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (CDN)
- **Runtime**: Cloudflare Workers
- **Process Manager**: PM2
- **Database**: Supabase (계획 중)

## 📁 Project Structure
```
webapp/
├── src/
│   └── index.tsx              # Hono 라우팅 + 모든 페이지
├── public/
│   └── static/
│       ├── spot-selector.js   # Step 1 로직
│       └── dashboard.js       # Step 2 로직
├── ecosystem.config.cjs       # PM2 설정
├── wrangler.jsonc            # Cloudflare 설정
├── package.json              # 의존성 관리
└── README.md                 # 프로젝트 문서
```

## 🧪 Development Commands
```bash
# 빌드
npm run build

# 로컬 개발 서버 (PM2)
pm2 start ecosystem.config.cjs

# 서비스 상태 확인
pm2 list

# 로그 확인
pm2 logs urban-fresh --nostream

# 포트 정리
npm run clean-port

# API 테스트
curl http://localhost:3000/api/spots
curl http://localhost:3000/api/collections/dreamplus-gangnam
```

## 📝 API Endpoints

### GET `/api/spots`
거점 리스트 조회

**Response:**
```json
{
  "spots": [
    {
      "id": "dreamplus-gangnam",
      "name": "드림플러스 강남",
      "address": "서울특별시 강남구 테헤란로 311",
      "district": "강남",
      "status": "open",
      "availableUntil": "18:00",
      "orderDeadline": "2026-03-05T18:00:00+09:00"
    }
  ]
}
```

### GET `/api/collections/:spotId`
거점별 메뉴 컬렉션 조회

**Response:**
```json
{
  "spot": { ... },
  "collections": [
    {
      "id": "sharp",
      "number": "01",
      "name": "Sharp",
      "tagline": "Focused Energy",
      "unitsLeft": 12,
      "price": 18900,
      "nutrition": { "calories": 520, "protein": 42 },
      "tags": ["고단백", "저당"]
    }
  ],
  "orderDeadline": "2026-03-05T18:00:00+09:00"
}
```

## 🎨 Animation Details

### Fade In Animations
- **Base**: 1s ease-out
- **Stagger**: 0s → 0.3s → 0.6s → 0.9s
- **Movement**: translateY(30px) → translateY(0)

### Pulse Tracker
- **Wave**: 2s ease-in-out infinite
- **Glow**: 20px → 40px box-shadow
- **Dot**: Scale 1.0 → 1.2

### Loading Spinner
- **Rotation**: 1s linear infinite
- **Border**: 3px solid with Neo-Mint top

## 🎯 Design Philosophy

### 하이엔드 델리 감성
- 복잡한 폼 없이 3번의 탭으로 완료
- 데이터를 정보가 아닌 **디자인 스펙**으로 표현
- 주문 완료를 '라이프스타일 확정'으로 승격

### 감각적 인터랙션
- 햅틱 피드백 (진동)
- 부드러운 애니메이션
- 즉각적인 시각적 피드백

### 잡지 편집 스타일
- 여백의 미학
- Light typography (300 weight)
- 타이트한 letter-spacing
- Editorial layout

## 📦 Deployment
- **Platform**: Cloudflare Pages
- **Status**: ✅ Local Development Active
- **Production**: 준비 중
- **Last Updated**: 2026-03-05

## 🔐 Environment Variables (Planned)
```bash
# .dev.vars (로컬 개발용)
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

---

**Urban Fresh** © 2026 · High-End Deli Service for Urban Professionals

**The Urban Standard.**
