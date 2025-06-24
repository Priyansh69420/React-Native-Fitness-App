import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigations/RootStackParamList";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../../../firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';
import { doc, getDoc, setDoc } from '@firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '../../contexts/AuthContext';
import { useNetInfo } from '@react-native-community/netinfo';
import { useOnboarding } from '../../contexts/OnboardingContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "GettingStarted">;

const logo = require('../../assets/logo.png');
const googleLogo = require('../../assets/google.png');
const lockLogo = require('../../assets/padlock.png');
const userLogo = require('../../assets/user.png');
const backIcon = require('../../assets/backIcon.png');

GoogleSignin.configure({
  webClientId: '602719973492-fgvv5f7knj4u3q8pmlmkdku6qeaqlo97.apps.googleusercontent.com',
  iosClientId: '602719973492-nj6j3hu2akaqj7k02v3rdohp54v3rk2u.apps.googleusercontent.com',
  scopes: ['email', 'profile'],
  offlineAccess: true,
});

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { setAuthUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const isConnected = useNetInfo().isConnected;
  const { resetOnboardingData, onboardingData } = useOnboarding();

  useEffect(() => {
    setError('')
  }, [email, password, isConnected])
  

  const handleLogin = async () => {
    if (!email || !password) {
      if (!email && password) {
        setError('Please enter your email');
        return;
      }

      if (email && !password) {
        setError('Please enter your password');
        return;
      }

      setError('Please enter both your email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setAuthUser(user.uid);

      await AsyncStorage.setItem('onboardingInProgress', JSON.stringify(false));
      await resetOnboardingData();
    } catch (error: any) {
      console.error('LoginScreen: Sign-in error:', error.message);

      const errorCode = error.code;

      const errorMessages: { [key: string]: string } = {
        'auth/user-not-found': 'No user found with this email.',
        'auth/wrong-password': `Incorrect password. Please try again.`,
        'auth/invalid-email': 'Email address is invalid.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Try again later.',
        'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
      };

      const friendlyMessage = errorMessages[errorCode] || 'Login failed. Please try again.';
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const googleCredential = GoogleAuthProvider.credential(tokens.idToken);
      const creds = await signInWithCredential(auth, googleCredential);
      const user = creds.user;
  
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email ?? 'user@gmail.com',
          name: user.displayName ?? 'User',
          profilePicture: user.photoURL ?? '2',
          goals: ['Weight Loss'],
          interests: ['Fitness'],
          gender: 'Male',
          calories: 0,
          faceId: false,
          userHeight: 0,
          userWeight: 0,
          onboardingComplete: true,
          isPremium: false,
          planType: '',
          calorieGoal: 2000,
          glassGoal: 8,
          stepGoal: 10000,
        });
        
        console.log("LoginScreen: Created initial user document for Google Sign-in");
      } else {
        console.log("LoginScreen: User document already exists for Google Sign-in");
      }
  
      await setAuthUser(user.uid);
      await resetOnboardingData();
  
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = "Google Sign-In failed";
      if (error.code === 'SIGN_IN_CANCELLED') {
        errorMessage = "Google Sign-In was cancelled";
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = "Google Play Services are not available on this device";
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = "Network error. Please check your internet connection.";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

          <Image source={logo} style={styles.appLogo} />

          <View style={styles.inputContainer}>
            <Image source={userLogo} style={styles.iconPlaceholder} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => setEmail(text)}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize='none'
              autoFocus
            />
          </View>

          <View style={styles.inputContainer}>
            <Image source={lockLogo} style={styles.iconPlaceholder} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!isVisible}
            />
            <TouchableOpacity
              onPress={() => setIsVisible(v => !v)}
              style={styles.eyeButton}
              accessibilityLabel={isVisible ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={isVisible ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgetPassword')}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={{ color: 'red', width: '85%', textAlign: 'center' }}>{error}</Text> : <></>}

          <Text style={styles.signInWithText}>Sign in with</Text>

          <View style={styles.socialIconsContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn} disabled={loading}>
              <Image source={googleLogo} style={styles.socialIconImage} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator size='small' color='#FFF' /> :
              <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: height * 0.12 }} />
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.05,
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
  appLogo: {
    width: width * 0.13,
    height: width * 0.13,
    backgroundColor: '#F5F7FA',
    borderRadius: width * 0.065,
    marginBottom: height * 0.075,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: width * 0.025,
    paddingHorizontal: width * 0.025,
    marginBottom: height * 0.01875,
    width: '100%',
    height: height * 0.0625,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconPlaceholder: {
    width: width * 0.045,
    height: width * 0.045,
    backgroundColor: '#FFF',
    marginRight: width * 0.025,
  },
  input: {
    flex: 1,
    fontSize: RFValue(16, height),
    color: '#333',
  },
  signInWithText: {
    fontSize: RFValue(16, height),
    color: '#666',
    marginVertical: height * 0.025,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: width * 0.38,
    marginBottom: height * 0.0375,
  },
  socialButton: {
    width: width * 0.1,
    height: width * 0.1,
    backgroundColor: '#FFF',
    borderRadius: width * 0.05,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  socialIconImage: {
    width: width * 0.055,
    height: width * 0.055,
    resizeMode: 'contain',
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.01875,
    paddingHorizontal: width * 0.1,
    borderRadius: width * 0.0625,
    marginTop: height * 0.025,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(18, height),
    fontWeight: 'bold',
  },
  eyeButton: {
    padding: 8,
  },
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
  },
  forgotPassword: {
    fontSize: RFValue(14, height),
    color: '#0000FF',
    textAlign: 'center',
    fontWeight: '500',
    justifyContent: 'flex-end',
  },
});