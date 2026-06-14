import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/index';
import { useAuth } from '../hooks/AuthContext';
import { formatRelativeTime } from '../utils/timeFormat';

function CommunityPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 发帖弹窗
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const pageSize = 10;

  const fetchPosts = useCallback(async (currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/posts', {
        params: { page: currentPage, limit: pageSize },
      });
      const data = res.data;
      // 兼容不同的响应格式
      const postList = data.posts || data.data || data || [];
      const pTotal = data.totalPages || data.total_pages || data.total || 1;
      setPosts(Array.isArray(postList) ? postList : []);
      setTotalPages(Math.max(1, Number(pTotal) || 1));
    } catch {
      setError('获取帖子列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(page);
  }, [page, fetchPosts]);

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const openModal = () => {
    setTitle('');
    setContent('');
    setModalError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setModalError('请输入标题');
      return;
    }
    if (title.trim().length > 200) {
      setModalError('标题不能超过200字');
      return;
    }
    if (!content.trim()) {
      setModalError('请输入内容');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      await api.post('/posts', {
        title: title.trim(),
        content: content.trim(),
      });
      closeModal();
      // 重置到第一页并刷新
      if (page === 1) {
        fetchPosts(1);
      } else {
        setPage(1);
      }
    } catch {
      setModalError('发布失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 内容预览（前100字）
  const getPreview = (text) => {
    if (!text) return '';
    if (text.length <= 100) return text;
    return text.slice(0, 100) + '...';
  };

  // 获取作者名
  const getAuthorName = (post) => {
    return post.author?.username || post.author?.name || post.authorName || post.author_name || '匿名用户';
  };

  if (loading && posts.length === 0) {
    return (
      <div className="page community-page">
        <h1>学习社区</h1>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page community-page">
        <h1>学习社区</h1>
        <div className="page-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchPosts(page)}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page community-page">
      <div className="community-header">
        <div>
          <h1>学习社区</h1>
          <p className="page-description">与其他学习者交流讨论，分享学习心得和经验</p>
        </div>
        <button className="btn btn-primary btn-new-post" onClick={openModal}>
          + 发帖
        </button>
      </div>

      {/* 帖子列表 */}
      {posts.length === 0 ? (
        <div className="empty-state">
          <p>暂无帖子，快来发表第一篇吧！</p>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <div
              key={post.id}
              className="post-card"
              onClick={() => navigate(`/community/${post.id}`)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/community/${post.id}`);
                }
              }}
            >
              <div className="post-card-body">
                <h2 className="post-card-title">{post.title}</h2>
                <p className="post-card-preview">{getPreview(post.content)}</p>
                <div className="post-card-meta">
                  <span className="post-card-author">{getAuthorName(post)}</span>
                  <span className="post-card-separator">·</span>
                  <span className="post-card-time">
                    {formatRelativeTime(post.createdAt || post.created_at)}
                  </span>
                  <span className="post-card-separator">·</span>
                  <span className="post-card-replies">
                    {post.replyCount ?? post.reply_count ?? post.replies?.length ?? 0} 回复
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            onClick={handlePrevPage}
            disabled={page <= 1}
          >
            上一页
          </button>
          <span className="pagination-info">
            第 {page} / {totalPages} 页
          </span>
          <button
            className="btn btn-outline"
            onClick={handleNextPage}
            disabled={page >= totalPages}
          >
            下一页
          </button>
        </div>
      )}

      {/* 浮动发帖按钮 */}
      <button
        className="fab-btn"
        onClick={openModal}
        title="发帖"
        aria-label="发帖"
      >
        +
      </button>

      {/* 发帖弹窗 */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发布新帖</h3>
              <button
                className="modal-close"
                onClick={closeModal}
                disabled={submitting}
                aria-label="关闭"
              >
                &times;
              </button>
            </div>
            <form className="modal-body" onSubmit={handleCreatePost}>
              {modalError && <div className="form-error">{modalError}</div>}
              <div className="form-group">
                <label htmlFor="post-title">标题</label>
                <input
                  id="post-title"
                  type="text"
                  placeholder="请输入标题（最多200字）"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="post-content">内容</label>
                <textarea
                  id="post-content"
                  className="form-textarea"
                  placeholder="请输入内容..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  disabled={submitting}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '发布中...' : '发布'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityPage;