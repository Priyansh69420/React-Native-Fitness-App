import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ActivityIndicator, useColorScheme } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { auth, firestore } from '../../../firebaseConfig';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import { TEXT } from '../../constants/text';

const logo = require('../../assets/logo.png');
const continueIcon = require('../../assets/continueIcon.png');

export default function ReadyToGo() {
  const [loading, setLoading] = useState(false);
  const [ error, setError ] = useState<string>('');
  const { onboardingData } = useOnboarding();
  const { setAuthUser } = useAuth();
  const isConnected = useNetInfo().isConnected;
  const theme = useColorScheme();

  useEffect(() => {
    if(!isConnected) {
      setError('Network error. Please check your internet connection and try again.');
      return;
    }

    setError('');
  }, [isConnected]);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;

      if(!user) return;

      await setDoc(doc(firestore, 'users', user.uid), {
        email: onboardingData.email ?? "",
        name: `${onboardingData.firstName} ${onboardingData.lastName}`,
        faceId: onboardingData.faceId ?? false,
        profilePicture: onboardingData.profilePicture ?? '',
        goals: onboardingData.goals ?? [],
        interests: onboardingData.interests ?? [],
        gender: onboardingData.gender ?? '',
        calories: 0,
        userHeight: onboardingData.userHeight ?? 0,
        userWeight: onboardingData.userWeight ?? 0,
        calorieGoal: 2000,
        glassGoal: 8,
        stepGoal: 10000,
        onboardingComplete: true,
        isPremium: false,
        planType: '',
        darkMode: theme === 'dark' ? true : false,
      });

      await setAuthUser(user.uid);

      if (onboardingData.verificationId) {
        const verificationDocRef = doc(firestore, 'pending_verifications', onboardingData.verificationId);
        await deleteDoc(verificationDocRef); 
      }
      await AsyncStorage.setItem('onboardingInProgress', JSON.stringify(false)); 
      await AsyncStorage.removeItem('onboardingData');
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

        <Text style={styles.title}>{TEXT.onboarding.readyToGo.title}</Text>
        <Text style={styles.subtitle}>
        {TEXT.onboarding.readyToGo.subTitle}
        </Text>

        {error ? (
          <Text style={{ color: 'red', width: '100%', textAlign: 'center' }}>{error}</Text>
        ) : (
        <TouchableOpacity style={styles.button} onPress={handleFinish} disabled={loading}>
          {loading ? <ActivityIndicator size='large' color="#FFF" /> : 
            <Image source={continueIcon} style={styles.continueIcon} resizeMode="contain" />}
        </TouchableOpacity>
      )}
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