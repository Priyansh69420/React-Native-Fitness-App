import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../../firebaseConfig';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { SettingStackParamList } from '../../navigations/SettingStackParamList';
import { useDispatch } from 'react-redux';
import { persistor } from '../../store/store';
import { clearUser } from '../../store/slices/userSlice';

type NavigationProp = DrawerNavigationProp<SettingStackParamList, 'Settings'>;

const { width, height } = Dimensions.get('window');

export default function Settings() {
    const [isPushEnabled, setPushEnabled] = useState(true);
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();
    
    const handleSignOut = async () => {
        try {
        await auth.signOut();
        await persistor.purge();
        dispatch(clearUser()); 
        } catch (error: any) {
        console.error("🚨 Sign out failed:"+ error.message);
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

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionText}>Invite Friend</Text>
                </TouchableOpacity>

                <View style={styles.option}>
                    <Text style={styles.optionText}>Push Notification</Text>
                    <Switch 
                        value={isPushEnabled}
                        onValueChange={setPushEnabled}
                    />
                </View>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionText}>Give Feedback</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionText}>Help and Support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionText}>Connect Device</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('AboutUs')}>
                    <Text style={styles.optionText}>About Us</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={() => handleSignOut()}>
                    <Text style={styles.logoutButton}>Log Out</Text>
                </TouchableOpacity>
            </View>
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
        fontSize: RFPercentage(1.9),
        color: '#333',
    },
    logoutButton: {
        fontSize: RFPercentage(1.9),
        color: '#ff0000',
    },
});

