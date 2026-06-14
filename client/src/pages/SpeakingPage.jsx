import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/index';

// 语种到 SpeechRecognition locale 的映射
const LANG_TO_LOCALE = {
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
};

// 检查浏览器是否支持语音识别
function isSpeechSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// 创建 SpeechRecognition 实例
function createRecognition(locale) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = locale;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  return recognition;
}

// 简单相似度计算 —— 基于词的匹配率
function calcSimilarity(original, spoken) {
  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/[.,!?;:'"()]/g, '')
      .trim();

  const a = normalize(original);
  const b = normalize(spoken);

  if (!a && !b) return 100;
  if (!a || !b) return 0;

  const wordsA = a.split(/\s+/).filter(Boolean);
  const wordsB = b.split(/\s+/).filter(Boolean);

  // 对于无空格的语言（如中文），使用字符级匹配
  if (wordsA.length <= 1 && wordsB.length <= 1) {
    const charsA = a.replace(/\s/g, '').split('');
    const charsB = b.replace(/\s/g, '').split('');
    if (charsA.length === 0 && charsB.length === 0) return 100;
    if (charsA.length === 0 || charsB.length === 0) return 0;

    let matches = 0;
    const used = new Array(charsB.length).fill(false);
    for (const ca of charsA) {
      for (let j = 0; j < charsB.length; j++) {
        if (!used[j] && charsB[j] === ca) {
          matches++;
          used[j] = true;
          break;
        }
      }
    }
    const maxLen = Math.max(charsA.length, charsB.length);
    return Math.round((matches / maxLen) * 100);
  }

  // 基于词的匹配率
  const setB = new Set(wordsB);
  let matchCount = 0;
  for (const w of wordsA) {
    if (setB.has(w)) matchCount++;
  }
  const maxLen = Math.max(wordsA.length, wordsB.length);
  return Math.round((matchCount / maxLen) * 100);
}

// 获取相似度评级
function getRating(score) {
  if (score >= 80) return { label: '优秀', className: 'speaking-rating-excellent' };
  if (score >= 60) return { label: '良好', className: 'speaking-rating-good' };
  return { label: '继续加油', className: 'speaking-rating-poor' };
}

function SpeakingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sentences, setSentences] = useState([]);
  const [languageCode, setLanguageCode] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [browserSupported] = useState(isSpeechSupported);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [similarity, setSimilarity] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState([]); // { sentenceIndex, recognizedText, score }
  const [interimResult, setInterimResult] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const recognitionRef = useRef(null);

  // 加载句子
  useEffect(() => {
    let cancelled = false;

    async function fetchSentences() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/courses/${id}/speaking`);
        if (cancelled) return;

        const data = Array.isArray(res.data)
          ? res.data
          : res.data.sentences || res.data.data || [];

        setSentences(data);

        // 尝试从 API 响应中提取语种代码
        if (data.length > 0) {
          const lang = data[0].language_code || data[0].languageCode || data[0].language || 'en';
          setLanguageCode(lang);
        } else if (res.data.language || res.data.language_code || res.data.languageCode) {
          setLanguageCode(res.data.language || res.data.language_code || res.data.languageCode);
        }
      } catch {
        if (!cancelled) {
          setError('获取跟读句子失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSentences();
    return () => {
      cancelled = true;
      stopRecognition();
    };
  }, [id]);

  // 停止识别
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.stop();
      } catch {
        // 忽略停止时的错误
      }
      recognitionRef.current = null;
    }
  }, []);

  // 开始录音
  const handleStartListening = useCallback(() => {
    if (isListening || !browserSupported) return;

    const locale = LANG_TO_LOCALE[languageCode] || 'en-US';
    const recognition = createRecognition(locale);
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const currentSentence = sentences[currentIndex];
      const sentenceText = currentSentence.sentence || currentSentence.text || '';
      const score = calcSimilarity(sentenceText, transcript);

      setRecognizedText(transcript);
      setSimilarity(score);
      setShowResult(true);
      setIsListening(false);

      setResults((prev) => [
        ...prev,
        { sentenceIndex: currentIndex, recognizedText: transcript, score },
      ]);
    };

    recognition.onerror = (event) => {
      // 忽略常见非致命错误
      if (event.error === 'no-speech') {
        setRecognizedText('(未检测到语音，请重试)');
        setSimilarity(0);
        setShowResult(true);
      } else if (event.error === 'aborted') {
        // 用户主动停止，忽略
      } else {
        setRecognizedText(`(识别错误: ${event.error})`);
        setSimilarity(0);
        setShowResult(true);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onspeechstart = () => {
      setInterimResult('正在聆听...');
    };

    recognition.onspeechend = () => {
      setInterimResult('正在识别...');
    };

    try {
      recognition.start();
      setIsListening(true);
      setRecognizedText('');
      setSimilarity(null);
      setShowResult(false);
      setInterimResult('正在聆听...');
    } catch {
      setIsListening(false);
      setRecognizedText('(无法启动语音识别)');
      setSimilarity(0);
      setShowResult(true);
    }
  }, [isListening, browserSupported, languageCode, sentences, currentIndex]);

  // 停止录音
  const handleStopListening = useCallback(() => {
    stopRecognition();
    setIsListening(false);
    setInterimResult('');
  }, [stopRecognition]);

  // 下一句
  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sentences.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(nextIndex);
      setRecognizedText('');
      setSimilarity(null);
      setShowResult(false);
      setInterimResult('');
    }
  }, [currentIndex, sentences.length]);

  // 提交学习记录
  useEffect(() => {
    if (!completed || submitted || sentences.length === 0) return;

    const submitRecord = async () => {
      try {
        const totalScore = results.length > 0
          ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
          : 0;
        await api.post('/learning/records', {
          course_id: Number(id),
          activity_type: 'speaking',
          score: totalScore,
        });
      } catch {
        // 静默失败
      } finally {
        setSubmitted(true);
      }
    };

    submitRecord();
  }, [completed, submitted, sentences.length, results, id]);

  // 再试一次
  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    setRecognizedText('');
    setSimilarity(null);
    setShowResult(false);
    setCompleted(false);
    setResults([]);
    setInterimResult('');
    setSubmitted(false);
  }, []);

  // 获取句子显示文本
  const getSentenceText = (sentence) => sentence.sentence || sentence.text || '';
  const getSentenceTranslation = (sentence) => sentence.translation || sentence.meaning || '';

  // --- 浏览器不支持 ---
  if (!browserSupported) {
    return (
      <div className="page speaking-page">
        <h1>口语跟读</h1>
        <nav className="breadcrumb">
          <Link to="/courses">课程中心</Link>
          <span className="breadcrumb-separator">&gt;</span>
          <Link to={`/courses/${id}`}>课程详情</Link>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">口语跟读</span>
        </nav>
        <div className="speaking-unsupported">
          <div className="speaking-unsupported-icon">🎤</div>
          <h2>浏览器不支持语音识别</h2>
          <p>您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器。</p>
          <Link to={`/courses/${id}`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            返回课程
          </Link>
        </div>
      </div>
    );
  }

  // --- 加载中 ---
  if (loading) {
    return (
      <div className="page speaking-page">
        <h1>口语跟读</h1>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  // --- 加载错误 ---
  if (error) {
    return (
      <div className="page speaking-page">
        <h1>口语跟读</h1>
        <div className="page-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // --- 无数据 ---
  if (sentences.length === 0) {
    return (
      <div className="page speaking-page">
        <h1>口语跟读</h1>
        <div className="empty-state">
          <p>本课程暂无可跟读句子</p>
          <Link to={`/courses/${id}`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            返回课程
          </Link>
        </div>
      </div>
    );
  }

  // --- 完成总结 ---
  if (completed) {
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;
    const rating = getRating(avgScore);

    return (
      <div className="page speaking-page">
        <h1>口语跟读</h1>
        <div className="speaking-summary">
          <div className="speaking-summary-score">
            <div className={`speaking-score-circle ${rating.className}`}>
              <span className="speaking-score-number">{avgScore}</span>
              <span className="speaking-score-unit">分</span>
            </div>
            <p className="speaking-score-detail">
              平均匹配度 {avgScore}% — {rating.label}
            </p>
          </div>

          <h2 className="grammar-summary-title">跟读详情</h2>
          <ul className="grammar-result-list">
            {results.map((result, index) => {
              const sentence = sentences[index];
              const sentenceText = getSentenceText(sentence);
              const resultRating = getRating(result.score);
              return (
                <li
                  key={index}
                  className={`grammar-result-item ${result.score >= 60 ? 'grammar-result-correct' : 'grammar-result-wrong'}`}
                >
                  <span className="grammar-result-icon">
                    {result.score >= 60 ? '✓' : '✗'}
                  </span>
                  <div className="grammar-result-content">
                    <p className="grammar-result-question">
                      {index + 1}. {sentenceText}
                    </p>
                    <p className="grammar-result-answer">
                      你的发音：<strong>{result.recognizedText}</strong>
                    </p>
                    <p className="grammar-result-answer">
                      匹配度：<strong className={`speaking-rating-color ${resultRating.className}`}>{result.score}%</strong>
                      {' '}— {resultRating.label}
                    </p>
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

  // --- 跟读界面 ---
  const currentSentence = sentences[currentIndex];
  const sentenceText = getSentenceText(currentSentence);
  const sentenceTranslation = getSentenceTranslation(currentSentence);
  const progressPercent = ((currentIndex + 1) / sentences.length) * 100;
  const rating = similarity !== null ? getRating(similarity) : null;

  return (
    <div className="page speaking-page">
      <h1>口语跟读</h1>

      {/* 面包屑 */}
      <nav className="breadcrumb">
        <Link to="/courses">课程中心</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <Link to={`/courses/${id}`}>课程详情</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">口语跟读</span>
      </nav>

      {/* 进度 */}
      <div className="speaking-progress">
        <div className="speaking-progress-bar">
          <div
            className="speaking-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="speaking-progress-text">
          第 {currentIndex + 1}/{sentences.length} 句
        </span>
      </div>

      {/* 句子卡片 */}
      <div className="speaking-sentence-card">
        <p className="speaking-sentence-text">{sentenceText}</p>
        {sentenceTranslation && (
          <p className="speaking-sentence-translation">{sentenceTranslation}</p>
        )}
      </div>

      {/* 麦克风按钮区域 */}
      <div className="speaking-mic-area">
        <button
          className={`speaking-mic-btn ${isListening ? 'speaking-mic-active' : ''}`}
          onClick={isListening ? handleStopListening : handleStartListening}
          disabled={showResult}
          title={isListening ? '点击停止录音' : '点击开始录音'}
        >
          <span className="speaking-mic-icon">🎤</span>
        </button>
        {isListening && (
          <p className="speaking-mic-status">{interimResult || '正在聆听...'}</p>
        )}
        {!isListening && !showResult && (
          <p className="speaking-mic-hint">点击麦克风开始跟读</p>
        )}
      </div>

      {/* 识别结果 */}
      {showResult && (
        <div className="speaking-result-card">
          <div className="speaking-result-original">
            <span className="speaking-result-label">原文</span>
            <p className="speaking-result-text-original">{sentenceText}</p>
          </div>
          <div className="speaking-result-recognized">
            <span className="speaking-result-label">你的发音</span>
            <p className="speaking-result-text-recognized">{recognizedText}</p>
          </div>
          {similarity !== null && (
            <div className="speaking-result-score">
              <div className={`speaking-score-circle ${rating.className}`}>
                <span className="speaking-score-number">{similarity}</span>
                <span className="speaking-score-unit">%</span>
              </div>
              <p className="speaking-score-detail">
                匹配度 {similarity}% — {rating.label}
              </p>
            </div>
          )}

          <button
            className="btn btn-primary speaking-next-btn"
            onClick={handleNext}
          >
            {currentIndex + 1 >= sentences.length ? '查看结果' : '下一句'}
          </button>
        </div>
      )}
    </div>
  );
}

export default SpeakingPage;