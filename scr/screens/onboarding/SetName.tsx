import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SetName">;
const logo = require('../../assets/logo.png'); 
const backIcon = require('../../assets/backIcon.png'); 

export default function SetNameScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [error1, setError1] = useState<string>('');
  const [shouldValidate, setShouldValidate] = useState<boolean>(false);
  const {updateOnboardingData, onboardingData} = useOnboarding();

  useEffect(() => {
    if(onboardingData.firstName) setFirstName(onboardingData.firstName);

    if(onboardingData.lastName) setLastName(onboardingData.lastName);
  }, [])
  
  useEffect(() => {
    if (!shouldValidate) return;
  
    if (!firstName.trim()) {
      setError1('Please enter your first name.');
    } else {
      setError1('');
    }
  }, [firstName, shouldValidate]);
  
  const handleContinuePress = () => {
    if (!firstName.trim()) {
      setShouldValidate(true);
      return;
    }
  
    setError1('');
    updateOnboardingData({ firstName });
    updateOnboardingData({ lastName });
    navigation.navigate('FaceId');
  };  

  return (
    <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={-2000}
        keyboardShouldPersistTaps="handled"
      >
    <SafeAreaView style={styles.safeArea}>
      
        <View style={styles.container}>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>

          <View style={styles.centeredContent}>
            <Image source={logo} style={styles.appLogo} resizeMode="contain" />

            <Text style={styles.title}>What’s your name?</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={(input) => {
                  const filtered = input.replace(/[0-9]/g, '');
                  setFirstName(filtered);
                }}
                placeholder="First Name"
                autoCapitalize="words"
              />
            </View>

            {error1 ? <Text style={{color: 'red', width: '85%', textAlign: 'center', marginTop: -10}}>{error1}</Text>: <></>}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={(input) => {
                  const filtered = input.replace(/[0-9]/g, '');
                  setLastName(filtered);
                }}
                placeholder="Last Name"
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleContinuePress}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      
      <View style={{marginBottom: height * 0.09,}}/>
    </SafeAreaView>
    </KeyboardAwareScrollView>
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
     
  },
  appLogo: {
    width: width * 0.13, 
    height: width * 0.13, 
    borderRadius: width * 0.065, 
    marginBottom: height * 0.05, 
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: RFValue(26, height), 
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.035, 
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderRadius: width * 0.025, 
    paddingHorizontal: width * 0.0375, 
    marginBottom: height * 0.01875, 
    marginTop: height * 0.0125, 
    width: '90%',
    height: height * 0.0625, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
  },
  input: {
    fontSize: RFValue(16, height), 
    color: '#666',
    width: '100%',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.01875, 
    paddingHorizontal: width * 0.1, 
    borderRadius: width * 0.0725,
    width: '85%',
    alignItems: 'center',
    marginTop: height * 0.10625, 
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(18, height), 
    fontWeight: 'bold',
  },
});