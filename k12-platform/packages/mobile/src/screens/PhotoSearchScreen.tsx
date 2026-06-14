import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';

type ScreenState = 'camera' | 'preview' | 'loading' | 'result';

const PhotoSearchScreen: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      if (photo) {
        setPhotoUri(photo.uri);
        setPhotoBase64(photo.base64 ?? null);
        setScreenState('preview');
        setError(null);
      }
    } catch {
      setError('拍照失败，请重试');
    }
  }, []);

  const retakePhoto = useCallback(() => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setScreenState('camera');
    setError(null);
  }, []);

  const confirmPhoto = useCallback(async () => {
    if (!photoBase64) {
      setError('图片数据为空');
      return;
    }

    setScreenState('loading');
    setError(null);

    try {
      const response = await apiClient.photoSearch(
        `data:image/jpeg;base64,${photoBase64}`,
      );

      setResultText(response.answer || response.text);
      setScreenState('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '识别失败，请稍后重试';
      setError(msg);
      setScreenState('preview');
    }
  }, [photoBase64]);

  const goBackToCamera = useCallback(() => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setResultText(null);
    setScreenState('camera');
    setError(null);
  }, []);

  // Permission not yet determined
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>正在检查相机权限...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#ccc" />
          <Text style={styles.permissionTitle}>需要相机权限</Text>
          <Text style={styles.permissionText}>
            拍照搜题需要访问您的相机，请在设置中允许相机权限
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.7}
          >
            <Text style={styles.permissionButtonText}>授予权限</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera view
  if (screenState === 'camera') {
    return (
      <SafeAreaView style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          {/* Top bar */}
          <View style={styles.cameraTopBar}>
            <Text style={styles.cameraTopText}>将题目对准取景框</Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.cameraBottomBar}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  // Preview
  if (screenState === 'preview' && photoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>照片预览</Text>
        </View>

        <View style={styles.previewImageContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={18} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={retakePhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-reverse-outline" size={20} color="#667eea" />
            <Text style={styles.retakeButtonText}>重新拍摄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmPhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>确认使用</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading
  if (screenState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>AI 正在识别题目...</Text>
          <Text style={styles.loadingSubText}>请稍候</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Result
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultHeader}>
        <TouchableOpacity
          style={styles.resultBackButton}
          onPress={goBackToCamera}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-outline" size={22} color="#667eea" />
          <Text style={styles.resultBackText}>再拍一张</Text>
        </TouchableOpacity>
        <Text style={styles.resultTitle}>识别结果</Text>
        <View style={styles.resultBackButton} />
      </View>

      <ScrollView
        style={styles.resultScroll}
        contentContainerStyle={styles.resultContent}
      >
        {photoUri && (
          <Image
            source={{ uri: photoUri }}
            style={styles.resultThumbnail}
          />
        )}
        <Text style={styles.resultText}>{resultText || '未能识别到内容'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5ff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  // Camera
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraTopBar: {
    paddingTop: 60,
    paddingBottom: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraTopText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  cameraBottomBar: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  // Permission
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 24,
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Loading
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  loadingSubText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  // Preview
  previewHeader: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: '70%',
    borderRadius: 12,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#667eea',
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#667eea',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
  },
  // Result
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  resultBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  resultBackText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultScroll: {
    flex: 1,
  },
  resultContent: {
    padding: 20,
  },
  resultThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
    marginBottom: 16,
    backgroundColor: '#e8e8e8',
  },
  resultText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
});

export default PhotoSearchScreen;