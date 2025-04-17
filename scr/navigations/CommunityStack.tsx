import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { CommunityStackParamList } from './CommunityStackParamList';
import Community from '../screens/home/Community';
import Post from '../screens/home/Post';
import { RouteProp } from '@react-navigation/native';
import UserInfo from '../screens/home/UserInfo';


const Stack = createStackNavigator<CommunityStackParamList>();

export default function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name='Community' component={Community} />
        <Stack.Screen name='Post' component={Post} />
        <Stack.Screen name='UserInfo' component={UserInfo}/>
    </Stack.Navigator>
  )
}

export type PostScreenRouteProp = RouteProp<CommunityStackParamList, 'Post'>;
export type UserInfoScreenRouteProp = RouteProp<CommunityStackParamList, 'UserInfo'>;
