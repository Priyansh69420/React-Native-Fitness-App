import React, { useEffect, useState } from 'react';
import { TextInput, View, Text } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { OnboardingForm, onboardingStyles } from '../../components/OnboardingForm';
import { auth } from '../../../firebaseConfig';

export default function SetNameScreen() {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [firstNameError, setFirstNameError] = useState<string>('');
  const user = auth.currentUser;

  const { updateOnboardingData, onboardingData } = useOnboarding();

  useEffect(() => {
    if (onboardingData.firstName) setFirstName(onboardingData.firstName);
    if (onboardingData.lastName) setLastName(onboardingData.lastName);
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!firstName.trim()) {
      setFirstNameError('Please enter your first name.');
      isValid = false;
    } else {
      setFirstNameError('');
    }

    return isValid;
  };

  const handleContinuePress = (): boolean => {
    const isValid = validateForm();
    if (!isValid) return false;
    updateOnboardingData({ firstName, lastName });
    return true;
  };

  return (
    <OnboardingForm
      title="What’s your name?"
      onContinue={handleContinuePress}
      nextScreen="SetDetails"
      backButton={user?.emailVerified || false}
    >
      <View style={onboardingStyles.onboardingInputContainer}>
        <TextInput
          style={onboardingStyles.onboardingInput}
          value={firstName}
          onChangeText={(input) => {
            setFirstName(input.replace(/\d/g, ''));
            if (firstNameError && input.trim()) {
              setFirstNameError('');
            }
          }}
          placeholder="First Name"
          autoCapitalize="words"
          autoFocus
        />
      </View>
      {firstNameError ? (
        <Text style={onboardingStyles.onboardingErrorText}>{firstNameError}</Text>
      ) : null}

      <View style={onboardingStyles.onboardingInputContainer}>
        <TextInput
          style={onboardingStyles.onboardingInput}
          value={lastName}
          onChangeText={(input) => setLastName(input.replace(/\d/g, ''))}
          placeholder="Last Name"
          autoCapitalize="words"
        />
      </View>
    </OnboardingForm>
  );
}
