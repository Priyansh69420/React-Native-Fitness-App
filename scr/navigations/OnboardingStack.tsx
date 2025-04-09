import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import GettingStarted from '../screens/onboarding/GettingStarted'
import Login from '../screens/onboarding/Login'
import Signup from '../screens/onboarding/Signup'
import SetPassword from '../screens/onboarding/SetPassword'
import SetName from '../screens/onboarding/SetName'
import FaceId from '../screens/onboarding/FaceId'
import SetProfile from '../screens/onboarding/SetProfile'
import Goals from '../screens/onboarding/Goals'
import Intrests from '../screens/onboarding/Intrests'
import Gender from '../screens/onboarding/Gender'
import ReadyToGo from '../screens/onboarding/ReadyToGo'
import { OnboardingProvider } from '../contexts/OnboardingContext'

const Stack = createStackNavigator();

export default function OnboardingStack() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name='GettingStarted' component={GettingStarted} />
          <Stack.Screen name='Login' component={Login} />
          <Stack.Screen name='Signup' component={Signup} />
          <Stack.Screen name='SetPassword' component={SetPassword} />
          <Stack.Screen name='SetName' component={SetName} />
          <Stack.Screen name='FaceId' component={FaceId} />
          <Stack.Screen name='SetProfile' component={SetProfile} />
          <Stack.Screen name='Goals' component={Goals} />
          <Stack.Screen name='Intrests' component={Intrests} />
          <Stack.Screen name='Gender' component={Gender} />
          <Stack.Screen name='ReadyToGo' component={ReadyToGo} />
      </Stack.Navigator>
    </OnboardingProvider>
  )
}