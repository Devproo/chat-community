import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { auth, db } from '@/lib/firebase';

type ConversationItem = {
  id: string;
  otherUserId: string;
  displayName: string;
  photoURL: string | null;
  lastMessage: string;
  updatedAt: Date | null;
};

export default function HomeScreen() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid),
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      async (snapshot) => {
        try {
          const items = await Promise.all(
            snapshot.docs.map(async (conversationDoc) => {
              const data = conversationDoc.data();
              const participantIds = data.participantIds as string[];
              const otherUserId = participantIds.find((id) => id !== user.uid);

              if (!otherUserId) {
                return null;
              }

              const profileSnapshot = await getDoc(
                doc(db, 'users', otherUserId),
              );

              const profile = profileSnapshot.data();
              const displayName =
                typeof profile?.displayName === 'string' &&
                profile.displayName.trim()
                  ? profile.displayName.trim()
                  : 'New user';

              return {
                id: conversationDoc.id,
                otherUserId,
                displayName,
                photoURL:
                  typeof profile?.photoURL === 'string'
                    ? profile.photoURL
                    : null,
                lastMessage:
                  typeof data.lastMessage === 'string' ? data.lastMessage : '',
                updatedAt: data.updatedAt?.toDate?.() ?? null,
              } satisfies ConversationItem;
            }),
          );

          setConversations(
            items
              .filter((item): item is ConversationItem => item !== null)
              .sort(
                (a, b) =>
                  (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
              ),
          );

          setError('');
        } catch {
          setError('Unable to load conversations. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Unable to load conversations. Please try again.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const filteredConversations = conversations.filter((conversation) =>
    conversation.displayName
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setError('');

    try {
      await signOut(auth);
      router.replace('/sign-in');
    } catch {
      setError('Unable to sign out. Please try again.');
      setSigningOut(false);
    }
  }

  function formatTime(date: Date | null) {
    if (!date) {
      return '';
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>YOUR COMMUNITY</Text>
          <Text style={styles.title}>Messages</Text>
        </View>

        <Pressable
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole='button'
          accessibilityLabel='Sign out'
        >
          {signingOut ? (
            <ActivityIndicator
              size='small'
              color='#4F46E5'
            />
          ) : (
            <Text style={styles.signOutText}>Sign out</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.welcome}>
        Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder='Search conversations...'
        placeholderTextColor='#737373'
        value={search}
        onChangeText={setSearch}
        autoCapitalize='none'
        autoCorrect={false}
        accessibilityLabel='Search conversations'
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent conversations</Text>
        {!loading && !error && (
          <Text style={styles.count}>{filteredConversations.length}</Text>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.status}>
          <ActivityIndicator
            size='large'
            color='#4F46E5'
          />
          <Text style={styles.statusText}>Loading your conversations...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyDescription}>{error}</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>✉</Text>
          </View>

          <Text style={styles.emptyTitle}>
            {search.trim()
              ? 'No conversations found'
              : 'Your conversations start here'}
          </Text>

          <Text style={styles.emptyDescription}>
            {search.trim()
              ? 'Try searching with another name.'
              : 'Visit Explore to find people and start chatting.'}
          </Text>

          {!search.trim() && (
            <Pressable
              style={styles.exploreButton}
              onPress={() => router.push('/explore')}
            >
              <Text style={styles.exploreButtonText}>Explore people</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps='handled'
        >
          {filteredConversations.map((conversation) => (
            <Pressable
              key={conversation.id}
              style={({ pressed }) => [
                styles.conversationCard,
                pressed && styles.conversationCardPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/chat/[conversationId]',
                  params: { conversationId: conversation.id },
                })
              }
              accessibilityRole='button'
              accessibilityLabel={`Open conversation with ${conversation.displayName}`}
            >
              {conversation.photoURL ? (
                <Image
                  source={{ uri: conversation.photoURL }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {conversation.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.conversationInfo}>
                <Text
                  style={styles.personName}
                  numberOfLines={1}
                >
                  {conversation.displayName}
                </Text>

                <Text
                  style={styles.lastMessage}
                  numberOfLines={1}
                >
                  {conversation.lastMessage || 'Start a conversation'}
                </Text>
              </View>

              <View style={styles.conversationMeta}>
                <Text style={styles.timestamp}>
                  {formatTime(conversation.updatedAt)}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  heading: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#4F46E5',
  },
  title: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: '700',
    color: '#171717',
  },
  signOutButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338CA',
  },
  welcome: {
    marginTop: 12,
    paddingHorizontal: 24,
    fontSize: 14,
    color: '#737373',
  },
  searchInput: {
    height: 50,
    marginTop: 24,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    fontSize: 15,
    color: '#171717',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    marginBottom: 14,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
  },
  count: {
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  conversationCardPressed: {
    backgroundColor: '#FAFAFA',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F5F5',
  },
  avatarFallback: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#E0E7FF',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3730A3',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  lastMessage: {
    marginTop: 6,
    fontSize: 13,
    color: '#737373',
  },
  conversationMeta: {
    alignItems: 'flex-end',
    gap: 5,
  },
  timestamp: {
    fontSize: 11,
    color: '#737373',
  },
  chevron: {
    fontSize: 24,
    color: '#A3A3A3',
  },
  status: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#737373',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
  },
  emptyIconText: {
    fontSize: 28,
    color: '#4338CA',
  },
  emptyTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#737373',
    textAlign: 'center',
  },
  exploreButton: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    marginHorizontal: 24,
    marginBottom: 8,
    fontSize: 13,
    color: '#DC2626',
  },
});
