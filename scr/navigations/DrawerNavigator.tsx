import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, useDrawerProgress } from '@react-navigation/drawer';
import { DrawerParamList } from './DrawerParamList';
import HomeStack from './HomeStack';
import CommunityStack from './CommunityStack';
import Notifications from '../screens/home/Notifications';
import SettingStack from './SettingStack';
import GetPremium from '../screens/home/GetPremium';
import { auth } from '../../firebaseConfig';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../store/slices/userSlice';
import { persistor, RootState } from '../store/store';
import { useNavigationState } from '@react-navigation/native';

const Drawer = createDrawerNavigator<DrawerParamList>();

interface Avatar {
  id: number;
  source: any;
}

const avatars: Avatar[] = [
  { id: 1, source: require('../assets/avatar5.png') },
  { id: 2, source: require('../assets/avatar2.png') },
  { id: 3, source: require('../assets/avatar4.png') },
];

const getAvatarSource = (id: number): any => {
  const avatar = avatars.find((item) => item.id === id);
  return avatar ? avatar.source : null;
};

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

  const profileImageSource =
    typeof userData?.profilePicture === 'string'
      ? { uri: userData.profilePicture }
      : userData?.profilePicture
      ? getAvatarSource(userData.profilePicture)
      : null;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileContainer}>
        <Image source={ profileImageSource } style={styles.profileImage}/>
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
          label="Community"
          onPress={() => props.navigation.navigate('Community')}
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
          onPress={() => handleSignOut()}
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
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
  },
  activeItem: {
    backgroundColor: '#f0f0f0', 
    borderRadius: 5,
  },
  activeLabel: {
    fontWeight: 'bold',
    color: '#7A5FFF',
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