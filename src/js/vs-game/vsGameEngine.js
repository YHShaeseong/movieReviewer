/* ============================================
   VS 게임 엔진 (3-Layer Deep Dive + Dynamic Confidence Scoring)

   Phase 1: 탐색전 (Round 1-10) - 3-Layer 데이터 수집
   Phase 2: 검증전 (Round 11-15) - 함정 질문 + 신뢰도 검증
   ============================================ */

/* ============================================
   Phase 1: 탐색전 라운드 구성 (10라운드)
   동적 영화 선택 템플릿
   ============================================ */
const PHASE1_ROUND_TEMPLATES = [
  // Layer 1: 현실 vs 환상 (3문항)
  {
    phase: 1,
    layer: 'worldview',
    theme: '현실 vs 환상',
    description: '어떤 세계관이 더 끌리나요?',
    movieA: {
      attribute: 'reality',
      genres: [18, 36],  // 드라마, 역사
      minVotes: 10000,
      minRating: 7.8
    },
    movieB: {
      attribute: 'fantasy',
      genres: [14, 878],  // 판타지, SF
      minVotes: 10000,
      minRating: 7.5
    }
  },
  {
    phase: 1,
    layer: 'worldview',
    theme: '다큐 vs SF',
    description: '사실 vs 상상, 어디에 더 빠지나요?',
    movieA: {
      attribute: 'reality',
      genres: [18, 80],  // 드라마, 범죄
      minVotes: 8000,
      minRating: 7.8
    },
    movieB: {
      attribute: 'fantasy',
      genres: [878],  // SF만
      minVotes: 10000,
      minRating: 7.5
    }
  },
  {
    phase: 1,
    layer: 'worldview',
    theme: '역사 vs 미래',
    description: '과거 vs 미래, 어디로 가고 싶나요?',
    movieA: {
      attribute: 'reality',
      genres: [36, 10752],  // 역사, 전쟁
      minVotes: 5000,
      minRating: 7.5
    },
    movieB: {
      attribute: 'fantasy',
      genres: [878, 12],  // SF, 모험
      minVotes: 10000,
      minRating: 7.5
    }
  },

  // Layer 2: 자극 타겟 (4문항) - Brain / Heart / Body
  {
    phase: 1,
    layer: 'stimulation',
    theme: '두뇌 vs 심장',
    description: '머리 vs 가슴, 무엇을 더 자극받고 싶나요?',
    movieA: {
      attribute: 'brain',
      genres: [53, 80],  // 스릴러, 범죄
      minVotes: 8000,
      minRating: 7.5
    },
    movieB: {
      attribute: 'heart',
      genres: [10749, 18],  // 로맨스, 드라마
      minVotes: 5000,
      minRating: 7.3
    }
  },
  {
    phase: 1,
    layer: 'stimulation',
    theme: '스릴 vs 감동',
    description: '긴장감 vs 눈물, 어떤 걸 원하나요?',
    movieA: {
      attribute: 'body',
      genres: [28, 53],  // 액션, 스릴러
      minVotes: 8000,
      minRating: 7.3
    },
    movieB: {
      attribute: 'heart',
      genres: [18, 10751],  // 드라마, 가족
      minVotes: 5000,
      minRating: 7.5
    }
  },
  {
    phase: 1,
    layer: 'stimulation',
    theme: '액션 vs 로맨스',
    description: '몸 vs 마음, 어떤 자극을 원하나요?',
    movieA: {
      attribute: 'body',
      genres: [28],  // 액션만
      minVotes: 8000,
      minRating: 7.2
    },
    movieB: {
      attribute: 'heart',
      genres: [10749],  // 로맨스만
      minVotes: 5000,
      minRating: 7.5
    }
  },
  {
    phase: 1,
    layer: 'stimulation',
    theme: '공포 vs 코미디',
    description: '소름 vs 웃음, 어떤 반응을 원하나요?',
    movieA: {
      attribute: 'body',
      genres: [27],  // 공포
      minVotes: 5000,
      minRating: 7.0
    },
    movieB: {
      attribute: 'heart',
      genres: [35],  // 코미디
      minVotes: 8000,
      minRating: 7.3
    }
  },

  // Layer 3: 감성 텍스처 (3문항) - 온도(따뜻/차가움) / 밀도(가벼움/무거움)
  {
    phase: 1,
    layer: 'texture',
    theme: '따뜻함 vs 차가움',
    description: '어떤 온도의 영화가 좋나요?',
    movieA: {
      attribute: 'warm',
      genres: [16, 10751],  // 애니메이션, 가족
      minVotes: 8000,
      minRating: 7.5
    },
    movieB: {
      attribute: 'cold',
      genres: [27, 53],  // 공포, 스릴러
      minVotes: 5000,
      minRating: 7.2
    }
  },
  {
    phase: 1,
    layer: 'texture',
    theme: '가벼움 vs 무거움',
    description: '어떤 무게감의 이야기가 좋나요?',
    movieA: {
      attribute: 'light',
      genres: [35, 28],  // 코미디, 액션
      minVotes: 5000,
      minRating: 7.0
    },
    movieB: {
      attribute: 'heavy',
      genres: [18],  // 드라마
      minVotes: 5000,
      minRating: 7.8
    }
  },
  {
    phase: 1,
    layer: 'texture',
    theme: '밝음 vs 어두움',
    description: '어떤 분위기를 선호하나요?',
    movieA: {
      attribute: 'light',
      genres: [16, 35],  // 애니메이션, 코미디
      minVotes: 5000,
      minRating: 7.0
    },
    movieB: {
      attribute: 'heavy',
      genres: [80, 53],  // 범죄, 스릴러
      minVotes: 3000,
      minRating: 7.5
    }
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
     동적 영화 선택 (장르/주제 기반)
     ============================================ */
  async fetchMovieByTemplate(template) {
    try {
      const params = {
        with_genres: template.genres.join(','),
        'vote_count.gte': template.minVotes,
        'vote_average.gte': template.minRating,
        sort_by: 'popularity.desc'
      };

      if (template.keywords) {
        params.with_keywords = template.keywords.join(',');
      }

      const data = await window.tmdbApi.discoverMovies(params);

      if (data.results && data.results.length > 0) {
        // 장르 필터링: 요청한 장르가 실제로 포함된 영화만 선택
        const validMovies = data.results.filter(movie => {
          // 영화의 genre_ids가 템플릿의 genres 중 하나라도 포함하는지 확인
          return template.genres.some(genreId => movie.genre_ids.includes(genreId));
        });

        if (validMovies.length > 0) {
          // 평점과 인기도 조합 점수로 정렬
          const scoredMovies = validMovies.map(movie => ({
            ...movie,
            score: (movie.vote_average * 0.7) + (Math.log(movie.popularity) * 0.3)
          }));

          scoredMovies.sort((a, b) => b.score - a.score);

          // 상위 3개 중 랜덤 선택
          const topMovies = scoredMovies.slice(0, 3);
          const randomIndex = Math.floor(Math.random() * topMovies.length);
          return topMovies[randomIndex];
        }
      }

      // 조건 완화하여 재시도
      params['vote_average.gte'] = template.minRating - 0.5;
      params['vote_count.gte'] = Math.floor(template.minVotes / 2);

      const retryData = await window.tmdbApi.discoverMovies(params);
      if (retryData.results && retryData.results.length > 0) {
        return retryData.results[0];
      }

      throw new Error('적합한 영화를 찾을 수 없습니다.');
    } catch (error) {
      console.error('영화 검색 실패:', error);
      throw error;
    }
  }

  /* ============================================
     영화 데이터 사전 로드 (동적)
     ============================================ */
  async preloadMovies() {
    try {
      console.log('Phase 1 영화 동적 로딩 시작...');

      // Phase 1 라운드별 영화 선택
      for (let i = 0; i < PHASE1_ROUND_TEMPLATES.length; i++) {
        const template = PHASE1_ROUND_TEMPLATES[i];

        try {
          // movieA 가져오기
          let movieA = await this.fetchMovieByTemplate(template.movieA);
          if (movieA) {
            this.moviesCache[movieA.id] = movieA;
          }

          // movieB 가져오기
          let movieB = await this.fetchMovieByTemplate(template.movieB);
          if (movieB) {
            this.moviesCache[movieB.id] = movieB;
          }

          // 라운드별로 저장 (양쪽 다 성공한 경우만)
          if (movieA && movieB) {
            this.roundMovies.push({
              movieA,
              movieB,
              template
            });
            console.log(`${template.theme} 영화 로드 완료: ${movieA.title} vs ${movieB.title}`);
          } else {
            console.warn(`${template.theme} 영화 로드 실패: A=${movieA?.title || '없음'}, B=${movieB?.title || '없음'}`);
          }
        } catch (error) {
          console.error(`라운드 영화 로드 실패 (${template.theme}):`, error);
        }
      }

      console.log(`Phase 1 영화 ${Object.keys(this.moviesCache).length}개 로드 완료`);

      // totalRounds 조정 (로드된 라운드 + Phase 2 3라운드)
      this.totalRounds = this.roundMovies.length + 3;
      console.log(`총 ${this.totalRounds}라운드로 조정 (Phase1: ${this.roundMovies.length}, Phase2: 3)`);

    } catch (error) {
      console.error('영화 데이터 로드 실패:', error);
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
     Phase 2 검증 라운드 동적 생성
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

    // 검증 질문 1: 극단적 선택 (세계관 1위 vs 2위)
    const worldviewWinner = this.phase1Results.worldview;
    const worldviewLoser = worldviewWinner === 'reality' ? 'fantasy' : 'reality';

    try {
      const movieA = await this.fetchMovieByTemplate(VERIFICATION_TEMPLATES[`${worldviewWinner}_extreme`]);
      const movieB = await this.fetchMovieByTemplate(VERIFICATION_TEMPLATES[`${worldviewLoser}_extreme`]);

      if (movieA && movieB) {
        this.moviesCache[movieA.id] = movieA;
        this.moviesCache[movieB.id] = movieB;

        this.phase2Rounds.push({
          type: 'extreme',
          layer: 'worldview',
          theme: '절대 포기할 수 없는 것은?',
          description: '당신의 최애 세계관을 확인합니다',
          movieA: {
            id: movieA.id,
            attribute: worldviewWinner,
            expected: true
          },
          movieB: {
            id: movieB.id,
            attribute: worldviewLoser,
            expected: false
          }
        });
      }
    } catch (error) {
      console.error('Phase 2 라운드 1 생성 실패:', error);
    }

    // 검증 질문 2: 시각 vs 청각
    try {
      const visualMovie = await this.fetchMovieByTemplate(VERIFICATION_TEMPLATES.visual);
      const audioMovie = await this.fetchMovieByTemplate(VERIFICATION_TEMPLATES.audio);

      if (visualMovie && audioMovie) {
        this.moviesCache[visualMovie.id] = visualMovie;
        this.moviesCache[audioMovie.id] = audioMovie;

        this.phase2Rounds.push({
          type: 'detail',
          layer: 'texture',
          theme: '스토리가 엉망이어도 용서되는 건?',
          description: '시각 vs 청각, 어느 쪽을 더 중시하나요?',
          movieA: {
            id: visualMovie.id,
            attribute: 'visual'
          },
          movieB: {
            id: audioMovie.id,
            attribute: 'audio'
          }
        });
      }
    } catch (error) {
      console.error('Phase 2 라운드 2 생성 실패:', error);
    }

    // 검증 질문 3: 자극 타겟 교차 검증
    const stimTop = this.phase1Results.stimulation;
    const stimOpposite = stimTop === 'brain' ? 'body' : (stimTop === 'body' ? 'heart' : 'brain');

    try {
      const stimTopMovie = await this.fetchMovieByTemplate(VERIFICATION_TEMPLATES[`${stimTop}_high`]);
      const stimOppMovie = await this.fetchMovieByTemplate(VERIFICATION_TEMPLATES[`${stimOpposite}_high`]);

      if (stimTopMovie && stimOppMovie) {
        this.moviesCache[stimTopMovie.id] = stimTopMovie;
        this.moviesCache[stimOppMovie.id] = stimOppMovie;

        this.phase2Rounds.push({
          type: 'crosscheck',
          layer: 'stimulation',
          theme: '진짜 원하는 자극은?',
          description: '당신의 자극 타겟을 재확인합니다',
          movieA: {
            id: stimTopMovie.id,
            attribute: stimTop,
            expected: true
          },
          movieB: {
            id: stimOppMovie.id,
            attribute: stimOpposite,
            expected: false
          }
        });
      }
    } catch (error) {
      console.error('Phase 2 라운드 3 생성 실패:', error);
    }

    // 검증 질문 4 & 5: 온도/밀도 함정 질문은 Phase 2의 복잡성 때문에 생략하고 3개 라운드로 축소
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

    // Layer 1: 세계관
    const worldviewTotal = finalScores.worldview.reality + finalScores.worldview.fantasy;
    const realityPercent = Math.round((finalScores.worldview.reality / worldviewTotal) * 100);
    const fantasyPercent = 100 - realityPercent;

    const worldviewResult = realityPercent > fantasyPercent ? {
      label: '현실파',
      percentage: realityPercent,
      description: '사실적이고 현실적인 이야기를 선호합니다. 다큐멘터리, 역사물, 전기 영화에 끌립니다.',
      attribute: 'reality'
    } : {
      label: '환상파',
      percentage: fantasyPercent,
      description: '상상력이 넘치는 세계를 좋아합니다. SF, 판타지, 모험 영화를 즐깁니다.',
      attribute: 'fantasy'
    };

    // Layer 2: 자극 타겟
    const stimTotal = finalScores.stimulation.brain + finalScores.stimulation.heart + finalScores.stimulation.body;
    const brainPercent = Math.round((finalScores.stimulation.brain / stimTotal) * 100);
    const heartPercent = Math.round((finalScores.stimulation.heart / stimTotal) * 100);
    const bodyPercent = Math.round((finalScores.stimulation.body / stimTotal) * 100);

    const stimMax = Math.max(brainPercent, heartPercent, bodyPercent);
    let stimLabel, stimDesc, stimAttr;

    if (stimMax === brainPercent) {
      stimLabel = '두뇌 자극형';
      stimDesc = '복잡한 스토리와 반전을 즐깁니다. 미스터리, 스릴러, 범죄 영화를 좋아합니다.';
      stimAttr = 'brain';
    } else if (stimMax === heartPercent) {
      stimLabel = '감성 자극형';
      stimDesc = '감정선이 풍부한 이야기를 좋아합니다. 드라마, 로맨스, 가족 영화에 끌립니다.';
      stimAttr = 'heart';
    } else {
      stimLabel = '액션 자극형';
      stimDesc = '강렬한 액션과 스릴을 즐깁니다. 액션, 공포, 어드벤처 영화를 선호합니다.';
      stimAttr = 'body';
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
        percentage: stimMax,
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
          percentage: warmPercent > coldPercent ? warmPercent : coldPercent,
          attribute: warmPercent > coldPercent ? 'warm' : 'cold'
        },
        density: {
          label: lightPercent > heavyPercent ? '가벼움' : '무거움',
          percentage: lightPercent > heavyPercent ? lightPercent : heavyPercent,
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
