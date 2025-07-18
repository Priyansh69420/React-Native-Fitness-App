import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { TEXT } from '../../constants/text';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SetPassword">;
const logo = require('../../assets/logo.png'); 
const backIcon = require('../../assets/backIcon.png');

export default function SetPassword() {
  const navigation = useNavigation<NavigationProp>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [shouldValidate, setShouldValidate] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const {updateOnboardingData, onboardingData} = useOnboarding();

  useEffect(() => {
      if(onboardingData.password) setPassword(onboardingData.password);
    }, [])

    useEffect(() => {
      if(!shouldValidate) return;

      if (password.length === 0) {
        setError('');
        return;
      }
    
      const { minLength, hasUpperCase, hasNumber } = checkPasswordRequirements(password);
    
      if (!minLength || !hasUpperCase || !hasNumber) {
        setError("Password must be at least 8 characters long, contain an uppercase letter, and include a number.");
      } else {
        setError('');
      }
    }, [password]);

  const checkPasswordRequirements = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    return { minLength, hasUpperCase, hasNumber };
  };

  const handleContinue = async () => {
    const {minLength, hasUpperCase, hasNumber} = checkPasswordRequirements(password);

    if(!minLength || !hasUpperCase || !hasNumber) {
      setError("Password must be at least 8 characters long, contain an uppercase letter, and include a number.")
      setShouldValidate(true);
      return;
    }

      updateOnboardingData({password});
      setError('');
      navigation.goBack();
  }

  const { minLength, hasUpperCase, hasNumber } = checkPasswordRequirements(password);

  return (
    <SafeAreaView style={styles.safeArea2}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={-2000}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container2}>
          <TouchableOpacity style={styles.backButton2} onPress={() => navigation.goBack()}>
            <Image source={backIcon} style={styles.backIcon2} />
          </TouchableOpacity>
  
          <View style={styles.centeredContent2}>
            <Image source={logo} style={styles.appLogo2} resizeMode="contain" />
  
            <Text style={styles.title2}>{TEXT.passwordSetup.title}</Text>
  
            <View style={styles.inputContainer2}>
              <TextInput
                style={styles.input2}
                value={password}
                onChangeText={setPassword}
                placeholder={TEXT.passwordSetup.placeholder}
                secureTextEntry={!isVisible}
                autoCapitalize="none"
                autoFocus
              />
              <TouchableOpacity
                onPress={() => setIsVisible(v => !v)}
                style={styles.eyeButton}
                accessibilityLabel={isVisible ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={isVisible ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
  
            {error ? (
              <Text style={{ color: 'red', width: '85%', marginBottom: 20, textAlign: 'center', marginTop: -10 }}>
                {error}
              </Text>
            ) : null}
  
            <View style={styles.requirementsContainer2}>
              <View style={styles.requirementRow2}>
                {minLength ? <View style={styles.checkedBox2} /> : <View style={styles.uncheckedBox2} />}
                <Text style={styles.requirementText2}>  {TEXT.passwordSetup.requirements.minLength}</Text>
              </View>
              <View style={styles.requirementRow2}>
                {hasUpperCase ? <View style={styles.checkedBox2} /> : <View style={styles.uncheckedBox2} />}
                <Text style={styles.requirementText2}>  {TEXT.passwordSetup.requirements.upperCase}</Text>
              </View>
              <View style={styles.requirementRow2}>
                {hasNumber ? <View style={styles.checkedBox2} /> : <View style={styles.uncheckedBox2} />}
                <Text style={styles.requirementText2}>  {TEXT.passwordSetup.requirements.number}</Text>
              </View>
            </View>
  
            <TouchableOpacity style={styles.button2} onPress={handleContinue}>
              <Text style={styles.buttonText2}>{TEXT.passwordSetup.button}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ marginBottom: height * 0.09 }} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );  
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea2: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container2: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: width * 0.05, 
    paddingTop: height * 0.025, 
  },
  backButton2: {
    position: 'absolute',
    top: height * 0.05, 
    left: width * 0.05, 
    zIndex: 1,
  },
  backIcon2: {
    width: width * 0.075, 
    height: width * 0.075, 
    resizeMode: 'contain',
  },
  centeredContent2: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.05, 
  },
  appLogo2: {
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: width * 0.065, 
    marginBottom: height * 0.05, 
    backgroundColor: 'transparent',
  },
  title2: {
    fontSize: RFValue(26, height), 
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.035, 
  },
  inputContainer2: {
    backgroundColor: '#FFF',
    borderRadius: width * 0.025, 
    paddingHorizontal: width * 0.0375,
    marginBottom: height * 0.025, 
    marginTop: height * 0.0125, 
    width: '90%',
    height: height * 0.0625, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input2: {
    fontSize: RFValue(16, height),
    color: '#666',
    flex: 1,
    textAlign: 'center'
  },
  requirementsContainer2: {
    marginBottom: height * 0.1, 
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: "90%"
  },
  requirementRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.00625, 
  },
  checkedBox2: {
    width: width * 0.045, 
    height: width * 0.045, 
    backgroundColor: '#7A5FFF', 
    borderRadius: width * 0.0075, 
    marginRight: width * 0.0125, 
  },
  uncheckedBox2: {
    width: width * 0.045, 
    height: width * 0.045, 
    backgroundColor: '#D9D9D9',
    borderRadius: width * 0.0075, 
    marginRight: width * 0.0125, 
  },
  requirementText2: {
    fontSize: RFValue(14, height), 
    color: '#A9A9A9',
    textAlign: 'left',
  },
  button2: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.01875, 
    paddingHorizontal: width * 0.1, 
    borderRadius: width * 0.0725, 
    width: '85%',
    alignItems: 'center',
  },
  buttonText2: {
    color: '#FFF',
    fontSize: RFValue(18, height), 
    fontWeight: 'bold',
  },
  eyeButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});