import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { auth, db } from '@/lib/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    setError('');

    if (!trimmedName || !trimmedEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Your password must contain at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      const credential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password,
      );
      await updateProfile(credential.user, {
        displayName: trimmedName,
      });

      await setDoc(doc(db, 'users', credential.user.uid), {
        displayName: trimmedName,
        photoURL: credential.user.photoURL ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.replace('/');
    } catch (err) {
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof err.code === 'string'
          ? err.code
          : '';

      switch (code) {
        case 'auth/email-already-in-use':
          setError('An account already exists with this email.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Please choose a stronger password.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Check your internet connection.');
          break;
        default:
          setError('Unable to create your account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CHAT & COMMUNITY</Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Join conversations and discover communities that interest you.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder='Enter your name'
          value={name}
          onChangeText={setName}
          autoCapitalize='words'
          autoComplete='name'
          editable={!loading}
        />

        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          placeholder='you@example.com'
          value={email}
          onChangeText={setEmail}
          keyboardType='email-address'
          autoCapitalize='none'
          autoCorrect={false}
          autoComplete='email'
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder='Create a password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete='new-password'
          editable={!loading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color='#FFFFFF' />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link
          href='/sign-in'
          style={styles.link}
        >
          Sign in
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
  },
  eyebrow: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  title: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    gap: 10,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  link: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
});
