import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, Modal, TextInput, Platform } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '../../../firebaseConfig';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { SettingStackParamList } from '../../navigations/SettingStackParamList';
import { useDispatch, useSelector } from 'react-redux';
import { persistor, RootState } from '../../store/store';
import { clearUser, updateUser } from '../../store/slices/userSlice';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext'; 
import { doc, updateDoc } from '@firebase/firestore';
import { useTheme } from '../../contexts/ThemeContext';

type NavigationProp = DrawerNavigationProp<SettingStackParamList, 'Settings'>;

const { width, height } = Dimensions.get('window');
const scaleFactor = 1.1;

export default function Settings() {
  const faceId = useSelector((state: RootState) => state.user?.userData?.faceId);
  const darkMode = useSelector((state: RootState) => state.user?.userData?.darkMode);
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(faceId ?? false);
  const [darkTheme, setDarkTheme] = useState(darkMode ?? false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const { clearAuthUser } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const loadPushSetting = async () => {
      try {
        const storedValue = await AsyncStorage.getItem('pushEnabled');
        if (storedValue !== null) {
          setIsPushEnabled(JSON.parse(storedValue));
        }
      } catch (error: any) {
        console.log('Failed to load push setting:', error);
      }
    };

    loadPushSetting();
  }, []);

  useEffect(() => {
    const savePushSetting = async () => {
      try {
        await AsyncStorage.setItem('pushEnabled', JSON.stringify(isPushEnabled));
      } catch (error: any) {
        console.log('Failed to save push setting:', error);
      }
    };

    savePushSetting();
  }, [isPushEnabled]);

  useEffect(() => {
    const saveBiometricSetting = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        await updateDoc(doc(firestore, 'users', userId), {
          faceId: isBiometricEnabled,
        });

        dispatch(updateUser({ faceId: isBiometricEnabled }));
      } catch (error: any) {
        console.error('Failed to save biometric setting:', error.message);
        Alert.alert('Error', 'Failed to update biometric setting. Please try again.');
      }
    };

    saveBiometricSetting();
  }, [isBiometricEnabled, dispatch]);

  useEffect(() => {
    const saveDarkModeSetting = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        await updateDoc(doc(firestore, 'users', userId), {
          darkMode: darkTheme,
        });

        dispatch(updateUser({ darkMode: darkTheme }));
      } catch (error: any) {
        console.error('Failed to save dark mode setting:', error.message);
        Alert.alert('Error', 'Failed to update dark mode setting. Please try again.');
      }
    };

    saveDarkModeSetting();
  }, [darkTheme, dispatch]);

  const appLink = Platform.select({
    ios: 'www.testlink.com',
    android: 'www.testlink.com',
    default: 'www.testlink.com',
  });

  const handleInviteFriend = async () => {
    if (appLink) {
      const message = `Check out this awesome app: ${appLink}`;
      const url = `sms:?body=${encodeURIComponent(message)}`;

      try {
        await Linking.openURL(url);
      } catch (error: any) {
        console.error('Error opening SMS app:', error.message);
      }
    } else {
      console.error('Invite Not Supported', 'App link is not configured for this platform.');
    }
  };

  const handleOpenDialerWithNumber = async () => {
    const phoneNumber = '7887052000';
    const url = `tel:${phoneNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open dialer for this device');
      }
    } catch (error: any) {
      console.error('Error opening dialer:', error.message);
    }
  };

  const handleOpenGmail = async () => {
    const email = 'contactus@gmail.com';
    const subject = 'Support Request';
    const body = 'Hi team, I need help with...';

    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Email client is not available');
      }
    } catch (error: any) {
      console.error('Error opening email:', error.message);
    }
  };

  const handleOpenMapLocation = async () => {
    const latitude = 12.9716;
    const longitude = 77.5946;
    const label = 'Park Avenue, Bangalore';

    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(label)}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(label)})`,
    });

    try {
      const supported = await Linking.canOpenURL(url!);
      if (supported) {
        await Linking.openURL(url!);
      } else {
        console.error('Maps app is not available on this device');
      }
    } catch (error: any) {
      console.error('Error opening maps:', error.message);
    }
  };

  const handleGiveFeedback = () => {
    setIsFeedbackModalVisible(true);
    setFeedbackText('');
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      return;
    }

    Alert.alert(
      'Feedback Received',
      'Thanks for your feedback!\nWe will look into it as soon as possible.'
    );

    setFeedbackText('');
    setIsFeedbackModalVisible(false);
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalVisible(false);
    setFeedbackText('');
  };

  const handleHelpAndSupport = () => {
    setIsSupportModalVisible(true);
  };

  const handleCloseSupportModal = () => {
    setIsSupportModalVisible(false);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      await clearAuthUser();
      await persistor.purge();
      dispatch(clearUser());
    } catch (error: any) {
      console.error('Sign out failed:', error.message);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
      <TouchableOpacity style={styles.drawerContainer} onPress={() => navigation.openDrawer()}>
        <Image
          source={require('../../assets/drawerIcon.png')}
          style={[styles.drawerIcon, { tintColor: theme.iconPrimary }]}
        />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>

      <View style={styles.settingView}>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('Profile')}>
          <Text style={[styles.optionText, { color: theme.textPrimary }]}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleInviteFriend}>
          <Text style={[styles.optionText, { color: theme.textPrimary }]}>Invite Friend</Text>
        </TouchableOpacity>

        <View style={styles.option}>
          <Text style={[styles.optionText, { color: theme.textPrimary }]}>Push Notification</Text>
          <Switch
            value={isPushEnabled}
            onValueChange={(value) => setIsPushEnabled(value)}
            trackColor={{ false: theme.switchTrackFalse, true: theme.switchTrackTrue }}
            thumbColor={isPushEnabled ? theme.switchThumbTrue : theme.switchThumbFalse}
          />
        </View>

        <View style={styles.option}>
          <Text style={[styles.optionText, { color: theme.textPrimary }]}>Enable Biometric</Text>
          <Switch
            value={isBiometricEnabled}
            onValueChange={(value) => setIsBiometricEnabled(value)}
            trackColor={{ false: theme.switchTrackFalse, true: theme.switchTrackTrue }}
            thumbColor={isBiometricEnabled ? theme.switchThumbTrue : theme.switchThumbFalse}
          />
        </View>

        <View style={styles.option}>
          <Text style={[styles.optionText, { color: theme.textPrimary }]}>Dark Mode</Text>
          <Switch
            value={darkTheme}
            onValueChange={(value) => setDarkTheme(value)}
            trackColor={{ false: theme.switchTrackFalse, true: theme.switchTrackTrue }}
            thumbColor={darkTheme ? theme.switchThumbTrue : theme.switchThumbFalse}
          />
        </View>

        <TouchableOpacity style={styles.option} onPress={handleGiveFeedback}>
          <Text style={[styles.optionText, { color: theme.textPrimary }]}>Give Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleHelpAndSupport}>
          <Text style={[styles.optionText, { color: theme.textPrimary }]}>Help and Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('AboutUs')}>
          <Text style={[styles.optionText, { color: theme.textPrimary }]}>About Us</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', style: 'destructive', onPress: () => handleSignOut().catch(console.error) },
            ])
          }
        >
          <Text style={[styles.logoutButton, { color: theme.textError }]}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isFeedbackModalVisible}
        onRequestClose={handleCloseFeedbackModal}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Give Feedback</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.borderSecondary }]}
              placeholder="Enter your feedback here..."
              placeholderTextColor={theme.textPlaceholder}
              multiline
              value={feedbackText}
              onChangeText={setFeedbackText}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.borderAccent }]}
                onPress={handleCloseFeedbackModal}
              >
                <Text style={[styles.modalButtonText, { color: theme.textButtonSecondary }]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  !feedbackText.trim()
                    ? { backgroundColor: theme.backgroundButtonDisabled }
                    : { backgroundColor: theme.backgroundButtonPrimary },
                ]}
                onPress={handleSendFeedback}
                disabled={!feedbackText.trim()}
              >
                <Text style={[styles.modalButtonText, { color: theme.textButtonPrimary }]}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSupportModalVisible}
        onRequestClose={handleCloseSupportModal}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Contact Us</Text>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              We are here to help and answer any question that you might have.
            </Text>
            <View style={styles.supportOptionsContainer}>
              <TouchableOpacity onPress={handleOpenMapLocation}>
                <View style={styles.supportOption}>
                  <Text style={[styles.icon, { color: theme.iconAccent }]}>📍</Text>
                  <Text style={[styles.supportDetail, { color: theme.textPrimary }]}>
                    Park Avenue, Bangalore, 160010
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenDialerWithNumber}>
                <View style={styles.supportOption}>
                  <Text style={[styles.icon, { color: theme.iconAccent }]}>📞</Text>
                  <Text style={[styles.supportDetail, { color: theme.textPrimary }]}>+91-7887052000</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenGmail}>
                <View style={styles.supportOption}>
                  <Text style={[styles.icon, { color: theme.iconAccent }]}>✉️</Text>
                  <Text style={[styles.supportDetail, { color: theme.textPrimary }]}>contactus@gmail.com</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.borderAccent }]}
                onPress={handleCloseSupportModal}
              >
                <Text style={[styles.modalButtonText, { color: theme.textButtonSecondary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    drawerContainer: {
        marginTop: height * 0.03,
        marginLeft: width * 0.045,
        width: '10%'
    },
    drawerIcon: {
        height: RFValue(32, height),
        width: RFValue(32, height),
        marginBottom: height * 0.005
    },
    title: {
        fontSize: RFPercentage(4 * 1.1),
        fontWeight: 'bold',
        marginLeft: width * 0.05,
        marginVertical: height * 0.015,
    },
    settingView: {
        paddingHorizontal: width * 0.05,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: height * 0.02,
        borderBottomWidth: 1,
        borderBottomColor: '#D3D3D3',
    },
    optionText: {
        fontSize: RFPercentage(2.1),
        color: '#333',
    },
    logoutButton: {
        fontSize: RFPercentage(2.1),
        color: '#ff0000',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        borderRadius: RFValue(15 * scaleFactor, height),
        padding: RFValue(25 * scaleFactor, height),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
        width: '85%',
        shadowOffset: {
            width: 0,
            height: 5,
        },
    },
    modalTitle: {
        fontSize: RFPercentage(3 * scaleFactor),
        fontWeight: 'bold',
        marginBottom: height * 0.025 * scaleFactor,
        color: '#333',
    },
    modalInput: {
        borderWidth: 1 * scaleFactor,
        borderColor: '#D3D3D3',
        borderRadius: RFValue(5 * scaleFactor, height),
        padding: RFValue(10 * scaleFactor, height),
        marginBottom: height * 0.02 * scaleFactor,
        width: '100%',
        minHeight: height * 0.15 * scaleFactor,
        textAlignVertical: 'top',
        fontSize: RFValue(16 * scaleFactor, height),
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'center', 
        width: '100%',
        marginTop: height * 0.015 * scaleFactor,
    },
    modalButton: {
        borderRadius: RFValue(25, height),
        paddingVertical: RFValue(13, height), 
        paddingHorizontal: RFValue(30, height), 
        alignItems: 'center',
        marginHorizontal: 10, 
    },
    modalCancelButton: {
        backgroundColor: '#FFF',
        borderWidth: 1, 
        borderColor: '#7A5FFF',
    },
    modalButtonText: {
        fontSize: RFValue(16, height), 
        fontWeight: 'bold',
        color: '#7A5FFF',
    },
    supportOptionsContainer: {
        width: '100%',
    },
    supportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: height * 0.01 * scaleFactor,
    },
    supportOptionLast: {
        borderBottomWidth: 0,
    },
    supportIcon: {
        backgroundColor: '#f0f0f0',
        borderRadius: RFValue(15 * scaleFactor, height),
        width: RFValue(30 * scaleFactor, height),
        height: RFValue(30 * scaleFactor, height),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: width * 0.03 * scaleFactor,
    },
    icon: {
        fontSize: RFValue(18 * scaleFactor, height),
        color: '#7A5FFF',
    },
    supportText: {
        fontSize: RFValue(18 * scaleFactor, height),
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    supportDetail: {
        fontSize: RFValue(16 * scaleFactor, height),
        color: '#666',
        marginLeft: width * 0.05 * scaleFactor 
    },
    modalDescription: {
        fontSize: RFValue(13 * scaleFactor, height), 
        marginBottom: height * 0.01 * scaleFactor,
    }
});