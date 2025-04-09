import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useOnboarding } from '../../contexts/OnboardingContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SetPassword">;
const logo = require('../../assets/logo.png'); 
const backIcon = require('../../assets/backIcon.png');

export default function SetPassword() {
  const navigation = useNavigation<NavigationProp>();
  const [password, setPassword] = useState('');
  const {updateOnboardingData, onboardingData} = useOnboarding();
  const email = onboardingData.email ?? "";

  const checkPasswordRequirements = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    return { minLength, hasUpperCase, hasNumber };
  };

  const handleContinue = async () => {
    const {minLength, hasUpperCase, hasNumber} = checkPasswordRequirements(password);

    if(!minLength || !hasUpperCase || !hasNumber) {
      alert("Password must be at least 8 characters long, contain an uppercase letter, and include a number.")
      return;
    }

      updateOnboardingData({password});
      navigation.navigate("SetName");
  }

  const { minLength, hasUpperCase, hasNumber } = checkPasswordRequirements(password);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={backIcon} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.centeredContent}>
          <Image source={logo} style={styles.appLogo} resizeMode="contain" />

          <Text style={styles.title}>Now let's set up your password</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.requirementsContainer}>
            <View style={styles.requirementRow}>
              {minLength ? (
                <View style={styles.checkedBox} />
              ) : (
                <View style={styles.uncheckedBox} />
              )}
              <Text style={styles.requirementText}>  8+ characters</Text>
            </View>
            <View style={styles.requirementRow}>
              {hasUpperCase ? (
                <View style={styles.checkedBox} />
              ) : (
                <View style={styles.uncheckedBox} />
              )}
              <Text style={styles.requirementText}>  At least 1 uppercase</Text>
            </View>
            <View style={styles.requirementRow}>
              {hasNumber ? (
                <View style={styles.checkedBox} />
              ) : (
                <View style={styles.uncheckedBox} />
              )}
              <Text style={styles.requirementText}>  At least 1 number</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
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
    marginTop: -50, 
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
    marginBottom: 20,
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
    textAlign: 'center',
  },
  requirementsContainer: {
    marginBottom: 80,
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: "90%"
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  checkedBox: {
  width: 18,
  height: 18,
  backgroundColor: '#7A5FFF', 
  borderRadius: 3,
  marginRight: 5,
  },
  uncheckedBox: {
  width: 18,
  height: 18,
  backgroundColor: '#D9D9D9',
  borderRadius: 3,
  marginRight: 5,
  },
  requirementText: {
    fontSize: 14,
    color: '#D3D3D3',
    textAlign: 'left',
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