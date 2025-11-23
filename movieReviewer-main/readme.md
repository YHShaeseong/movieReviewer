# Pictos - 영화 추천 서비스

개인 취향에 맞는 영화를 추천받고, 다양한 리뷰와 평점을 확인할 수 있는 영화 추천 웹 서비스입니다.

## 📁 프로젝트 구조

```
js과제/
├── index.html              # 메인 페이지 (프로젝트 진입점)
├── README.md              # 프로젝트 문서
├── .gitignore             # Git 제외 파일 설정
│
├── src/                   # 소스 코드 디렉토리
│   ├── js/                # JavaScript 파일
│   │   ├── script.js      # 메인 페이지 로직
│   │   └── popup.js       # 팝업 설문조사 로직
│   │
│   ├── css/               # 스타일시트
│   │   └── style.css      # 전역 스타일
│   │
│   └── pages/             # HTML 페이지
│       └── popup.html     # 설문조사 팝업 페이지
│
├── assets/                # 정적 자산
│   └── images/            # 이미지 파일
│       ├── 팝업 결과창.png
│       ├── 팝업창 예시.png
│       ├── 페이지 상단.png
│       ├── 페이지 중단.png
│       └── 페이지 하단.png
│
├── docs/                  # 문서 및 가이드
│   ├── readme.md          # 기존 프로젝트 설명
│   ├── CLAUDE_COMMAND_GUIDE.md
│   └── githubrules.md
│
└── TMDB example/          # TMDB API 예제 및 참고자료
```

## 🗂️ 디렉토리 설명

### `src/` - 소스 코드
애플리케이션의 핵심 소스 코드가 위치한 디렉토리입니다.

- **`src/js/`**: JavaScript 파일
  - `script.js`: 메인 페이지 로직 (영화 목록, 검색, 히어로 캐러셀 등)
  - `popup.js`: 팝업 설문조사 로직 (취향 분석, 추천 알고리즘)

- **`src/css/`**: 스타일시트
  - `style.css`: 전역 CSS (레이아웃, 컴포넌트 스타일)

- **`src/pages/`**: HTML 페이지 (모듈화된 페이지들)
  - `popup.html`: 사용자 취향 설문조사 팝업

### `assets/` - 정적 자산
이미지, 아이콘 등 정적 리소스를 관리합니다.

- **`assets/images/`**: 프로젝트 이미지 파일
  - 디자인 참고용 스크린샷
  - UI 목업 이미지

### `docs/` - 문서
프로젝트 문서, 가이드, 협업 규칙을 보관합니다.

- `readme.md`: 기존 프로젝트 설명
- `CLAUDE_COMMAND_GUIDE.md`: Claude Code 사용 가이드
- `githubrules.md`: GitHub 협업 규칙

### `TMDB example/` - 참고 자료
TMDB API 사용 예제 및 테스트 코드입니다.

## 🚀 시작하기

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd "js과제"
```

### 2. 브라우저에서 실행
```bash
# index.html을 브라우저에서 열기
# 또는
python -m http.server 8000
# http://localhost:8000 접속
```

### 3. 팝업 설문조사
- 첫 접속 시 자동으로 취향 설문조사 팝업이 표시됩니다
- 5가지 질문 응답 → 영화 별점 평가 → 맞춤 추천 결과 확인

## 📝 주요 기능

1. **취향 기반 영화 추천**
   - 사용자 설문조사를 통한 개인화 추천
   - TMDB API 기반 영화 데이터

2. **히어로 캐러셀**
   - 추천 영화 슬라이드
   - 자동 전환 및 수동 제어

3. **TOP100 영화 랭킹**
   - TMDB 평점 기반 인기 영화 목록

4. **장르 필터링 및 검색**
   - 장르별 영화 필터링
   - 실시간 영화 검색

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **API**: TMDB (The Movie Database) API
- **Storage**: LocalStorage (사용자 프로필 저장)

## 👥 협업 가이드

### Git 브랜치 전략
```
main        - 배포용 브랜치
develop     - 개발 통합 브랜치
feature/*   - 기능 개발 브랜치
```

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 업무, 패키지 관리
```

### 파일 수정 시 주의사항
1. `src/` 내부 파일 수정 시 경로 확인
2. 새 JavaScript 파일 추가 시 `index.html` 또는 해당 페이지에 `<script>` 태그 추가
3. 이미지 추가 시 `assets/images/`에 저장
4. 문서 추가 시 `docs/`에 저장

## 📄 라이선스

© 2024 Pictos. All rights reserved.

## 🔗 참고 링크

- [TMDB API 문서](https://developers.themoviedb.org/3)
- [프로젝트 상세 문서](./docs/readme.md)
