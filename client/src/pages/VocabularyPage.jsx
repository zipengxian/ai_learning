import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/index';

function VocabularyPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState([]);
  const [reviewNeeded, setReviewNeeded] = useState([]);
  const [finished, setFinished] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 加载单词数据
  useEffect(() => {
    let cancelled = false;

    async function fetchWords() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/courses/${id}/vocabulary`);
        if (cancelled) return;
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.vocabulary || res.data.words || [];
        setWords(data);
        if (data.length === 0) {
          setFinished(true);
        }
      } catch {
        if (!cancelled) {
          setError('获取单词数据失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchWords();
    return () => { cancelled = true; };
  }, [id]);

  // 翻牌
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // 标记已掌握
  const handleMastered = useCallback(() => {
    const word = words[currentIndex];
    if (!word) return;
    setMastered((prev) => [...prev, word.id || currentIndex]);
    goNext();
  }, [currentIndex, words]);

  // 标记需复习
  const handleReviewNeeded = useCallback(() => {
    const word = words[currentIndex];
    if (!word) return;
    setReviewNeeded((prev) => [...prev, word.id || currentIndex]);
    goNext();
  }, [currentIndex, words]);

  // 切换到下一个单词
  const goNext = () => {
    if (currentIndex + 1 >= words.length) {
      setFinished(true);
      return;
    }
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  // 提交学习记录
  useEffect(() => {
    if (!finished || submitted || words.length === 0) return;

    const submitRecord = async () => {
      try {
        const totalReviewed = mastered.length + reviewNeeded.length;
        const score = totalReviewed > 0
          ? Math.round((mastered.length / totalReviewed) * 100)
          : 0;
        await api.post('/learning/records', {
          course_id: Number(id),
          activity_type: 'vocabulary',
          score,
        });
      } catch {
        // 静默失败，不影响用户体验
      } finally {
        setSubmitted(true);
      }
    };

    submitRecord();
  }, [finished, submitted, words.length, mastered.length, reviewNeeded.length, id]);

  // 重新开始
  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMastered([]);
    setReviewNeeded([]);
    setFinished(false);
    setSubmitted(false);
  };

  // 获取单词释义（兼容多种字段名）
  const getDefinition = (word) => word.definition || word.meaning || word.translation || '';
  // 获取例句
  const getExample = (word) => word.example || word.sentence || '';
  // 获取词性
  const getPartOfSpeech = (word) => word.partOfSpeech || word.part_of_speech || word.pos || '';
  // 获取音标
  const getPhonetic = (word) => word.phonetic || word.pronunciation || '';

  // --- 加载 / 错误状态 ---
  if (loading) {
    return (
      <div className="page vocabulary-page">
        <h1>单词记忆</h1>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page vocabulary-page">
        <h1>单词记忆</h1>
        <div className="page-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 无单词数据
  if (words.length === 0) {
    return (
      <div className="page vocabulary-page">
        <h1>单词记忆</h1>
        <div className="empty-state">
          <p>本课程暂无单词数据</p>
          <Link to={`/courses/${id}`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            返回课程
          </Link>
        </div>
      </div>
    );
  }

  // --- 完成页 ---
  if (finished) {
    const total = mastered.length + reviewNeeded.length;
    const rate = total > 0 ? Math.round((mastered.length / total) * 100) : 0;

    return (
      <div className="page vocabulary-page">
        <h1>单词记忆</h1>
        <div className="vocab-completion">
          <div className="vocab-completion-card">
            <div className="vocab-completion-emoji">🎉</div>
            <h2>本轮学习完成！</h2>
            <div className="vocab-completion-stats">
              <div className="vocab-stat">
                <span className="vocab-stat-value">{mastered.length}</span>
                <span className="vocab-stat-label">已掌握</span>
              </div>
              <div className="vocab-stat">
                <span className="vocab-stat-value">{reviewNeeded.length}</span>
                <span className="vocab-stat-label">需复习</span>
              </div>
              <div className="vocab-stat">
                <span className="vocab-stat-value">{rate}%</span>
                <span className="vocab-stat-label">正确率</span>
              </div>
            </div>
            <div className="vocab-completion-actions">
              <button className="btn btn-primary" onClick={handleRestart}>
                再学一次
              </button>
              <Link to={`/courses/${id}`} className="btn btn-outline">
                返回课程
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 闪卡学习页 ---
  const word = words[currentIndex];
  const progressPercent = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="page vocabulary-page">
      <h1>单词记忆</h1>

      {/* 面包屑 */}
      <nav className="breadcrumb">
        <Link to="/courses">课程中心</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <Link to={`/courses/${id}`}>课程详情</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">单词记忆</span>
      </nav>

      {/* 进度条 */}
      <div className="vocab-progress-section">
        <div className="vocab-progress-info">
          第 {currentIndex + 1}/{words.length} 个单词
        </div>
        <div className="vocab-progress-bar">
          <div
            className="vocab-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 闪卡 */}
      <div className="flashcard-scene" onClick={handleFlip}>
        <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}>
          {/* 正面：单词 */}
          <div className="flashcard-face flashcard-front">
            <span className="flashcard-word">{word.word}</span>
            {(getPhonetic(word) || getPartOfSpeech(word)) && (
              <span className="flashcard-meta">
                {getPhonetic(word) && <span className="flashcard-phonetic">{getPhonetic(word)}</span>}
                {getPartOfSpeech(word) && <span className="flashcard-pos">{getPartOfSpeech(word)}</span>}
              </span>
            )}
            <span className="flashcard-hint">点击翻转查看释义</span>
          </div>
          {/* 背面：释义 + 例句 */}
          <div className="flashcard-face flashcard-back">
            <p className="flashcard-definition">{getDefinition(word)}</p>
            {getExample(word) && (
              <p className="flashcard-example">{getExample(word)}</p>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="vocab-actions">
        <button
          className="btn btn-review"
          onClick={handleReviewNeeded}
        >
          需复习
        </button>
        <button
          className="btn btn-mastered"
          onClick={handleMastered}
        >
          已掌握
        </button>
      </div>
    </div>
  );
}

export default VocabularyPage;