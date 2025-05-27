import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../../../firebaseConfig";
import Realm from "realm";
import { User } from "../../../realmConfig"; 

// ------------------- Types -------------------
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

// ------------------- Initial State -------------------
const initialState: UserState = {
    userData: null,
    loading: false,
    error: null,
};

// ------------------- Firebase Thunk -------------------
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

// ------------------- Realm Thunk -------------------
export const loadUserDataFromRealm = createAsyncThunk(
    'user/loadUserDataFromRealm',
    async (realm: Realm, { rejectWithValue }) => {
      try {
        const users = realm.objects('User');
        if (!users.length) throw new Error('No local user data found.');
  
        const user = users[0];
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

// ------------------- Helpers -------------------
const setDefaultProfilePicture = (userData: UserData) => {
    if (userData.profilePicture === '' || userData.profilePicture === null) {
        userData.profilePicture = 'https://dojvycwbetqfeutcvsqe.supabase.co/storage/v1/object/public/profileimages/profile_pictures/default-Icon.jpeg';
    }
};

// ------------------- Slice -------------------
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
        // Firebase
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

        // Realm
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
