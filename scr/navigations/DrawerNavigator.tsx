import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { DrawerParamList } from './DrawerParamList';
import HomeStack from './HomeStack'; 
import CommunityStack from './CommunityStack';
import Notifications from '../screens/home/Notifications';
import SettingStack from './SettingStack';
import GetPremium from '../screens/home/GetPremium';
import { auth } from '../../firebaseConfig';
import { View, Image, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { clearUser } from '../store/slices/userSlice';
import { persistor } from '../store/store';

const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent(props: any) {

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
    <DrawerContentScrollView {...props} contentContainerStyle={styles.contentContainer}>
      <View style={styles.menuContainer}>
      <DrawerItem
        label="Home"
        onPress={() => props.navigation.navigate('HomeStack')}
        icon={() => <Image source={require('../assets/HomeIcon.png')} style={styles.icon} />}
        labelStyle={styles.label}
      />
      <DrawerItem
        label="Community"
        onPress={() => props.navigation.navigate('Community')}
        icon={() => <Image source={require('../assets/CommunityIcon.png')} style={styles.icon} />}
        labelStyle={styles.label}
      />
      <DrawerItem
        label="Notifications"
        onPress={() => props.navigation.navigate('Notifications')}
        icon={() => <Image source={require('../assets/NotificationsIcon.png')} style={styles.icon} />}
        labelStyle={styles.label}
      />
      <DrawerItem
        label="Settings"
        onPress={() => props.navigation.navigate('SettingStack')}
        icon={() => <Image source={require('../assets/SettingsIcon.png')} style={styles.icon} />}
        labelStyle={styles.label}
      />
      <DrawerItem
        label="Get Premium"
        onPress={() => props.navigation.navigate('GetPremium')}
        icon={() => <Image source={require('../assets/PremiumIcon.png')} style={styles.icon} />}
        labelStyle={styles.label}
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
  drawerHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuContainer: {
    flex: 1, 
    justifyContent: 'center',
    paddingVertical: 20,
  },
  icon: {
    width: 32,
    height: 32,
  },
  label: {
    fontSize: 18,
    color: '#333',
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