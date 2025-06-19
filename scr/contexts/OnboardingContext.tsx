import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';

interface OnboardingData {
  email?: string;
  isEmailVerified?: boolean, 
  password?: string;
  firstName?: string;
  lastName?: string;
  userHeight?: number;
  userWeight?: number;
  faceId?: boolean;
  profilePicture?: any;
  goals?: string[];
  interests?: string[];
  gender?: string;
  calories?: number;
  verificationId?: string;
}

interface OnboardingContextType {
  onboardingData: OnboardingData;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});


  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('onboardingData');
        if (jsonValue) {
          setOnboardingData(JSON.parse(jsonValue));
        }
      } catch (err) {
        console.error('❌ Failed to load onboarding data:', err);
      }
    };

    loadFromStorage();
  }, []);

  const saveToAsyncStorage = async (data: OnboardingData) => {
    try {
      await AsyncStorage.setItem('onboardingData', JSON.stringify(data));
    } catch (err) {
      console.error('❌ Failed to save onboarding data:', err);
    }
  };
  
  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => {
      const updated = { ...prev, ...data };
      saveToAsyncStorage(updated); 
      return updated;
    });
  };

  const value = useMemo(
    () => ({ onboardingData, updateOnboardingData }),
    [onboardingData]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};