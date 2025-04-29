import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useNotifications } from '../../contexts/NotificationsContext';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'Notification'>;

type NotificationItem = {
  id: string;
  title?: string;
  body?: string;
  postId: string;
  type: 'like' | 'comment' | 'new_post';
  timestamp?: number;
};

const { width, height } = Dimensions.get('window');
const scaleFactor = 1.1;

const NotificationsScreen = () => {
  const { notifications, addNotification } = useNotifications();
  const [isPushEnabled, setPushEnabled] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const loadPushSetting = async () => {
      try {
        const value = await AsyncStorage.getItem('pushEnabled');

        if(value != null) setPushEnabled(JSON.parse(value));
      } catch (error: any) {
        console.error('Failed to load push setting:', error);
      }
    }

    loadPushSetting();
  }, []);
  

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const time = item.timestamp 
      ? `${Math.floor((Date.now() - item.timestamp) / 60000)} minutes ago` 
      : 'Just now';
    const title = item.type === 'new_post' 
      ? `${item.title || 'Someone'}` 
      : item.type === 'like' 
      ? `${item.title || 'Someone'}` 
      : `${item.title || 'Someone'}`;
    const body = item.body || (item.type === 'comment' ? 'New comment' : '');

    return (
      <View style={styles.notificationItem}>
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle}>{title} <Text style={styles.notificationBody}>{body}</Text></Text>
        </View>
        <Text style={styles.notificationTime}>{time}</Text>
        {!item.timestamp && <View style={styles.unreadDot} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.drawerContainer} onPress={() => navigation.openDrawer()}>
        <Image source={require('../../assets/drawerIcon.png')} style={styles.drawerIcon} />
      </TouchableOpacity>

      <Text style={styles.title}>Notifications</Text>
      

      <View style={styles.notificationContainer}>
        {isPushEnabled ? (
          notifications.length > 0 ? (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={renderNotificationItem}
            />
          ) : (
            <Text style={styles.noNotificationsText}>
              No notifications available.
            </Text>
          )
        ) : (
          <Text style={styles.notificationDisabledText}>
            Enable Notifications to receive updates about likes, comments, and more.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  drawerContainer: {
    marginTop: height * 0.03,
    marginLeft: width * 0.045,
    width: '10%',
  },
  drawerIcon: {
    height: RFValue(32, height),
    width: RFValue(32, height),
    marginBottom: height * 0.006,
  },
  title: {
    fontSize: RFPercentage(3.8 * scaleFactor),
    fontWeight: 'bold',
    marginLeft: width * 0.05,
    marginTop: height * 0.015,
    marginBottom: height * 0.05,
    color: '#333',
  },
  subtitle: {
    fontSize: RFPercentage(1.8 * scaleFactor),
    color: '#888',
    marginLeft: width * 0.05,
    marginBottom: height * 0.03,
  },
  notificationContainer: {
    backgroundColor: '#FFF',
    height: height * 0.65, 
  },
  listContent: {
    padding: RFValue(25 * scaleFactor, height),
    marginTop: -15
  },
  notificationItem: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  notificationTextContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  notificationTitle: {
    fontSize: RFPercentage(2 * scaleFactor),
    fontWeight: '600',
    color: '#333',
    lineHeight: RFPercentage(2.5 * scaleFactor),
    marginBottom: height * 0.01,
    paddingHorizontal: 0.02 * width,
    marginTop: height * 0.02
  },
  notificationBody: {
    fontSize: RFPercentage(1.9 * scaleFactor),
    color: '#666',
    lineHeight: RFPercentage(2.2 * scaleFactor),
  },
  notificationTime: {
    fontSize: RFPercentage(1.5 * scaleFactor),
    color: '#888',
    marginRight: width * 0.04 * scaleFactor,
    paddingHorizontal: 0.02 * width,
    marginBottom: height * 0.02
  },
  unreadDot: {
    width: RFValue(10 * scaleFactor, height),
    height: RFValue(10 * scaleFactor, height),
    borderRadius: RFValue(5 * scaleFactor, height),
    backgroundColor: '#7A5FFF',
    marginLeft: width * 0.02 * scaleFactor,
  },
  notificationDisabledText: {
    flex: 1,
    textAlign: 'center',
    fontSize: RFPercentage(2.2 * scaleFactor),
    color: '#999',
    paddingHorizontal: width * 0.1,
    paddingTop: height * 0.25,
  },
  noNotificationsText: {
    fontSize: RFPercentage(2.2 * scaleFactor),
    color: '#999',
    textAlign: 'center',
    marginTop: height * 0.25,
  },
});