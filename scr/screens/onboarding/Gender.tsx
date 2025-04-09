import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../contexts/OnboardingContext';

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
  const { updateOnboardingData } = useOnboarding();

  const handleGenderPress = (genderLabel: string) => {
    setSelectedGender(genderLabel);
  };

  const handleContinuePress = () => {
    if (selectedGender) {
      updateOnboardingData({gender: selectedGender});
      navigation.navigate('ReadyToGo'); 
    } else {
      Alert.alert('Please select a gender');
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

          <TouchableOpacity style={styles.button} onPress={handleContinuePress}>
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
    marginTop: -130,
  },
  appLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 50,
  },
  genderCard: {
    width: '45%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  genderIcon: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  genderLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold'
  },
  checkbox: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
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
    width: 16,
    height: 16,
    tintColor: '#FFF',
  },
  subtitle: {
    fontSize: 20,
    color: '#777',
    textAlign: 'center',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '75%',
    alignItems: 'center',
    marginTop: 20
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});