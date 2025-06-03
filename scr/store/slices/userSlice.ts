import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../../../firebaseConfig";
import Realm from "realm";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';

export interface UserData {
    email: string;
    name: string;
    faceId: boolean;
    profilePicture: string | number;
    goals: string[];
    interests: string[];
    gender: string;
    calories: number;
    isPremium: boolean;
    planType: string;
    onboardingComplete: boolean;
    userHeight: number;
    userWeight: number;
    calorieGoal: number;
    glassGoal: number;
    stepGoal: number;
}

interface RealmUser {
    email: string;
    name: string;
    faceId: boolean;
    profilePicture: string | number;
    goals: Realm.List<string>;
    interests: Realm.List<string>;
    gender: string;
    calories: number;
    isPremium: boolean;
    planType: string;
    onboardingComplete: boolean;
    userHeight: number;
    userWeight: number;
    calorieGoal: number;
    glassGoal: number;
    stepGoal: number;
}

interface UserState {
    userData: UserData | null;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    userData: null,
    loading: false,
    error: null,
};

const setDefaultProfilePicture = (userData: UserData) => {
    if (userData.profilePicture === '' || userData.profilePicture === null) {
        userData.profilePicture = 'https://dojvycwbetqfeutcvsqe.supabase.co/storage/v1/object/public/profileimages/profile_pictures/default-Icon.jpeg';
    }
};

export const saveUserDataToRealm = (realm: Realm, userData: UserData) => {
    realm.write(() => {
        realm.create('User', userData, Realm.UpdateMode.Modified);
    });
};

export const updateUserProfile = createAsyncThunk(
    'user/updateUserProfile',
    async (
      { updatedData, realm }: { updatedData: Partial<UserData>; realm: Realm },
      { getState, dispatch }
    ) => {
      const state = getState() as { user: UserState };
      const currentUser = state.user.userData;
  
      if (!currentUser) {
        throw new Error('No user data available');
      }
  
      const newUserData = { ...currentUser, ...updatedData };
  
      // Step 1: Update Redux store
      dispatch(updateUser(updatedData));
  
      // Step 2: Update Realm immediately
      try {
        saveUserDataToRealm(realm, newUserData);
      } catch (err) {
        console.error('[updateUserProfile] Failed to save to Realm:', err);
      }
  
      // Step 3: Sync logic based on network status
      try {
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          await syncRealmUserToFirestore(realm, newUserData.email);
          await AsyncStorage.removeItem('pendingUserSync');
          await AsyncStorage.removeItem('pendingUserData');
        } else {
          await AsyncStorage.setItem('pendingUserSync', 'true');
          await AsyncStorage.setItem('pendingUserData', JSON.stringify(newUserData));
        }
      } catch (netErr) {
        await AsyncStorage.setItem('pendingUserSync', 'true');
        await AsyncStorage.setItem('pendingUserData', JSON.stringify(newUserData));
      }
  
      return updatedData;
    }
);
  

export const syncRealmUserToFirestore = async (realm: Realm, email: string) => {
    try {
        const user = realm.objectForPrimaryKey<RealmUser>('User', email);
        if (!user) throw new Error('User not found in Realm for syncing');

        const userData: UserData = {
            email: user.email,
            name: user.name, 
            faceId: user.faceId,
            profilePicture: user.profilePicture,
            goals: Array.from(user.goals),
            interests: Array.from(user.interests),
            gender: user.gender,
            calories: user.calories,
            isPremium: user.isPremium ?? false,
            planType: user.planType ?? '',
            onboardingComplete: user.onboardingComplete,
            userHeight: user.userHeight,
            userWeight: user.userWeight,
            calorieGoal: user.calorieGoal,
            glassGoal: user.glassGoal,
            stepGoal: user.stepGoal,
        };

        const firestoreUser = auth.currentUser;
        if (!firestoreUser) throw new Error("No authenticated user found.");

        const userDoc = doc(firestore, 'users', firestoreUser.uid);
        await setDoc(userDoc, userData, { merge: true });

    } catch (error: any) {
        console.error('Failed to sync Realm to Firestore:', error);
        throw error;
    }
};

export const fetchUserData = createAsyncThunk("user/fetchUserData", async (_, { rejectWithValue }) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found.");

        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) throw new Error("User data not found.");

        return userDoc.data() as UserData;
    } catch (error: any) {
        return rejectWithValue(error.message);
    }
});

export const loadUserDataFromRealm = createAsyncThunk(
    'user/loadUserDataFromRealm',
    async (realm: Realm, { rejectWithValue }) => {
      try {
        const users = realm.objects('User');
        if (!users.length) throw new Error('No local user data found.');
  
        const user = users[0] as unknown as RealmUser;

        const userData: UserData = {
        email: user.email,
        name: user.name,
        faceId: user.faceId,
        profilePicture: user.profilePicture,
        goals: Array.from(user.goals),        
        interests: Array.from(user.interests), 
        gender: user.gender,
        calories: user.calories,
        isPremium: user.isPremium,
        planType: user.planType,
        onboardingComplete: user.onboardingComplete,
        userHeight: user.userHeight,
        userWeight: user.userWeight,
        calorieGoal: user.calorieGoal,
        glassGoal: user.glassGoal,
        stepGoal: user.stepGoal,
        };
  
        return userData;
      } catch (error: any) {
        return rejectWithValue(error.message);
      }
    }
  );

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserData: (state, action: PayloadAction<UserData>) => {
            state.userData = action.payload;
            state.loading = false;
        },
        updateUser: (state, action: PayloadAction<Partial<UserData>>) => {
            if (state.userData) {
                state.userData = { ...state.userData, ...action.payload };
            }
        },
        clearUser: (state) => {
            state.userData = null;
            state.error = null;
        },
        setCalories: (state, action: PayloadAction<number>) => {
            if (state.userData) {
                state.userData.calories = action.payload;
            }
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUserData.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchUserData.fulfilled, (state, action) => {
            state.loading = false;
            setDefaultProfilePicture(action.payload);
            state.userData = action.payload;
        });
        builder.addCase(fetchUserData.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        builder.addCase(loadUserDataFromRealm.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(loadUserDataFromRealm.fulfilled, (state, action) => {
            state.loading = false;
            setDefaultProfilePicture(action.payload);
            state.userData = action.payload;
        });
        builder.addCase(loadUserDataFromRealm.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export const { setUserData, updateUser, clearUser, setCalories } = userSlice.actions;
export default userSlice.reducer;
