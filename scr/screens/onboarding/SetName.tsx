import React, { useEffect, useState } from 'react';
import { TextInput, View, Text } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { OnboardingForm, onboardingStyles } from '../../components/OnboardingForm';
import { useFormValidation } from '../../hooks/useFormValidation';

export default function SetNameScreen() {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const { updateOnboardingData, onboardingData } = useOnboarding();

  useEffect(() => {
    if (onboardingData.firstName) setFirstName(onboardingData.firstName);
    if (onboardingData.lastName) setLastName(onboardingData.lastName);
  }, []);

  const { errors, validateForm } = useFormValidation({
    firstName: {
      value: firstName.trim(),
      required: true,
      errorMessage: 'Please enter your first name.',
    },
  });

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
    >
      <View style={onboardingStyles.onboardingInputContainer}>
        <TextInput
          style={onboardingStyles.onboardingInput}
          value={firstName}
          onChangeText={(input) => setFirstName(input.replace(/\d/g, ''))}
          placeholder="First Name"
          autoCapitalize="words"
          autoFocus
        />
      </View>
      {errors.firstName ? (
        <Text style={onboardingStyles.onboardingErrorText}>{errors.firstName}</Text>
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