import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, Modal, TextInput, Platform } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../../firebaseConfig';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { SettingStackParamList } from '../../navigations/SettingStackParamList';
import { useDispatch } from 'react-redux';
import { persistor } from '../../store/store';
import { clearUser } from '../../store/slices/userSlice';
import * as Linking from 'expo-linking';

type NavigationProp = DrawerNavigationProp<SettingStackParamList, 'Settings'>;

const { width, height } = Dimensions.get('window');
const scaleFactor = 1.1;

export default function Settings() {
    const [isPushEnabled, setPushEnabled] = useState(true);
    const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSupportModalVisible, setSupportModalVisible] = useState(false);
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    const appLink = Platform.select({
        ios: 'YOUR_IOS_APP_LINK',
        android: 'YOUR_ANDROID_APP_LINK',
        default: '',
    });

    const handleInviteFriend = async () => {
        if (appLink) {
            try {
                const result = await Linking.openURL(`sms:&body=Check out this awesome app: ${appLink}`);
                if (!result) {
                    console.error('Error', 'Could not open SMS app.');
                }
            } catch (error: any) {
              console.error('Error', `Could not open SMS app: ${error.message}`);
            }
        } else {
          console.error('Invite Not Supported', 'App link is not configured for this platform.');
        }
    };

    const handleGiveFeedback = () => {
        setFeedbackModalVisible(true);
        setFeedbackText('');
    };

    const handleSendFeedback = () => {
        Alert.alert(
            'Thank You',
            'Thanks for your feedback!\nWe will look into it as soon as possible.'
        );
        setFeedbackModalVisible(false);
        setFeedbackText('');
    };

    const handleCloseFeedbackModal = () => {
        setFeedbackModalVisible(false);
        setFeedbackText('');
    };

    const handleHelpAndSupport = () => {
        setSupportModalVisible(true);
    };

    const handleCloseSupportModal = () => {
        setSupportModalVisible(false);
    };

    const handleCallSupport = () => {
        Linking.openURL(`tel:${'7887052000'}`);
    };

    const handleEmailSupport = () => {
        Linking.openURL(`mailto:${'contactus@mail.in'}?subject=App Support Request&body=`);
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            await persistor.purge();
            dispatch(clearUser());
        } catch (error: any) {
            console.error("Sign out failed:" + error.message);
        }
    };
  

    return (
        <SafeAreaView style={styles.safeArea}>
            <TouchableOpacity style={styles.menuContainer} onPress={() => navigation.openDrawer()}>
                <Image source={require('../../assets/drawerIcon.png')} style={styles.menuIcon} />
            </TouchableOpacity>

            <Text style={styles.title}>Settings</Text>

            <View style={styles.settingView}>
                <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('Profile')}>
                    <Text style={styles.optionText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={handleInviteFriend}>
                    <Text style={styles.optionText}>Invite Friend</Text>
                </TouchableOpacity>

                <View style={styles.option}>
                    <Text style={styles.optionText}>Push Notification</Text>
                    <Switch
                        value={isPushEnabled}
                        onValueChange={setPushEnabled}
                    />
                </View>

                <TouchableOpacity style={styles.option} onPress={handleGiveFeedback}>
                    <Text style={styles.optionText}>Give Feedback</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={handleHelpAndSupport}>
                    <Text style={styles.optionText}>Help and Support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={() =>  navigation.navigate('ConnectDevice')}>
                    <Text style={styles.optionText}>Connect Device</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('AboutUs')}>
                    <Text style={styles.optionText}>About Us</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={() => handleSignOut()}>
                    <Text style={styles.logoutButton}>Log Out</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isFeedbackModalVisible}
                onRequestClose={handleCloseFeedbackModal}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Give Feedback</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter your feedback here..."
                            multiline
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                            textAlignVertical="top"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={handleCloseFeedbackModal}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalSubmitButton]}
                                onPress={handleSendFeedback}
                            >
                                <Text style={styles.modalButtonText}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType='slide'
                transparent={true}
                visible={isSupportModalVisible}
                onRequestClose={handleCloseSupportModal}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Need Help?</Text>

                        <View style={styles.supportOptionsContainer}>
                            <TouchableOpacity style={styles.supportOption} onPress={handleCallSupport}>
                                <View style={styles.supportIcon}>
                                    <Text style={styles.icon}>📞</Text>
                                </View>
                                <Text style={styles.supportText}>Call Us</Text>
                                <Text style={styles.supportDetail}>7887052000</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.supportOption} onPress={handleEmailSupport}>
                                <View style={styles.supportIcon}>
                                    <Text style={styles.icon}>✉️</Text>
                                </View>
                                <Text style={styles.supportText}>Email Us</Text>
                                <Text style={styles.supportDetail}>contactus@mail.in</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={handleCloseSupportModal}
                            >
                                <Text style={styles.modalButtonText}>Close</Text>
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
        backgroundColor: '#F5F7FA',
    },
    menuContainer: {
        marginTop: height * 0.03,
        marginLeft: width * 0.04,
    },
    menuIcon: {
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
        backgroundColor: 'white',
        borderRadius: RFValue(15 * scaleFactor, height),
        padding: RFValue(25 * scaleFactor, height),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
        width: '85%',
    },
    modalTitle: {
        fontSize: RFPercentage(3 * scaleFactor),
        fontWeight: 'bold',
        marginBottom: height * 0.03 * scaleFactor,
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
        justifyContent: 'flex-end',
        width: '100%',
        marginTop: height * 0.02 * scaleFactor,
    },
    modalButton: {
        borderRadius: RFValue(8 * scaleFactor, height),
        paddingVertical: RFValue(12 * scaleFactor, height),
        paddingHorizontal: RFValue(20 * scaleFactor, height),
        alignItems: 'center',
        marginLeft: width * 0.02 * scaleFactor,
    },
    modalCancelButton: {
        backgroundColor: '#d3d3d3',
    },
    modalSubmitButton: {
        backgroundColor: '#7A5FFF',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: RFValue(16 * scaleFactor, height),
    },
    supportOptionsContainer: {
        width: '100%',
        marginBottom: height * 0.03 * scaleFactor,
    },
    supportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: height * 0.015 * scaleFactor,
        borderBottomWidth: 1 * scaleFactor,
        borderBottomColor: '#eee',
        marginBottom: height * 0.015 * scaleFactor,
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
    },
});