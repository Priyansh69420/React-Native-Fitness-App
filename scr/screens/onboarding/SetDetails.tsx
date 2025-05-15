import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SetDetails">;
const logo = require('../../assets/logo.png'); 
const backIcon = require('../../assets/backIcon.png'); 

export default function SetDetails() {
  const navigation = useNavigation<NavigationProp>();
  const [userHeight, setUserHeight] = useState<number>();
  const [userWeight, setUserWeight] = useState<number>();
  const [error1, setError1] = useState<string>('');
  const [error2, setError2] = useState<string>('');
  const [shouldValidate, setShouldValidate] = useState<boolean>(false);
  const {updateOnboardingData, onboardingData} = useOnboarding();

  useEffect(() => {
    if(onboardingData.userHeight) setUserHeight(onboardingData.userHeight);

    if(onboardingData.userWeight) setUserWeight(onboardingData.userWeight);
  }, []);
  
  useEffect(() => {
    if (!shouldValidate) return;
  
    if (!userHeight) {
      setError1('Please enter your height.');
    } else {
      setError1('');
    }

    if(!userWeight) {
      setError2('Please enter your weight.');
    } else {
      setError2('');
    }
  }, [userHeight, userWeight, shouldValidate]);
  
  const handleContinuePress = () => {
    if (!userHeight || !userWeight) {
      setShouldValidate(true);
      return;
    }
  
    setError1('');
    updateOnboardingData({ userHeight });
    updateOnboardingData({ userWeight });
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

            <Text style={styles.title}>What are your height & weight?</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={userHeight !== undefined ? String(userHeight) : ''}
                onChangeText={(text) => setUserHeight(text ? parseFloat(text) : undefined)}
                placeholder="Height (cm)"
                keyboardType="numeric"
              />
            </View>

            {error1 ? <Text style={{color: 'red', width: '85%', textAlign: 'center', marginTop: -10}}>{error1}</Text>: <></>}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={userWeight !== undefined ? String(userWeight) : ''}
                onChangeText={(text) => setUserWeight(text ? parseFloat(text) : undefined)}
                placeholder="Weight (kg)"
                keyboardType="numeric"
              />
            </View>

            {error2 ? <Text style={{color: 'red', width: '85%', textAlign: 'center', marginTop: -10}}>{error2}</Text>: <></>}

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