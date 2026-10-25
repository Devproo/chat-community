import { router } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
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
import { db } from '@/lib/firebase';
import { getOrCreateDirectConversation } from '@/services/conversations';

type UserProfile = {
  id: string;
  displayName: string;
  photoURL: string | null;
};

export default function ExploreScreen() {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingUserId, setOpeningUserId] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState('');

  useEffect(() => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const profiles = snapshot.docs
          .map((document) => {
            const data = document.data();

            return {
              id: document.id,
              displayName:
                typeof data.displayName === 'string' && data.displayName.trim()
                  ? data.displayName.trim()
                  : 'New user',
              photoURL:
                typeof data.photoURL === 'string' ? data.photoURL : null,
            };
          })
          .filter((profile) => profile.id !== user.uid)
          .sort((a, b) => a.displayName.localeCompare(b.displayName));

        setUsers(profiles);
        setLoading(false);
        setError('');
      },
      () => {
        setError('Unable to load people. Please try again.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const filteredUsers = users.filter((profile) =>
    profile.displayName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function handleOpenConversation(otherUserId: string) {
    if (openingUserId !== null) {
      return;
    }

    setOpeningUserId(otherUserId);
    setConversationError('');

    try {
      const conversationId = await getOrCreateDirectConversation(otherUserId);

      router.push({
        pathname: '/chat/[conversationId]',
        params: { conversationId },
      });
    } catch {
      setConversationError(
        'Unable to open this conversation. Please try again.',
      );
    } finally {
      setOpeningUserId(null);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps='handled'
    >
      <Text style={styles.eyebrow}>DISCOVER</Text>

      <Text style={styles.title}>Find your people</Text>

      <Text style={styles.subtitle}>
        Discover people and connect with your community.
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder='Search people by name...'
        placeholderTextColor='#737373'
        value={search}
        onChangeText={setSearch}
        autoCapitalize='none'
        autoCorrect={false}
        accessibilityLabel='Search people by name'
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>People</Text>

        {!loading && !error && (
          <Text style={styles.count}>{filteredUsers.length}</Text>
        )}
      </View>

      {conversationError ? (
        <Text style={styles.errorText}>{conversationError}</Text>
      ) : null}

      {loading ? (
        <View style={styles.status}>
          <ActivityIndicator
            size='large'
            color='#4F46E5'
          />
          <Text style={styles.statusText}>Finding people...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Couldn't load people</Text>
          <Text style={styles.emptyDescription}>{error}</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>👥</Text>
          </View>

          <Text style={styles.emptyTitle}>
            {search.trim() ? 'No people found' : 'Your community starts here'}
          </Text>

          <Text style={styles.emptyDescription}>
            {search.trim()
              ? 'Try searching with another name.'
              : 'When other users create profiles, they will appear here.'}
          </Text>
        </View>
      ) : (
        filteredUsers.map((profile) => {
          const isOpening = openingUserId === profile.id;

          return (
            <Pressable
              key={profile.id}
              style={({ pressed }) => [
                styles.userCard,
                pressed && styles.userCardPressed,
              ]}
              onPress={() => handleOpenConversation(profile.id)}
              disabled={openingUserId !== null}
              accessibilityRole='button'
              accessibilityLabel={`Start conversation with ${profile.displayName}`}
            >
              {profile.photoURL ? (
                <Image
                  source={{ uri: profile.photoURL }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {profile.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{profile.displayName}</Text>
                <Text style={styles.userSubtitle}>
                  Chat &amp; Community member
                </Text>
              </View>

              {isOpening ? (
                <ActivityIndicator
                  size='small'
                  color='#4F46E5'
                />
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#4F46E5',
  },
  title: {
    marginTop: 8,
    fontSize: 29,
    fontWeight: '700',
    color: '#171717',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#737373',
  },
  searchInput: {
    height: 52,
    marginTop: 26,
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
    marginTop: 30,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  userCardPressed: {
    backgroundColor: '#F9FAFB',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E7FF',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3730A3',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
  },
  userSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: '#737373',
  },
  chevron: {
    marginLeft: 12,
    fontSize: 28,
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
    paddingHorizontal: 20,
    paddingVertical: 44,
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
  errorText: {
    marginTop: 12,
    marginBottom: 12,
    color: '#DC2626',
    fontSize: 14,
  },
});
