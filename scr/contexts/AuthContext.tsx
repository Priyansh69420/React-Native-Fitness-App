import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, firestore } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData } from '../store/slices/userSlice';
import { useRealm } from '../../realmConfig'; 
import { UpdateMode } from 'realm';
import NetInfo from '@react-native-community/netinfo';

interface AuthContextType {
  user: { uid: string } | null;
  loading: boolean;
  onboardingComplete: boolean;
  onboardingInProgress: boolean;
  setAuthUser: (uid: string) => Promise<void>;
  clearAuthUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [onboardingInProgress, setOnboardingInProgress] = useState<boolean>(false);

  const realm = useRealm();

  const setOnboardingInProgressFlag = async (inProgress: boolean) => {
    try {
      await AsyncStorage.setItem('onboardingInProgress', JSON.stringify(inProgress));
      setOnboardingInProgress(inProgress);
    } catch (error) {
      console.error('Failed to set onboardingInProgress:', error);
    }
  };

  const getOnboardingInProgressFlag = async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem('onboardingInProgress');
      return value ? JSON.parse(value) : false;
    } catch (error) {
      console.error('Failed to get onboardingInProgress:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setLoading(true);
  
        const inProgress = await getOnboardingInProgressFlag();
        setOnboardingInProgress(inProgress);
  
        const authData = await AsyncStorage.getItem('authUser');
        if (!authData) return handleNoAuthUser();
  
        const { uid } = JSON.parse(authData);
        if (!uid) return handleNoAuthUser();
  
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          await handleOnlineFlow(uid);
        } else {
          handleOfflineFlow();
        }
      } catch (error) {
        console.error('Error loading initial state:', error);
        await handleErrorFallback();
      } finally {
        setLoading(false);
      }
    };
  
    const handleNoAuthUser = () => {
      setUser(null);
      setOnboardingComplete(false);
    };
  
    const handleErrorFallback = async () => {
      setUser(null);
      setOnboardingComplete(false);
      setOnboardingInProgress(false);
      await setOnboardingInProgressFlag(false);
    };
  
    const handleOnlineFlow = async (uid: string) => {
      const userDocRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        await AsyncStorage.removeItem('authUser');
        handleNoAuthUser();
        return;
      }
  
      const userData = userDoc.data() as UserData;
      const isOnboardingComplete = userData.onboardingComplete === true;
  
      setUser({ uid });
      setOnboardingComplete(isOnboardingComplete);
  
      try {
        const email = auth.currentUser?.email ?? '';
        realm.write(() => {
          realm.create('User', { ...userData, email }, UpdateMode.Modified);
        });
      } catch (realmError) {
        console.error('Error writing to Realm:', realmError);
      }
  
      if (isOnboardingComplete) {
        await setOnboardingInProgressFlag(false);
      }
    };
  
    const handleOfflineFlow = () => {
      const realmUsers = realm.objects('User');
      if (realmUsers.length > 0) {
        const localUser = realmUsers[0];
        setUser({ uid: localUser.email as string });
        setOnboardingComplete(Boolean(localUser.onboardingComplete));
      } else {
        console.warn('No local user data found in Realm.');
        setUser(null);
        setOnboardingComplete(false);
      }
    };
  
    loadInitialState();
  }, []);  

  const setAuthUser = async (uid: string) => {
    try {
      setLoading(true);
      await AsyncStorage.setItem('authUser', JSON.stringify({ uid }));
      const userDocRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        const isOnboardingComplete = userData.onboardingComplete === true;
        setOnboardingComplete(isOnboardingComplete);
        setUser({ uid });

        try {
          const email = auth.currentUser?.email ?? '';
          realm.write(() => {
            realm.create('User', { ...userData, email }, UpdateMode.Modified);
          });
        } catch (realmError) {
          console.error('Error writing to Realm:', realmError);
        }

        if (isOnboardingComplete) {
          await setOnboardingInProgressFlag(false);
        }
      }
    } catch (error) {
      console.error('Error setting auth user:', error);
      setUser(null);
      setOnboardingComplete(false);
      await setOnboardingInProgressFlag(false);
    } finally {
      setLoading(false);
    }
  };

  const clearAuthUser = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem('authUser');
      await auth.signOut(); 
      setUser(null);
      setOnboardingComplete(false);
      setOnboardingInProgress(false);
      await setOnboardingInProgressFlag(false);

      try {
        realm.write(() => {
          realm.delete(realm.objects('User'));
        });
      } catch (realmError) {
        console.error('Error clearing Realm data:', realmError);
      }
    } catch (error) {
      console.error('Error clearing auth user:', error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = React.useMemo(
    () => ({ user, loading, onboardingComplete, onboardingInProgress, setAuthUser, clearAuthUser } as AuthContextType),
    [user, loading, onboardingComplete, onboardingInProgress]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};