/**
 * 格式化日期为 yyyy-MM-dd
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 格式化日期为 yyyy-MM-dd HH:mm:ss
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
};

/**
 * 获取学习进度百分比
 */
export const getProgressPercent = (completed: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * 简易 ID 生成器
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};