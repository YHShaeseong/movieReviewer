/* ============================================
   영화 상세 페이지 로더
   ============================================ */

async function loadMovieDetail() {
  const params = new URLSearchParams(window.location.search);
  const movieId = params.get("id");
  const container = document.getElementById("movieDetail");

  if (!movieId) {
    container.innerHTML = "<p>잘못된 접근입니다.</p>";
    return;
  }

  try {
    // ✅ 영화 전체 정보 로드 (상세, 출연진, 비디오, 비슷한 영화 등 포함)
    const movie = await tmdbApi.getCompleteMovieInfo(movieId);

    const poster = tmdbApi.getImageUrl(movie.poster_path, "w500");
    const backdrop = tmdbApi.getImageUrl(movie.backdrop_path, "w1280");
    const genres = movie.genres?.map(g => g.name).join(", ") || "장르 정보 없음";

    const director = movie.credits?.crew?.find(p => p.job === "Director");
    const castList = (movie.credits?.cast || []).slice(0, 6);

    // ✅ 비디오(예고편) 링크 가져오기
    const trailer = (movie.videos?.results || []).find(v => v.type === "Trailer" && v.site === "YouTube");

    container.innerHTML = `
      <div class="movie-detail" style="background-image: url('${backdrop}')">
        <div class="movie-detail-overlay">
          <img src="${poster}" alt="${movie.title}" class="detail-poster">
          <div class="detail-info">
            <h1>${movie.title}</h1>
            <p class="meta">📅 ${movie.release_date?.split("-")[0] || "N/A"} | ⭐ ${movie.vote_average.toFixed(1)} | ${genres}</p>
            <p class="overview">${movie.overview || "줄거리 정보가 없습니다."}</p>

            ${director ? `<p class="director">🎬 감독: ${director.name}</p>` : ""}

            ${trailer ? `
              <button class="btn-primary" onclick="window.open('https://www.youtube.com/watch?v=${trailer.key}', '_blank')">
                ▶ 예고편 보기
              </button>` : ""
            }
          </div>
        </div>
      </div>

      <section class="cast-section">
        <h2>출연진</h2>
        <div class="cast-list">
          ${castList.length > 0 ? castList.map(actor => `
            <div class="cast-card">
              <img src="${tmdbApi.getImageUrl(actor.profile_path, 'w185')}" alt="${actor.name}">
              <p class="actor-name">${actor.name}</p>
              <p class="actor-role">${actor.character || ""}</p>
            </div>
          `).join("") : "<p>출연진 정보가 없습니다.</p>"}
        </div>
      </section>

      <section class="recommend-section">
        <h2>비슷한 영화</h2>
        <div class="recommend-grid">
          ${(movie.similar?.results || [])
            .slice(0, 8)
            .map(sim => `
              <div class="recommend-card" onclick="window.location.href='detail.html?id=${sim.id}'">
                <img src="${tmdbApi.getImageUrl(sim.poster_path, 'w342')}" alt="${sim.title}">
                <p>${sim.title}</p>
              </div>
            `).join("") || "<p>비슷한 영화가 없습니다.</p>"}
        </div>
      </section>
    `;
  } catch (err) {
    console.error("[Detail Error]", err);
    container.innerHTML = "<p>영화 정보를 불러올 수 없습니다.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadMovieDetail);
