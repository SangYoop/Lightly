# Urban Fresh 🥗

## Project Overview
- **Name**: Urban Fresh
- **Goal**: 도심 직장인을 위한 '주문 후 제작' 기반 하이엔드 델리 서비스
- **Core Features**: 3-Tap 주문 시스템 (거점 선택 → 컬렉션 선택 → 결제)

## 📱 URLs
- **Development**: https://3000-i4eawevu93jl9scwhit4j-cbeee0f9.sandbox.novita.ai
- **API Endpoint**: `/api/spots`
- **GitHub**: (미설정)

## 🎨 Design System
### High-Contrast Minimal
- **Deep Slate**: `#1A1A1B` (배경)
- **Neo-Mint**: `#00FF85` (포인트/강조)
- **Off-White**: `#F9FAFB` (텍스트/기본 배경)

### Typography
- **Font**: Inter (Google Fonts)
- **Style**: 대담한 산세리프 (Sans-serif)

### Layout
- **System**: Bento Grid
- **Responsive**: 모바일 최적화 (300px+ breakpoint)

## 🏗️ Data Architecture
### Current Implementation
```typescript
// Spot 데이터 구조
{
  id: string,           // 거점 고유 ID
  name: string,         // 거점 이름
  address: string,      // 주소
  status: 'open' | 'closed',  // 운영 상태
  availableUntil: string,     // 주문 마감 시간
  coordinates: {              // 좌표 (향후 지도 연동용)
    lat: number,
    lng: number
  }
}
```

### Storage Services
- **현재**: In-memory Array (하드코딩)
- **계획**: Supabase PostgreSQL 마이그레이션 예정

### Available Spots
1. **드림플러스 강남**
   - ID: `dreamplus-gangnam`
   - 주소: 서울특별시 강남구 테헤란로 311
   - 운영: ~18:00

2. **한국과학기술회관 역삼**
   - ID: `kstc-yeoksam`
   - 주소: 서울특별시 강남구 테헤란로 7길 22
   - 운영: ~18:00

## 🚀 User Guide
### 1단계: 거점 선택 (Spot Selector)
1. 메인 페이지에서 "Select Your Coordinate" 확인
2. 이용 가능한 거점 카드 2개 표시
3. 원하는 거점 클릭
4. 자동으로 `/dashboard`로 이동

### 로컬 스토리지
- **Key**: `selectedSpot`
- **Value**: 선택한 거점의 ID (예: `dreamplus-gangnam`)
- **Timestamp**: `selectedSpotTimestamp`

## 🛠️ Tech Stack
- **Framework**: Hono (Cloudflare Workers/Pages)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (CDN)
- **Runtime**: Cloudflare Workers
- **Process Manager**: PM2
- **Database**: Supabase (계획 중)

## 📋 Currently Completed Features
✅ 프로젝트 초기화 및 Git 설정  
✅ High-Contrast Minimal 디자인 시스템 구현  
✅ Bento Grid 레이아웃 시스템  
✅ Spot Selector UI (거점 선택 화면)  
✅ 거점 API (`/api/spots`)  
✅ 로컬 스토리지 기반 상태 관리  
✅ PM2 서비스 관리 설정  
✅ 반응형 모바일 디자인  

## 🔄 Features Not Yet Implemented
❌ Supabase 데이터베이스 연동  
❌ Dashboard 화면 (컬렉션 선택)  
❌ 메뉴 컬렉션 시스템  
❌ 실시간 재고 수량 표시  
❌ 주문 마감 카운트다운  
❌ Pulse Tracker (주문 상태 추적)  
❌ 결제 시스템  
❌ 주문 히스토리  

## 🎯 Recommended Next Steps
1. **Supabase 설정**
   - PostgreSQL 데이터베이스 생성
   - `spots`, `menus`, `orders` 테이블 스키마 설계
   - Supabase API 키 발급 및 환경 변수 설정

2. **Dashboard 화면 구현**
   - 선택된 거점 정보 표시
   - 컬렉션 메뉴 리스트
   - 실시간 재고 수량 연동

3. **실시간 카운트다운**
   - 주문 마감 시간까지 남은 시간 표시
   - 1분마다 업데이트

4. **Pulse Tracker**
   - 주문 상태 추적 UI
   - 제작 진행 상태 실시간 반영

## 📦 Deployment
- **Platform**: Cloudflare Pages
- **Status**: ✅ Local Development Active
- **Last Updated**: 2026-03-05

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
```

## 📁 Project Structure
```
webapp/
├── src/
│   └── index.tsx              # Hono 백엔드 + 라우팅
├── public/
│   └── static/
│       └── spot-selector.js   # 클라이언트 JS
├── ecosystem.config.cjs       # PM2 설정
├── wrangler.jsonc            # Cloudflare 설정
├── package.json              # 의존성 관리
└── README.md                 # 프로젝트 문서
```

## 🔐 Environment Variables (Planned)
```bash
# .dev.vars (로컬 개발용)
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

## 📝 API Endpoints
### GET `/api/spots`
현재 이용 가능한 거점 리스트 조회

**Response:**
```json
{
  "spots": [
    {
      "id": "dreamplus-gangnam",
      "name": "드림플러스 강남",
      "address": "서울특별시 강남구 테헤란로 311",
      "status": "open",
      "availableUntil": "18:00",
      "coordinates": {
        "lat": 37.5012,
        "lng": 127.0396
      }
    }
  ]
}
```

---

**Urban Fresh** © 2026 · High-End Deli Service for Urban Professionals
