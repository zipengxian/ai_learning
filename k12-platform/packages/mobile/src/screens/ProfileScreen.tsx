import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('清除缓存', '缓存已清除', [{ text: '确定' }]);
  };

  const handleAbout = () => {
    Alert.alert(
      '关于 K12 学习平台',
      '版本：1.0.0\n\nK12 学习平台是一个面向中小学生的在线学习平台，提供丰富的课程内容、AI 智能辅导和个性化学习体验。\n\n© 2026 K12 学习平台',
      [{ text: '确定' }]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* User Info Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person-circle" size={72} color="#667eea" />
        </View>
        <Text style={styles.userName}>{user?.name || '未登录用户'}</Text>
        <Text style={styles.userEmail}>{user?.email || '请先登录'}</Text>
        {user?.grade && (
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeBadgeText}>{user.grade}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>12</Text>
          <Text style={styles.statsLabel}>学习天数</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>28</Text>
          <Text style={styles.statsLabel}>完成知识点</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>85</Text>
          <Text style={styles.statsLabel}>总练习数</Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>设置</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon-outline" size={20} color="#667eea" />
            <Text style={styles.settingText}>深色模式</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#ddd', true: '#667eea' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleClearCache}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="trash-outline" size={20} color="#667eea" />
            <Text style={styles.settingText}>清除缓存</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleAbout}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle-outline" size={20} color="#667eea" />
            <Text style={styles.settingText}>关于</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5ff',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLarge: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  gradeBadge: {
    backgroundColor: '#e8eeff',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  gradeBadgeText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  statsLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  statsDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 15,
    color: '#333333',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 15,
    color: '#e74c3c',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ProfileScreen;