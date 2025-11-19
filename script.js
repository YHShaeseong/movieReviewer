/* ============================================
   TMDB API 설정
   ============================================ */
const API_KEY = 'f325a6979b2e26db0c5ee2420d0f3138';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

/* ============================================
   영화 데이터 배열
   수정 포인트: TMDB API에서 자동으로 가져옴
   ============================================ */
let movies = [];

/* ============================================
   함수: 영화 목록을 화면에 표시
   - movieList: 표시할 영화 배열
   - 영화 카드 HTML을 생성하여 #movies에 추가
   ============================================ */
function renderMovies(movieList) {
  const container = document.getElementById('movies');
  container.innerHTML = ''; // 기존 내용 초기화

  movieList.forEach((movie, index) => {
    // 영화 카드 HTML 생성
    const movieCard = `
      <div class="movie_item">
        <span class="rank-badge">#${index + 1}</span>
        <span class="rating-badge">★ ${movie.rating}</span>
        <img src="${movie.image}" alt="${movie.title}">
        <div class="movie-info">
          <div class="title">${movie.title}</div>
          <div class="movie-meta">${movie.year} · ${getGenreName(movie.genre)}</div>
          <div class="movie-stats">
            <span class="likes">좋아요 ${movie.likes}</span>
            <span class="star-rating">★ ${movie.rating}</span>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += movieCard;
  });
}

/* ============================================
   함수: 장르 코드를 한글로 변환
   - genre: 영어 장르 코드 (예: 'action')
   - 반환값: 한글 장르명 (예: '액션')
   수정 포인트: 새로운 장르 추가
   ============================================ */
function getGenreName(genre) {
  const genreMap = {
    action: '액션',
    drama: '드라마',
    comedy: '코미디',
    horror: '공포',
    sf: 'SF',
    romance: '로맨스',
    thriller: '스릴러',
    animation: '애니메이션'
  };
  return genreMap[genre] || genre; // 매칭되는 장르가 없으면 원본 반환
}

/* ============================================
   기능: 장르 필터링
   - 각 장르 버튼 클릭 시 해당 장르 영화만 표시
   - 버튼 배경색 변경으로 선택 상태 표시
   ============================================ */
document.querySelectorAll('.genre-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const genre = this.dataset.genre; // data-genre 속성 값 가져오기

    // 선택한 장르의 영화만 필터링
    const filtered = movies.filter(movie => movie.genre === genre);

    // 필터링된 영화 표시 (결과가 없으면 전체 영화 표시)
    renderMovies(filtered.length > 0 ? filtered : movies);

    // 모든 버튼 배경색 초기화
    document.querySelectorAll('.genre-btn').forEach(b => b.style.backgroundColor = 'white');
    // 클릭한 버튼만 배경색 변경
    this.style.backgroundColor = '#eff6ff';
  });
});

/* ============================================
   기능: 영화 검색
   - 검색창에 입력할 때마다 실시간으로 영화 필터링
   - 영화 제목에 검색어가 포함된 영화만 표시
   ============================================ */
document.getElementById('searchInput').addEventListener('input', function(e) {
  const keyword = e.target.value.toLowerCase(); // 입력값을 소문자로 변환

  // 제목에 검색어가 포함된 영화 필터링
  const filtered = movies.filter(movie =>
    movie.title.toLowerCase().includes(keyword)
  );

  // 필터링된 영화 표시 (결과가 없으면 전체 영화 표시)
  renderMovies(filtered.length > 0 ? filtered : movies);
});

/* ============================================
   기능: 히어로 섹션 버튼 이벤트
   수정 포인트: alert 대신 실제 동작 구현
   ============================================ */

// 예고편 보기 버튼
document.querySelector('.btn-play').addEventListener('click', function() {
  alert('예고편 재생 기능은 준비 중입니다.');
  // TODO: 영상 재생 기능 추가
});

// 상세 정보 버튼
document.querySelector('.btn-info').addEventListener('click', function() {
  alert('상세 정보 페이지로 이동합니다.');
  // TODO: 상세 페이지 이동 기능 추가
});

/* ============================================
   기능: 로그인 버튼 이벤트
   수정 포인트: 로그인 페이지 연결
   ============================================ */
document.querySelector('.login-btn').addEventListener('click', function() {
  alert('로그인 페이지로 이동합니다.');
  // TODO: 로그인 페이지 연결
});

/* ============================================
   TMDB API에서 영화 데이터 가져오기
   ============================================ */
async function fetchMovies() {
  try {
    const response = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ko-KR&page=1`);
    const data = await response.json();

    // TMDB 데이터를 기존 형식으로 변환
    movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      genre: 'drama', // 기본값 (장르 ID 매핑 필요 시 추가 가능)
      rating: movie.vote_average.toFixed(1),
      likes: `${(movie.vote_count / 1000).toFixed(1)}K`,
      image: movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'https://via.placeholder.com/300x450'
    }));

    renderMovies(movies);
  } catch (error) {
    console.error('영화 데이터 로딩 실패:', error);
  }
}

/* ============================================
   페이지 로드 시 초기 렌더링
   - TMDB API에서 영화 데이터를 가져와 표시
   ============================================ */
fetchMovies();

/* ============================================
   취향 확인 팝업 기능
   - 5단계 질문과 결과 페이지
   - localStorage로 재방문 여부 확인
   ============================================ */
const popup = document.getElementById('preferencePopup');
const popupClose = document.getElementById('popupClose');
const popupSteps = document.querySelectorAll('.popup-step');
const popupResult = document.querySelector('.popup-result');
const btnStart = document.getElementById('btnStart');

let currentStep = 1;
const totalSteps = 5;
const userAnswers = {};

// 단계 표시 함수
function showStep(step) {
  popupSteps.forEach(stepEl => {
    stepEl.style.display = 'none';
  });
  popupResult.style.display = 'none';

  const currentStepEl = document.querySelector(`.popup-step[data-step="${step}"]`);
  if (currentStepEl) {
    currentStepEl.style.display = 'block';
  }
}

// 결과 페이지 표시
function showResult() {
  popupSteps.forEach(stepEl => {
    stepEl.style.display = 'none';
  });
  popupResult.style.display = 'block';
}

// 페이지 로드 시 팝업 표시 여부 확인
window.addEventListener('load', function() {
  // 테스트를 위해 localStorage 초기화 (나중에 주석 해제)
  localStorage.removeItem('hasVisited');

  const hasVisited = localStorage.getItem('hasVisited');

  if (!hasVisited) {
    popup.classList.add('active');
    showStep(1);
  }
});

// 선택지 버튼 이벤트
document.querySelectorAll('.option-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const step = this.closest('.popup-step').dataset.step;

    // 같은 단계의 다른 버튼 선택 해제
    this.closest('.popup-options').querySelectorAll('.option-btn').forEach(b => {
      b.classList.remove('selected');
    });

    // 현재 버튼 선택
    this.classList.add('selected');

    // 답변 저장
    userAnswers[`question${step}`] = this.dataset.value;
  });
});

// 이전/다음 버튼 이벤트
popupSteps.forEach(stepEl => {
  const step = parseInt(stepEl.dataset.step);
  const btnPrev = stepEl.querySelector('.btn-prev');
  const btnNext = stepEl.querySelector('.btn-next');

  // 이전 버튼
  if (btnPrev) {
    btnPrev.addEventListener('click', function() {
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      }
    });
  }

  // 다음 버튼
  if (btnNext) {
    btnNext.addEventListener('click', function() {
      // 답변 선택 확인
      if (!userAnswers[`question${currentStep}`]) {
        alert('답변을 선택해주세요.');
        return;
      }

      if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
      } else {
        // 마지막 단계면 결과 페이지 표시
        showResult();
      }
    });
  }
});

// 팝업 닫기 함수
function closePopup() {
  popup.classList.remove('active');
  localStorage.setItem('hasVisited', 'true');

  // 초기화
  currentStep = 1;
  Object.keys(userAnswers).forEach(key => delete userAnswers[key]);
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
}

// X 버튼 클릭 시 팝업 닫기
popupClose.addEventListener('click', closePopup);

// 시작하기 버튼 클릭 시 팝업 닫기
btnStart.addEventListener('click', closePopup);

// 오버레이 클릭 시 팝업 닫기
popup.querySelector('.popup-overlay').addEventListener('click', closePopup);
