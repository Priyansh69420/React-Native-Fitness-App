import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, Image, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useNotifications } from '../../contexts/NotificationsContext';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';

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
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();

  useEffect(() => {
    const loadPushSetting = async () => {
      try {
        const value = await AsyncStorage.getItem('pushEnabled');
        if (value != null) setIsPushEnabled(JSON.parse(value));
      } catch (error: any) {
        console.error('Failed to load push setting:', error);
      }
    };

    loadPushSetting();
  }, []);

  useEffect(() => {
    const seen = new Set();
    const filtered = notifications.filter(item => {
      const uniqueKey = `${item.type}-${item.timestamp}`;
      
      if(seen.has(uniqueKey)) return false
    });
  }, [])

  let offset = 1;

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const time = item.timestamp 
      ? `${Math.floor((Date.now() - item.timestamp + (1000000 + (offset++ * 100000))) / 60000)} minutes ago` 
      : 'Just now';
  
    const isKnownType = ['new_post', 'comment', 'like'].includes(item.type);
    const title = isKnownType ? (item.title ?? 'Someone') : (item.title ?? '');
    const body = item.body ?? (item.type === 'comment' ? 'New comment' : '');
  
    return (
      <View style={[styles.notificationItem, { borderBottomColor: theme.borderPrimary }]}>
        <View style={styles.notificationTextContainer}>
          <Text style={[styles.notificationTitle, { color: theme.textPrimary }]}>
            {!!title && title + ' '}
            <Text style={[styles.notificationBody, { color: theme.textSecondary }]}>
              {body}
            </Text>
          </Text>
        </View>
        <Text style={[styles.notificationTime, { color: theme.textPlaceholder }]}>{time}</Text>
        {!item.timestamp && <View style={[styles.unreadDot, { backgroundColor: theme.borderAccent }]} />}
      </View>
    );
  };
  

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
      <TouchableOpacity style={styles.drawerContainer} onPress={() => navigation.openDrawer()}>
        <Image source={require('../../assets/drawerIcon.png')} style={[styles.drawerIcon, { tintColor: theme.iconPrimary }]} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.textPrimary }]}>Notifications</Text>

      <View style={[styles.notificationContainer, { backgroundColor: theme.backgroundSecondary }]}>
        {(() => {
          if (!isPushEnabled) {
            return (
              <Text style={[styles.notificationDisabledText, { color: theme.textPlaceholder }]}>
                Enable Notifications to receive updates about likes, comments, and more.
              </Text>
            );
          }

          if (notifications.length > 0) {
            return (
              <FlatList
                data={notifications as any}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderNotificationItem}
              />
            );
          }

          return (
            <Text style={[styles.noNotificationsText, { color: theme.textPlaceholder }]}>
              No notifications available.
            </Text>
          );
        })()}
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
    height: height * 0.85, 
  },
  listContent: {
    padding: RFValue(25 * scaleFactor, height),
    marginTop: -15
  },
  notificationItem: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: height * 0.015,
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
    lineHeight: RFPercentage(2.3 * scaleFactor),
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