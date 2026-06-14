import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
}

interface PointDetail {
  id: string;
  name: string;
  content: string;
  examples: string[];
  questions: Question[];
  status: 'not_started' | 'in_progress' | 'completed';
}

const LearningDetailScreen: React.FC<{ route?: any; navigation?: any }> = ({
  route,
  navigation,
}) => {
  const pointId = route?.params?.pointId;
  const pointName = route?.params?.pointName || '知识点详情';

  const [detail, setDetail] = useState<PointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    if (pointId) {
      fetchDetail();
    } else {
      setError('缺少知识点 ID');
      setLoading(false);
    }
  }, [pointId]);

  const fetchDetail = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiClient.getKnowledgePointDetail(pointId);
      setDetail(data);
    } catch {
      // Demo data
      const demoDetail: PointDetail = {
        id: pointId || 'demo',
        name: pointName,
        content:
          '**定义：** 只含有一个未知数，并且未知数的最高次数是 2 的整式方程叫做一元二次方程。\n\n**一般形式：** ax² + bx + c = 0（其中 a ≠ 0）\n\n其中：\n- a 是二次项系数\n- b 是一次项系数\n- c 是常数项\n\n**核心要点：**\n1. 方程必须是整式方程\n2. 只含有一个未知数\n3. 未知数的最高次数必须是 2\n4. 二次项系数 a 不能为 0',
        examples: [
          '例1：3x² - 5x + 2 = 0 是一元二次方程，其中 a=3, b=-5, c=2',
          '例2：x² = 4 也是一元二次方程，可以写成 x² + 0x - 4 = 0',
          '例3：(x+1)(x-2) = 0 展开后得 x² - x - 2 = 0，是一元二次方程',
        ],
        questions: [
          {
            id: 'q1',
            question: '下列哪个是一元二次方程？',
            options: [
              'A. 2x + 3 = 7',
              'B. x² + 2x + 1 = 0',
              'C. 3x³ - x = 5',
              'D. x + y = 0',
            ],
            answer: 1,
          },
          {
            id: 'q2',
            question: '方程 2x² - 3x + 1 = 0 中，一次项系数是？',
            options: ['A. 2', 'B. -3', 'C. 1', 'D. 0'],
            answer: 1,
          },
          {
            id: 'q3',
            question: '关于 x 的方程 (m-1)x² + 3x - 2 = 0 是一元二次方程，则 m 的取值范围是？',
            options: [
              'A. m = 1',
              'B. m ≠ 1',
              'C. m > 1',
              'D. m ≥ 1',
            ],
            answer: 1,
          },
        ],
        status: 'in_progress',
      };
      setDetail(demoDetail);
    } finally {
      setLoading(false);
    }
  }, [pointId, pointName]);

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (showAnswers[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckAnswer = (questionId: string) => {
    setShowAnswers((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    try {
      await apiClient.markKnowledgePointCompleted(pointId || '');
      setDetail((prev) =>
        prev ? { ...prev, status: 'completed' } : null
      );
      Alert.alert('成功', '已标记为已完成！', [{ text: '确定' }]);
    } catch {
      // Demo: mark complete locally
      setDetail((prev) =>
        prev ? { ...prev, status: 'completed' } : null
      );
      Alert.alert('成功', '已标记为已完成！', [{ text: '确定' }]);
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleGoBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  const getStatusBadge = () => {
    if (!detail) return null;
    const isCompleted = detail.status === 'completed';
    return (
      <View
        style={[
          styles.statusBadge,
          isCompleted ? styles.statusCompleted : styles.statusInProgress,
        ]}
      >
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'time-outline'}
          size={14}
          color={isCompleted ? '#27ae60' : '#f39c12'}
        />
        <Text
          style={[
            styles.statusText,
            { color: isCompleted ? '#27ae60' : '#f39c12' },
          ]}
        >
          {isCompleted ? '已完成' : '学习中'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>加载知识点...</Text>
      </View>
    );
  }

  if (error && !detail) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDetail}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>未找到知识点信息</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Back Button */}
      {navigation?.canGoBack() && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#667eea" />
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
      )}

      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{detail.name}</Text>
        {getStatusBadge()}
      </View>

      {/* Content */}
      <View style={styles.contentCard}>
        <Text style={styles.sectionTitle}>内容讲解</Text>
        <Text style={styles.contentText}>{detail.content}</Text>
      </View>

      {/* Examples */}
      {detail.examples && detail.examples.length > 0 && (
        <View style={styles.examplesCard}>
          <Text style={styles.sectionTitle}>例题</Text>
          {detail.examples.map((example, index) => (
            <View key={index} style={styles.exampleItem}>
              <Text style={styles.exampleText}>{example}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Practice Questions */}
      {detail.questions && detail.questions.length > 0 && (
        <View style={styles.questionsCard}>
          <Text style={styles.sectionTitle}>练习题</Text>
          {detail.questions.map((question, qIndex) => {
            const selected = selectedAnswers[question.id];
            const shown = showAnswers[question.id];
            const isCorrect = selected === question.answer;

            return (
              <View key={question.id} style={styles.questionItem}>
                <Text style={styles.questionText}>
                  第{qIndex + 1}题：{question.question}
                </Text>
                {question.options.map((option, oIndex) => {
                  let optionStyle: object[] = [styles.optionButton];
                  if (shown) {
                    if (oIndex === question.answer) {
                      optionStyle.push(styles.optionCorrect);
                    } else if (oIndex === selected && !isCorrect) {
                      optionStyle.push(styles.optionWrong);
                    }
                  } else if (oIndex === selected) {
                    optionStyle.push(styles.optionSelected);
                  }

                  return (
                    <TouchableOpacity
                      key={oIndex}
                      style={optionStyle}
                      onPress={() => handleSelectAnswer(question.id, oIndex)}
                      activeOpacity={0.7}
                      disabled={shown}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          shown && oIndex === question.answer && styles.optionTextCorrect,
                          shown &&
                            oIndex === selected &&
                            !isCorrect &&
                            styles.optionTextWrong,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {selected !== undefined && !shown && (
                  <TouchableOpacity
                    style={styles.checkButton}
                    onPress={() => handleCheckAnswer(question.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.checkButtonText}>检查答案</Text>
                  </TouchableOpacity>
                )}
                {shown && (
                  <Text
                    style={[
                      styles.feedbackText,
                      isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
                    ]}
                  >
                    {isCorrect ? '✓ 回答正确！' : '✗ 回答错误，请查看正确答案'}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Mark Complete Button */}
      {detail.status !== 'completed' && (
        <TouchableOpacity
          style={[
            styles.completeButton,
            markingComplete && styles.completeButtonDisabled,
          ]}
          onPress={handleMarkComplete}
          disabled={markingComplete}
          activeOpacity={0.7}
        >
          {markingComplete ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.completeButtonText}>标记为已完成</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5ff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f5ff',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#eafaf1',
  },
  statusInProgress: {
    backgroundColor: '#fef9e7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 24,
  },
  examplesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  exampleItem: {
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  questionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  questionItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 12,
    lineHeight: 22,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#e8eeff',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  optionCorrect: {
    backgroundColor: '#eafaf1',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  optionWrong: {
    backgroundColor: '#fdedec',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  optionText: {
    fontSize: 14,
    color: '#333333',
  },
  optionTextCorrect: {
    color: '#27ae60',
    fontWeight: '500',
  },
  optionTextWrong: {
    color: '#e74c3c',
  },
  checkButton: {
    backgroundColor: '#667eea',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  feedbackCorrect: {
    color: '#27ae60',
  },
  feedbackWrong: {
    color: '#e74c3c',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LearningDetailScreen;