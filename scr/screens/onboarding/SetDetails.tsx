import React, { useEffect, useState } from 'react';
import { TextInput, View, Text } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { OnboardingForm, onboardingStyles } from '../../components/OnboardingForm';

export default function SetDetails() {
  const [userHeight, setUserHeight] = useState<number | undefined>();
  const [userWeight, setUserWeight] = useState<number | undefined>();
  const [heightError, setHeightError] = useState<string>('');
  const [weightError, setWeightError] = useState<string>('');

  const { updateOnboardingData, onboardingData } = useOnboarding();

  useEffect(() => {
    if (onboardingData.userHeight) setUserHeight(onboardingData.userHeight);
    if (onboardingData.userWeight) setUserWeight(onboardingData.userWeight);
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;

    if (userHeight === undefined || isNaN(userHeight)) {
      setHeightError('Please enter your height.');
      isValid = false;
    } else {
      setHeightError('');
    }

    if (userWeight === undefined || isNaN(userWeight)) {
      setWeightError('Please enter your weight.');
      isValid = false;
    } else {
      setWeightError('');
    }

    return isValid;
  };

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
      <View style={onboardingStyles.onboardingInputContainer}>
        <TextInput
          style={onboardingStyles.onboardingInput}
          value={userHeight !== undefined ? String(userHeight) : ''}
          onChangeText={(text) => {
            const parsed = text ? parseFloat(text) : undefined;
            setUserHeight(parsed);
            if (heightError && !isNaN(parsed!)) setHeightError('');
          }}
          placeholder="Height (cm)"
          keyboardType="numeric"
          autoFocus
          maxLength={3}
        />
      </View>
      {heightError ? (
        <Text style={onboardingStyles.onboardingErrorText}>{heightError}</Text>
      ) : null}

      <View style={onboardingStyles.onboardingInputContainer}>
        <TextInput
          style={onboardingStyles.onboardingInput}
          value={userWeight !== undefined ? String(userWeight) : ''}
          onChangeText={(text) => {
            const parsed = text ? parseFloat(text) : undefined;
            setUserWeight(parsed);
            if (weightError && !isNaN(parsed!)) setWeightError('');
          }}
          placeholder="Weight (kg)"
          keyboardType="numeric"
          maxLength={3}
        />
      </View>
      {weightError ? (
        <Text style={onboardingStyles.onboardingErrorText}>{weightError}</Text>
      ) : null}
    </OnboardingForm>
  );
}
