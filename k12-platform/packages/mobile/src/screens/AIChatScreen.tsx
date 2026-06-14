import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import apiClient from '../services/api';
import type { AIStackParamList } from '../navigation/AppNavigator';

type AIChatNavigationProp = NativeStackNavigationProp<AIStackParamList, 'AIMain'>;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const AIChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 K12 AI 学习助手，有什么问题我可以帮你解答吗？\n\n你可以问我数学题、物理概念、英语语法等任何学习相关的问题。',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation<AIChatNavigationProp>();

  const sendMessage = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    // Scroll to bottom after adding user message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await apiClient.sendMessage(trimmed);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Demo fallback response
      const demoReplies = [
        '这是一个很好的问题！让我来帮你分析一下。\n\n根据相关知识点，我们可以从以下几个方面来理解：\n\n1. **基本概念**：首先要明确问题的核心概念\n2. **解题思路**：按照步骤逐步推导\n3. **注意事项**：常见的易错点需要特别关注\n\n还有什么不清楚的地方吗？',
        '让我为你详细解答这个问题。\n\n**关键点：**\n- 理解题目的核心要求\n- 运用已学的公式和定理\n- 注意单位换算和符号\n\n如果你是初中生，可以用更简单的思路来理解。需要我用更简单的方式解释吗？',
        '这个问题涉及到的知识点是重点考察内容。\n\n我建议你按照以下步骤来学习：\n1. 先复习相关的基础概念\n2. 做一些基础练习题巩固\n3. 再尝试较难的变式题\n\n需要我推荐一些相关的练习题吗？',
      ];
      const randomReply = demoReplies[Math.floor(Math.random() * demoReplies.length)];
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: randomReply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [inputText, isSending]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.assistantMessageRow,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Ionicons name="school-outline" size={18} color="#667eea" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {item.content}
          </Text>
        </View>
        {isUser && (
          <View style={styles.avatarContainer}>
            <Ionicons name="person-outline" size={18} color="#764ba2" />
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>开始和 AI 助教对话吧</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => navigation.navigate('PhotoSearch')}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>AI 学习助手</Text>
          <Text style={styles.headerSubtitle}>随时为你解答学习问题</Text>
        </View>
        <View style={styles.cameraButton} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入你的问题..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isSending}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5ff',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#333333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default AIChatScreen;