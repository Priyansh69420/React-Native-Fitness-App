import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import OnboardingStack from "./OnboardingStack";
import DrawerNavigator from "./DrawerNavigator";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "../../firebaseConfig";
import { doc, getDoc, collection, collectionGroup, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import notifee, { AndroidImportance, EventType, RepeatFrequency, TimestampTrigger, TriggerType } from "@notifee/react-native";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import ReactNativeBiometrics from "react-native-biometrics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../store/slices/userSlice";
import { useNotifications } from "../contexts/NotificationsContext";

const isWithinLast24Hours = (createdAt: any) => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return Timestamp.fromDate(yesterday);
};

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPushEnabled, setPushEnabled] = useState(true);

  const { addNotification } = useNotifications();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async currentUser => {
      setLoading(true);
      if (currentUser) {
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        const justLogged = (await AsyncStorage.getItem("justLoggedIn")) === "true";
        if (userDoc.exists() && userDoc.data()?.faceId && !justLogged) {
          const success = await new ReactNativeBiometrics().simplePrompt({ promptMessage: "Authenticate to continue" });
          setUser(success ? currentUser : null);
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if(!isPushEnabled) return;

    if (!user?.uid) return;
    
    let unsubLikes: () => void = () => {};
    let unsubComments: () => void = () => {};
    let unsubNewPosts: () => void = () => {};

    (async () => {
      const perm = await notifee.requestPermission();
      const channelId = await notifee.createChannel({ id: 'default', name: 'Default', importance: AndroidImportance.HIGH });

      unsubLikes = listenToPostLikes(user.uid) ?? (() => {});
      unsubComments = listenToPostComments(user.uid) ?? (() => {});
      unsubNewPosts = listenToNewPosts(user.uid) ?? (() => {});

      notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          const postId = detail.notification?.data?.postId;
        }
      });
      
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          const postId = detail.notification?.data?.postId;
        }
      });
    })();

    return () => {
      unsubLikes && unsubLikes();
      unsubComments && unsubComments();
      unsubNewPosts && unsubNewPosts();
    };
  }, [user?.uid, isPushEnabled]);

  useEffect(() => {
    if(user) scheduleDailyWaterReminders();
  }, [user]);

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
  }, [])
  

  const scheduleDailyWaterReminders = async () => {
    if(!isPushEnabled) return;

    await notifee.createChannel({
      id: 'reminder',
      name: 'Daily Reminder',
      importance: AndroidImportance.HIGH,
    });

    const scheduleAtTime = async (hour: number, minute: number, id: string, body: string) => {
      const date = new Date(Date.now());
      date.setHours(hour);
      date.setMinutes(minute);
      date.setSeconds(0);

      if(date.getTime() < Date.now()) date.setDate(date.getDate() + 1);

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      await notifee.createTriggerNotification({
        title: 'Stay Hydrated 💧',
        body,
        android: {
          channelId: 'reminder',
        }
      }, trigger);
    }

    await scheduleAtTime(12, 0, 'water-1', 'Don’t forget to stay hydrated!')
    await scheduleAtTime(18, 0, 'water-1', 'Don’t forget to stay hydrated!')
  }

  const listenToPostLikes = (uid: string) => {
    if(!isPushEnabled) return;

    const postsQuery = query(
      collection(firestore, "posts"),
      where("userId", "==", uid)
    );
    const lastCounts: Record<string, number> = {};
  
    const unsubscribe = onSnapshot(postsQuery, snapshot => {
      snapshot.docs.forEach(async postDoc => {
        const postId = postDoc.id;
        const data = postDoc.data();
        const likes: string[] = data.likes || [];
  
        if (!isWithinLast24Hours(data.createdAt)) return;
  
        const prevCount = lastCounts[postId] || 0;
        if (likes.length > prevCount) {
          const newLikers = likes.slice(prevCount);
          for (const likerId of newLikers) {
            if (likerId !== uid) {
              const likerDoc = await getDoc(doc(firestore, "users", likerId));
              if (likerDoc.exists()) {
                const likerData = likerDoc.data() as UserData;
                await notifee.displayNotification({
                  title: "New Like ❤️",
                  body: `${likerData.name} liked your post!`,
                  android: { channelId: "default" },
                  data: { postId, type: "like" },
                });
                addNotification({
                  id: `${Date.now()}`,
                  title: 'New Like ❤️',
                  body: `${likerData.name} liked your post!`,
                  postId,
                  type: 'like',
                  timestamp: Date.now(),
                });
              }
            }
          }
        }
  
        lastCounts[postId] = likes.length;
      });
    }, error => console.error("Likes listener error:", error));
  
    return unsubscribe;
  };
  
  const listenToPostComments = (uid: string) => {
    if(!isPushEnabled) return;

    return onSnapshot(
      collectionGroup(firestore, "comments"),
      snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === "added") {
            const comment = change.doc.data() as {
              userId?: string;
              content?: string;
              username?: string;
              postId?: string;
              createdAt?: Timestamp;
            };
  
            if (!isWithinLast24Hours(comment.createdAt)) return;
  
            if (comment.userId && comment.userId !== uid && comment.postId) {
              const postDoc = await getDoc(doc(firestore, "posts", comment.postId));
              if (postDoc.exists()) {
                const postOwnerId = postDoc.data()?.userId;
                if (postOwnerId === uid) {
                  await notifee.displayNotification({
                    title: "New Comment 💬",
                    body: `${comment.username || "Someone"}: "${comment.content}"`,
                    android: { channelId: "default" },
                    data: { postId: comment.postId, type: "comment" },
                  });
                  addNotification({
                    id: `${Date.now()}`,
                    title: 'New Comment 💬',
                    body: `${comment.username || "Someone"}: "${comment.content}"`,
                    postId: comment.postId!,
                    type: 'comment',
                    timestamp: Date.now(),
                  });
                }
              }
            }
          }
        });
      },
      error => console.error("Comments listener error:", error)
    );
  };
  
  const listenToNewPosts = (uid: string) => {
    if(!isPushEnabled) return;

    const newPostsQuery = query(
      collection(firestore, "posts"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
  
    const unsubscribe = onSnapshot(newPostsQuery, snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === "added") {
          const post = change.doc.data() as { userId?: string; createdAt?: Timestamp };
          if (!isWithinLast24Hours(post.createdAt)) return;
  
          if (post.userId && post.userId !== uid) {
            const userDoc = await getDoc(doc(firestore, "users", post.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data() as UserData;
              await notifee.displayNotification({
                title: "New Post 📝",
                body: `${userData.name} just posted!`,
                android: { channelId: "default" },
                data: { postId: change.doc.id, type: "new_post" },
              });
              addNotification({
                id: `${Date.now()}`,
                title: 'New Post 📝',
                body: `${userData.name} just posted!`,
                postId: change.doc.id,
                type: 'new_post',
                timestamp: Date.now(),
              });
            }
          }
        }
      });
    }, error => console.error("New posts listener error:", error));
  
    return unsubscribe;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7A5FFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <DrawerNavigator /> : <OnboardingStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
});
