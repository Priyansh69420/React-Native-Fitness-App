import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';

export default function Notifications() {
  useEffect(() => {
    async function setupNotifications() {
      await notifee.requestPermission();
  
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
    }
  
    setupNotifications();
  }, []);

  async function onDisplayNotification() {
    try {
      await notifee.displayNotification({
        title: 'Local Notification Title',
        body: 'Local Notification Body',
        android: {
          channelId: 'default',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'true',
        },
      });
      console.log('Notification displayed successfully!');
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onDisplayNotification}>
        <Text>Press for notification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});