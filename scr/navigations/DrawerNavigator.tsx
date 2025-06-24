import React, { useEffect, useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { DrawerParamList } from './DrawerParamList';
import HomeStack from './HomeStack';
import CommunityStack from './CommunityStack';
import Notifications from '../screens/home/Notifications';
import SettingStack from './SettingStack';
import GetPremium from '../screens/home/GetPremium';
import { auth } from '../../firebaseConfig';
import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../store/slices/userSlice';
import { persistor, RootState } from '../store/store';
import { useNavigationState } from '@react-navigation/native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useAuth } from '../contexts/AuthContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerMenuItem = ({
  label,
  icon,
  isActive,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onPress: () => void;
}) => (
  <DrawerItem
    label={label}
    onPress={onPress}
    icon={() => icon}
    labelStyle={[styles.label, isActive && styles.activeLabel]}
    style={isActive && styles.activeItem}
  />
);


function CustomDrawerContent(props: any) {
  const dispatch = useDispatch();
  const { clearAuthUser } = useAuth();
  const { userData } = useSelector((state: RootState) => state.user);
  const navigationState = useNavigationState(state => state);
  const currentRouteName = navigationState?.routes?.[navigationState.index]?.name ?? 'HomeStack';
  const [firstPurchase, setFirstPurchase] = useState<boolean | null>(null);

  const navigateToHome = () => props.navigation.navigate('HomeStack');
  const navigateToCommunity = () => props.navigation.navigate('Community');
  const navigateToNotifications = () => props.navigation.navigate('Notifications');
  const navigateToSettings = () => props.navigation.navigate('SettingStack');
  const navigateToGetPremium = () => props.navigation.navigate('GetPremium');

  useEffect(() => {
    checkFirstPurchase();
  }, [])

  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => { handleSignOut(); } }
      ],
      { cancelable: true }
    );
  };

  const checkFirstPurchase = async () => {
      try {
        const value = await AsyncStorage.getItem('firstPurchase');
        setFirstPurchase(Boolean(value));
      } catch (error) {
        console.error('Error reading firstPurchase from AsyncStorage:', error);
        return false;
      }
    };

  const handleCommunityNavigation = () => {
    if (!userData?.isPremium) {
      Alert.alert(
        'Premium Feature',
        'Unlock all features of the app by upgrading to Premium.',
        [
          { text: 'Maybe Later' },
          { text: firstPurchase ? 'Renew Premium' : 'Buy Premium', onPress: navigateToGetPremium }
        ],
        { cancelable: true }
      );
      return;
    }
    navigateToCommunity();
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      await clearAuthUser();
      await persistor.purge();
      dispatch(clearUser());
    } catch (error: any) {
      console.error("Sign out failed: " + error.message);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const communityLabel = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
      <Text style={[styles.label, currentRouteName === 'Community' && styles.activeLabel]}>
        Community
      </Text>
      {!userData?.isPremium && (
        <Image source={require('../assets/lockIcon.png')} style={styles.lockIcon} />
      )}
    </View>
  );

  const communityIcon = () => <Image source={require('../assets/CommunityIcon.png')} style={styles.icon} />;

  const profileImageSource = typeof userData?.profilePicture === 'string'
    ? { uri: userData.profilePicture }
    : undefined;

  const isCustomImg = typeof userData?.profilePicture === 'string'
    && !userData.profilePicture.includes('avatar');

  const profilePictureStyle = {
    width: isCustomImg ? RFValue(75) : RFValue(85),
    height: isCustomImg ? RFValue(75) : RFValue(85),
    borderRadius: RFValue(60),
    marginBottom: RFPercentage(1.5),
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileContainer}>
        <Image source={profileImageSource} style={profilePictureStyle} />
        <Text style={styles.userName}>{userData?.name}</Text>
        {userData?.isPremium && (
          <View style={styles.premiumBadge}>
            <Image source={require('../assets/PremiumIcon.png')} style={styles.premiumIcon} />
            <Text style={styles.premiumText}>Premium Member</Text>
          </View>
        )}
      </View>

      <View style={styles.menuContainer}>
        <DrawerMenuItem
          label="Home"
          icon={<Image source={require('../assets/HomeIcon.png')} style={styles.icon} />}
          isActive={currentRouteName === 'HomeStack'}
          onPress={navigateToHome}
        />

        <DrawerItem
          label={communityLabel}
          onPress={handleCommunityNavigation}
          icon={communityIcon}
          labelStyle={[styles.label, currentRouteName === 'Community' && styles.activeLabel]}
          style={currentRouteName === 'Community' && styles.activeItem}
        />

        <DrawerMenuItem
          label="Notifications"
          icon={<Image source={require('../assets/NotificationsIcon.png')} style={styles.icon} />}
          isActive={currentRouteName === 'Notifications'}
          onPress={navigateToNotifications}
        />

        <DrawerMenuItem
          label="Settings"
          icon={<Image source={require('../assets/SettingsIcon.png')} style={styles.icon} />}
          isActive={currentRouteName === 'SettingStack'}
          onPress={navigateToSettings}
        />

        <DrawerMenuItem
          label="Get Premium"
          icon={<Image source={require('../assets/PremiumIcon.png')} style={styles.icon} />}
          isActive={currentRouteName === 'GetPremium'}
          onPress={navigateToGetPremium}
        />

        <DrawerMenuItem
          label="Logout"
          icon={<Image source={require('../assets/LogoutIcon.png')} style={styles.icon} />}
          onPress={confirmLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  profileContainer: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F5F0FF',
    borderRadius: 20,
  },
  premiumIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#7A5FFF',
  },
  premiumText: {
    color: '#7A5FFF',
    fontWeight: '600',
    fontSize: 14,
  },  
  menuContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: 10,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  activeItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  activeLabel: {
    fontWeight: 'bold',
    color: '#7A5FFF',
  },
  lockIcon: {
    width: 20,
    height: 20,
    marginLeft: 8,
    tintColor: '#000',
  },
});

function renderCustomDrawerContent(props: any) {
  return <CustomDrawerContent {...props} />;
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="HomeStack"
      drawerContent={renderCustomDrawerContent}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen
        name="HomeStack"
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Drawer.Screen
        name="Community"
        component={CommunityStack}
        options={{ title: 'Community' }}
      />
      <Drawer.Screen
        name="Notifications"
        component={Notifications}
        options={{ title: 'Notifications' }}
      />
      <Drawer.Screen
        name="SettingStack"
        component={SettingStack}
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen
        name="GetPremium"
        component={GetPremium}
        options={{ title: 'Get Premium' }}
      />
    </Drawer.Navigator>
  );
}