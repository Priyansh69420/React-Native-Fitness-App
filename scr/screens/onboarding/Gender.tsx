import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { RFValue } from 'react-native-responsive-fontsize';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SetProfile">;

const logo = require('../../assets/logo.png');
const backIcon = require('../../assets/backIcon.png');
const checkIcon = require('../../assets/checkIcon.png');
const maleIcon = require('../../assets/manIcon.png');
const femaleIcon = require('../../assets/womanIcon.png'); 

const genders = [
  { id: 1, label: 'Male', source: maleIcon },
  { id: 2, label: 'Female', source: femaleIcon },
];

export default function SetGenderScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const { updateOnboardingData } = useOnboarding();

  const handleGenderPress = (genderLabel: string) => {
    setSelectedGender(genderLabel);
  };

  const handleContinuePress = () => {
    if (selectedGender) {
      updateOnboardingData({gender: selectedGender});
      navigation.navigate('ReadyToGo'); 
    } else {
      setError('Please select a gender');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={backIcon} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.centeredContent}>
          <Image source={logo} style={styles.appLogo} resizeMode="contain" />

          <Text style={styles.title}>Which one are you?</Text>

          <View style={styles.genderContainer}>
            {genders.map((gender) => (
              <TouchableOpacity
                key={gender.id}
                style={styles.genderCard}
                onPress={() => handleGenderPress(gender.label)}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedGender === gender.label && styles.selectedCheckbox,
                  ]}
                >
                  {selectedGender === gender.label && (
                    <Image source={checkIcon} style={styles.checkIcon} />
                  )}
                </View>
                <Image source={gender.source} style={styles.genderIcon} resizeMode="contain" />
                <Text style={styles.genderLabel}>{gender.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subtitle}>
            To give you a better experience we need to know your gender
          </Text>

          {error ? <Text style={{color: 'red', width: '100%', textAlign: 'center', marginTop: -30, marginBottom: 12}}>Note: {error}</Text>: <></>}

          <TouchableOpacity style={styles.button} onPress={handleContinuePress}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const guidelineBaseWidth = 390; 
const guidelineBaseHeight = 844; 

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
  },
  backButton: {
    position: 'absolute',
    top: verticalScale(40),
    left: scale(20),
    zIndex: 1,
  },
  backIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    marginTop: verticalScale(-100), // Adjusted marginTop
  },
  appLogo: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginBottom: verticalScale(30),
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: RFValue(26),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: verticalScale(30),
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    width: '90%', 
    marginBottom: verticalScale(40),
  },
  genderCard: {
    width: '45%',
    backgroundColor: '#FFF',
    borderRadius: scale(10),
    padding: moderateScale(20), 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
    position: 'relative',
  },
  genderIcon: {
    width: scale(80), 
    height: scale(80), 
    marginBottom: verticalScale(10),
  },
  genderLabel: {
    fontSize: RFValue(18),
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center', 
  },
  checkbox: {
    position: 'absolute',
    top: scale(10),
    right: scale(10),
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  selectedCheckbox: {
    backgroundColor: '#7A5FFF',
    borderColor: '#7A5FFF',
  },
  checkIcon: {
    width: scale(16),
    height: scale(16),
    tintColor: '#FFF',
  },
  subtitle: {
    fontSize: RFValue(18),
    color: '#777',
    textAlign: 'center',
    marginBottom: verticalScale(40),
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.1,
    borderRadius: scale(50),
    width: width * 0.75,
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(18),
    fontWeight: 'bold',
  },
});