import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../../../firebaseConfig";

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
            if(state.userData) {
                state.userData.calories = action.payload;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserData.fulfilled, (state, action) => {
                state.loading = false;
                state.userData = action.payload;
            })
            .addCase(fetchUserData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setUserData, updateUser, clearUser, setCalories } = userSlice.actions;
export default userSlice.reducer;
