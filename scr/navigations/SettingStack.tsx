import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { SettingStackParamList } from './SettingStackParamList'
import Settings from '../screens/home/Settings';
import Profile from '../screens/home/Profile';
import AboutUs from '../screens/home/AboutUs';
import ConnectDevice from '../screens/home/ConnectDevice';


const Stack = createStackNavigator<SettingStackParamList>();

export default function SettingStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name='Settings' component={Settings} />
        <Stack.Screen name='Profile' component={Profile} />
        <Stack.Screen name='AboutUs' component={AboutUs} />
        <Stack.Screen name='ConnectDevice' component={ConnectDevice} />

    </Stack.Navigator>
  )
}