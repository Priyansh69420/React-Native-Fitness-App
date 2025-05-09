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
import { navigationRef } from "./DrawerParamList";

// Utility to wait for navigation to be ready with retry logic
const waitForNavigationReady = async () => {
  let retries = 3;
  let attempt = 0;

  while (attempt < retries) {
    try {
      return await new Promise<void>((resolve, reject) => {
        const maxWaitTime = 10000;
        let elapsedTime = 0;

        const checkInterval = setInterval(() => {
          if (navigationRef.isReady()) {
            clearInterval(checkInterval);
            resolve();
          }

          elapsedTime += 100;
          if (elapsedTime >= maxWaitTime) {
            clearInterval(checkInterval);
            reject(new Error(`Navigation failed to become ready within ${maxWaitTime / 1000} seconds`));
          }
        }, 100);
      });
    } catch (error) {
      attempt++;
      if (attempt === retries) {
        throw new Error("Navigation failed after all retries");
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Store pending navigation data if navigation isn't ready or user isn't authenticated
const storePendingNavigation = async (routeName: string, params?: object) => {
  try {
    const data = { routeName, params, timestamp: Date.now() };
    await AsyncStorage.setItem('pendingNavigation', JSON.stringify(data));
  } catch (error) {
    console.error("Failed to store pending navigation:", error);
  }
};

// Retrieve and execute pending navigation
const executePendingNavigation = async () => {
  try {
    const pendingNav = await AsyncStorage.getItem('pendingNavigation');
    if (pendingNav) {
      const { routeName, params } = JSON.parse(pendingNav);
      await waitForNavigationReady();
      navigationRef.reset(routeName);
      await AsyncStorage.removeItem('pendingNavigation');
    }
  } catch (error) {
    console.error("Failed to execute pending navigation:", error);
  }
};

const isWithinLast24Hours = (createdAt: any) => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return Timestamp.fromDate(yesterday);
};

const rnBiometrics = new ReactNativeBiometrics();

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPushEnabled, setPushEnabled] = useState(true);
  const [isBiometricChecked, setBiometricChecked] = useState(false);
  const [initialNotificationHandled, setInitialNotificationHandled] = useState(false);

  const { addNotification } = useNotifications();

  const performBiometricCheck = async (uid: string) => {
    const userDoc = await getDoc(doc(firestore, "users", uid));
    if (!userDoc.exists() || !userDoc.data()?.faceId) return;

    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: "Authenticate to continue",
      });
      if (!success) {
        await auth.signOut();
        setUser(null);
      }
    } catch (e) {
      console.error("Biometric prompt error", e);
      await auth.signOut();
      setUser(null);
    }
  };

  const handleInitialNotification = async () => {
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification && initialNotification.pressAction) {
      const postId = initialNotification.notification?.data?.postId as string | undefined;
      try {
        await waitForNavigationReady();
        if (user) {
          navigationRef.navigate('Notifications');
        } else {
          await storePendingNavigation('Notifications', postId ? { postId } : undefined);
        }
      } catch (error) {
        console.error("Initial navigation failed, storing pending navigation:", error);
        await storePendingNavigation('Notifications', postId ? { postId } : undefined);
      }
    }
    setInitialNotificationHandled(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        if (!isBiometricChecked) {
          await performBiometricCheck(currentUser.uid);
          setBiometricChecked(true);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [isBiometricChecked]);

  useEffect(() => {
    if (!isPushEnabled || !user?.uid) return;

    let unsubLikes: () => void = () => {};
    let unsubComments: () => void = () => {};
    let unsubNewPosts: () => void = () => {};

    (async () => {
      await notifee.requestPermission();

      await notifee.createChannel({
        id: 'default',
        name: 'Default',
        importance: AndroidImportance.HIGH,
      });

      const unsubscribeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          const postId = detail.notification?.data?.postId as string | undefined;
          try {
            await waitForNavigationReady();
            if (user) {
              navigationRef.navigate('Notifications');
            } else {
              await storePendingNavigation('Notifications', postId ? { postId } : undefined);
            }
          } catch (error) {
            console.error("Foreground navigation failed, storing pending navigation:", error);
            await storePendingNavigation('Notifications', postId ? { postId } : undefined);
          }
        }
      });

      const unsubscribeBackground = notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          const postId = detail.notification?.data?.postId as string | undefined;
          try {
            await waitForNavigationReady();
            if (user) {
              navigationRef.navigate('Notifications');
            } else {
              await storePendingNavigation('Notifications', postId ? { postId } : undefined);
            }
          } catch (error) {
            console.error("Background navigation failed, storing pending navigation:", error);
            await storePendingNavigation('Notifications', postId ? { postId } : undefined);
          }
        }
      });

      unsubLikes = listenToPostLikes(user.uid) ?? (() => {});
      unsubComments = listenToPostComments(user.uid) ?? (() => {});
      unsubNewPosts = listenToNewPosts(user.uid) ?? (() => {});
    })();

    return () => {
      unsubLikes && unsubLikes();
      unsubComments && unsubComments();
      unsubNewPosts && unsubNewPosts();
    };
  }, [user?.uid, isPushEnabled]);

  useEffect(() => {
    if (user) {
      scheduleDailyWaterReminders();
    }
  }, [user]);

  useEffect(() => {
    const loadPushSetting = async () => {
      try {
        const value = await AsyncStorage.getItem('pushEnabled');
        if (value != null) {
          setPushEnabled(JSON.parse(value));
        }
      } catch (error) {
        console.error('Failed to load push setting:', error);
      }
    };
    loadPushSetting();
  }, []);

  useEffect(() => {
    if (!initialNotificationHandled) {
      handleInitialNotification();
    }
  }, [user, initialNotificationHandled]);

  useEffect(() => {
    if (user && !loading && initialNotificationHandled) {
      executePendingNavigation();

      const retryInterval = setInterval(() => {
        executePendingNavigation();
      }, 2000);

      const timeout = setTimeout(() => {
        clearInterval(retryInterval);
      }, 10000);

      return () => {
        clearInterval(retryInterval);
        clearTimeout(timeout);
      };
    }
  }, [user, loading, initialNotificationHandled]);

  const scheduleDailyWaterReminders = async () => {
    if (!isPushEnabled) return;

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

      if (date.getTime() < Date.now()) date.setDate(date.getDate() + 1);

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      await notifee.createTriggerNotification({
        id,
        title: 'Stay Hydrated 💧',
        body,
        android: {
          channelId: 'reminder',
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
      }, trigger);

      addNotification({
        id: `${Date.now()}`,
        title: 'Stay Hydrated 💧',
        body,
        type: 'reminder',
        timestamp: Date.now(),
        postId: '',
      });
    };

    await scheduleAtTime(12, 0, 'water-1', 'Don’t forget to stay hydrated!');
  };

  const listenToPostLikes = (uid: string) => {
    if (!isPushEnabled) return;

    const postsQuery = query(
      collection(firestore, "posts"),
      where("userId", "==", uid)
    );
    const lastCounts: Record<string, number> = {};

    let likesCount = 0;

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
                likesCount++;
                await notifee.displayNotification({
                  id: `like-${postId}-${likerId}`,
                  title: "New Like ❤️",
                  body: `${likerData.name} liked your post!`,
                  android: {
                    channelId: "default",
                    groupId: "likes",
                    pressAction: {
                      id: 'default',
                      launchActivity: 'default',
                    },
                  },
                  data: { postId, type: "like" },
                });

                await notifee.displayNotification({
                  id: "likes-summary",
                  title: "New Likes",
                  body: `You have ${likesCount} new likes!`,
                  android: {
                    channelId: "default",
                    groupId: "likes",
                    groupSummary: true,
                    pressAction: {
                      id: 'default',
                      launchActivity: 'default',
                    },
                  },
                  data: { type: "like_summary" },
                });

                addNotification({
                  id: `${Date.now()}`,
                  title: 'New Like ❤️',
                  body: `${likerData.name} liked your post!`,
                  postId,
                  type: 'like',
                  timestamp: data.createdAt?.toMillis?.() ?? Date.now(),
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
    if (!isPushEnabled) return;

    let commentsCount = 0;

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
                  commentsCount++;
                  await notifee.displayNotification({
                    id: `comment-${comment.postId}-${change.doc.id}`,
                    title: "New Comment 💬",
                    body: `${comment.username || "Someone"}: "${comment.content}"`,
                    android: {
                      channelId: "default",
                      groupId: "comments",
                      pressAction: {
                        id: 'default',
                        launchActivity: 'default',
                      },
                    },
                    data: { postId: comment.postId, type: "comment" },
                  });

                  await notifee.displayNotification({
                    id: "comments-summary",
                    title: "New Comments",
                    body: `You have ${commentsCount} new comments!`,
                    android: {
                      channelId: "default",
                      groupId: "comments",
                      groupSummary: true,
                      pressAction: {
                        id: 'default',
                        launchActivity: 'default',
                      },
                    },
                    data: { type: "comment_summary" },
                  });

                  addNotification({
                    id: `${Date.now()}`,
                    title: 'New Comment 💬',
                    body: `${comment.username || "Someone"}: "${comment.content}"`,
                    postId: comment.postId!,
                    type: 'comment',
                    timestamp: comment.createdAt?.toMillis?.() ?? Date.now(),
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
    if (!isPushEnabled) return;

    const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

    const newPostsQuery = query(
      collection(firestore, "posts"),
      where("createdAt", ">=", twentyFourHoursAgo),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    let newPostsCount = 0;

    const unsubscribe = onSnapshot(newPostsQuery, snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === "added") {
          const post = change.doc.data() as { userId?: string; createdAt?: Timestamp };

          if (!isWithinLast24Hours(post.createdAt)) return;

          if (post.userId && post.userId !== uid) {
            const userDoc = await getDoc(doc(firestore, "users", post.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data() as UserData;
              newPostsCount++;
              await notifee.displayNotification({
                id: `new-post-${change.doc.id}`,
                title: "New Post 📝",
                body: `${userData.name} just posted!`,
                android: {
                  channelId: "default",
                  groupId: "new-posts",
                  pressAction: {
                    id: 'default',
                    launchActivity: 'default',
                  },
                },
                data: { postId: change.doc.id, type: "new_post" },
              });

              await notifee.displayNotification({
                id: "new-posts-summary",
                title: "New Posts",
                body: `You have ${newPostsCount} new posts!`,
                android: {
                  channelId: "default",
                  groupId: "new-posts",
                  groupSummary: true,
                  pressAction: {
                    id: 'default',
                    launchActivity: 'default',
                  },
                },
                data: { type: "new_post_summary" },
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
    <NavigationContainer ref={navigationRef}>
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