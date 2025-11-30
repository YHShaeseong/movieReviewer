/* ============================================
   VS 게임 엔진 (3-Layer 취향 분석)

   Phase 1: 탐색 (Round 1-10) - 3-Layer 데이터 수집
   Phase 2: 검증 (Round 11-13) - 취향 재확인 + 신뢰도 조정
   ============================================ */

/* ============================================
   Phase 1: 고정 영화 라운드 (10라운드)
   ============================================ */
const PHASE1_FIXED_ROUNDS = [
  // R1: 현실 vs 환상
  {
    phase: 1,
    layer: 'worldview',
    theme: '현실 vs 환상',
    description: '어떤 세계관이 더 끌리나요?',
    movieA: { id: 278, attribute: 'reality' },      // 쇼생크 탈출
    movieB: { id: 157336, attribute: 'fantasy' }    // 인터스텔라
  },
  // R2: 현실 범죄 vs SF
  {
    phase: 1,
    layer: 'worldview',
    theme: '현실 범죄 vs SF',
    description: '사실 vs 상상, 어디에 더 빠지나요?',
    movieA: { id: 238, attribute: 'reality' },      // 대부
    movieB: { id: 27205, attribute: 'fantasy' }     // 인셉션
  },
  // R3: 역사 vs 미래
  {
    phase: 1,
    layer: 'worldview',
    theme: '역사 vs 미래',
    description: '과거 vs 미래, 어디로 가고 싶나요?',
    movieA: { id: 424, attribute: 'reality' },      // 쉰들러 리스트
    movieB: { id: 603, attribute: 'fantasy' }       // 매트릭스
  },

  // R4: 두뇌 vs 심장
  {
    phase: 1,
    layer: 'stimulation',
    theme: '두뇌 vs 심장',
    description: '머리 vs 가슴, 무엇을 더 자극받고 싶나요?',
    movieA: { id: 550, attribute: 'brain' },        // 파이트 클럽
    movieB: { id: 13, attribute: 'heart' }          // 포레스트 검프
  },
  // R5: 스릴 vs 감동
  {
    phase: 1,
    layer: 'stimulation',
    theme: '스릴 vs 감동',
    description: '긴장감 vs 눈물, 어떤 걸 원하나요?',
    movieA: { id: 155, attribute: 'body' },         // 다크 나이트
    movieB: { id: 129, attribute: 'heart' }         // 센과 치히로의 행방불명
  },
  // R6: 액션 vs 로맨스
  {
    phase: 1,
    layer: 'stimulation',
    theme: '액션 vs 로맨스',
    description: '몸 vs 마음, 어떤 자극을 원하나요?',
    movieA: { id: 524434, attribute: 'body' },      // 덩케르크
    movieB: { id: 19404, attribute: 'heart' }       // 어바웃 타임
  },
  // R7: 진지함 vs 유쾌함
  {
    phase: 1,
    layer: 'stimulation',
    theme: '진지함 vs 유쾌함',
    description: '무거운 감동 vs 따뜻한 감동, 어떤 걸 원하나요?',
    movieA: { id: 497, attribute: 'body' },         // 그린 마일
    movieB: { id: 11216, attribute: 'heart' }       // 시네마 천국
  },

  // R8: 따뜻함 vs 차가움
  {
    phase: 1,
    layer: 'texture',
    theme: '따뜻함 vs 차가움',
    description: '어떤 온도의 영화가 좋나요?',
    movieA: { id: 12477, attribute: 'warm' },       // 그래비티 폴즈
    movieB: { id: 1124, attribute: 'cold' }         // 프레스티지
  },
  // R9: 가벼움 vs 무거움
  {
    phase: 1,
    layer: 'texture',
    theme: '가벼움 vs 무거움',
    description: '어떤 무게감의 이야기가 좋나요?',
    movieA: { id: 920, attribute: 'light' },        // 카 (픽사)
    movieB: { id: 378, attribute: 'heavy' }         // 라이언 일병 구하기
  },
  // R10: 밝음 vs 어두움
  {
    phase: 1,
    layer: 'texture',
    theme: '밝음 vs 어두움',
    description: '어떤 분위기를 선호하나요?',
    movieA: { id: 862, attribute: 'light' },        // 토이 스토리
    movieB: { id: 769, attribute: 'heavy' }         // 양들의 침묵
  }
];

/* ============================================
   검증용 영화 템플릿 (Verification Templates)
   ============================================ */
const VERIFICATION_TEMPLATES = {
  reality_extreme: {
    genres: [18, 36],
    minVotes: 10000,
    minRating: 8.0,
    keywords: [9715]  // true-story
  },
  fantasy_extreme: {
    genres: [14, 878],
    minVotes: 10000,
    minRating: 8.0
  },
  visual: {
    genres: [878, 28, 12],
    minVotes: 8000,
    minRating: 7.5
  },
  audio: {
    genres: [10402, 18],  // 음악, 드라마
    minVotes: 5000,
    minRating: 7.5
  },
  brain_high: {
    genres: [9648, 53],
    minVotes: 8000,
    minRating: 8.0
  },
  heart_high: {
    genres: [10749, 18],
    minVotes: 5000,
    minRating: 7.8
  },
  body_high: {
    genres: [28],
    minVotes: 8000,
    minRating: 7.5
  }
};

/* ============================================
   VS 게임 엔진 클래스
   ============================================ */
export class VSGameEngine {
  constructor() {
    this.currentRound = 0;
    this.phase = 1;
    this.totalRounds = 13; // Phase 1 (10) + Phase 2 (3)

    // 영화 데이터 캐시
    this.moviesCache = {};

    // 라운드별 영화 매핑
    this.roundMovies = [];

    // 사용자 점수 (3-Layer)
    this.scores = {
      worldview: { reality: 0, fantasy: 0 },
      stimulation: { brain: 0, heart: 0, body: 0 },
      texture: { warm: 0, cold: 0, light: 0, heavy: 0 }
    };

    // 신뢰도 점수 (Confidence Score)
    this.confidence = {
      worldview: 1.0,
      stimulation: 1.0,
      texture: 1.0
    };

    // Phase 1 결과 저장
    this.phase1Results = null;

    // Phase 2 라운드 (동적 생성)
    this.phase2Rounds = [];

    // 선택 기록
    this.history = [];
  }

  /* ============================================
     영화 ID로 영화 정보 가져오기
     ============================================ */
  async fetchMovieById(movieId) {
    try {
      return await window.tmdbApi.getCompleteMovieInfo(movieId);
    } catch (error) {
      console.error(`영화 ID ${movieId} 로드 실패:`, error);
      throw error;
    }
  }

  /* ============================================
     영화 데이터 사전 로드 (고정)
     ============================================ */
  async preloadMovies() {
    try {
      console.log('Phase 1 고정 영화 로딩 시작...');

      for (const round of PHASE1_FIXED_ROUNDS) {
        try {
          const movieA = await this.fetchMovieById(round.movieA.id);
          const movieB = await this.fetchMovieById(round.movieB.id);

          this.moviesCache[movieA.id] = movieA;
          this.moviesCache[movieB.id] = movieB;

          this.roundMovies.push({
            movieA,
            movieB,
            template: round
          });

          console.log(`${round.theme}: ${movieA.title} vs ${movieB.title}`);
        } catch (error) {
          console.error(`${round.theme} 로드 실패:`, error);
        }
      }

      this.totalRounds = this.roundMovies.length + 3;
      console.log(`총 ${this.totalRounds}라운드 (Phase1: 10, Phase2: 3)`);
    } catch (error) {
      console.error('영화 로드 실패:', error);
      throw error;
    }
  }

  /* ============================================
     현재 라운드 데이터 반환
     ============================================ */
  async getCurrentRound() {
    // Phase 1 (1-10)
    if (this.currentRound < this.roundMovies.length) {
      const roundData = this.roundMovies[this.currentRound];

      if (!roundData) {
        console.error(`라운드 ${this.currentRound} 데이터 없음`);
        return null;
      }

      const { movieA, movieB, template } = roundData;

      // 동적 roundConfig 생성
      const roundConfig = {
        ...template,
        movieA: {
          id: movieA.id,
          attribute: template.movieA.attribute
        },
        movieB: {
          id: movieB.id,
          attribute: template.movieB.attribute
        }
      };

      return {
        phase: 1,
        roundConfig,
        movieAData: movieA,
        movieBData: movieB,
        progress: {
          current: this.currentRound + 1,
          total: this.totalRounds,
          percentage: ((this.currentRound + 1) / this.totalRounds) * 100
        },
        theme: template.theme,
        description: template.description
      };
    }

    // Phase 2
    else if (this.currentRound < this.totalRounds) {
      // Phase 2 첫 라운드면 검증 라운드 생성
      if (this.phase2Rounds.length === 0) {
        await this.generatePhase2Rounds();
      }

      const phase2Index = this.currentRound - this.roundMovies.length;
      const roundConfig = this.phase2Rounds[phase2Index];

      if (!roundConfig) {
        console.error('Phase 2 라운드 없음:', phase2Index);
        return null;
      }

      const movieAData = this.moviesCache[roundConfig.movieA.id];
      const movieBData = this.moviesCache[roundConfig.movieB.id];

      return {
        phase: 2,
        roundConfig,
        movieAData,
        movieBData,
        progress: {
          current: this.currentRound + 1,
          total: this.totalRounds,
          percentage: ((this.currentRound + 1) / this.totalRounds) * 100
        },
        theme: roundConfig.theme,
        description: roundConfig.description,
        isVerification: true
      };
    }

    return null;
  }

  /* ============================================
     Phase 2 검증 라운드 고정 생성
     ============================================ */
  async generatePhase2Rounds() {
    console.log('Phase 2 검증 라운드 생성 시작...');

    // Phase 1 결과 분석
    this.phase1Results = {
      worldview: this.scores.worldview.reality > this.scores.worldview.fantasy ? 'reality' : 'fantasy',
      stimulation: this.getTopStimulation(),
      texture: {
        temperature: this.scores.texture.warm > this.scores.texture.cold ? 'warm' : 'cold',
        density: this.scores.texture.light > this.scores.texture.heavy ? 'light' : 'heavy'
      }
    };

    console.log('Phase 1 분석 결과:', this.phase1Results);

    // R11: 세계관 검증 (reality vs fantasy)
    const worldviewMovies = {
      reality: { id: 598, title: '시티 오브 갓' },      // 현실파 극한
      fantasy: { id: 122, title: '반지의 제왕: 두 개의 탑' }  // 판타지파 극한
    };

    const wvWinner = this.phase1Results.worldview;
    const wvLoser = wvWinner === 'reality' ? 'fantasy' : 'reality';

    try {
      const movieA = await this.fetchMovieById(worldviewMovies[wvWinner].id);
      const movieB = await this.fetchMovieById(worldviewMovies[wvLoser].id);

      this.moviesCache[movieA.id] = movieA;
      this.moviesCache[movieB.id] = movieB;

      this.phase2Rounds.push({
        type: 'extreme',
        layer: 'worldview',
        theme: '절대 포기할 수 없는 것',
        description: '당신이 진짜 좋아하는 세계관을 확인합니다',
        movieA: { id: movieA.id, attribute: wvWinner, expected: true },
        movieB: { id: movieB.id, attribute: wvLoser, expected: false }
      });
    } catch (error) {
      console.error('Phase 2 R11 생성 실패:', error);
    }

    // R12: 자극 검증 (brain vs heart vs body)
    const stimMovies = {
      brain: { id: 489, title: '살인의 추억' },
      heart: { id: 372058, title: '너의 이름은' },
      body: { id: 99861, title: '어벤져스' }
    };

    const stimWinner = this.phase1Results.stimulation;
    const stimOpposite = stimWinner === 'brain' ? 'body' : (stimWinner === 'body' ? 'heart' : 'brain');

    try {
      const movieA = await this.fetchMovieById(stimMovies[stimWinner].id);
      const movieB = await this.fetchMovieById(stimMovies[stimOpposite].id);

      this.moviesCache[movieA.id] = movieA;
      this.moviesCache[movieB.id] = movieB;

      this.phase2Rounds.push({
        type: 'crosscheck',
        layer: 'stimulation',
        theme: '진짜 원하는 자극',
        description: '어떤 자극이 더 끌리는지 확인합니다',
        movieA: { id: movieA.id, attribute: stimWinner, expected: true },
        movieB: { id: movieB.id, attribute: stimOpposite, expected: false }
      });
    } catch (error) {
      console.error('Phase 2 R12 생성 실패:', error);
    }

    // R13: 온도 검증 (warm vs cold)
    const tempMovies = {
      warm: { id: 585511, title: '수퍼 소닉2' },
      cold: { id: 539, title: '분노의 질주: 더 세븐' }
    };

    const tempWinner = this.phase1Results.texture.temperature;
    const tempLoser = tempWinner === 'warm' ? 'cold' : 'warm';

    try {
      const movieA = await this.fetchMovieById(tempMovies[tempWinner].id);
      const movieB = await this.fetchMovieById(tempMovies[tempLoser].id);

      this.moviesCache[movieA.id] = movieA;
      this.moviesCache[movieB.id] = movieB;

      this.phase2Rounds.push({
        type: 'trap',
        layer: 'texture',
        theme: '따뜻함 vs 차가움',
        description: '어떤 분위기가 더 편한지 확인합니다',
        movieA: { id: movieA.id, attribute: tempWinner, expected: true },
        movieB: { id: movieB.id, attribute: tempLoser, expected: false }
      });
    } catch (error) {
      console.error('Phase 2 R13 생성 실패:', error);
    }

    console.log('Phase 2 라운드 생성 완료 (3라운드):', this.phase2Rounds);
  }

  /* ============================================
     영화 선택 처리
     ============================================ */
  async selectMovie(choice) {
    const roundData = await this.getCurrentRound();
    if (!roundData) return true;

    const { roundConfig, phase } = roundData;
    const selectedMovie = choice === 'A' ? roundConfig.movieA : roundConfig.movieB;
    const attribute = selectedMovie.attribute;

    // 선택 기록
    this.history.push({
      round: this.currentRound + 1,
      phase,
      choice,
      attribute,
      layer: roundConfig.layer
    });

    // Phase 1: 기본 점수 누적
    if (phase === 1) {
      this.addScore(roundConfig.layer, attribute);
    }

    // Phase 2: 검증 + 신뢰도 조정
    else if (phase === 2) {
      this.addScore(roundConfig.layer, attribute);
      this.adjustConfidence(roundConfig, selectedMovie);
    }

    // 다음 라운드로
    this.currentRound++;

    // Phase 1 완료 시점 (10라운드 끝)
    if (this.currentRound === 10) {
      console.log('Phase 1 완료! Phase 2 준비 중...');
      return false; // 아직 게임 계속
    }

    // 게임 종료 여부
    return this.currentRound >= this.totalRounds;
  }

  /* ============================================
     점수 추가
     ============================================ */
  addScore(layer, attribute) {
    if (layer === 'worldview') {
      this.scores.worldview[attribute]++;
    } else if (layer === 'stimulation') {
      this.scores.stimulation[attribute]++;
    } else if (layer === 'texture') {
      this.scores.texture[attribute]++;
    }
  }

  /* ============================================
     신뢰도 조정 (Phase 2)
     ============================================ */
  adjustConfidence(roundConfig, selectedMovie) {
    const { layer, type } = roundConfig;
    const isExpected = selectedMovie.expected === true;

    console.log(`신뢰도 조정: ${layer}, 예상대로? ${isExpected}`);

    if (type === 'extreme' || type === 'crosscheck' || type === 'trap') {
      if (isExpected) {
        // 일관성 있음 → 신뢰도 증가
        this.confidence[layer] *= 1.2;
        console.log(`✅ ${layer} 신뢰도 증가: ${this.confidence[layer].toFixed(2)}`);
      } else {
        // 일관성 없음 → 신뢰도 감소
        this.confidence[layer] *= 0.9;
        console.log(`⚠️ ${layer} 신뢰도 감소: ${this.confidence[layer].toFixed(2)}`);
      }
    }
  }

  /* ============================================
     최상위 자극 타겟 계산
     ============================================ */
  getTopStimulation() {
    const { brain, heart, body } = this.scores.stimulation;
    if (brain >= heart && brain >= body) return 'brain';
    if (heart >= body) return 'heart';
    return 'body';
  }

  /* ============================================
     랜덤 선택 헬퍼
     ============================================ */
  pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /* ============================================
     3-Layer 프로필 분석
     ============================================ */
  getProfileAnalysis() {
    // 신뢰도 적용된 최종 점수 계산
    const finalScores = {
      worldview: {
        reality: this.scores.worldview.reality * this.confidence.worldview,
        fantasy: this.scores.worldview.fantasy * this.confidence.worldview
      },
      stimulation: {
        brain: this.scores.stimulation.brain * this.confidence.stimulation,
        heart: this.scores.stimulation.heart * this.confidence.stimulation,
        body: this.scores.stimulation.body * this.confidence.stimulation
      },
      texture: {
        warm: this.scores.texture.warm * this.confidence.texture,
        cold: this.scores.texture.cold * this.confidence.texture,
        light: this.scores.texture.light * this.confidence.texture,
        heavy: this.scores.texture.heavy * this.confidence.texture
      }
    };

    // 강도 계산 헬퍼 함수
    const getIntensity = (percent) => {
      if (percent >= 80) return '매우 강하게';
      if (percent >= 65) return '강하게';
      if (percent >= 55) return '약간';
      return '균형있게';
    };

    // Layer 1: 세계관
    const worldviewTotal = finalScores.worldview.reality + finalScores.worldview.fantasy;
    const realityPercent = Math.round((finalScores.worldview.reality / worldviewTotal) * 100);
    const fantasyPercent = 100 - realityPercent;

    const worldviewResult = realityPercent > fantasyPercent ? {
      label: '현실파',
      intensity: getIntensity(realityPercent),
      description: '사실적이고 현실적인 이야기를 선호합니다. 다큐멘터리, 역사물, 전기 영화에 끌립니다.',
      attribute: 'reality'
    } : {
      label: '환상파',
      intensity: getIntensity(fantasyPercent),
      description: '상상력이 넘치는 세계를 좋아합니다. SF, 판타지, 모험 영화를 즐깁니다.',
      attribute: 'fantasy'
    };

    // Layer 2: 자극 타겟
    const stimTotal = finalScores.stimulation.brain + finalScores.stimulation.heart + finalScores.stimulation.body;
    const brainPercent = Math.round((finalScores.stimulation.brain / stimTotal) * 100);
    const heartPercent = Math.round((finalScores.stimulation.heart / stimTotal) * 100);
    const bodyPercent = Math.round((finalScores.stimulation.body / stimTotal) * 100);

    const stimMax = Math.max(brainPercent, heartPercent, bodyPercent);
    let stimLabel, stimDesc, stimAttr, stimIntensity;

    if (stimMax === brainPercent) {
      stimLabel = '두뇌 자극형';
      stimDesc = '복잡한 스토리와 반전을 즐깁니다. 미스터리, 스릴러, 범죄 영화를 좋아합니다.';
      stimAttr = 'brain';
      stimIntensity = getIntensity(brainPercent);
    } else if (stimMax === heartPercent) {
      stimLabel = '감성 자극형';
      stimDesc = '감정선이 풍부한 이야기를 좋아합니다. 드라마, 로맨스, 가족 영화에 끌립니다.';
      stimAttr = 'heart';
      stimIntensity = getIntensity(heartPercent);
    } else {
      stimLabel = '액션 자극형';
      stimDesc = '강렬한 액션과 스릴을 즐깁니다. 액션, 공포, 어드벤처 영화를 선호합니다.';
      stimAttr = 'body';
      stimIntensity = getIntensity(bodyPercent);
    }

    // Layer 3: 감성 텍스처
    const warmColdTotal = finalScores.texture.warm + finalScores.texture.cold;
    const warmPercent = Math.round((finalScores.texture.warm / warmColdTotal) * 100);
    const coldPercent = 100 - warmPercent;

    const lightHeavyTotal = finalScores.texture.light + finalScores.texture.heavy;
    const lightPercent = Math.round((finalScores.texture.light / lightHeavyTotal) * 100);
    const heavyPercent = 100 - lightPercent;

    return {
      worldview: worldviewResult,
      stimulation: {
        label: stimLabel,
        intensity: stimIntensity,
        description: stimDesc,
        attribute: stimAttr,
        distribution: {
          brain: brainPercent,
          heart: heartPercent,
          body: bodyPercent
        }
      },
      texture: {
        temperature: {
          label: warmPercent > coldPercent ? '따뜻함' : '차가움',
          intensity: getIntensity(warmPercent > coldPercent ? warmPercent : coldPercent),
          attribute: warmPercent > coldPercent ? 'warm' : 'cold'
        },
        density: {
          label: lightPercent > heavyPercent ? '가벼움' : '무거움',
          intensity: getIntensity(lightPercent > heavyPercent ? lightPercent : heavyPercent),
          attribute: lightPercent > heavyPercent ? 'light' : 'heavy'
        }
      },
      confidence: this.confidence,
      rawScores: this.scores,
      finalScores: finalScores
    };
  }

  /* ============================================
     추천 영화 가져오기
     ============================================ */
  async getRecommendations(page = 1) {
    const profile = this.getProfileAnalysis();
    const genreScores = {};

    // 1. 1단계 설문 장르 (가중치 50%)
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (userProfile.genres) {
      userProfile.genres.forEach(genreId => {
        genreScores[genreId] = (genreScores[genreId] || 0) + 5.0;
      });
    }

    // 2. VS 게임 선택 영화 장르 (가중치 30%)
    this.history.forEach(h => {
      const round = this.roundMovies[h.round - 1];
      if (!round) return;
      const selected = h.choice === 'A' ? round.movieA : round.movieB;
      if (selected?.genre_ids) {
        selected.genre_ids.forEach(genreId => {
          genreScores[genreId] = (genreScores[genreId] || 0) + 3.0;
        });
      }
    });

    // 3. 3-Layer 분석 (가중치 20%)
    const genreMapping = {
      reality: [36, 18, 80],
      fantasy: [878, 14, 12],
      brain: [9648, 53, 80],
      heart: [10749, 18, 10751],
      body: [28, 27, 12],
      warm: [35, 10751, 16],
      cold: [53, 80, 9648],
      light: [35, 28],
      heavy: [18, 36]
    };

    [
      ...genreMapping[profile.worldview.attribute],
      ...genreMapping[profile.stimulation.attribute],
      ...genreMapping[profile.texture.temperature.attribute],
      ...genreMapping[profile.texture.density.attribute]
    ].forEach(genreId => {
      genreScores[genreId] = (genreScores[genreId] || 0) + 2.0;
    });

    // 점수 기준 상위 5개 장르
    const uniqueGenres = Object.entries(genreScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => parseInt(id));

    console.log('추천 장르:', uniqueGenres);

    // VS 게임에서 이미 본 영화 ID 수집
    const seenMovieIds = new Set();
    this.roundMovies.forEach(round => {
      if (round.movieA) seenMovieIds.add(round.movieA.id);
      if (round.movieB) seenMovieIds.add(round.movieB.id);
    });
    this.phase2Rounds.forEach(round => {
      const movieA = this.moviesCache[round.movieA.id];
      const movieB = this.moviesCache[round.movieB.id];
      if (movieA) seenMovieIds.add(movieA.id);
      if (movieB) seenMovieIds.add(movieB.id);
    });

    console.log('제외할 영화 수:', seenMovieIds.size);

    try {
      const data = await window.tmdbApi.discoverMovies({
        with_genres: uniqueGenres.slice(0, 3).join(','),
        sort_by: 'vote_average.desc',
        'vote_count.gte': 5000,
        'vote_average.gte': 7.5,
        page: page
      });

      if (!data.results || data.results.length === 0) {
        return [];
      }

      // VS 게임에서 본 영화 제외하고 중복 제거
      const uniqueMovies = [];
      const movieIds = new Set();

      for (const movie of data.results) {
        if (!seenMovieIds.has(movie.id) && !movieIds.has(movie.id)) {
          movieIds.add(movie.id);
          uniqueMovies.push(movie);
        }
      }

      console.log(`추천 영화 ${uniqueMovies.length}개 로드 (${seenMovieIds.size}개 제외)`);

      return uniqueMovies;
    } catch (error) {
      console.error('추천 영화 로드 실패:', error);
      return [];
    }
  }

  /* ============================================
     프로필 저장
     ============================================ */
  saveProfile() {
    const profile = this.getProfileAnalysis();
    localStorage.setItem('vsGameProfile', JSON.stringify({
      profile,
      history: this.history,
      timestamp: new Date().toISOString()
    }));
    console.log('VS 게임 프로필 저장 완료');
  }
}
