import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { PermissionsAndroid, Platform } from "react-native";
import HealthKit, { HKQuantityTypeIdentifier } from "@kingstinct/react-native-healthkit";
import GoogleFit, { BucketUnit, Scopes } from "react-native-google-fit";

interface FootstepState {
    steps: number;
    loading: boolean;
    error: string | null;
}

const initialState: FootstepState = {
    steps: 0,
    loading: false,
    error: null,
};

export const fetchSteps = createAsyncThunk("footsteps/fetchSteps", async (_WORKLET, { rejectWithValue }) => {
  try {
      if (Platform.OS === "ios") {
          const isAvailable = await HealthKit.isHealthDataAvailable();
          if (!isAvailable) throw new Error("HealthKit is not available on this device");

          await HealthKit.requestAuthorization([HKQuantityTypeIdentifier.stepCount]);

          const options = {
              from: new Date(new Date().setHours(0, 0, 0, 0)),
              to: new Date(),
          };

          const steps = await HealthKit.queryQuantitySamples(HKQuantityTypeIdentifier.stepCount, options);
          const totalSteps = steps.reduce((sum, sample) => sum + sample.quantity, 0);
          return totalSteps;
      } else if (Platform.OS === "android") {
          try {
              const hasPermission = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
              );

              if (hasPermission === PermissionsAndroid.RESULTS.GRANTED) {
                  const authResult = await GoogleFit.authorize({
                      scopes: [
                          Scopes.FITNESS_ACTIVITY_READ,
                          Scopes.FITNESS_ACTIVITY_WRITE,
                      ],
                  });

                  if (!authResult.success) {
                      console.error("Google Fit authorization failed:", authResult.message);
                      throw new Error(`Google Fit authorization failed: ${authResult.message}`);
                  }
              } else {
                  console.error("Activity Recognition permission denied");
                  throw new Error("Activity Recognition permission denied");
              }

              const options = {
                  startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
                  endDate: new Date().toISOString(),
                  bucketUnit: BucketUnit.DAY,
                  bucketInterval: 1,
              };

              const stepData = await GoogleFit.getDailyStepCountSamples(options);
              const totalSteps = stepData
                  .filter((bucket) =>
                      bucket.source === "com.google.step_count.delta" ||
                      bucket.source === "com.google.android.gms:estimated_steps"
                  )
                  .reduce((sum, bucket) => {
                      const steps = bucket.steps?.reduce((acc, curr) => acc + curr.value, 0) || 0;
                      return sum + steps;
                  }, 0);

              return totalSteps;
          } catch (error: any) {
              console.error("Error in Google Fit step count retrieval:", error.message);
              throw error;
          }
      } else {
          throw new Error("Unsupported platform");
      }
  } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch steps");
  }
});

const footstepSlice = createSlice({
  name: "footsteps",
  initialState,
  reducers: {
    resetSteps: (state) => {
      state.steps = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
  builder
    .addCase(fetchSteps.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchSteps.fulfilled, (state, action) => {
      state.loading = false;
      state.steps = action.payload;
    })
    .addCase(fetchSteps.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { resetSteps } = footstepSlice.actions;
export default footstepSlice.reducer;
