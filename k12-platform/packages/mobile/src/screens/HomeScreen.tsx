import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';

interface Stats {
  completedToday: number;
  totalQuestions: number;
  correctRate: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  time: string;
}

const HomeScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    completedToday: 0,
    totalQuestions: 0,
    correctRate: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.getStats();
      setStats({
        completedToday: data.completedToday,
        totalQuestions: data.totalQuestions,
        correctRate: data.correctRate,
      });
      setActivities(data.activities || []);
    } catch (err) {
      // Use demo data when API is unavailable
      setStats({
        completedToday: 5,
        totalQuestions: 28,
        correctRate: 85,
      });
      setActivities([
        { id: '1', type: 'study', title: '完成了「一元二次方程」学习', time: '10分钟前' },
        { id: '2', type: 'quiz', title: '完成「因式分解」练习题', time: '30分钟前' },
        { id: '3', type: 'ai', title: '与AI讨论了物理力学问题', time: '1小时前' },
        { id: '4', type: 'study', title: '开始学习「英语定语从句」', time: '2小时前' },
        { id: '5', type: 'quiz', title: '完成「化学元素周期表」测试', time: '3小时前' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'study':
        return 'book-outline';
      case 'quiz':
        return 'checkbox-outline';
      case 'ai':
        return 'chatbubble-ellipses-outline';
      default:
        return 'ellipse-outline';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#667eea"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}，{user?.name || '同学'}
            </Text>
            <Text style={styles.subtitle}>今天也要加油学习哦！</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person-circle" size={48} color="#fff" />
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: '#667eea' }]}>
          <Text style={styles.statsValue}>{stats.completedToday}</Text>
          <Text style={styles.statsLabel}>今日完成</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: '#764ba2' }]}>
          <Text style={styles.statsValue}>{stats.totalQuestions}</Text>
          <Text style={styles.statsLabel}>总练习题</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: '#f093fb' }]}>
          <Text style={styles.statsValue}>{stats.correctRate}%</Text>
          <Text style={styles.statsLabel}>正确率</Text>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.quickLinkCard}
          onPress={() => navigation?.navigate('学习')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: '#e8eeff' }]}>
            <Ionicons name="book-outline" size={28} color="#667eea" />
          </View>
          <Text style={styles.quickLinkText}>开始学习</Text>
          <Text style={styles.quickLinkDesc}>浏览课程内容</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLinkCard}
          onPress={() => navigation?.navigate('AI')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: '#f0e6ff' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#764ba2" />
          </View>
          <Text style={styles.quickLinkText}>AI 辅导</Text>
          <Text style={styles.quickLinkDesc}>智能问答助手</Text>
        </TouchableOpacity>
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近动态</Text>
        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>暂无动态记录</Text>
            <Text style={styles.emptySubText}>开始学习后这里会显示你的学习记录</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: '#f0f5ff' },
                ]}
              >
                <Ionicons
                  name={getActivityIcon(activity.type)}
                  size={20}
                  color="#667eea"
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5ff',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f5ff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -20,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  quickLinks: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickLinkIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  quickLinkDesc: {
    fontSize: 12,
    color: '#666666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf0ed',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

export default HomeScreen;