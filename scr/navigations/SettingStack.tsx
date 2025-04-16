import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { SettingStackParamList } from './SettingStackParamList'
import Settings from '../screens/home/Settings';
import Profile from '../screens/home/Profile';
import AboutUs from '../screens/home/AboutUs';
import Community from '../screens/home/Community';
import Post from '../screens/home/Post';

const Stack = createStackNavigator<SettingStackParamList>();

export default function SettingStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name='Settings' component={Settings} />
        <Stack.Screen name='Profile' component={Profile} />
        <Stack.Screen name='AboutUs' component={AboutUs} />
        <Stack.Screen name='Community' component={Community} />
        <Stack.Screen name='Post' component={Post} />
    </Stack.Navigator>
  )
}