import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/index';

function GrammarPage() {
  const { id } = useParams();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [checking, setChecking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const recordSubmittedRef = useRef(false);

  // 加载题目
  useEffect(() => {
    let cancelled = false;

    async function fetchQuestions() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/courses/${id}/grammar`);
        if (cancelled) return;

        const data = Array.isArray(res.data)
          ? res.data
          : res.data.questions || res.data.data || [];
        setQuestions(data);
      } catch {
        if (!cancelled) {
          setError('获取语法题失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchQuestions();
    return () => { cancelled = true; };
  }, [id]);

  // 完成时提交学习记录
  useEffect(() => {
    if (!completed || recordSubmittedRef.current || questions.length === 0) return;
    recordSubmittedRef.current = true;

    const correctCount = results.filter((r) => r.isCorrect).length;
    const score = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

    api.post('/learning/records', {
      activity_type: 'grammar',
      score,
    }).catch(() => {
      // 静默失败，不影响用户体验
    });
  }, [completed, questions.length, results]);

  // 选择选项
  const handleSelectOption = useCallback(async (option) => {
    if (checking || feedback) return;

    setSelectedOption(option);
    setChecking(true);

    const currentQuestion = questions[currentIndex];

    try {
      const res = await api.post(`/courses/${id}/grammar/check`, {
        question_id: currentQuestion.id,
        answer: option,
      });

      const checkData = res.data;
      const isCorrect = checkData.correct !== undefined
        ? checkData.correct
        : checkData.is_correct !== undefined
          ? checkData.is_correct
          : checkData.isCorrect !== undefined
            ? checkData.isCorrect
            : false;
      const correctAnswer = checkData.correct_answer
        || checkData.correctAnswer
        || checkData.answer
        || '';
      const explanation = checkData.explanation || '';

      const result = {
        questionId: currentQuestion.id,
        selectedOption: option,
        correctOption: correctAnswer,
        isCorrect,
        explanation,
      };

      setFeedback(result);
      setResults((prev) => [...prev, result]);
    } catch {
      // check API 失败时的处理：假设答错
      const result = {
        questionId: currentQuestion.id,
        selectedOption: option,
        correctOption: '',
        isCorrect: false,
        explanation: '',
      };
      setFeedback(result);
      setResults((prev) => [...prev, result]);
    } finally {
      setChecking(false);
    }
  }, [checking, feedback, questions, currentIndex, id]);

  // 下一题
  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [currentIndex, questions.length]);

  // 再试一次
  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    setResults([]);
    setSelectedOption(null);
    setFeedback(null);
    setCompleted(false);
    recordSubmittedRef.current = false;
  }, []);

  // 获取选项标签
  const getOptionLabel = (index) => String.fromCharCode(65 + index);

  // 计算进度百分比
  const progressPercent = questions.length > 0
    ? Math.round((currentIndex / questions.length) * 100)
    : 0;

  // 加载中
  if (loading) {
    return (
      <div className="page grammar-page">
        <h1>语法练习</h1>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="page grammar-page">
        <h1>语法练习</h1>
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
      <div className="page grammar-page">
        <h1>语法练习</h1>
        <div className="empty-state">
          <p>该课程暂无语法练习题</p>
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
      <div className="page grammar-page">
        <h1>语法练习</h1>
        <div className="grammar-summary">
          <div className="grammar-summary-score">
            <div className="grammar-score-circle">
              <span className="grammar-score-number">{accuracy}</span>
              <span className="grammar-score-unit">分</span>
            </div>
            <p className="grammar-score-detail">
              正确 {correctCount} / {totalCount} 题（正确率 {accuracy}%）
            </p>
          </div>

          <h2 className="grammar-summary-title">答题详情</h2>
          <ul className="grammar-result-list">
            {results.map((result, index) => {
              const question = questions[index];
              const isCorrect = result.isCorrect;
              return (
                <li
                  key={result.questionId}
                  className={`grammar-result-item ${isCorrect ? 'grammar-result-correct' : 'grammar-result-wrong'}`}
                >
                  <span className="grammar-result-icon">
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <div className="grammar-result-content">
                    <p className="grammar-result-question">
                      {index + 1}. {question.stem || question.question || question.title || ''}
                    </p>
                    <p className="grammar-result-answer">
                      你的答案：<strong>{result.selectedOption}</strong>
                      {!isCorrect && (
                        <span className="grammar-result-correct-answer">
                          {' '}正确答案：<strong>{result.correctOption}</strong>
                        </span>
                      )}
                    </p>
                    {result.explanation && (
                      <div className="grammar-result-explanation">
                        {result.explanation}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="grammar-summary-actions">
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
  const options = currentQuestion.options || currentQuestion.choices || [];
  const questionNumber = currentIndex + 1;
  const totalQuestions = questions.length;

  // 获取选项的 CSS 类
  const getOptionClass = (option) => {
    const classes = ['grammar-option-btn'];
    if (feedback) {
      if (option === feedback.correctOption) {
        classes.push('grammar-option-correct');
      } else if (option === selectedOption && !feedback.isCorrect) {
        classes.push('grammar-option-wrong');
      }
    } else if (option === selectedOption && checking) {
      classes.push('grammar-option-selected');
    }
    return classes.join(' ');
  };

  return (
    <div className="page grammar-page">
      <h1>语法练习</h1>

      {/* 进度条 */}
      <div className="grammar-progress">
        <div className="grammar-progress-bar">
          <div
            className="grammar-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="grammar-progress-text">
          第 {questionNumber}/{totalQuestions} 题
        </span>
      </div>

      {/* 题目区域 */}
      <div className="grammar-question-card">
        <div className="grammar-question-number">
          第 {questionNumber}/{totalQuestions} 题
        </div>
        <p className="grammar-question-stem">
          {currentQuestion.stem || currentQuestion.question || currentQuestion.title || ''}
        </p>

        {/* 选项 */}
        <div className="grammar-options">
          {options.map((option, idx) => {
            const optionText = typeof option === 'string'
              ? option
              : option.text || option.label || option.option || '';
            const optionKey = optionText;
            const label = getOptionLabel(idx);

            return (
              <button
                key={idx}
                className={getOptionClass(optionKey)}
                disabled={!!feedback || checking}
                onClick={() => handleSelectOption(optionKey)}
              >
                <span className="grammar-option-label">{label}</span>
                <span className="grammar-option-text">{optionText}</span>
              </button>
            );
          })}
        </div>

        {/* 反馈区域 */}
        {feedback && (
          <div className="grammar-feedback">
            {feedback.isCorrect ? (
              <p className="grammar-feedback-correct">✓ 回答正确！</p>
            ) : (
              <p className="grammar-feedback-wrong">
                ✗ 回答错误。正确答案是：<strong>{feedback.correctOption}</strong>
              </p>
            )}
            {feedback.explanation && (
              <div className="grammar-explanation">
                {feedback.explanation}
              </div>
            )}
            <button
              className="btn btn-primary grammar-next-btn"
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

export default GrammarPage;