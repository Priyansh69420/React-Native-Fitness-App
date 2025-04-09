import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import OnboardingStack from "./OnboardingStack";
import DrawerNavigator from "./DrawerNavigator";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ActivityIndicator, Alert, View, StyleSheet } from "react-native";
import ReactNativeBiometrics from "react-native-biometrics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [biometricAuthenticated, setBiometricAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        try {
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          const justLoggedIn = (await AsyncStorage.getItem('justLoggedIn')) === 'true';
          if (userDoc.exists() && userDoc.data()?.faceId === true && !justLoggedIn) {
            const success = await handleBiometricAuth();
            if (success) {
              setBiometricAuthenticated(true);
              setUser(currentUser);
            } else {
              setBiometricAuthenticated(false);
              setUser(null);
            }
          } else {
            setBiometricAuthenticated(true); 
            setUser(currentUser);
          }
        } catch (error) {
          Alert.alert('AppNavigator:', 'Failed to check biometric settings.');
          setUser(null); 
        }
      } else {
        setUser(null);
        setBiometricAuthenticated(false);
      }

      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  const handleBiometricAuth = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();

      if (!rnBiometrics) {
        Alert.alert('AppNavigator:', 'Biometric authentication is not available on this device.');
        return false;
      }

      const { success, error } = await rnBiometrics.simplePrompt({ promptMessage: 'Authenticate to continue' });

      if (success) {
        return true;
      } else {
        Alert.alert('AppNavigator:', 'Biometric authentication failed. Please log in manually.');
        return false;
      }
    } catch (error) {
      Alert.alert('AppNavigator:', 'Biometric authentication failed from device.');
      return false;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7A5FFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user && biometricAuthenticated ? <DrawerNavigator /> : <OnboardingStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA'
  },
});