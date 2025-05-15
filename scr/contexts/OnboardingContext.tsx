import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface OnboardingData {
  email?: string;
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
}

interface OnboardingContextType {
  onboardingData: OnboardingData;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
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