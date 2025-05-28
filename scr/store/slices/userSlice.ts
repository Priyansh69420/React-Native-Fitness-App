import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../../../firebaseConfig";
import Realm from "realm";

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

export const syncRealmUserToFirestore = async (realm: Realm, email: string) => {
    try {
        const user = realm.objectForPrimaryKey('User', email);
        if(!user) return;
  
        const userDoc = doc(firestore, 'users', email);
        await setDoc(userDoc, {
            email: user.email,
            name: user.name,
            faceId: user.faceId,
            profilePicture: user.profilePicture,
            goals: user.goals,
            interests: user.interests,
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
        }, {merge: true});
    } catch(error: any) {
        console.error('Failed to sync Realm to Firestore:', error);
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
  
        const user = users[0] as unknown as UserData;
        const userData: UserData = {
          email: user.email,
          name: user.name,
          faceId: user.faceId,
          profilePicture: user.profilePicture,
          goals: user.goals,
          interests: user.interests,
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
