import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logo = require('../../assets/logo.png');
const continueIcon = require('../../assets/continueIcon.png'); 

export default function ReadyToGo() {
  const [loading, setLoading] = useState(false);
  const { onboardingData } = useOnboarding();
  const email = onboardingData.email ?? "";
  const password = onboardingData.password ?? "";

  const handleFinish = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem('justLoggedIn', 'true');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(firestore, 'users', user.uid), {
        email,
        name: `${onboardingData.firstName} ${onboardingData.lastName}` || '',
        faceId: onboardingData.faceId || false,
        profilePicture: onboardingData.profilePicture || '',
        goals: onboardingData.goals || [],
        interests: onboardingData.interests || [],
        gender: onboardingData.gender || '',
        calories: 0,
        userHeight: onboardingData.userHeight || 0,
        userWeight: onboardingData.userWeight || 0,
      });

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.appLogo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>You are ready to go!</Text>
        <Text style={styles.subtitle}>
          Thanks for taking your time to create account with us. Now this is the fun part, let’s explore the app.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleFinish}>
          {loading ? <ActivityIndicator size='large' color="#FFF" /> : 
          <Image source={continueIcon} style={styles.continueIcon} resizeMode="contain" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7A5FFF', 
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 90, 
    height: 90,
    borderRadius: 45, 
    backgroundColor: '#FFF', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 45,
  },
  appLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 19,
    width: "85%",
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 28,
  },
  button: {
    padding: 10,
  },
  continueIcon: {
    width: 45,
    height: 45,
    tintColor: '#FFF',
  },
});