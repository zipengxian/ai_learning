import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import StudyScreen from '../screens/StudyScreen';
import AIChatScreen from '../screens/AIChatScreen';
import PhotoSearchScreen from '../screens/PhotoSearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LearningDetailScreen from '../screens/LearningDetailScreen';

// ---- Type definitions ----

export type HomeStackParamList = {
  HomeMain: undefined;
};

export type StudyStackParamList = {
  StudyMain: undefined;
  LearningDetail: { pointId: string; pointName: string };
};

export type AIStackParamList = {
  AIMain: undefined;
  PhotoSearch: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
};

export type TabParamList = {
  首页: undefined;
  学习: undefined;
  AI: undefined;
  我的: undefined;
};

export type DrawerParamList = {
  Tabs: undefined;
};

// ---- Navigators ----

const Tab = createBottomTabNavigator<TabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const StudyStack = createNativeStackNavigator<StudyStackParamList>();
const AIStack = createNativeStackNavigator<AIStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

type IoniconsName = keyof typeof Ionicons.glyphMap;

// ---- Icons ----

const tabIconMap: Record<string, { focused: IoniconsName; unfocused: IoniconsName }> = {
  '首页': { focused: 'home', unfocused: 'home-outline' },
  '学习': { focused: 'book', unfocused: 'book-outline' },
  'AI': { focused: 'chatbubble-ellipses', unfocused: 'chatbubble-ellipses-outline' },
  '我的': { focused: 'person', unfocused: 'person-outline' },
};

const drawerItems: {
  label: string;
  icon: IoniconsName;
  targetTab: keyof TabParamList;
}[] = [
  { label: '学习看板', icon: 'grid-outline' as IoniconsName, targetTab: '首页' },
  { label: '课程中心', icon: 'library-outline' as IoniconsName, targetTab: '学习' },
  { label: '练习中心', icon: 'school-outline' as IoniconsName, targetTab: '学习' },
  { label: '错题本', icon: 'alert-circle-outline' as IoniconsName, targetTab: '学习' },
  { label: 'AI 助手', icon: 'chatbubble-ellipses-outline' as IoniconsName, targetTab: 'AI' },
  { label: '个人中心', icon: 'person-outline' as IoniconsName, targetTab: '我的' },
];

// ---- Stack navigators ----

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function StudyStackNavigator() {
  return (
    <StudyStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <StudyStack.Screen
        name="StudyMain"
        component={StudyScreen}
        options={{ title: '学习中心' }}
      />
      <StudyStack.Screen
        name="LearningDetail"
        component={LearningDetailScreen}
        options={({ route }) => ({
          title: route.params?.pointName || '知识点详情',
        })}
      />
    </StudyStack.Navigator>
  );
}

function AIStackNavigator() {
  return (
    <AIStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AIStack.Screen name="AIMain" component={AIChatScreen} />
      <AIStack.Screen
        name="PhotoSearch"
        component={PhotoSearchScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </AIStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// ---- Tab navigator (inner content) ----

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIconMap[route.name];
          const iconName: IoniconsName = focused
            ? icons.focused
            : icons.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#eee',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="首页"
        component={HomeStackNavigator}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen
        name="学习"
        component={StudyStackNavigator}
        options={{ tabBarLabel: '学习' }}
      />
      <Tab.Screen
        name="AI"
        component={AIStackNavigator}
        options={{ tabBarLabel: 'AI' }}
      />
      <Tab.Screen
        name="我的"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
}

// ---- Custom drawer content ----

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;

  const handleDrawerItemPress = (targetTab: string) => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Tabs',
        params: {
          screen: targetTab,
        },
      })
    );
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerScrollContent}
    >
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>K12 学习平台</Text>
        <Text style={styles.drawerSubtitle}>让学习更高效</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Navigation items */}
      {drawerItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.drawerItem}
          onPress={() => handleDrawerItemPress(item.targetTab)}
          activeOpacity={0.6}
        >
          <Ionicons
            name={item.icon}
            size={22}
            color="#667eea"
            style={styles.drawerItemIcon}
          />
          <Text style={styles.drawerItemLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </DrawerContentScrollView>
  );
}

// ---- AppNavigator (Drawer wrapping Tabs) ----

const AppNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        drawerType: 'front',
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: false,
        drawerActiveBackgroundColor: '#f0f5ff',
        drawerActiveTintColor: '#667eea',
        drawerInactiveTintColor: '#333',
        drawerStyle: {
          backgroundColor: '#ffffff',
          width: 280,
        },
        swipeEnabled: true,
        swipeEdgeWidth: 50,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={styles.menuButton}
            activeOpacity={0.6}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      })}
    >
      <Drawer.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ title: 'K12 学习平台' }}
      />
    </Drawer.Navigator>
  );
};

// ---- Styles ----

const styles = StyleSheet.create({
  drawerScrollContent: {
    flex: 1,
    paddingTop: 0,
  },
  drawerHeader: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  drawerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 0,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  drawerItemIcon: {
    marginRight: 16,
  },
  drawerItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  menuButton: {
    paddingLeft: 16,
    paddingRight: 8,
  },
});

export default AppNavigator;