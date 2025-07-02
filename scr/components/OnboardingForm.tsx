import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootStackParamList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { RFValue } from 'react-native-responsive-fontsize';

const logo = require('../assets/logo.png');
const backIcon = require('../assets/backIcon.png');

interface OnboardingFormProps {
  title: string;
  children: React.ReactNode;
  onContinue: () => boolean;
  nextScreen: keyof RootStackParamList;
  backButton: boolean;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  title,
  children,
  onContinue,
  nextScreen,
  backButton,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleContinuePress = () => {
    const isValid: boolean = onContinue(); 
    if (isValid) {
      navigation.navigate(nextScreen);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      extraScrollHeight={-2000}
      keyboardShouldPersistTaps="handled"
    >
      <SafeAreaView style={onboardingStyles.onboardingSafeArea}>
        <View style={onboardingStyles.onboardingContainer}>
          {!backButton ? (
            <TouchableOpacity
            style={onboardingStyles.onboardingBackButton}
            onPress={() => navigation.goBack()}
          >
            <Image source={backIcon} style={onboardingStyles.onboardingBackIcon} />
          </TouchableOpacity>
          ) : null}

          <View style={onboardingStyles.onboardingCenteredContent}>
            <Image source={logo} style={onboardingStyles.onboardingAppLogo} resizeMode="contain" />
            <Text style={onboardingStyles.onboardingTitle}>{title}</Text>
            {children}
            <TouchableOpacity style={onboardingStyles.onboardingButton} onPress={handleContinuePress}>
              <Text style={onboardingStyles.onboardingButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={onboardingStyles.onboardingBottomMargin} />
      </SafeAreaView>
    </KeyboardAwareScrollView>
  );
};

const { width, height } = Dimensions.get('window');

export const onboardingStyles = StyleSheet.create({
  onboardingSafeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.025,
  },
  onboardingBackButton: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    zIndex: 1,
  },
  onboardingBackIcon: {
    width: width * 0.075,
    height: width * 0.075,
    resizeMode: 'contain',
  },
  onboardingCenteredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
  },
  onboardingAppLogo: {
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: width * 0.065,
    marginBottom: height * 0.05,
    backgroundColor: 'transparent',
  },
  onboardingTitle: {
    fontSize: RFValue(26, height),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.035,
  },
  onboardingInputContainer: {
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
  onboardingInput: {
    fontSize: RFValue(16, height),
    color: '#666',
    width: '100%',
    textAlign: 'center',
  },
  onboardingErrorText: {
    color: 'red',
    width: '85%',
    textAlign: 'center',
    marginTop: -10,
  },
  onboardingButton: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.01875,
    paddingHorizontal: width * 0.1,
    borderRadius: width * 0.0725,
    width: '85%',
    alignItems: 'center',
    marginTop: height * 0.10625,
  },
  onboardingButtonText: {
    color: '#FFF',
    fontSize: RFValue(18, height),
    fontWeight: 'bold',
  },
  onboardingBottomMargin: {
    marginBottom: height * 0.09,
  },
});