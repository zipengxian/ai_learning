/**
 * 将 ISO 时间字符串格式化为相对时间（中文）
 * 例如："3分钟前"、"2小时前"、"5天前"
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';

  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;

  if (diffMs < 0) return '刚刚';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  if (months < 12) return `${months}个月前`;
  return `${years}年前`;
}