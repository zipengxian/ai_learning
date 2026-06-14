import { useState, useRef, useCallback } from 'react';
import { photoSearch, type PhotoSearchResult } from '@/api/ai';

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function PhotoSearchPage() {
  const [image, setImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhotoSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImage(base64);
      setPreviewUrl(base64);
      setResult(null);
      setError(null);
    };
    reader.onerror = () => {
      setError('文件读取失败');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await photoSearch(image, grade);
      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '识别失败，请稍后重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [image, grade]);

  const handleReset = useCallback(() => {
    setImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 'var(--spacing-lg)',
        maxWidth: 900,
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        拍照搜题
      </h1>

      {/* 上传区域 */}
      {!previewUrl && (
        <div
          style={{
            background: 'var(--color-bg-primary)',
            border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-2xl)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color var(--transition-fast)',
            marginBottom: 'var(--spacing-lg)',
          }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              marginBottom: 'var(--spacing-md)',
              opacity: 0.35,
              margin: '0 auto',
            }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          <p
            style={{
              fontSize: 'var(--font-size-md)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            点击上传题目图片，或拖拽图片到此处
          </p>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              margin: 0,
            }}
          >
            支持 JPG、PNG、WebP 格式
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* 图片预览 */}
      {previewUrl && (
        <div
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              图片预览
            </h3>
            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              重新上传
            </button>
          </div>
          <img
            src={previewUrl}
            alt="预览"
            style={{
              width: '100%',
              maxHeight: 300,
              objectFit: 'contain',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-secondary)',
              marginBottom: 'var(--spacing-md)',
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                年级（可选）
              </label>
              <select
                value={grade ?? ''}
                onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : undefined)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">不选择</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g} 年级
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !image}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-sm)',
              width: '100%',
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              background:
                loading || !image
                  ? 'var(--color-bg-tertiary)'
                  : 'var(--color-accent)',
              color: loading || !image ? 'var(--color-text-tertiary)' : '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-md)',
              fontWeight: 600,
              cursor: loading || !image ? 'not-allowed' : 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              if (!loading && image) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && image) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)';
              }
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
                正在识别中...
              </>
            ) : (
              '识别题目'
            )}
          </button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div
          style={{
            padding: 'var(--spacing-md)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && !result && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-2xl)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 40,
              height: 40,
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-accent)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              marginBottom: 'var(--spacing-md)',
            }}
          />
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            AI 正在识别题目，请稍候...
          </span>
        </div>
      )}

      {/* 识别结果 */}
      {result && (
        <div
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-md)',
              marginTop: 0,
            }}
          >
            识别结果
          </h3>
          <div
            style={{
              padding: 'var(--spacing-md)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '3px solid var(--color-accent)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}
            >
              {result.answer || result.text}
            </p>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!loading && !result && !error && !previewUrl && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-2xl)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: 'var(--spacing-md)', opacity: 0.4 }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
            上传题目图片，点击「识别题目」获取 AI 解答
          </p>
        </div>
      )}
    </div>
  );
}