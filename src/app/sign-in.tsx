import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { auth } from '@/lib/firebase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    const trimmedEmail = email.trim();

    setError('');

    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, trimmedEmail, password);

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
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Incorrect email or password.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Check your internet connection.');
          break;
        default:
          setError('Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CHAT & COMMUNITY</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to reconnect with your communities.
        </Text>
      </View>

      <View style={styles.form}>
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
          placeholder='Enter your password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete='current-password'
          editable={!loading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color='#FFFFFF' />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link
          href='/sign-up'
          style={styles.link}
        >
          Create one
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
    marginBottom: 36,
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
