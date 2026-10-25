# Chat & Community — Backend Architecture

## Services
- Firebase Authentication
- Cloud Firestore
- Firebase Security Rules

## Collections

### users/{userId}
- displayName
- username
- avatarUrl
- createdAt
- updatedAt

### conversations/{conversationId}
- type: direct
- participantIds: string[]
- createdAt
- updatedAt
- lastMessageText
- lastMessageAt

### conversations/{conversationId}/messages/{messageId}
- senderId
- text
- createdAt
- updatedAt
- deletedAt

### communities/{communityId}
- name
- description
- ownerId
- createdAt
- updatedAt

### communities/{communityId}/members/{userId}
- role: owner | moderator | member
- joinedAt

### communities/{communityId}/posts/{postId}
- authorId
- text
- createdAt
- updatedAt
- deletedAt

## Security
- Require authentication for private application data.
- Validate document fields and types in Firestore Rules.
- Restrict conversations to their participants.
- Restrict community content to authorized members.
- Enforce message, post, and membership permissions on the server.
- Never place service-account credentials in the mobile app.

## Real-Time Features
- Subscribe to conversation updates.
- Subscribe to messages in the active conversation.
- Subscribe to community posts when viewing a community.

## Initial Limitations
- Text-only messages and posts.
- No voice or video calls.
- No media uploads.
- No push notifications in the first implementation.
