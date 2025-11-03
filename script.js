// ========================================
// 샘플 영화 데이터
// ========================================
const movies = [
  { id: 1, title: '쇼생크 탈출', year: 1994, genre: 'drama', rating: 9.3, likes: '2.8M', image: 'https://via.placeholder.com/300x450' },
  { id: 2, title: '대부', year: 1972, genre: 'drama', rating: 9.2, likes: '1.9M', image: 'https://via.placeholder.com/300x450' },
  { id: 3, title: '다크 나이트', year: 2008, genre: 'action', rating: 9.0, likes: '2.7M', image: 'https://via.placeholder.com/300x450' },
  { id: 4, title: '대부 2', year: 1974, genre: 'drama', rating: 9.0, likes: '1.4M', image: 'https://via.placeholder.com/300x450' },
  { id: 5, title: '12명의 성난 사람들', year: 1957, genre: 'drama', rating: 9.0, likes: '0.8M', image: 'https://via.placeholder.com/300x450' }
];

// ========================================
// 영화 목록 렌더링
// ========================================
function renderMovies(movieList) {
  const container = document.getElementById('movies');
  container.innerHTML = '';

  movieList.forEach((movie, index) => {
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

// ========================================
// 장르 코드를 한글로 변환
// ========================================
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
  return genreMap[genre] || genre;
}

// ========================================
// 장르 필터링
// ========================================
document.querySelectorAll('.genre-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const genre = this.dataset.genre;
    const filtered = movies.filter(movie => movie.genre === genre);
    renderMovies(filtered.length > 0 ? filtered : movies);

    // 버튼 활성화 표시
    document.querySelectorAll('.genre-btn').forEach(b => b.style.backgroundColor = 'white');
    this.style.backgroundColor = '#eff6ff';
  });
});

// ========================================
// 검색 기능
// ========================================
document.getElementById('searchInput').addEventListener('input', function(e) {
  const keyword = e.target.value.toLowerCase();
  const filtered = movies.filter(movie =>
    movie.title.toLowerCase().includes(keyword)
  );
  renderMovies(filtered.length > 0 ? filtered : movies);
});

// ========================================
// 히어로 버튼 이벤트
// ========================================
document.querySelector('.btn-play').addEventListener('click', function() {
  alert('예고편 재생 기능은 준비 중입니다.');
});

document.querySelector('.btn-info').addEventListener('click', function() {
  alert('상세 정보 페이지로 이동합니다.');
});

// ========================================
// 로그인 버튼 이벤트
// ========================================
document.querySelector('.login-btn').addEventListener('click', function() {
  alert('로그인 페이지로 이동합니다.');
});

// ========================================
// 초기 렌더링
// ========================================
renderMovies(movies);
