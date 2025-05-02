import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, useDrawerProgress } from '@react-navigation/drawer';
import { DrawerParamList } from './DrawerParamList';
import HomeStack from './HomeStack';
import CommunityStack from './CommunityStack';
import Notifications from '../screens/home/Notifications';
import SettingStack from './SettingStack';
import GetPremium from '../screens/home/GetPremium';
import { auth } from '../../firebaseConfig';
import { View, Text, Image, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../store/slices/userSlice';
import { persistor, RootState } from '../store/store';
import { useNavigationState } from '@react-navigation/native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';

const Drawer = createDrawerNavigator<DrawerParamList>();

const avatars = [
  { id: 1, source: require('../assets/avatar5.png') },
  { id: 2, source: require('../assets/avatar2.png') },
  { id: 3, source: require('../assets/avatar4.png') },
];

function CustomDrawerContent(props: any) {
  const dispatch = useDispatch();
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      await persistor.purge();
      dispatch(clearUser());
    } catch (error: any) {
      console.error("Sign out failed:"+ error.message);
    }
  };

  const { userData, loading } = useSelector((state: RootState) => state.user);
  const navigationState = useNavigationState(state => state);
  const currentRouteName = navigationState?.routes?.[navigationState.index]?.name;

  const isProfilePicNumber = typeof userData?.profilePicture === 'number';
  const localAvatar = isProfilePicNumber
    ? avatars.find(avatar => avatar.id === userData.profilePicture)
    : undefined;

  const isCustomImg = typeof userData?.profilePicture === 'string'
    && !userData.profilePicture.includes('avatar');

  const profileImageSource = isCustomImg
    ? { uri: userData.profilePicture }
    : localAvatar?.source;

    const profilePictureStyle = {
      width: isCustomImg ? RFValue(70) : RFValue(110),
      height: isCustomImg ? RFValue(70) : RFValue(110),
      borderRadius: RFValue(60),
      marginBottom: RFPercentage(1.5),
    };
    
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.contentContainer}>
      <View 
        style={styles.profileContainer} 
      >
        <Image source={ profileImageSource } style={profilePictureStyle}/>
        <Text style={styles.userName}>{userData?.name}</Text>
      </View>

      <View style={styles.menuContainer}>
        <DrawerItem
          label="Home"
          onPress={() => props.navigation.navigate('HomeStack')}
          icon={() => <Image source={require('../assets/HomeIcon.png')} style={styles.icon} />}
          labelStyle={[styles.label, currentRouteName === 'HomeStack' && styles.activeLabel]}
          style={currentRouteName === 'HomeStack' && styles.activeItem}
        />
        
        <DrawerItem
          label={() => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
              <Text style={[styles.label, currentRouteName === 'Community' && styles.activeLabel]}>
                Community
              </Text>
              {!userData?.isPremium && (
                <Image source={require('../assets/lockIcon.png')} style={styles.lockIcon} />
              )}
            </View>
          )}
          onPress={() => {
            if(!userData?.isPremium) {
              Alert.alert(
                'Premium Feature',
                'Unlock all features of the app by upgrading to Premium.',
                [
                  {
                    text: 'Maybe Later',
                    style: 'cancel',
                  },
                  {
                    text: 'Buy Premium',
                    onPress: () => {
                     props.navigation.navigate('GetPremium');
                    },
                    style: 'default',
                  },
                ],
                { cancelable: true }
              );
              return;
            }
            props.navigation.navigate('Community')
          }}
          icon={() => <Image source={require('../assets/CommunityIcon.png')} style={styles.icon} />}
          labelStyle={[styles.label, currentRouteName === 'Community' && styles.activeLabel]}
          style={currentRouteName === 'Community' && styles.activeItem}
        />

        <DrawerItem
          label="Notifications"
          onPress={() => props.navigation.navigate('Notifications')}
          icon={() => <Image source={require('../assets/NotificationsIcon.png')} style={styles.icon} />}
          labelStyle={[styles.label, currentRouteName === 'Notifications' && styles.activeLabel]}
          style={currentRouteName === 'Notifications' && styles.activeItem}
        />

        <DrawerItem
          label="Settings"
          onPress={() => props.navigation.navigate('SettingStack')}
          icon={() => <Image source={require('../assets/SettingsIcon.png')} style={styles.icon} />}
          labelStyle={[styles.label, currentRouteName === 'SettingStack' && styles.activeLabel]}
          style={currentRouteName === 'SettingStack' && styles.activeItem}
        />

        <DrawerItem
          label="Get Premium"
          onPress={() => props.navigation.navigate('GetPremium')}
          icon={() => <Image source={require('../assets/PremiumIcon.png')} style={styles.icon} />}
          labelStyle={[styles.label, currentRouteName === 'GetPremium' && styles.activeLabel]}
          style={currentRouteName === 'GetPremium' && styles.activeItem}
        />

        <DrawerItem
          label="Logout"
          onPress={() => {
            Alert.alert(
              'Confirm Logout',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: handleSignOut }
              ],
              { cancelable: true }
            );
          }}
          icon={() => <Image source={require('../assets/LogoutIcon.png')} style={styles.icon} />}
          labelStyle={styles.label}
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
    fontWeight: '500'
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
    tintColor: '#000'
  },

})
export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="HomeStack"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{headerShown: false}}
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