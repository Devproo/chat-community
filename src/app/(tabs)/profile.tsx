import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { auth, db } from '@/lib/firebase';

const CLOUDINARY_CLOUD_NAME = 'djmajvsul';
const CLOUDINARY_UPLOAD_PRESET = 'Devproo';

export default function ProfileScreen() {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
    setPhotoURL(user?.photoURL ?? '');
  }, [user]);

  async function handleUploadPhoto() {
    if (!user || uploading || saving) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError('Allow photo library access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        setError('Choose an image smaller than 10 MB.');
        return;
      }

      setUploading(true);

      const formData = new FormData();

      if (asset.file) {
        // Web: upload the actual File object.
        formData.append('file', asset.file);
      } else {
        // iOS and Android: upload the local file URI.
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName || 'profile-picture.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as unknown as Blob);
      }

      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'chat-community/profiles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      const resultData = (await response.json()) as {
        secure_url?: string;
        error?: { message?: string };
      };

      if (!response.ok || !resultData.secure_url) {
        throw new Error(
          resultData.error?.message || 'The image upload failed.',
        );
      }

      const uploadedURL = resultData.secure_url;

      await setDoc(
        doc(db, 'users', user.uid),
        {
          photoURL: uploadedURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await updateProfile(user, { photoURL: uploadedURL });

      setPhotoURL(uploadedURL);
      setSuccess('Your profile picture has been updated.');
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload your picture. Please try again.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!user || saving || uploading) {
      return;
    }

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError('Please enter a display name.');
      setSuccess('');
      return;
    }

    if (trimmedName.length > 40) {
      setError('Your display name must be 40 characters or fewer.');
      setSuccess('');
      return;
    }

    Keyboard.dismiss();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName: trimmedName,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await updateProfile(user, { displayName: trimmedName });

      setDisplayName(trimmedName);
      setSuccess('Your profile has been updated.');
    } catch {
      setError('Unable to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

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

  const initial = (displayName.trim() || user?.email || '?')
    .charAt(0)
    .toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps='handled'
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your community identity.</Text>
      </View>

      <View style={styles.profileCard}>
        <Pressable
          onPress={handleUploadPhoto}
          disabled={uploading || saving || !user}
          accessibilityRole='button'
          accessibilityLabel='Change profile picture'
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && styles.buttonPressed,
          ]}
        >
          {photoURL ? (
            <Image
              source={{ uri: photoURL }}
              style={styles.avatarImage}
              accessibilityLabel='Profile picture'
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}

          <View style={styles.cameraBadge}>
            {uploading ? (
              <ActivityIndicator
                size='small'
                color='#FFFFFF'
              />
            ) : (
              <Text style={styles.cameraBadgeText}>Edit</Text>
            )}
          </View>
        </Pressable>

        <Text style={styles.photoHint}>
          {uploading ? 'Uploading picture…' : 'Tap your picture to change it'}
        </Text>

        <Text style={styles.profileName}>
          {displayName.trim() || 'Community member'}
        </Text>

        <Text style={styles.profileEmail}>
          {user?.email || 'No email available'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal information</Text>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={(value) => {
            setDisplayName(value);
            setError('');
            setSuccess('');
          }}
          placeholder='Enter your display name'
          placeholderTextColor='#737373'
          maxLength={40}
          autoCapitalize='words'
          autoCorrect={false}
          returnKeyType='done'
          onSubmitEditing={handleSave}
          accessibilityLabel='Display name'
        />

        <Text style={styles.helper}>
          This name is visible to other community members.
        </Text>

        <Text style={styles.label}>Email address</Text>
        <View style={styles.readOnlyField}>
          <Text style={styles.emailText}>
            {user?.email || 'No email available'}
          </Text>
          <Text style={styles.verifiedLabel}>Account email</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.buttonPressed,
            (saving || uploading) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || uploading || !user}
          accessibilityRole='button'
        >
          {saving ? (
            <ActivityIndicator color='#FFFFFF' />
          ) : (
            <Text style={styles.saveButtonText}>Save changes</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.accountDescription}>
          You are signed in to Chat Community. Signing out will return you to
          the sign-in screen.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.buttonPressed,
            signingOut && styles.buttonDisabled,
          ]}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole='button'
        >
          {signingOut ? (
            <ActivityIndicator color='#B91C1C' />
          ) : (
            <Text style={styles.signOutText}>Sign out</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingTop: 64,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
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
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#737373',
  },
  profileCard: {
    alignItems: 'center',
    marginTop: 28,
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarButton: {
    position: 'relative',
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatar: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 46,
    backgroundColor: '#E0E7FF',
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#E5E7EB',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3730A3',
  },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    minWidth: 42,
    height: 28,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  cameraBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#737373',
  },
  profileName: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: '#171717',
  },
  profileEmail: {
    marginTop: 6,
    fontSize: 14,
    color: '#737373',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    marginBottom: 20,
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#404040',
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
    fontSize: 15,
    color: '#171717',
  },
  helper: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 12,
    lineHeight: 18,
    color: '#737373',
  },
  readOnlyField: {
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  emailText: {
    fontSize: 14,
    color: '#525252',
  },
  verifiedLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#737373',
  },
  errorText: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    color: '#DC2626',
  },
  successText: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    color: '#15803D',
  },
  saveButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  accountDescription: {
    marginTop: -6,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 20,
    color: '#737373',
  },
  signOutButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B91C1C',
  },
});
