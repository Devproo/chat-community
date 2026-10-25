# Chat & Community — Business Logic

## Authentication
- signUp
- signIn
- signOut
- getCurrentUser
- updateProfile

## Direct Messaging
- createConversation
- getConversations
- getMessages
- sendMessage
- editMessage
- deleteMessage
- subscribeToMessages

## Communities
- createCommunity
- getCommunities
- getCommunity
- joinCommunity
- leaveCommunity
- updateCommunity
- deleteCommunity

## Community Membership
- getMembers
- updateMemberRole
- removeMember

## Community Posts
- getPosts
- createPost
- editPost
- deletePost
- subscribeToPosts

## Authorization Rules
- Users can access only conversations they participate in.
- Users can modify only their own messages and posts,
  except authorized moderators.
- Community owners and moderators can manage community content
  according to their permissions.
- Only community owners can assign or remove moderators.
- All permissions must be enforced by the backend.

## Implementation Order
1. Authentication and user profiles
2. Direct conversations and messages
3. Community creation and membership
4. Community posts and discussions
5. Real-time updates
