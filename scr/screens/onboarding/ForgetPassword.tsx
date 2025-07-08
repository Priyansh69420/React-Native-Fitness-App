import { View, Text, Dimensions, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigations/RootStackParamList";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { RFValue } from 'react-native-responsive-fontsize';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TEXT } from '../../constants/text';

const logo = require('../../assets/logo.png');
const userLogo = require('../../assets/user.png');
const backIcon = require('../../assets/backIcon.png');
const illustration = require('../../assets/password_reset_illustration.png'); 

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "GettingStarted">;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Success',
        'A password reset link has been sent to your email address.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      if (error.code === 'auth/invalid-email') {
        setError('That doesn’t look like a valid email address.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account is linked with this email address.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={-2000}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>
  
          <Image source={illustration} style={styles.illustration} />
          <Text style={styles.title}>{TEXT.forgotPassword.title}</Text>
          <Text style={styles.subtitle}>{TEXT.forgotPassword.subtitle}</Text>
  
          <View style={{ width: '100%', marginTop: 20 }}>
            <Text style={styles.label}>{TEXT.forgotPassword.label}</Text>
            <View style={styles.inputContainer}>
              <Image source={userLogo} style={styles.iconPlaceholder} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => setEmail(text)}
                placeholder={TEXT.forgotPassword.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            </View>
          </View>
  
          {error ? <Text style={styles.error}>{error}</Text> : null}
  
          <TouchableOpacity style={styles.button} onPress={handlePasswordReset} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.buttonText}>{TEXT.forgotPassword.resetButton}</Text>
            }
          </TouchableOpacity>
  
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>{TEXT.forgotPassword.rememberText}</Text>
          </TouchableOpacity>
        </View>
  
        <View style={{ marginBottom: height * 0.12 }} />
      </KeyboardAwareScrollView>
  
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7A5FFF" />
        </View>
      )}
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
    alignItems: 'center',
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.05,
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
  illustration: {
    width: width * 0.65,
    height: height * 0.25,
    resizeMode: 'contain',
  },
  title: {
    fontSize: RFValue(22, height),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: RFValue(14, height),
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.03,
    paddingHorizontal: width * 0.05,
  },
  label: {
    fontSize: RFValue(14, height),
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginLeft: width * 0.01,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: width * 0.025,
    paddingHorizontal: width * 0.025,
    width: '100%',
    height: height * 0.06,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconPlaceholder: {
    width: width * 0.045,
    height: width * 0.045,
    marginRight: width * 0.025,
  },
  input: {
    flex: 1,
    fontSize: RFValue(16, height),
    color: '#333',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: height * 0.015,
    width: '85%',
    marginBottom: height * 0.025
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.1,
    borderRadius: width * 0.062,
    marginTop: height * 0.03,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(18, height),
    fontWeight: 'bold',
  },
  linkText: {
    color: '#0000FF',
    marginTop: height * 0.025,
    fontWeight: '500',
    fontSize: RFValue(14, height),
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});