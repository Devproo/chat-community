import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

export async function getOrCreateDirectConversation(
  otherUserId: string,
): Promise<string> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('You must be signed in to start a conversation.');
  }

  if (currentUser.uid === otherUserId) {
    throw new Error('You cannot start a conversation with yourself.');
  }

  const participantIds = [currentUser.uid, otherUserId].sort();

  const conversationsRef = collection(db, 'conversations');

  const existingQuery = query(
    conversationsRef,
    where('type', '==', 'direct'),
    where('participantIds', '==', participantIds),
    limit(1),
  );

  const existing = await getDocs(existingQuery);

  if (!existing.empty) {
    return existing.docs[0].id;
  }

  const conversationRef = await addDoc(conversationsRef, {
    type: 'direct',
    participantIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: '',
    lastMessageAt: null,
  });

  return conversationRef.id;
}
