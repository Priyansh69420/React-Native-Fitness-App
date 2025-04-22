import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import OnboardingStack from "./OnboardingStack";
import DrawerNavigator from "./DrawerNavigator";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import ReactNativeBiometrics from "react-native-biometrics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../store/slices/userSlice";

// ——— Firestore Notification Listeners ———
// Uses in-memory tracking to detect new likes
const listenToPostLikes = (uid: string) => {
  const postsQuery = query(
    collection(firestore, "posts"),
    where("userId", "==", uid)
  );
  const lastCounts: Record<string, number> = {};

  const unsubscribe = onSnapshot(postsQuery, snapshot => {
    snapshot.docs.forEach(async postDoc => {
      const postId = postDoc.id;
      const likes: string[] = postDoc.data().likes || [];
      const prevCount = lastCounts[postId] || 0;

      if (likes.length > prevCount) {
        // New likers are those added beyond prevCount
        const newLikers = likes.slice(prevCount);
        newLikers.forEach(async likerId => {
          if (likerId !== uid) {
            // Fetch liker data
            const likerDoc = await getDoc(doc(firestore, "users", likerId));
            if (likerDoc.exists()) {
              const likerData = likerDoc.data() as UserData;
              try {
                await notifee.displayNotification({
                  title: "New Like ❤️",
                  body: `${likerData.name} liked your post!`,
                  android: { channelId: "default" },
                  data: { postId, type: "like" },
                });
              } catch (err) {
                console.error('Error displaying like notification:', err);
              }
            }
          }
        });
      }

      lastCounts[postId] = likes.length;
    });
  }, error => console.error('Likes listener error:', error));

  return unsubscribe;
};

// Listens to added comments across all posts, notifies if it's on user's post
const listenToPostComments = (uid: string) => {
  return onSnapshot(
    collectionGroup(firestore, "comments"),
    (snapshot) => {
      console.log("Snapshot received for comments", snapshot.docChanges());
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const comment = change.doc.data() as { userId?: string; text?: string; username?: string };
          const postId = change.doc.ref.parent.parent?.id;
          console.log(
            `Comment data: userId=${comment.userId}, postId=${postId}, text=${comment.text}, username=${comment.username}`
          );

          if (comment.userId && comment.userId !== uid && postId) {
            const postDoc = await getDoc(doc(firestore, "posts", postId));
            if (postDoc.exists()) {
              const postOwnerId = postDoc.data()?.userId;
              console.log(`Post owner ID: ${postOwnerId}, Current user ID: ${uid}`);
              
              // Only notify the post owner if it's not their own comment
              if (postOwnerId === uid) {
                try {
                  const notifId = await notifee.displayNotification({
                    title: "New Comment 💬",
                    body: `${comment.username || "Someone"}: "${comment.text || "New comment"}"`,
                    android: { channelId: "default" },
                    data: { postId: postId, type: "comment" },
                  });
                  console.log("Notification displayed, id:", notifId);
                } catch (err) {
                  console.error("Error displaying notification:", err);
                }
              } else {
                console.log(`Comment is on someone else's post, no notification sent.`);
              }
            } else {
              console.log(`Post document not found for ID: ${postId}`);
            }
          } else {
            console.log(`Skipping comment: userId=${comment.userId}, uid=${uid}, postId=${postId}`);
          }
        }
      });
    },
    (error) => {
      console.error("Error fetching comments:", error);
    }
  );
};

// Listens to new posts globally
const listenToNewPosts = (uid: string) => {
  const newPostsQuery = query(
    collection(firestore, "posts"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const unsubscribe = onSnapshot(newPostsQuery, snapshot => {
    snapshot.docChanges().forEach(async change => {
      if (change.type === "added") {
        const post = change.doc.data() as { userId?: string };
        if (post.userId && post.userId !== uid) {
          const userDoc = await getDoc(doc(firestore, "users", post.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            try {
              await notifee.displayNotification({
                title: "New Post 📝",
                body: `${userData.name} just posted!`,
                android: { channelId: "default" },
                data: { postId: change.doc.id, type: "new_post" },
              });
            } catch (err) {
              console.error('Error displaying post notification:', err);
            }
          }
        }
      }
    });
  }, error => console.error('New posts listener error:', error));

  return unsubscribe;
};

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Authentication & Biometrics
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

  // Notifications setup & listeners
  useEffect(() => {
    if (!user?.uid) return;
    let unsubLikes: () => void;
    let unsubComments: () => void;
    let unsubNewPosts: () => void;

    (async () => {
      const perm = await notifee.requestPermission();
      console.log('Notification permission:', perm);
      const channelId = await notifee.createChannel({ id: 'default', name: 'Default', importance: AndroidImportance.HIGH });
      console.log('Channel created:', channelId);

      unsubLikes = listenToPostLikes(user.uid);
      unsubComments = listenToPostComments(user.uid);
      unsubNewPosts = listenToNewPosts(user.uid);

      notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          const postId = detail.notification?.data?.postId;
          console.log('Foreground press:', postId);
          // navigation.navigate('PostDetail', { postId });
        }
      });

      notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          const postId = detail.notification?.data?.postId;
          console.log('Background press:', postId);
          // handle background navigation
        }
      });
    })();

    return () => {
      unsubLikes && unsubLikes();
      unsubComments && unsubComments();
      unsubNewPosts && unsubNewPosts();
    };
  }, [user?.uid]);

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