import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigations/RootStackParamList";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../../../firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';
import { doc, getDoc, setDoc } from '@firebase/firestore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "GettingStarted">;

const logo = require('../../assets/logo.png');
const twitterLogo = require('../../assets/twitter.png');
const facebookLogo = require('../../assets/facebook.png');
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
  const navigation = useNavigation<NavigationProp>()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<String>('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem('justLoggedIn', 'true');
    } catch (error: any) {
      console.error('LoginScreen: Sign-in error:', error.message);
      alert(error.message);
    } finally {
      setLoading(false);
      setError('');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const googleCredential = GoogleAuthProvider.credential(tokens.idToken);
      const creds = await signInWithCredential(auth, googleCredential);

      await AsyncStorage.setItem('justLoggedIn', 'true');

      if (creds?.user) {
        const userDocRef = doc(firestore, 'users', creds.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: creds.user.email || 'user@gmail.com',
            name: creds.user.displayName || 'User',
            profilePicture: creds.user.photoURL || '2',
            goals: [ 'Weight Loss' ],
            interests: [ 'Fitness' ],
            gender: 'Male',
            calories: 0,
            biometricAuthenticated: false,
            faceId: false,
          });
          console.log("LoginScreen: Created initial user document for Google Sign-in");
        } else {
          console.log("LoginScreen: User document already exists for Google Sign-in");
        }
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      Alert.alert("Error", error.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -130}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>

        <View style={styles.container}>
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
            />
          </View>

          <View style={styles.inputContainer}>
            <Image source={lockLogo} style={styles.iconPlaceholder} />
            <TextInput 
              style={styles.input} 
              value={password}
              onChangeText={(text) => setPassword(text)}
              placeholder="Password" 
              secureTextEntry 
            />
          </View>

          {error ? <Text style={{color: 'red', width: '85%', textAlign: 'center'}}>{error}</Text>: <></>}

          <Text style={styles.signInWithText}>Sign in with</Text>

          <View style={styles.socialIconsContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
              <Image source={googleLogo} style={styles.socialIconImage} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            {loading ? <ActivityIndicator size='small' color='#FFF' /> :
            <Text style={styles.buttonText}>Continue</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <View style={{marginBottom: height * 0.12, }}/>
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
    paddingTop: height * 0.025,
    
  },
  backButton: {
    position: 'absolute',
    top: height * 0.12, 
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
});