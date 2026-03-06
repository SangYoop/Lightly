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
  orderDeadline: string,      // "10:00"
  orderDeadlineISO: string,   // ISO 8601 format
  pickupTime: string,         // "11:30"
  coordinates: { lat, lng },
  pickupDetails: {
    location: string,         // "B1층 로비"
    description: string,      // 상세 안내 문구
    guide: string,           // 픽업 방법
    image: string            // 이미지 URL
  }
}
```

### Collection 데이터 구조
```typescript
{
  id: string,
  number: string,        // "01", "02", "03"
  name: string,
  tagline: string,
  description: string,
  unitsLeft: number,
  price: number,         // 9900 (₩9,900 고정)
  ingredients: string[],
  nutrition: { calories, protein, carbs, fat },
  tags: string[],
  supplement: string     // Weekly Wellness 건강기능식품
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
- ✅ Real-time status updates (polling simulation)
- ✅ Digital Pickup Pass (on Arrived status)
- ✅ Log: Optimized Selection (실제 주문 메타데이터)
- ✅ Pickup Location Details Modal
- ✅ "Add to My Calendar", "Keep My Rhythm" 버튼

### **Step 4: Real-time Pulse Tracker**
- ✅ Order status polling (2초 간격)
- ✅ Status transition animations
- ✅ Haptic feedback on status change
- ✅ Admin simulator panel (테스트용)
- ✅ Flash animation on "Arrived" status
- ✅ Digital Pickup Pass reveal

### **Step 5: Data & Logic Refinement**
- ✅ 가격 정책: 모든 컬렉션 ₩9,900 고정
- ✅ 운영 시간: 마감 10:00 / 픽업 11:30
- ✅ Weekly Wellness 건강기능식품 추가
- ✅ Drawer 디자인 개선 (웰니스 섹션)
- ✅ 라이프스타일 리포트 문구 개선
- ✅ 실제 Order Meta 표시 (MENU, SPOT, TIME)

### **Step 6: Pickup Location Details**
- ✅ SPOT 정보 옆 "상세 위치" 버튼 추가
- ✅ Slide-up Modal 구현
- ✅ 거점별 픽업 존 사진 (placeholder)
- ✅ 상세 안내 설명 (위치, 방법)
- ✅ 동적 콘텐츠 렌더링

## 📋 Currently Completed Features
✅ **3-Tap 주문 플로우 완성**
- Step 1: 거점 선택 (모바일 우선)
- Step 2: 메뉴 컬렉션 선택 (Drawer + Weekly Wellness)
- Step 3: 주문 확정 및 성공 화면 (라이프스타일 리포트)

✅ **모바일 우선 디자인**
- 원-핸드 조작 최적화
- 터치 인터랙션 (햅틱 피드백)
- Safe area 지원 (노치 디바이스)

✅ **실시간 기능**
- 카운트다운 타이머 (마감 10:00까지)
- Pulse Tracker 애니메이션 (Crafting → On Way → Arrived)
- Order status polling (2초 간격)
- 재고 수량 실시간 표시

✅ **하이엔드 UX**
- 부드러운 페이드인 애니메이션 (staggered)
- 로딩 상태 피드백 ("Connecting to the kitchen")
- 잡지 편집 스타일 레이아웃
- Line art 버튼 스타일
- Neo-Mint flash animation on arrival

✅ **픽업 시스템**
- Digital Pickup Pass (Arrived 상태 시)
- Pickup Location Details Modal
- 거점별 상세 안내 (위치, 방법, 사진)
- QR 코드 및 픽업 코드 표시

✅ **데이터 정책**
- 가격 정책: 모든 컬렉션 ₩9,900 고정
- 운영 시간: 주문 마감 10:00 / 픽업 11:30
- Weekly Wellness: 컬렉션별 건강기능식품 포함

## 🔄 Features Not Yet Implemented
❌ Supabase 데이터베이스 연동 (현재 in-memory)
❌ 실제 결제 시스템 (PG 연동)  
❌ 주문 히스토리 및 마이페이지
❌ 푸시 알림 (주문 상태 변경 시)
❌ 실제 이미지 업로드 (현재 플레이스홀더)  
❌ Supabase Realtime 구독 (현재 polling)
❌ 캘린더 연동 (Add to Calendar 버튼)  
❌ 관리자 대시보드
❌ 주문 취소 기능
❌ 회원가입/로그인

## 🎯 Recommended Next Steps
1. **Supabase 통합**: spots, collections, orders 테이블 생성 및 마이그레이션
2. **실시간 구독**: polling → Supabase Realtime 전환
3. **실제 이미지**: 픽업 존 사진, 메뉴 이미지 업로드
4. **Cloudflare Pages 배포**: Production 환경 설정
5. **GitHub 연동**: 소스 코드 저장소 설정
6. **결제 연동**: PG사 (토스페이먼츠, 이니시스 등) 연동
7. **관리자 패널**: 주문 관리, 재고 관리, 거점 관리  

## 🎯 User Journey (완성)

### 1️⃣ 거점 선택
1. 메인 페이지 진입
2. "Pick Your Spot" 확인
3. 드림플러스 강남 or 한국과학기술회관 역삼 선택
4. localStorage에 저장
5. 자동으로 `/dashboard` 이동

### 2️⃣ 메뉴 선택
1. 선택한 거점 이름 표시
2. 주문 마감까지 실시간 타이머 확인 (10:00 AM)
3. 3가지 컬렉션 중 선택 (Sharp, Vital, Calm - 각 ₩9,900)
4. 카드 탭 → Drawer 슬라이드업
5. 영양 정보, 재료, Weekly Wellness 건강기능식품 확인
6. "Confirm & Reserve · ₩9,900" 버튼 클릭

### 3️⃣ 주문 확정
1. "Connecting to the kitchen" 로딩 (2.5초)
2. `/order-success` 이동
3. **"The Urban Standard" 헤드라인 페이드인**
4. **웰니스 메시지**: "바쁜 도심 속에서 찾아낸 오직 당신만을 위한 웰니스로 곧 찾아갈게요."
5. **Rhythm Note**: "번거로운 선택은 어반프레시가 대신했습니다. 당신은 그저 다가올 가장 맑은 시간을 즐기기만 하세요."
6. Pulse Tracker에서 "Crafting" 상태 확인
7. Order Meta 확인 (MENU: 01. Sharp, SPOT: 드림플러스 강남, TIME: 11:30 AM)
8. **"상세 위치" 버튼 클릭** → Pickup Location Modal 확인
   - 거점 이름 (Neo-Mint)
   - 픽업 존 이미지 placeholder
   - 상세 설명 ("B1층 로비, 엘리베이터 우측...")
   - 픽업 방법 ("스마트 락커에 표시된 픽업 코드...")
9. (Admin 패널로 상태 변경 테스트 가능)
10. "Arrived" 상태 → Neo-Mint flash + Digital Pickup Pass 표시
11. "Keep My Rhythm" 클릭 → 홈으로

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
│       ├── dashboard.js       # Step 2 로직
│       └── order-success.js   # Step 3 로직 (Pulse Tracker, Modal)
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
      "orderDeadline": "10:00",
      "pickupTime": "11:30",
      "coordinates": { "lat": 37.5012, "lng": 127.0396 },
      "pickupDetails": {
        "location": "B1층 로비",
        "description": "드림플러스 강남 B1층 로비, 엘리베이터 우측 어반프레시 전용 픽업 스테이션에 준비되어 있습니다.",
        "guide": "스마트 락커에 표시된 픽업 코드를 입력하시면 자동으로 문이 열립니다.",
        "image": "/static/images/pickup-dreamplus.jpg"
      }
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
      "price": 9900,
      "nutrition": { "calories": 520, "protein": 42, "carbs": 48, "fat": 18 },
      "tags": ["고단백", "저당"],
      "supplement": "이번 주 웰니스: 활력 비타민 B 콤플렉스 스틱 1포"
    }
  ],
  "orderDeadline": "2026-03-06T01:00:00.000Z",
  "pickupTime": "11:30"
}
```

### POST `/api/orders`
주문 생성

**Request Body:**
```json
{
  "spotId": "dreamplus-gangnam",
  "collectionId": "sharp"
}
```

**Response:**
```json
{
  "order": {
    "id": "URB-XXXXX",
    "spotId": "dreamplus-gangnam",
    "collectionId": "sharp",
    "status": "crafting",
    "pickupCode": "7936",
    "qrCode": "URB-XXXXX",
    "pickupLocation": "B1층 Urban Fresh Zone",
    "createdAt": "2026-03-06T12:00:00.000Z"
  }
}
```

### GET `/api/orders/:orderId`
주문 상태 조회

**Response:**
```json
{
  "order": {
    "id": "URB-XXXXX",
    "status": "crafting",
    "pickupCode": "7936",
    "qrCode": "URB-XXXXX",
    "pickupLocation": "B1층 Urban Fresh Zone",
    "updatedAt": "2026-03-06T12:05:00.000Z"
  }
}
```

### PATCH `/api/orders/:orderId/status`
주문 상태 업데이트 (Admin)

**Request Body:**
```json
{
  "status": "on_the_way"
}
```

**Response:**
```json
{
  "order": {
    "id": "URB-XXXXX",
    "status": "on_the_way",
    "updatedAt": "2026-03-06T12:10:00.000Z"
  }
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
