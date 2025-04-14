import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigations/RootStackParamList";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FacebookAuthProvider, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "GettingStarted">;

const logo = require('../../assets/logo.png');
const twitterLogo = require('../../assets/twitter.png');
const facebookLogo = require('../../assets/facebook.png');
const googleLogo = require('../../assets/google.png');
const lockLogo = require('../../assets/padlock.png');
const userLogo = require('../../assets/user.png');
const backIcon = require('../../assets/backIcon.png');

GoogleSignin.configure({
  webClientId: '602719973492-kpgm6n50gejr82a9nbvc4c976iql2dqn.apps.googleusercontent.com',
  iosClientId: '602719973492-nj6j3hu2akaqj7k02v3rdohp54v3rk2u.apps.googleusercontent.com',
  scopes: ['email', 'profile'],
  offlineAccess: true,
});

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter your email and password');
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
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens(); 
  
      if (!idToken) {
        throw new Error("Google Sign-In failed: No ID token received.");
      }
  
      console.log("LoginScreen: Google Sign-In successful, idToken:", idToken);
  
      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, googleCredential);
  
      await AsyncStorage.setItem("lastLoginTimestamp", Date.now().toString());
      console.log("LoginScreen: Firebase Sign-In with Google successful");
    } catch (error: any) {
      console.error("LoginScreen: Google Sign-In error:", error);
  
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Cancelled", "Google Sign-In was cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("In Progress", "Google Sign-In is already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services are not available");
      } else {
        Alert.alert("Error", "Google Sign-In failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };  

  return (
    <SafeAreaView style={styles.safeArea}>

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

        <Text style={styles.signInWithText}>Sign in with</Text>

        <View style={styles.socialIconsContainer}>
          <TouchableOpacity style={styles.socialButton} >
            <Image source={twitterLogo} style={styles.socialIconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image source={facebookLogo} style={styles.socialIconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
            <Image source={googleLogo} style={styles.socialIconImage} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          {loading ? <ActivityIndicator size='small' color='#FFF' /> :
          <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>
      </View>
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
    marginTop: -height * 0.12, 
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
    justifyContent: 'space-between',
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