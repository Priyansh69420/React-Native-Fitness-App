import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigator from "./navigations/AppNavigator";
import { Provider } from "react-redux";
import { store, persistor } from "./store/store";
import { PersistGate } from "redux-persist/integration/react";
import notifee, { AndroidImportance } from "@notifee/react-native";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { AuthProvider } from "./contexts/AuthContext";

const App = () => {
  useEffect(() => {
    async function setupNotifications() {
      await notifee.createChannel({
        id: "default",
        name: "Default Channel",
        importance: AndroidImportance.HIGH,
      });
    }
    
    setupNotifications();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NotificationsProvider>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </NotificationsProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
};

export default App;