import React, { useEffect, useState } from 'react';
import { TextInput, View, Text } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { OnboardingForm, onboardingStyles } from '../../components/OnboardingForm';

export default function SetDetails() {
  const [heightText, setHeightText] = useState('');
  const [weightText, setWeightText] = useState('');
  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');

  const { updateOnboardingData, onboardingData } = useOnboarding();

  useEffect(() => {
    if (onboardingData.userHeight !== undefined) {
      setHeightText(String(onboardingData.userHeight));
    }
    if (onboardingData.userWeight !== undefined) {
      setWeightText(String(onboardingData.userWeight));
    }
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;

    const parsedHeight = parseFloat(heightText.replace(',', '.'));
    const parsedWeight = parseFloat(weightText.replace(',', '.'));

    if (isNaN(parsedHeight)) {
      setHeightError('Please enter your height.');
      isValid = false;
    } else if (parsedHeight > 300) {
      setHeightError('Height can not be more than 300cm.');
      isValid = false;
    } else {
      setHeightError('');
    }

    if (isNaN(parsedWeight)) {
      setWeightError('Please enter your weight.');
      isValid = false;
    } else if (parsedWeight > 300) {
      setWeightError('Weight can not be more than 300 kgs.');
      isValid = false;
    } else {
      setWeightError('');
    }

    return isValid;
  };

  const handleContinuePress = (): boolean => {
    const parsedHeight = parseFloat(heightText.replace(',', '.'));
    const parsedWeight = parseFloat(weightText.replace(',', '.'));

    const isValid = validateForm();
    if (!isValid) return false;

    updateOnboardingData({
      userHeight: parsedHeight,
      userWeight: parsedWeight,
    });

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
          value={heightText}
          onChangeText={(text) => {
            const cleaned = text.replace(',', '.');
            if (/^\d*\.?\d*$/.test(cleaned)) {
              setHeightText(cleaned);
              if (heightError && !isNaN(parseFloat(cleaned))) setHeightError('');
            }
          }}
          placeholder="Height (cm)"
          keyboardType="numeric"
          autoFocus
          maxLength={5}
        />
      </View>
      {heightError ? (
        <Text style={onboardingStyles.onboardingErrorText}>{heightError}</Text>
      ) : null}

      <View style={onboardingStyles.onboardingInputContainer}>
        <TextInput
          style={onboardingStyles.onboardingInput}
          value={weightText}
          onChangeText={(text) => {
            const cleaned = text.replace(',', '.');
            if (/^\d*\.?\d*$/.test(cleaned)) {
              setWeightText(cleaned);
              if (weightError && !isNaN(parseFloat(cleaned))) setWeightError('');
            }
          }}
          placeholder="Weight (kg)"
          keyboardType="numeric"
          maxLength={5}
        />
      </View>
      {weightError ? (
        <Text style={onboardingStyles.onboardingErrorText}>{weightError}</Text>
      ) : null}
    </OnboardingForm>
  );
}
