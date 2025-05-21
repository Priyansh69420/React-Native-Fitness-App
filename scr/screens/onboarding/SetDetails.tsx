import React, { useEffect, useState } from 'react';
import { TextInput, View, Text } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { OnboardingForm, onboardingStyles } from '../../components/OnboardingForm';
import { useFormValidation } from '../../hooks/useFormValidation';

export default function SetDetails() {
  const [userHeight, setUserHeight] = useState<number | undefined>();
  const [userWeight, setUserWeight] = useState<number | undefined>();
  const { updateOnboardingData, onboardingData } = useOnboarding();

  useEffect(() => {
    if (onboardingData.userHeight) setUserHeight(onboardingData.userHeight);
    if (onboardingData.userWeight) setUserWeight(onboardingData.userWeight);
  }, []); 

  const { errors, validateForm } = useFormValidation({
    userHeight: {
      value: userHeight,
      required: true,
      errorMessage: 'Please enter your height.',
    },
    userWeight: {
      value: userWeight,
      required: true,
      errorMessage: 'Please enter your weight.',
    },
  });

  const handleContinuePress = (): boolean => {
    const isValid = validateForm();
    if (!isValid) return false;
    updateOnboardingData({ userHeight, userWeight });
    return true;
  };

  return (
    <OnboardingForm
      title="Please enter your height and weight."
      onContinue={handleContinuePress}
      nextScreen="FaceId"
    >
      <View style={onboardingStyles.inputContainer}>
        <TextInput
          style={onboardingStyles.input}
          value={userHeight !== undefined ? String(userHeight) : ''}
          onChangeText={(text) => setUserHeight(text ? parseFloat(text) : undefined)}
          placeholder="Height (cm)"
          keyboardType="numeric"
        />
      </View>
      {errors.userHeight ? (
        <Text style={onboardingStyles.errorText}>{errors.userHeight}</Text>
      ) : null}
      <View style={onboardingStyles.inputContainer}>
        <TextInput
          style={onboardingStyles.input}
          value={userWeight !== undefined ? String(userWeight) : ''}
          onChangeText={(text) => setUserWeight(text ? parseFloat(text) : undefined)}
          placeholder="Weight (kg)"
          keyboardType="numeric"
        />
      </View>
      {errors.userWeight ? (
        <Text style={onboardingStyles.errorText}>{errors.userWeight}</Text>
      ) : null}
    </OnboardingForm>
  );
}