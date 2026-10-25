# Chat & Community — Data Models

## 1. User
- id
- displayName
- username
- avatarUrl (optional)
- createdAt
- updatedAt

## 2. Conversation
- id
- type: direct
- participantIds
- createdAt
- updatedAt

## 3. Message
- id
- conversationId
- senderId
- text
- createdAt
- updatedAt
- deletedAt (optional)

## 4. Community
- id
- name
- description (optional)
- ownerId
- createdAt
- updatedAt

## 5. Community Membership
- id
- communityId
- userId
- role: owner | moderator | member
- joinedAt

## 6. Community Post
- id
- communityId
- authorId
- text
- createdAt
- updatedAt
- deletedAt (optional)

## Relationships

- A user can participate in many conversations.
- A conversation has at least two participants.
- A conversation contains many messages.
- A message belongs to one conversation and one sender.
- A user can own multiple communities.
- A community has many members.
- A community contains many posts.
- A post belongs to one community and one author.

## Business Rules

- Usernames must be unique.
- Direct conversations must not create duplicate conversations
  for the same pair of participants.
- Only conversation participants can read or send its messages.
- Only community members can access member-only discussions.
- Only authorized community members can manage membership.
- Users can edit or delete only their own messages and posts,
  unless they have appropriate moderation permissions.
- Message and post text cannot be empty.
- Deleted messages and posts are hidden from normal views.

## Initial Scope

Implement text-only messaging and basic community discussions first.
Add media attachments, reactions, typing indicators, read receipts,
push notifications, and group chat enhancements later.
