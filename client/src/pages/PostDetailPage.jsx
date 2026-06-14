import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/index';
import { useAuth } from '../hooks/AuthContext';
import { formatRelativeTime } from '../utils/timeFormat';

function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 回帖表单
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/posts/${id}`);
      const data = res.data;
      setPost(data.post || data);
      const replyList = data.replies || data.post?.replies || [];
      setReplies(Array.isArray(replyList) ? replyList : []);
    } catch {
      setError('获取帖子详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      setReplyError('请输入回复内容');
      return;
    }

    setReplySubmitting(true);
    setReplyError('');
    try {
      await api.post(`/posts/${id}/replies`, {
        content: replyContent.trim(),
      });
      setReplyContent('');
      // 重新获取帖子详情以刷新回帖列表
      await fetchPost();
    } catch {
      setReplyError('回复失败，请稍后重试');
    } finally {
      setReplySubmitting(false);
    }
  };

  // 获取作者名
  const getAuthorName = (item) => {
    return item.author?.username || item.author?.name || item.authorName || item.author_name || '匿名用户';
  };

  if (loading) {
    return (
      <div className="page post-detail-page">
        <div className="breadcrumb">
          <Link to="/community">社区</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">帖子详情</span>
        </div>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page post-detail-page">
        <div className="breadcrumb">
          <Link to="/community">社区</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">帖子详情</span>
        </div>
        <div className="page-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchPost}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page post-detail-page">
        <div className="breadcrumb">
          <Link to="/community">社区</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">帖子详情</span>
        </div>
        <div className="empty-state">
          <p>帖子不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page post-detail-page">
      {/* 面包屑 */}
      <div className="breadcrumb">
        <Link to="/community">社区</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">帖子详情</span>
      </div>

      {/* 帖子内容 */}
      <div className="post-detail">
        <h1 className="post-detail-title">{post.title}</h1>
        <div className="post-detail-meta">
          <span>{getAuthorName(post)}</span>
          <span className="post-card-separator">·</span>
          <span>{formatRelativeTime(post.createdAt || post.created_at)}</span>
        </div>
        <div className="post-detail-content">
          {post.content}
        </div>
      </div>

      {/* 回帖列表 */}
      <div className="replies-section">
        <h2 className="section-title">
          回复（{replies.length}）
        </h2>
        {replies.length === 0 ? (
          <div className="empty-state">
            <p>暂无回复，来说点什么吧</p>
          </div>
        ) : (
          <div className="replies-list">
            {replies.map((reply, index) => (
              <div key={reply.id || index} className="reply-item">
                <div className="reply-item-meta">
                  <span className="reply-author">{getAuthorName(reply)}</span>
                  <span className="post-card-separator">·</span>
                  <span className="reply-time">
                    {formatRelativeTime(reply.createdAt || reply.created_at)}
                  </span>
                </div>
                <p className="reply-content">{reply.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* 回帖表单 */}
        <div className="reply-form-section">
          <h3 className="reply-form-title">发表回复</h3>
          <form onSubmit={handleSubmitReply}>
            {replyError && <div className="form-error">{replyError}</div>}
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="写下你的回复..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
                disabled={replySubmitting}
              />
            </div>
            <div className="reply-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={replySubmitting}
              >
                {replySubmitting ? '提交中...' : '提交回复'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PostDetailPage;