# 팝업이 안 나올 때 디버깅 가이드

팝업이 표시되지 않을 때 아래 순서대로 확인하세요.

---

## 🔍 1단계: 브라우저 개발자 도구 콘솔 확인

**F12 키를 눌러 개발자 도구 → Console 탭 열기**

### 확인할 로그 메시지:

```
[DEBUG] 팝업 초기화: { popupFrame: '존재함', surveyCompleted: null, ... }
[DEBUG] 팝업 표시
[POPUP DEBUG] 팝업 초기화 시작: { popup: '존재함', ... }
[POPUP DEBUG] 팝업 표시 완료
```

### 만약 에러가 보인다면:

#### ❌ `[ERROR] popupFrame 요소를 찾을 수 없습니다!`
**원인**: index.html에 iframe이 없음
**해결**: `index.html`에서 `<iframe id="popupFrame">` 확인

#### ❌ `[POPUP ERROR] Survey popup element not found!`
**원인**: popup.html에 `id="surveyPopup"` 요소가 없음
**해결**: `src/pages/popup.html`에서 `<section id="surveyPopup">` 확인

#### ❌ `Failed to load resource: net::ERR_FILE_NOT_FOUND`
**원인**: 파일 경로가 잘못됨
**해결**:
- `src/pages/popup.html` 파일 존재 확인
- `index.html`의 iframe src 경로 확인: `src="src/pages/popup.html"`

---

## 🧹 2단계: LocalStorage 초기화

팝업이 이전에 완료되었다고 기록되어 있으면 다시 안 나옵니다.

### 방법 1: 콘솔에서 직접 삭제
```javascript
localStorage.removeItem('survey_completed');
localStorage.removeItem('userProfile');
location.reload();
```

### 방법 2: Application 탭에서 삭제
1. F12 → **Application** 탭
2. 왼쪽 **Local Storage** 클릭
3. `survey_completed` 항목 찾아서 **우클릭 → Delete**
4. `userProfile` 항목도 삭제
5. 페이지 새로고침 (F5)

### 방법 3: 모든 데이터 초기화 (주의!)
```javascript
localStorage.clear();
location.reload();
```
⚠️ 주의: 로그인 정보, Watchlist 등 모든 데이터가 삭제됩니다.

---

## 📋 3단계: HTML 구조 확인

### index.html에 iframe이 있는지 확인:
```html
<iframe id="popupFrame"
        src="src/pages/popup.html"
        style="display: none; position: fixed; ...">
</iframe>
```

### popup.html에 팝업 섹션이 있는지 확인:
```html
<section class="preference-popup" id="surveyPopup">
  ...
</section>
```

---

## 🎨 4단계: CSS 확인

팝업이 화면에 있지만 안 보이는 경우 (드물지만 가능):

### 콘솔에서 강제로 표시:
```javascript
document.getElementById('popupFrame').style.display = 'block';
```

### iframe 내부 팝업도 확인:
```javascript
const iframe = document.getElementById('popupFrame');
const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
const popup = innerDoc.getElementById('surveyPopup');
console.log('Popup display:', popup.style.display);
popup.style.display = 'flex';
```

---

## 🔧 5단계: 스크립트 로딩 확인

### Console에서 확인:
```javascript
// popup.js가 로드되었는지 확인
typeof initSurveyPopup
// "function"이 나와야 정상

// tmdbApi.js가 로드되었는지 확인
typeof tmdbApi
// "object"가 나와야 정상
```

### index.html에서 스크립트 순서 확인:
```html
<!-- TMDB API 모듈 먼저 로드 -->
<script src="src/js/tmdbApi.js"></script>
<!-- 메인 스크립트 -->
<script src="src/js/script.js"></script>
```

### popup.html에서 스크립트 확인:
```html
<script src="../js/popup.js"></script>
```

---

## 🚨 6단계: 자주 발생하는 문제들

### 문제 1: "팝업이 깜빡이고 사라져요"
**원인**: `survey_completed`가 이미 true로 설정됨
**해결**: LocalStorage에서 `survey_completed` 삭제

### 문제 2: "iframe이 검은 화면이에요"
**원인**: popup.html 파일 경로 오류 또는 CSS 문제
**해결**:
1. 콘솔에서 404 에러 확인
2. iframe src 경로 확인: `src="src/pages/popup.html"`
3. popup.html의 CSS 링크 확인: `href="../css/style.css"`

### 문제 3: "첫 번째 단계는 나오는데 두 번째로 안 넘어가요"
**원인**:
- 장르를 선택하지 않음
- 무드를 선택하지 않음
- 탐색 스타일을 선택하지 않음

**해결**: 콘솔에서 alert 메시지 확인 후 필수 항목 선택

### 문제 4: "별점 평가에서 완료가 안 돼요"
**원인**: 최소 3개 영화에 별점을 매기지 않음
**해결**: Pass가 아닌 별점을 최소 3개 이상 선택

---

## 🎯 빠른 문제 해결 체크리스트

팝업이 안 나오면 순서대로 확인:

- [ ] **F12 → Console 탭 열어서 에러 메시지 확인**
- [ ] **`localStorage.removeItem('survey_completed')` 실행 후 새로고침**
- [ ] **Network 탭에서 popup.html 로딩 실패 확인 (404 에러)**
- [ ] **파일 경로 확인: `src/pages/popup.html` 존재하는지**
- [ ] **index.html에 `<iframe id="popupFrame">` 있는지 확인**
- [ ] **popup.html에 `<section id="surveyPopup">` 있는지 확인**

---

## 💡 개발자를 위한 디버깅 팁

### 콘솔 로그 키워드로 검색:
- `[DEBUG]` - 일반 디버그 정보
- `[ERROR]` - 오류 메시지
- `[POPUP DEBUG]` - 팝업 관련 상세 정보

### 유용한 콘솔 명령어:
```javascript
// 현재 팝업 상태 확인
console.log({
  frame: document.getElementById('popupFrame'),
  frameDisplay: document.getElementById('popupFrame')?.style.display,
  surveyCompleted: localStorage.getItem('survey_completed'),
  userProfile: localStorage.getItem('userProfile')
});

// 팝업 강제 표시
document.getElementById('popupFrame').style.display = 'block';

// 팝업 완료 상태 초기화
localStorage.removeItem('survey_completed');
localStorage.removeItem('userProfile');
```

---

## 📞 그래도 안 되면?

1. 브라우저 캐시 삭제: `Ctrl + Shift + Delete`
2. 시크릿/프라이빗 모드에서 테스트
3. 다른 브라우저에서 테스트
4. 콘솔의 모든 에러 메시지 복사해서 검색

**핵심**: 항상 F12 개발자 도구의 Console 탭을 먼저 확인하세요!
