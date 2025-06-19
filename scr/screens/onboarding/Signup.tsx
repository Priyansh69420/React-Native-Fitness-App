import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { fetchSignInMethodsForEmail, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { RFValue } from 'react-native-responsive-fontsize';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNetInfo } from '@react-native-community/netinfo';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Signup">;
const logo = require('../../assets/logo.png');
const backIcon = require('../../assets/backIcon.png'); 

export default function Signup() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [shouldValidate, setShouldValidate] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string>('');
  const isConnected = useNetInfo();

  const { updateOnboardingData, onboardingData } = useOnboarding();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (onboardingData.email) setEmail(onboardingData.email);
  }, []);

  useEffect(() => {
    if (!shouldValidate) return;

    if (email.length === 0) {
      setError('Please enter your email address');
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      setError('Please enter a valid email address');
    } else {
      setError('');
    }
  }, [email, shouldValidate]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  async function handleContinue() {
    if(!isConnected.isConnected) {
      setError('Network error. Please check your internet connection and try again.');
      return;
    }
    
    setShouldValidate(true);
    setVerificationError('');

    const trimmedEmail = email.trim().toLowerCase();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (trimmedEmail.length === 0) {
      setError('Please enter your email address');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError('That doesn’t look like a valid email address');
      return;
    }

    if(auth.currentUser && onboardingData.isEmailVerified && onboardingData.email === email) {
      navigation.navigate('SetName');
      return;
    }

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, trimmedEmail);

      if (signInMethods.length > 0) {
        setError('An account with this email already exists. Please log in instead.');
        return;
      }

      if (!onboardingData.password) {
        updateOnboardingData({ email: trimmedEmail });
        setError('');
        navigation.navigate("SetPassword", { email: trimmedEmail });
      } else {
        await verifyEmail(trimmedEmail);
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        setError('That doesn’t look like a valid email address');
      } else {
        console.error("Firebase error:", error.message);
        setError("Something went wrong. Please try again.");
      }
    }
  }

  async function verifyEmail(email: string) {
    setVerifying(true);
    setVerificationMessage('');
    setVerificationError('');

    if(!onboardingData.password) {
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, onboardingData.password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      setVerificationMessage('Verification email sent. Please check your inbox and verify your email.');

      const intervalId = setInterval(async () => {
        if (user) {
          await user.reload();
          if (user.emailVerified) {
            clearInterval(intervalId);
            intervalRef.current = null;
            setVerifying(false);
            setVerificationMessage('');
            updateOnboardingData({ isEmailVerified: true });
            navigation.navigate('SetName');
          }
        }
      }, 2000);

      intervalRef.current = intervalId;

      setTimeout(async () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;

          await user.reload();
          if (!user?.emailVerified) {
            try {
              await user.delete();
            } catch(error: any) {
              console.error('Error checking or deleting user:', error);
            }

            setVerifying(false);
            setVerificationError('Email verification timed out. Please try again.');
          }
        }
      }, 2 * 60 * 1000);
    } catch (error: any) {
      console.error("Email verification error:", error.message);
      setVerifying(false);

      const user = auth.currentUser;
      if(user && !user.emailVerified) {
        await user.delete();
      }

      if (error.code === 'auth/email-already-in-use') {
        setVerificationError('An account with this email already exists.');
        updateOnboardingData({isEmailVerified: true});
      } else if (error.code === 'auth/weak-password') {
        setVerificationError('Password is too weak. Please set a stronger password.');
      } else {
        setVerificationError('Failed to send verification email. Please try again.');
      }
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={-2000}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>

          <View style={styles.centeredContent}>
            <Image source={logo} style={styles.appLogo} resizeMode="contain" />

            <Text style={styles.title}>
              {onboardingData.password ? 'Verify Your Email' : 'What is your Email address?'}
            </Text>

            <View style={{ marginBottom: height * 0.125, width: '100%', alignItems: 'center' }}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!verifying}
                  autoFocus
                />
              </View>

              {error ? (
                <Text style={{ color: 'red', width: '100%', textAlign: 'center' }}>{error}</Text>
              ) : null}
              {verificationMessage ? (
                <Text style={{ color: '#333', width: '90%', textAlign: 'center', marginTop: 10 }}>
                  {verificationMessage}
                </Text>
              ) : null}
              {verificationError ? (
                <Text style={{ color: 'red', width: '90%', textAlign: 'center', marginTop: 10 }}>
                  {verificationError}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.button, verifying && { backgroundColor: '#A9A9A9' }]}
              onPress={handleContinue}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {onboardingData.password ? 'Verify Email' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ marginBottom: height * 0.18 }} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.025,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    zIndex: 1,
  },
  backIcon: {
    width: width * 0.075,
    height: width * 0.075,
    resizeMode: 'contain',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
  },
  appLogo: {
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: width * 0.065,
    marginBottom: height * 0.05,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: RFValue(26, height),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.035,
    width: "110%"
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderRadius: width * 0.025,
    paddingHorizontal: width * 0.0375,
    marginBottom: height * 0.01,
    marginTop: height * 0.0125,
    width: '90%',
    height: height * 0.0625,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
  },
  input: {
    fontSize: RFValue(16, height),
    color: '#666',
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.01875,
    paddingHorizontal: width * 0.1,
    borderRadius: width * 0.0725,
    width: '85%',
    alignItems: 'center',
    opacity: 1,
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(18, height),
    fontWeight: 'bold',
  },
});