# 프로젝트 구조 상세 설명

## 📋 목차
1. [디렉토리 구조 설계 이유](#디렉토리-구조-설계-이유)
2. [각 디렉토리별 상세 설명](#각-디렉토리별-상세-설명)
3. [파일 관리 규칙](#파일-관리-규칙)

---

## 디렉토리 구조 설계 이유

### 1. **관심사의 분리 (Separation of Concerns)**
- **코드와 자산 분리**: 소스 코드(`src/`)와 정적 자산(`assets/`)을 명확히 구분
- **문서와 코드 분리**: 개발 문서를 별도 디렉토리(`docs/`)로 관리
- **유지보수성 향상**: 각 파일의 역할이 명확해 수정 시 찾기 쉬움

### 2. **협업 효율성 증대**
- 팀원들이 작업할 파일을 빠르게 찾을 수 있음
- 명확한 디렉토리 구조로 인한 충돌 최소화
- 새로운 팀원의 온보딩 시간 단축

### 3. **확장성 (Scalability)**
- 프로젝트가 커져도 일관된 구조 유지 가능
- 새로운 기능 추가 시 적절한 위치에 배치 가능
- 모듈화된 구조로 코드 재사용성 증가

---

## 각 디렉토리별 상세 설명

### `src/` - 소스 코드 디렉토리

#### 왜 `src/`를 만들었나?
- 프로젝트의 모든 소스 코드를 한 곳에 모아 관리
- 배포 시 `src/` 디렉토리만 번들링하면 됨
- 코드 에디터에서 소스 파일만 빠르게 탐색 가능

#### `src/js/` - JavaScript 파일
**포함 파일:**
- `script.js` (12.9 KB)
  - 메인 페이지 로직
  - TMDB API 호출
  - 영화 목록 렌더링
  - 히어로 캐러셀 기능
  - 검색 및 필터링 기능
  - iframe 팝업 제어

- `popup.js` (19.5 KB)
  - 설문조사 팝업 로직
  - 사용자 프로필 관리
  - 별점 평가 시스템
  - 추천 알고리즘
  - LocalStorage 연동

**분리 이유:**
- 각 JS 파일이 명확한 책임을 가짐 (Single Responsibility Principle)
- 메인 페이지와 팝업 로직의 독립성 유지
- 디버깅 및 테스트 용이성

#### `src/css/` - 스타일시트
**포함 파일:**
- `style.css` (28.4 KB)
  - 전역 스타일 정의
  - 컴포넌트별 스타일
  - 반응형 디자인
  - 애니메이션 및 트랜지션

**추후 확장 가능:**
```
src/css/
  ├── style.css          # 통합 스타일
  ├── components/        # 컴포넌트별 스타일
  │   ├── header.css
  │   ├── hero.css
  │   └── popup.css
  └── utils/             # 유틸리티 스타일
      ├── variables.css
      └── mixins.css
```

#### `src/pages/` - HTML 페이지
**포함 파일:**
- `popup.html` (11.1 KB)
  - 설문조사 팝업 페이지
  - 독립적인 HTML 문서
  - iframe으로 메인 페이지에 삽입

**분리 이유:**
- 팝업을 별도 페이지로 관리하여 재사용성 향상
- 메인 HTML 코드 간결화 (254줄 → 99줄)
- 팝업만 독립적으로 테스트 가능

---

### `assets/` - 정적 자산 디렉토리

#### 왜 `assets/`를 만들었나?
- 코드와 미디어 파일을 명확히 구분
- 이미지 최적화, 압축 등 자산 관리 작업 용이
- CDN 배포 시 `assets/`만 별도 배포 가능

#### `assets/images/` - 이미지 파일
**포함 파일:**
- `팝업 결과창.png` (473 KB) - 팝업 결과 화면 목업
- `팝업창 예시.png` (220 KB) - 팝업 디자인 참고
- `페이지 상단.png` (555 KB) - 메인 페이지 상단 목업
- `페이지 중단.png` (310 KB) - 메인 페이지 중단 목업
- `페이지 하단.png` (313 KB) - 메인 페이지 하단 목업

**용도:**
- 디자인 참고 및 목업
- 프로젝트 문서화
- 클라이언트/팀원 커뮤니케이션

**추후 확장 가능:**
```
assets/
  ├── images/
  │   ├── icons/         # 아이콘 파일
  │   ├── logos/         # 로고 이미지
  │   └── screenshots/   # 스크린샷
  ├── fonts/             # 커스텀 폰트
  └── videos/            # 비디오 파일
```

---

### `docs/` - 문서 디렉토리

#### 왜 `docs/`를 만들었나?
- 개발 문서와 소스 코드 분리
- GitHub Pages 등 문서 호스팅 시 편리
- 프로젝트 관련 지식 중앙화

#### 포함 파일
- `readme.md` (3.2 KB)
  - 기존 프로젝트 설명
  - 기능 명세
  - 개발 히스토리

- `CLAUDE_COMMAND_GUIDE.md` (2.8 KB)
  - Claude Code 사용 가이드
  - 슬래시 커맨드 정리

- `githubrules.md` (3.7 KB)
  - GitHub 협업 규칙
  - 브랜치 전략
  - 커밋 메시지 컨벤션

**확장 계획:**
```
docs/
  ├── readme.md
  ├── API.md             # API 문서
  ├── CONTRIBUTING.md    # 기여 가이드
  ├── CHANGELOG.md       # 변경 이력
  └── guides/            # 상세 가이드
      ├── setup.md
      └── deployment.md
```

---

### `TMDB example/` - 참고 자료

#### 포함 내용
TMDB API 사용 예제 및 실험 코드

#### 유지 이유
- API 테스트용 코드 보관
- 새로운 API 기능 실험 공간
- 학습 및 참고 자료

---

## 파일 관리 규칙

### 1. 새 파일 추가 시

#### JavaScript 파일
```
src/js/새파일.js 생성
→ index.html 또는 관련 HTML에 <script> 태그 추가
```

#### CSS 파일
```
src/css/새파일.css 생성
→ index.html 또는 관련 HTML에 <link> 태그 추가
```

#### HTML 페이지
```
src/pages/새페이지.html 생성
→ 라우팅 또는 링크 설정
```

#### 이미지 파일
```
assets/images/새이미지.png 추가
→ HTML/CSS에서 상대 경로로 참조
```

### 2. 경로 참조 규칙

#### 루트에서 참조 (index.html)
```html
<link rel="stylesheet" href="src/css/style.css">
<script src="src/js/script.js"></script>
<iframe src="src/pages/popup.html"></iframe>
<img src="assets/images/logo.png">
```

#### src/pages/에서 참조 (popup.html)
```html
<link rel="stylesheet" href="../css/style.css">
<script src="../js/popup.js"></script>
```

#### CSS에서 이미지 참조
```css
/* src/css/style.css에서 */
background-image: url('../../assets/images/bg.png');
```

### 3. 파일 네이밍 규칙

- **JavaScript**: camelCase (예: `movieList.js`)
- **CSS**: kebab-case (예: `hero-carousel.css`)
- **HTML**: kebab-case (예: `movie-detail.html`)
- **이미지**: 한글 가능, 공백은 대시로 (예: `팝업-결과창.png`)

### 4. 삭제된 파일

다음 파일들은 정리 과정에서 삭제되었습니다:
- `script.js.backup` - 백업 파일 (불필요)
- `test.html` - 테스트 파일 (불필요)

---

## 🎯 정리 전후 비교

### Before (정리 전)
```
js과제/
├── index.html
├── popup.html
├── script.js
├── popup.js
├── style.css
├── script.js.backup
├── test.html
├── readme.md
├── CLAUDE_COMMAND_GUIDE.md
├── githubrules.md
├── *.png (5개)
└── TMDB example/
```
**문제점:**
- 모든 파일이 루트에 혼재
- 파일 역할 파악 어려움
- 협업 시 혼란 가능성

### After (정리 후)
```
js과제/
├── index.html              # 진입점
├── README.md               # 프로젝트 문서
├── STRUCTURE.md            # 구조 설명 (이 문서)
│
├── src/                    # 소스 코드
│   ├── js/
│   ├── css/
│   └── pages/
│
├── assets/                 # 정적 자산
│   └── images/
│
├── docs/                   # 문서
└── TMDB example/           # 참고 자료
```
**개선점:**
- 명확한 디렉토리 구조
- 파일 역할 즉시 파악 가능
- 협업 및 유지보수 용이

---

## ✅ 정리 체크리스트

- [x] `src/` 디렉토리 생성 및 소스 코드 이동
- [x] `assets/` 디렉토리 생성 및 이미지 이동
- [x] `docs/` 디렉토리 생성 및 문서 이동
- [x] `index.html` 경로 수정
- [x] `popup.html` 경로 수정
- [x] 불필요한 백업/테스트 파일 삭제
- [x] `README.md` 작성
- [x] `STRUCTURE.md` 작성 (이 문서)

---

## 🚀 다음 단계

1. **모듈화 심화**
   - `script.js`를 기능별로 분리 (`api.js`, `ui.js`, `utils.js`)
   - CSS를 컴포넌트별로 분리

2. **빌드 시스템 도입**
   - Webpack, Vite 등 번들러 설정
   - 코드 압축 및 최적화

3. **테스트 환경 구축**
   - `tests/` 디렉토리 생성
   - Jest, Vitest 등 테스트 프레임워크 도입

4. **배포 자동화**
   - GitHub Actions 설정
   - CI/CD 파이프라인 구축
