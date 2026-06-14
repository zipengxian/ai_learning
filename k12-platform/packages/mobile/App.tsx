import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const navigationTheme = {
  dark: false,
  colors: {
    primary: '#667eea',
    background: '#f0f5ff',
    card: '#ffffff',
    text: '#333333',
    border: '#eee',
    notification: '#667eea',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar
              barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
              backgroundColor="#667eea"
            />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});