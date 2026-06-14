import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';

interface Subject {
  id: string;
  name: string;
  icon?: string;
}

interface Chapter {
  id: string;
  name: string;
  subjectId: string;
  grade: string;
  order: number;
}

interface KnowledgePoint {
  id: string;
  name: string;
  chapterId: string;
  content: string;
  status: 'not_started' | 'in_progress' | 'completed';
  order: number;
}

const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三'];

const StudyScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('七年级');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<Record<string, KnowledgePoint[]>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.getSubjects();
      setSubjects(data);
      if (data.length > 0 && !selectedSubject) {
        setSelectedSubject(data[0].id);
      }
    } catch {
      // Demo data
      const demoSubjects: Subject[] = [
        { id: 'math', name: '数学' },
        { id: 'physics', name: '物理' },
        { id: 'chemistry', name: '化学' },
        { id: 'english', name: '英语' },
        { id: 'chinese', name: '语文' },
      ];
      setSubjects(demoSubjects);
      if (!selectedSubject) {
        setSelectedSubject(demoSubjects[0].id);
      }
    }
  }, [selectedSubject]);

  const fetchChapters = useCallback(async () => {
    if (!selectedSubject) return;
    setChaptersLoading(true);
    try {
      setError(null);
      const data = await apiClient.getChapters(selectedSubject, selectedGrade);
      setChapters(data);
      // Auto-expand first chapter
      if (data.length > 0) {
        setExpandedChapters({ [data[0].id]: true });
      }
    } catch {
      // Demo data
      const demoChapters: Chapter[] = [
        { id: 'ch1', name: '一元二次方程', subjectId: selectedSubject, grade: selectedGrade, order: 1 },
        { id: 'ch2', name: '因式分解', subjectId: selectedSubject, grade: selectedGrade, order: 2 },
        { id: 'ch3', name: '函数与图像', subjectId: selectedSubject, grade: selectedGrade, order: 3 },
        { id: 'ch4', name: '几何初步', subjectId: selectedSubject, grade: selectedGrade, order: 4 },
      ];
      setChapters(demoChapters);
      if (demoChapters.length > 0) {
        setExpandedChapters({ [demoChapters[0].id]: true });
      }
    } finally {
      setChaptersLoading(false);
    }
  }, [selectedSubject, selectedGrade]);

  const fetchKnowledgePoints = useCallback(
    async (chapterId: string) => {
      if (knowledgePoints[chapterId]) return;
      try {
        const data = await apiClient.getKnowledgePoints(chapterId);
        setKnowledgePoints((prev) => ({ ...prev, [chapterId]: data }));
      } catch {
        // Demo data
        const demoPoints: KnowledgePoint[] = [
          { id: 'kp1', name: '一元二次方程的定义', chapterId, content: '', status: 'completed', order: 1 },
          { id: 'kp2', name: '配方法', chapterId, content: '', status: 'in_progress', order: 2 },
          { id: 'kp3', name: '公式法', chapterId, content: '', status: 'not_started', order: 3 },
          { id: 'kp4', name: '因式分解法', chapterId, content: '', status: 'not_started', order: 4 },
          { id: 'kp5', name: '根的判别式', chapterId, content: '', status: 'not_started', order: 5 },
        ];
        setKnowledgePoints((prev) => ({ ...prev, [chapterId]: demoPoints }));
      }
    },
    [knowledgePoints]
  );

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      setKnowledgePoints({});
      setExpandedChapters({});
      fetchChapters();
    }
  }, [selectedSubject, selectedGrade, fetchChapters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubjects();
    if (selectedSubject) {
      setKnowledgePoints({});
      setExpandedChapters({});
      await fetchChapters();
    }
    setRefreshing(false);
  }, [fetchSubjects, fetchChapters, selectedSubject]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newState = { ...prev, [chapterId]: !prev[chapterId] };
      if (!prev[chapterId]) {
        // Fetch knowledge points when expanding
        fetchKnowledgePoints(chapterId);
      }
      return newState;
    });
  };

  const getStatusIcon = (status: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (status) {
      case 'completed':
        return { name: 'checkmark-circle', color: '#27ae60' };
      case 'in_progress':
        return { name: 'time-outline', color: '#f39c12' };
      default:
        return { name: 'ellipse-outline', color: '#ccc' };
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '学习中';
      default:
        return '未开始';
    }
  };

  const handlePointPress = (point: KnowledgePoint) => {
    navigation?.navigate('LearningDetail', {
      pointId: point.id,
      pointName: point.name,
    });
  };

  // Grade button width calculation
  const gradeButtonWidth = Platform.OS === 'ios' ? 'auto' : undefined;

  return (
    <View style={styles.container}>
      {/* Subject Tabs */}
      {subjects.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subjectTabs}
          contentContainerStyle={styles.subjectTabsContent}
        >
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.subjectTab,
                selectedSubject === subject.id && styles.subjectTabActive,
              ]}
              onPress={() => setSelectedSubject(subject.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.subjectTabText,
                  selectedSubject === subject.id && styles.subjectTabTextActive,
                ]}
              >
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.subjectTabs}>
          <ActivityIndicator size="small" color="#667eea" />
        </View>
      )}

      {/* Grade Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.gradeSelector}
        contentContainerStyle={styles.gradeSelectorContent}
      >
        {GRADES.map((grade) => (
          <TouchableOpacity
            key={grade}
            style={[
              styles.gradeButton,
              selectedGrade === grade && styles.gradeButtonActive,
              gradeButtonWidth ? { minWidth: gradeButtonWidth } : undefined,
            ]}
            onPress={() => setSelectedGrade(grade)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.gradeButtonText,
                selectedGrade === grade && styles.gradeButtonTextActive,
              ]}
            >
              {grade}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chapter List */}
      <ScrollView
        style={styles.chapterList}
        contentContainerStyle={styles.chapterListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#667eea"
          />
        }
      >
        {loading || chaptersLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>加载课程中...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          </View>
        ) : chapters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>暂无课程内容</Text>
            <Text style={styles.emptySubText}>
              请选择其他年级或学科
            </Text>
          </View>
        ) : (
          chapters.map((chapter) => {
            const points = knowledgePoints[chapter.id] || [];
            const isExpanded = expandedChapters[chapter.id] || false;
            const completedCount = points.filter((p) => p.status === 'completed').length;

            return (
              <View key={chapter.id} style={styles.chapterCard}>
                <TouchableOpacity
                  style={styles.chapterHeader}
                  onPress={() => toggleChapter(chapter.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.chapterInfo}>
                    <Ionicons
                      name="folder-outline"
                      size={20}
                      color="#667eea"
                    />
                    <Text style={styles.chapterName}>{chapter.name}</Text>
                    {points.length > 0 && (
                      <Text style={styles.chapterProgress}>
                        {completedCount}/{points.length}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.pointsList}>
                    {points.length === 0 ? (
                      <View style={styles.pointsLoading}>
                        <ActivityIndicator size="small" color="#667eea" />
                        <Text style={styles.pointsLoadingText}>加载知识点...</Text>
                      </View>
                    ) : (
                      points.map((point) => {
                        const statusInfo = getStatusIcon(point.status);
                        return (
                          <TouchableOpacity
                            key={point.id}
                            style={styles.pointItem}
                            onPress={() => handlePointPress(point)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={statusInfo.name}
                              size={18}
                              color={statusInfo.color}
                            />
                            <Text style={styles.pointName}>{point.name}</Text>
                            <Text
                              style={[
                                styles.pointStatus,
                                { color: statusInfo.color },
                              ]}
                            >
                              {getStatusText(point.status)}
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color="#ccc"
                            />
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5ff',
  },
  subjectTabs: {
    maxHeight: 56,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subjectTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subjectTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#f5f5f5',
  },
  subjectTabActive: {
    backgroundColor: '#667eea',
  },
  subjectTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  subjectTabTextActive: {
    color: '#fff',
  },
  gradeSelector: {
    maxHeight: 52,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  gradeSelectorContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  gradeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 3,
    backgroundColor: '#f5f5f5',
  },
  gradeButtonActive: {
    backgroundColor: '#667eea',
  },
  gradeButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  gradeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  chapterList: {
    flex: 1,
  },
  chapterListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
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
  chapterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  chapterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chapterName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    marginLeft: 10,
    flex: 1,
  },
  chapterProgress: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  pointsList: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pointsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  pointsLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#999',
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  pointName: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 10,
    flex: 1,
  },
  pointStatus: {
    fontSize: 12,
    marginRight: 8,
  },
});

export default StudyScreen;