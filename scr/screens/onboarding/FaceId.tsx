import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { TEXT } from '../../constants/text';

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
      .then(handleBiometricAvailability)
      .catch((error) => {
        console.error('Error:', error);
        Alert.alert('Error', 'An error occurred while checking biometrics availability.');
      });
  };

  const handleBiometricAvailability = (resultObject: { available: boolean; biometryType?: keyof typeof BiometryTypes }) => {
    const { available, biometryType } = resultObject;

    if (available && biometryType === BiometryTypes.TouchID) {
      promptBiometricAlert('TouchID', 'Would you like to enable TouchID authentication for the next time?', true);
    } else if (available && (biometryType === BiometryTypes.FaceID || biometryType === BiometryTypes.Biometrics)) {
      promptBiometricAlert('Device Supported Biometrics', 'Would you like to enable biometric authentication for the next time?', true);
    } else {
      Alert.alert('Biometrics not supported', 'This device does not support biometric authentication.', [
        { text: 'OK', onPress: () => navigation.navigate('SetProfile') }
      ]);
    }
  };

  const promptBiometricAlert = (title: string, message: string, enableBiometrics: boolean) => {
    Alert.alert(title, message, [
      {
        text: 'Yes please',
        onPress: () => handleBiometricEnable(enableBiometrics),
      },
      { text: 'Cancel', style: 'cancel', onPress: () => navigation.navigate('SetProfile') },
    ]);
  };

  const handleBiometricEnable = (enableBiometrics: boolean) => {
    if (enableBiometrics) {
      updateOnboardingData({ faceId: true });
      Alert.alert('Success!', 'Biometric authentication enabled successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('SetProfile') }
      ]);
    }
  };

  const handleNotNow = async () => {
    updateOnboardingData({ faceId: false });
    navigation.navigate("SetProfile");
  }

  return (
    <SafeAreaView style={styles.bioSafeArea}>
      <View style={styles.bioContainer}>
  
        <TouchableOpacity style={styles.bioBackButton} onPress={() => navigation.goBack()}>
          <Image source={backIcon} style={styles.bioBackIcon} />
        </TouchableOpacity>
  
        <View style={styles.bioCenteredContent}>
          <Image source={logo} style={styles.appLogo} resizeMode="contain" />
          <Image source={fingerprintIcon} style={styles.fingerprintIcon} resizeMode="contain" />
  
          <Text style={styles.title}>{TEXT.onboarding.faceId.title}</Text>
  
          <Text style={styles.subtitle}>{TEXT.onboarding.faceId.subtitle}</Text>
  
          <TouchableOpacity style={styles.button} onPress={enableBiometricAuth}>
            <Text style={styles.buttonText}>{TEXT.onboarding.faceId.continueButton}</Text>
          </TouchableOpacity>
  
          <TouchableOpacity style={styles.notNowButton} onPress={handleNotNow}>
            <Text style={styles.notNowText}>{TEXT.onboarding.faceId.notNowButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );  
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  bioSafeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  bioContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: width * 0.05, 
    paddingTop: height * 0.025, 
  },
  bioBackButton: {
    position: 'absolute',
    top: height * 0.05, 
    left: width * 0.05, 
    zIndex: 1,
  },
  bioBackIcon: {
    width: width * 0.075, 
    height: width * 0.075, 
    resizeMode: 'contain',
  },
  bioCenteredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.05, 
    marginTop: -height * 0.1, 
  },
  appLogo: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.065, 
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
