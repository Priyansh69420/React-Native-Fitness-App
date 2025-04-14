import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { RFValue } from 'react-native-responsive-fontsize';

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
    marginTop: -height * 0.1, 
  },
  appLogo: {
    width: width * 0.15, 
    height: width * 0.15, 
    borderRadius: width * 0.075, 
    marginBottom: height * 0.05, 
    backgroundColor: 'transparent',
  },
  fingerprintIcon: {
    width: width * 0.25, 
    height: width * 0.25, 
    borderRadius: width * 0.125, 
    marginBottom: height * 0.03, 
  },
  title: {
    fontSize: RFValue(26, height),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.0125, 
  },
  subtitle: {
    fontSize: RFValue(16, height),
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.05, 
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.01875, 
    paddingHorizontal: width * 0.1, 
    borderRadius: width * 0.0725, 
    width: '85%',
    alignItems: 'center',
    marginTop: height * 0.075, 
    marginBottom: height * 0.01875, 
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(18, height), 
    fontWeight: 'bold',
  },
  notNowButton: {
    paddingVertical: height * 0.0125, 
    paddingHorizontal: width * 0.1,
    borderRadius: width * 0.0625,
    width: '75%',
    alignItems: 'center',
  },
  notNowText: {
    color: '#7A5FFF',
    fontSize: RFValue(18, height),
    fontWeight: 'bold',
  },
});
