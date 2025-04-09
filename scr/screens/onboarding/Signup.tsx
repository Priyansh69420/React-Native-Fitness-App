// app/sign-up.tsx
import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Signup">;
const logo = require('../../assets/logo.png');
const backIcon = require('../../assets/backIcon.png'); 

export default function Signup() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const {updateOnboardingData} = useOnboarding();

  async function handleContinue() {
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (Array.isArray(methods) && methods.length > 0) {
        alert('Email already exists, please log in');
        return;
      }
      updateOnboardingData({ email });
      navigation.navigate("SetPassword", { email });
    } catch (error: any) {
      console.log('Error code:', error.code); 
      console.log('Error message:', error.message); 
      alert(error.message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={backIcon} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.centeredContent}>
          <Image source={logo} style={styles.appLogo} resizeMode="contain" />

          <Text style={styles.title}>What is your email address?</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={() => handleContinue()}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 20,
    paddingTop: 20, 
  },
  backButton: {
    position: 'absolute',
    top: 40, 
    left: 20, 
    zIndex: 1, 
  },
  backIcon: {
    width: 30,
    height: 30, 
    resizeMode: 'contain', 
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20, 
    marginTop: -150, 
  },
  appLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 40,
    backgroundColor: 'transparent', 
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 100,
    marginTop: 10,
    width: '90%',
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center', 
  },
  input: {
    fontSize: 16,
    color: '#666',
    width: '100%',
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#7A5FFF', 
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '75%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});