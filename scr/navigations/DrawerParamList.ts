import { createNavigationContainerRef } from '@react-navigation/native';

export type DrawerParamList = {
    HomeStack: undefined;
    Community: undefined;
    Notifications: undefined;
    SettingStack: undefined;
    GetPremium: undefined;
    Profile: undefined;
};

// Define the navigation param list (adjust based on your app's navigation structure)
export type RootStackParamList = {
  Notifications: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?:  undefined) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
