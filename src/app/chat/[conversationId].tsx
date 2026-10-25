import { router, useLocalSearchParams } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date | null;
};

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipientName, setRecipientName] = useState('Conversation');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!user || !conversationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeConversation = onSnapshot(
      doc(db, 'conversations', conversationId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('This conversation could not be found.');
          setLoading(false);
          return;
        }

        const participantIds = snapshot.data().participantIds as
          | string[]
          | undefined;
        const otherUserId = participantIds?.find((id) => id !== user.uid);

        if (!otherUserId) {
          setError('This conversation has no other participant.');
          setLoading(false);
          return;
        }

        unsubscribeProfile?.();

        unsubscribeProfile = onSnapshot(
          doc(db, 'users', otherUserId),
          (profileSnapshot) => {
            const profile = profileSnapshot.data();

            setRecipientName(
              typeof profile?.displayName === 'string' &&
                profile.displayName.trim()
                ? profile.displayName.trim()
                : 'New user',
            );
          },
          () => setRecipientName('Conversation'),
        );

        setLoading(false);
      },
      () => {
        setError('Unable to load this conversation.');
        setLoading(false);
      },
    );

    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((messageDoc) => {
            const data = messageDoc.data();

            return {
              id: messageDoc.id,
              senderId: data.senderId,
              text: data.text,
              createdAt: data.createdAt?.toDate?.() ?? null,
            };
          }),
        );
        setLoading(false);
        setError('');
      },
      () => {
        setError('Unable to load messages.');
        setLoading(false);
      },
    );

    return () => {
      unsubscribeProfile?.();
      unsubscribeConversation();
      unsubscribeMessages();
    };
  }, [conversationId, user]);

  async function handleSendMessage() {
    const text = draft.trim();

    if (!text || !user || !conversationId || sending) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const conversationRef = doc(db, 'conversations', conversationId);

      await addDoc(collection(conversationRef, 'messages'), {
        senderId: user.uid,
        text,
        type: 'text',
        createdAt: serverTimestamp(),
      });

      await updateDoc(conversationRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setDraft('');
    } catch {
      setError('Message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function formatTime(date: Date | null) {
    if (!date) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole='button'
          accessibilityLabel='Go back'
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{recipientName}</Text>
          <Text style={styles.headerSubtitle}>Chat & Community</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator
            size='large'
            color='#4F46E5'
          />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={styles.messageList}
          contentContainerStyle={[
            styles.messageContent,
            messages.length === 0 && styles.emptyMessageContent,
          ]}
          data={messages}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps='handled'
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Say hello 👋</Text>
              <Text style={styles.emptySubtitle}>
                Send your first message to start the conversation.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.uid;

            return (
              <View
                style={[
                  styles.messageRow,
                  isMine ? styles.myMessageRow : styles.theirMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMine ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  <Text
                    style={[styles.messageText, isMine && styles.myMessageText]}
                  >
                    {item.text}
                  </Text>

                  <Text
                    style={[styles.messageTime, isMine && styles.myMessageTime]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder='Write a message...'
          placeholderTextColor='#737373'
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={4000}
          editable={!sending}
          accessibilityLabel='Message'
        />

        <Pressable
          style={[
            styles.sendButton,
            (!draft.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!draft.trim() || sending}
          accessibilityRole='button'
          accessibilityLabel='Send message'
        >
          {sending ? (
            <ActivityIndicator
              size='small'
              color='#FFFFFF'
            />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  backText: {
    marginTop: -4,
    fontSize: 32,
    color: '#171717',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#737373',
  },
  errorText: {
    paddingHorizontal: 20,
    paddingTop: 10,
    color: '#DC2626',
    fontSize: 13,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#737373',
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyMessageContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171717',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#737373',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 7,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 5,
  },
  theirMessage: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#171717',
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    alignSelf: 'flex-end',
    marginTop: 5,
    fontSize: 10,
    color: '#737373',
  },
  myMessageTime: {
    color: '#E0E7FF',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    gap: 10,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 23,
    backgroundColor: '#F5F5F5',
    fontSize: 15,
    color: '#171717',
  },
  sendButton: {
    minWidth: 62,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 23,
    backgroundColor: '#4F46E5',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
