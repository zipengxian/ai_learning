import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/index';

// 语种名称 → TTS 语言代码
const LANGUAGE_TTS_MAP = {
  '英语': 'en-US',
  '日语': 'ja-JP',
  '韩语': 'ko-KR',
};

function ListeningPage() {
  const { id } = useParams();

  const [questions, setQuestions] = useState([]);
  const [course, setCourse] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [checking, setChecking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const recordSubmittedRef = useRef(false);
  const audioRef = useRef(null);
  const synthRef = useRef(null);

  // 获取 TTS 语言代码
  const getTtsLang = useCallback(() => {
    if (!course) return 'en-US';
    const lang = course.language || '';
    return LANGUAGE_TTS_MAP[lang] || 'en-US';
  }, [course]);

  // 停止所有音频
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    synthRef.current = null;
    setIsPlaying(false);
  }, []);

  // 加载题目和课程信息
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [listeningRes, courseRes] = await Promise.all([
          api.get(`/courses/${id}/listening`),
          api.get(`/courses/${id}`),
        ]);
        if (cancelled) return;

        const listData = Array.isArray(listeningRes.data)
          ? listeningRes.data
          : listeningRes.data.listening || [];
        setQuestions(listData);

        const courseData = courseRes.data.course || courseRes.data;
        setCourse(courseData);
      } catch {
        if (!cancelled) {
          setError('获取听力题失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
      stopAudio();
    };
  }, [id, stopAudio]);

  // 完成时提交学习记录
  useEffect(() => {
    if (!completed || recordSubmittedRef.current || questions.length === 0) return;
    recordSubmittedRef.current = true;

    const correctCount = results.filter((r) => r.isCorrect).length;
    const score = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

    api.post('/learning/records', {
      course_id: Number(id),
      activity_type: 'listening',
      score,
    }).catch(() => {
      // 静默失败，不影响用户体验
    });
  }, [completed, questions.length, results, id]);

  // 播放音频
  const handlePlay = useCallback(() => {
    if (questions.length === 0) return;

    // 如果正在播放，停止
    if (isPlaying) {
      stopAudio();
      return;
    }

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const audioUrl = currentQuestion.audio_url;
    const text = currentQuestion.question || '';

    // 如果有 audio_url，使用 HTML5 Audio
    if (audioUrl) {
      stopAudio();
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
      audio.play().catch(() => {
        setIsPlaying(false);
        audioRef.current = null;
      });
      return;
    }

    // 使用 SpeechSynthesis TTS
    if (!window.speechSynthesis) {
      return;
    }

    stopAudio();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getTtsLang();
    utterance.rate = 0.9;
    synthRef.current = utterance;

    utterance.onend = () => {
      setIsPlaying(false);
      synthRef.current = null;
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      synthRef.current = null;
    };

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  }, [isPlaying, questions, currentIndex, stopAudio, getTtsLang]);

  // 选择选项
  const handleSelectOption = useCallback(async (option) => {
    if (checking || feedback) return;

    setSelectedOption(option);
    setChecking(true);

    const currentQuestion = questions[currentIndex];

    try {
      const res = await api.post(`/courses/${id}/listening/check`, {
        answers: [
          {
            question_id: currentQuestion.id,
            answer: option,
          },
        ],
      });

      const checkData = res.data;
      const resultItem = (checkData.results && checkData.results[0]) || {};

      const isCorrect = resultItem.correct !== undefined
        ? resultItem.correct
        : checkData.correct !== undefined
          ? checkData.correct
          : false;

      const correctAnswer = resultItem.correct_answer
        || checkData.correct_answer
        || checkData.correctAnswer
        || '';

      const result = {
        questionId: currentQuestion.id,
        selectedOption: option,
        correctOption: correctAnswer,
        isCorrect,
      };

      setFeedback(result);
      setResults((prev) => [...prev, result]);
    } catch {
      const result = {
        questionId: currentQuestion.id,
        selectedOption: option,
        correctOption: '',
        isCorrect: false,
      };
      setFeedback(result);
      setResults((prev) => [...prev, result]);
    } finally {
      setChecking(false);
    }
  }, [checking, feedback, questions, currentIndex, id]);

  // 下一题
  const handleNext = useCallback(() => {
    stopAudio();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [currentIndex, questions.length, stopAudio]);

  // 再试一次
  const handleRetry = useCallback(() => {
    stopAudio();
    setCurrentIndex(0);
    setResults([]);
    setSelectedOption(null);
    setFeedback(null);
    setCompleted(false);
    recordSubmittedRef.current = false;
  }, [stopAudio]);

  // 获取选项标签
  const getOptionLabel = (index) => String.fromCharCode(65 + index);

  // 计算进度百分比
  const progressPercent = questions.length > 0
    ? Math.round((currentIndex / questions.length) * 100)
    : 0;

  // 加载中
  if (loading) {
    return (
      <div className="page listening-page">
        <h1>听力训练</h1>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="page listening-page">
        <h1>听力训练</h1>
        <div className="page-error">
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 没有题目
  if (questions.length === 0) {
    return (
      <div className="page listening-page">
        <h1>听力训练</h1>
        <div className="empty-state">
          <p>该课程暂无听力练习题</p>
          <Link to={`/courses/${id}`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            返回课程
          </Link>
        </div>
      </div>
    );
  }

  // 完成总结
  if (completed) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = questions.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    return (
      <div className="page listening-page">
        <h1>听力训练</h1>
        <div className="listening-summary">
          <div className="listening-summary-score">
            <div className="listening-score-circle">
              <span className="listening-score-number">{accuracy}</span>
              <span className="listening-score-unit">分</span>
            </div>
            <p className="listening-score-detail">
              正确 {correctCount} / {totalCount} 题（正确率 {accuracy}%）
            </p>
          </div>

          <h2 className="listening-summary-title">答题详情</h2>
          <ul className="listening-result-list">
            {results.map((result, index) => {
              const question = questions[index];
              const isCorrect = result.isCorrect;
              return (
                <li
                  key={result.questionId}
                  className={`listening-result-item ${isCorrect ? 'listening-result-correct' : 'listening-result-wrong'}`}
                >
                  <span className="listening-result-icon">
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <div className="listening-result-content">
                    <p className="listening-result-question">
                      {index + 1}. {question.question || ''}
                    </p>
                    <p className="listening-result-answer">
                      你的答案：<strong>{result.selectedOption}</strong>
                      {!isCorrect && (
                        <span className="listening-result-correct-answer">
                          {' '}正确答案：<strong>{result.correctOption}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="listening-summary-actions">
            <button className="btn btn-primary" onClick={handleRetry}>
              再试一次
            </button>
            <Link to={`/courses/${id}`} className="btn btn-outline">
              返回课程
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 当前题目
  const currentQuestion = questions[currentIndex];
  const options = [
    currentQuestion.option_a || '',
    currentQuestion.option_b || '',
    currentQuestion.option_c || '',
    currentQuestion.option_d || '',
  ];
  const questionNumber = currentIndex + 1;
  const totalQuestions = questions.length;

  // 获取选项的 CSS 类
  const getOptionClass = (option) => {
    const classes = ['listening-option-btn'];
    if (feedback) {
      if (option === feedback.correctOption) {
        classes.push('listening-option-correct');
      } else if (option === selectedOption && !feedback.isCorrect) {
        classes.push('listening-option-wrong');
      }
    } else if (option === selectedOption && checking) {
      classes.push('listening-option-selected');
    }
    return classes.join(' ');
  };

  return (
    <div className="page listening-page">
      <h1>听力训练</h1>

      {/* 进度条 */}
      <div className="listening-progress">
        <div className="listening-progress-bar">
          <div
            className="listening-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="listening-progress-text">
          第 {questionNumber}/{totalQuestions} 题
        </span>
      </div>

      {/* 音频播放区域 */}
      <div className="listening-audio-card">
        <button
          className={`listening-play-btn ${isPlaying ? 'listening-play-btn-active' : ''}`}
          onClick={handlePlay}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="8,5 19,12 8,19" />
            </svg>
          )}
        </button>
        <p className="listening-audio-hint">
          {isPlaying ? '正在播放...' : '点击播放按钮收听音频'}
        </p>
      </div>

      {/* 题目区域 */}
      <div className="listening-question-card">
        <div className="listening-question-number">
          第 {questionNumber}/{totalQuestions} 题
        </div>
        <p className="listening-question-stem">
          {currentQuestion.question || ''}
        </p>

        {/* 选项 */}
        <div className="listening-options">
          {options.map((optionText, idx) => {
            const label = getOptionLabel(idx);
            return (
              <button
                key={idx}
                className={getOptionClass(optionText)}
                disabled={!!feedback || checking}
                onClick={() => handleSelectOption(optionText)}
              >
                <span className="listening-option-label">{label}</span>
                <span className="listening-option-text">{optionText}</span>
              </button>
            );
          })}
        </div>

        {/* 反馈区域 */}
        {feedback && (
          <div className="listening-feedback">
            {feedback.isCorrect ? (
              <p className="listening-feedback-correct">✓ 回答正确！</p>
            ) : (
              <p className="listening-feedback-wrong">
                ✗ 回答错误。正确答案是：<strong>{feedback.correctOption}</strong>
              </p>
            )}
            <button
              className="btn btn-primary listening-next-btn"
              onClick={handleNext}
            >
              {questionNumber >= totalQuestions ? '查看结果' : '下一题'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListeningPage;