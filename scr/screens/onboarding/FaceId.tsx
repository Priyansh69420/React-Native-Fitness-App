import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { useOnboarding } from '../../contexts/OnboardingContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SetPassword">;
const logo = require('../../assets/logo.png'); 
const backIcon = require('../../assets/backIcon.png'); 
const fingerprintIcon = require('../../assets/faceidIcon.png'); 

export default function FaceId() {
  const navigation = useNavigation<NavigationProp>();
  const { updateOnboardingData } = useOnboarding();

  const enableBiometricAuth = () => {
    const rnBiometrics = new ReactNativeBiometrics();

    rnBiometrics.isSensorAvailable()
      .then((resultObject) => {
        const {available, biometryType} = resultObject;

        if (available && biometryType === BiometryTypes.TouchID) {
          Alert.alert('TouchID', 'Would you like to enable TouchID authentication for the next time?', [
            {
              text: 'Yes please',
              onPress: async () => {
                await updateOnboardingData({ faceId: true });
                Alert.alert('Success!', 'TouchID authentication enabled successfully!', [
                  {text: 'OK', onPress: () => navigation.navigate("SetProfile")},
                ]);
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]);
        } else if (available && biometryType === BiometryTypes.FaceID) {
          Alert.alert('Device Supported Biometrics', 'Would you like to enable biometric authentication for the next time?', [
            {
              text: 'Yes please',
              onPress: async () => {
                await updateOnboardingData({ faceId: true });
                Alert.alert('Success!', 'Biometric authentication enabled successfully!', [
                  { text: 'OK', onPress: () => navigation.navigate('SetProfile') }
                ]);
              },
            },
            { text: 'Cancel', style: 'cancel', onPress: () => navigation.navigate('SetProfile') },
          ]);
        } else if (available && biometryType === BiometryTypes.Biometrics) {
          Alert.alert('Device Supported Biometrics', 'Would you like to enable biometric authentication for the next time?', [
            {
              text: 'Yes please',
              onPress: async () => {
                await updateOnboardingData({ faceId: true });
                Alert.alert('Success!', 'Biometric authentication enabled successfully!', [
                  { text: 'OK', onPress: () => navigation.navigate('SetProfile') }
                ]);
              },
            },
            { text: 'Cancel', style: 'cancel', onPress: () => navigation.navigate('SetProfile') },
          ]);
        } else {
          Alert.alert('Biometrics not supported', 'This device does not support biometric authentication.', [
            { text: 'OK', onPress: () => navigation.navigate('SetProfile') }
          ]);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        Alert.alert('Error', 'An error occurred while checking biometrics availability.');
      });
  }

  const handleNotNow = async () => {
    await updateOnboardingData({ faceId: false });
    navigation.navigate("SetProfile");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={backIcon} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.centeredContent}>
          <Image source={logo} style={styles.appLogo} resizeMode="contain" />

          <Image source={fingerprintIcon} style={styles.fingerprintIcon} resizeMode="contain" />

          <Text style={styles.title}>Enable Face ID</Text>

          <Text style={styles.subtitle}>
            If you enable Face ID, you don’t need to enter your password when you login.
          </Text>

          <TouchableOpacity style={styles.button} onPress={enableBiometricAuth} >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notNowButton} onPress={handleNotNow} >
            <Text style={styles.notNowText}>Not Now</Text>
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
    marginTop: -80, 
  },
  appLogo: {
    width: 60,
    height: 60,
    borderRadius: 25,
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  fingerprintIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10, 
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40, 
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '75%',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notNowButton: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '75%',
    alignItems: 'center',
  },
  notNowText: {
    color: '#7A5FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});