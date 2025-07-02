import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, SafeAreaView, Image, StyleSheet, Dimensions, ActivityIndicator, Modal, Animated } from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, getDoc, where, deleteDoc, limit, startAfter, getDocs, startAt, DocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { auth, firestore } from '../../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { User } from '@firebase/auth';
import { Feather, SimpleLineIcons } from '@expo/vector-icons';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { CommunityStackParamList } from '../../navigations/CommunityStackParamList';
import * as ImagePicker from 'expo-image-picker';
import RNFS from 'react-native-fs';
import { supabase } from '../../../supabaseConfig'; 
import { ScrollView, TapGestureHandler } from 'react-native-gesture-handler';
import { Menu, MenuItem } from 'react-native-material-menu';
import { ResizeMode, Video } from 'expo-av';
import InstaStory from 'react-native-insta-story';
import { Post } from './Post';
import { getRealmInstance, useRealm } from '../../../realmConfig';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { UpdateMode } from 'realm';
import { useTheme } from '../../contexts/ThemeContext';

type NavigationProp = DrawerNavigationProp<CommunityStackParamList, 'Community'>;

export interface UserData {
  email?: string;
  name?: string;
  faceId?: boolean;
  profilePicture?: string;
  goals?: string[];
  interests?: string[];
  gender?: string;
  calories?: number;
  stories?: Record<string, { imageUrl: string; timestamp: any }>;
}

interface IUserStoryItem {
  story_id: string; 
  story_image: string;
}

interface IUserStory {
  user_id: string;
  user_name: string;
  user_image?: string;
  stories: IUserStoryItem[];
}

export const getTimeAgo = (timestamp: any) => {
  if (!timestamp) return 'Just now';

  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'Just now';
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userDataMap, setUserDataMap] = useState<Record<string, UserData>>({});
  const [isAddPostModalVisible, setIsAddPostModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null); 
  const [newPostVideo, setNewPostVideo] = useState<string | null>(null); 
  const [uploadingImage, setUploadingImage] = useState(false); 
  const [storiesData, setStoriesData] = useState<any[]>([]);
  const [showHeart, setShowHeart] = useState<boolean>(false);
  const [visiblePostId, setVisiblePostId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true); 
  const [loadingMore, setLoadingMore] = useState(false); 
  const [lastVisibleDoc, setLastVisibleDoc] = useState<DocumentSnapshot | null>(null);
  const [latestFirestorePostTimestamp, setLatestFirestorePostTimestamp] = useState<Date | null>(null);

  const theme = useTheme();
  const isConnected = useNetInfo().isConnected;
  const realm = useRealm()
  const navigation = useNavigation<NavigationProp>();

    const loadOfflinePosts = async () => {
      try {
        const realm = await getRealmInstance();
        const offlinePosts = realm.objects<Post>('Post').sorted('timestamp', true);
        const deepCopiedPosts = offlinePosts.map(p => ({
          id: p.id,
          userId: p.userId,
          content: p.content,
          imageUrl: p.imageUrl,
          timestamp: new Date(p.timestamp),
          likes: [...(p.likes || [])],
        }));
        setPosts(deepCopiedPosts);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error loading posts from Realm:', err);
        setError('Failed to load offline posts');
        setLoading(false);
      }
    };
  
    const handleSnapshot = async (snapshot: QuerySnapshot, isInitialLoad: boolean = true) => {
      try {
        const allPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() ?? new Date(),
        })) as Post[];
  
        if (allPosts.length === 0) {
          if (isInitialLoad) {
            setPosts([]);
          }
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
  
        const newestPostTimestamp = allPosts[0].timestamp instanceof Date
          ? allPosts[0].timestamp
          : allPosts[0].timestamp?.toDate?.() ?? new Date();
  
        const realm = await getRealmInstance();
        const shouldClearRealm = !latestFirestorePostTimestamp || newestPostTimestamp > latestFirestorePostTimestamp;
        setLatestFirestorePostTimestamp(newestPostTimestamp);
  
        if (shouldClearRealm) {
          realm.write(() => {
            const oldPosts = realm.objects<Post>('Post');
            realm.delete(oldPosts);
          });
        }
  
        const userIds = [...new Set(allPosts.map(post => post.userId))];
        const userDataResults = await Promise.all(userIds.map(async userId => {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', userId));
            return userDoc.exists()
              ? [userId, userDoc.data() as UserData]
              : [userId, { name: 'User', profilePicture: undefined }];
          } catch (e) {
            console.warn(`Failed to fetch user data for ${userId}:`, e);
            return [userId, { name: 'User', profilePicture: undefined }];
          }
        }));
  
        const newUserDataMap = Object.fromEntries(userDataResults);
        setUserDataMap(prev => ({ ...prev, ...newUserDataMap }));
        setPosts(prev => isInitialLoad ? allPosts : [...prev.filter(p => !allPosts.some(np => np.id === p.id)), ...allPosts]);
        const top5 = posts.slice(0, 5);
        realm.write(() => {
          top5.forEach((post) => {
            realm.create('Post', {
              ...post,
              timestamp: post.timestamp,
            }, UpdateMode.Modified);
          });
        });

        setLastVisibleDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(allPosts.length === 5);
        setLoading(false);
        setLoadingMore(false);
      } catch (e: any) {
        console.error('❌ Error processing snapshot:', {
          message: e.message,
          code: e.code,
        });
        setError('Failed to process posts data: ' + e.message);
        setLoading(false);
        setLoadingMore(false);
      }
    };
  
  const loadOnlinePosts = () => {
    try {
      const postsCollection = collection(firestore, 'posts');
      const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'), limit(5));
      const unsubscribe = onSnapshot(postsQuery, (snapshot) => handleSnapshot(snapshot, true), (error) => {
        console.error('❌ Error fetching posts:', {
          message: error.message,
          code: error.code,
        });
        setError('Failed to fetch posts: ' + error.message);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err: any) {
      console.error('❌ Error setting up Firestore listener:', {
        message: err.message,
        code: err.code,
      });
      setError('Failed to fetch posts: ' + err.message);
      setLoading(false);
    }
  };

  const loadRemainingPosts = async () => {
    if (!hasMore || loadingMore || !lastVisibleDoc) return;
    try {
      setLoadingMore(true);
      const postsCollection = collection(firestore, 'posts');
      const nextQuery = query(
        postsCollection,
        orderBy('timestamp', 'desc'),
        startAfter(lastVisibleDoc),
        limit(5)
      );
      const snapshot = await getDocs(nextQuery);
      await handleSnapshot(snapshot, false);
    } catch (err: any) {
      console.error('❌ Error loading remaining posts:', {
        message: err.message,
        code: err.code,
      });
      setError('Failed to load remaining posts: ' + err.message);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let unsubscribePosts: (() => void) | null = null;

    const loadPosts = async () => {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        await loadOfflinePosts();
        return;
      }
      unsubscribePosts = loadOnlinePosts() || null;
    };

    loadPosts();

    return () => {
      if (unsubscribePosts) {
        unsubscribePosts();
      }
    };
  }, [isConnected, realm]);


  useEffect(() => {
    const fetchRecentStories = () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const storiesCollection = collection(firestore, 'stories');

      const storiesQuery = query(
        storiesCollection,
        where('timestamp', '>', twentyFourHoursAgo),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        storiesQuery,
        async (snapshot) => {
          try {
            const userIds = extractUserIdsFromSnapshot(snapshot);
            const userDataMap = await fetchUserDataMap(userIds);
            const allStories = buildStoriesData(snapshot, userDataMap);
            setStoriesData(allStories);
          } catch (error) {
            console.error('Error fetching recent stories:', error);
          }
        },
        (error) => {
          console.error('onSnapshot error:', error);
        }
      );

      return unsubscribe;
    };

    const extractUserIdsFromSnapshot = (snapshot: any): Set<string> => {
      const userIds = new Set<string>();
      snapshot.forEach((doc: any) => {
        const storyData = doc.data();
        userIds.add(storyData.userId);
      });
      return userIds;
    };

    const fetchUserDataMap = async (userIds: Set<string>): Promise<Record<string, UserData>> => {
      const userDataPromises = Array.from(userIds).map(fetchUserData);
      const userDataResults = await Promise.all(userDataPromises);

      return userDataResults.reduce((acc, { userId, userData }) => {
        acc[userId] = userData;
        return acc;
      }, {} as Record<string, UserData>);
    };

    const fetchUserData = async (userId: string) => {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      return {
        userId,
        userData: userDoc.exists() ? (userDoc.data() as UserData) : { name: 'User', profilePicture: undefined },
      };
    };

    const buildStoriesData = (snapshot: any, userDataMap: Record<string, UserData>): IUserStory[] => {
      const storiesByUser: Record<string, IUserStory> = {};

      snapshot.forEach((doc: any) => {
        const storyData = doc.data();
        const userId = storyData.userId;
        const userData = userDataMap[userId];

        if (!storiesByUser[userId]) {
          storiesByUser[userId] = {
            user_id: userId,
            user_name: userData.name ?? 'User',
            user_image: userData.profilePicture ?? undefined,
            stories: [],
          };
        }

        storiesByUser[userId].stories.push({
          story_id: doc.id,
          story_image: storyData.imageUrl,
        });
      });

      return Object.values(storiesByUser).filter((userStory) => userStory.stories.length > 0);
    };

    const unsubscribe = fetchRecentStories();
    return () => unsubscribe();
  }, []);

  const uploadMedia = async (
    uri: string,
    mediaType: 'image' | 'video',
    uploadType: 'story' | 'post',
    postData?: { content: string; likes: string[]; commentCount: number }
  ): Promise<string | null> => {
    setUploadingImage(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Required', `You need to be logged in to add a ${uploadType}.`);
        return null;
      }

      const { bucket, fileExtension, filePath, collectionName } = getUploadConfig(uri, mediaType, uploadType);

      const fileArray = await convertToBinary(uri, mediaType);
      if (!fileArray) throw new Error(`Failed to convert ${mediaType} to binary`);

      await uploadToSupabase(bucket, filePath, fileArray, mediaType, fileExtension);

      const publicUrl = await getPublicUrl(bucket, filePath);
      if (!publicUrl) throw new Error(`Failed to retrieve public URL for ${uploadType}`);

      await saveToFirestore(collectionName, user.uid, publicUrl, uploadType, mediaType, postData);

      return publicUrl;
    } catch (error: any) {
      console.error(`Error uploading ${uploadType}:`, error.message);
      Alert.alert('Error', `Failed to upload ${uploadType}.`);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const getUploadConfig = (uri: string, mediaType: string, uploadType: string) => {
    const isStory = uploadType === 'story';
    const bucket = isStory ? 'stories' : 'userposts';
    const subFolder = mediaType === 'video' && !isStory ? 'videos' : '';
    const fileExtension = mediaType === 'image' ? 'jpg' : 'mp4';
    const fileName = uri.split('/').pop() ?? `${uploadType}_${Date.now()}.${fileExtension}`;
    const filePath = subFolder ? `${bucket}/${subFolder}/${fileName}` : `${bucket}/${fileName}`;
    const collectionName = isStory ? 'stories' : 'posts';

    return { bucket, subFolder, fileExtension, filePath, collectionName };
  };

  const convertToBinary = async (uri: string, mediaType: string): Promise<Uint8Array | null> => {
    try {
      const base64Data = await RNFS.readFile(uri, 'base64');
      if (!base64Data) return null;

      const binaryString = atob(base64Data);
      const fileArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileArray[i] = binaryString.charCodeAt(i);
      }
      return fileArray;
    } catch (error: any) {
      console.error(`Error converting ${mediaType} to binary:`, error.message);
      return null;
    }
  };

  const uploadToSupabase = async (
    bucket: string,
    filePath: string,
    fileArray: Uint8Array,
    mediaType: string,
    fileExtension: string
  ) => {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileArray, {
        contentType: `${mediaType}/${fileExtension}`,
        upsert: false,
      });

    if (uploadError) {
      console.error(`Supabase upload error:`, uploadError);
      throw new Error(uploadError.message);
    }
  };

  const getPublicUrl = async (bucket: string, filePath: string): Promise<string | null> => {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return urlData?.publicUrl ?? null;
  };

  const saveToFirestore = async (
    collectionName: string,
    userId: string,
    publicUrl: string,
    uploadType: string,
    mediaType: string,
    postData?: { content: string; likes: string[]; commentCount: number }
  ) => {
    const collectionRef = collection(firestore, collectionName);
    const docData = uploadType === 'story'
      ? {
          userId,
          imageUrl: publicUrl,
          timestamp: serverTimestamp(),
        }
      : {
          userId,
          content: postData?.content ?? '',
          imageUrl: mediaType === 'image' ? publicUrl : null,
          videoUrl: mediaType === 'video' ? publicUrl : null,
          timestamp: serverTimestamp(),
          likes: postData?.likes || [],
          commentCount: postData?.commentCount ?? 0,
        };

    await addDoc(collectionRef, docData);
  };

  const handlePickMedia = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please grant permission to access your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selected = result.assets[0];
        if (selected.type === 'video') {
          setNewPostVideo(selected.uri);
        } else {
          setNewPostImage(selected.uri);
        }
      }
    } catch (error: any) {
      console.error('Error picking media:', error.message);
    }
  };

  const handlePickStoryMedia = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please grant permission to access your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        await uploadMedia(result.assets[0].uri, 'image', 'story');
      }
    } catch (error: any) {
      console.error('Error picking story media:', error.message);
    }
  };

  const handleCreateNewPost = async () => {
    setPostLoading(true);

    if (!newPostContent.trim() && !newPostImage && !newPostVideo) {
      setPostLoading(false);
      return;
    }

    try {
      if (newPostImage) {
        await uploadMedia(newPostImage, 'image', 'post', {
          content: newPostContent,
          likes: [],
          commentCount: 0,
        });
      } else if (newPostVideo) {
        await uploadMedia(newPostVideo, 'video', 'post', {
          content: newPostContent,
          likes: [],
          commentCount: 0,
        });
      } else {
        // If there's no media, just create a text post
        const user = auth.currentUser;
        if (!user) {
          Alert.alert('Authentication Required', 'You need to be logged in to create a post.');
          return;
        }

        const postsCollectionRef = collection(firestore, 'posts');
        await addDoc(postsCollectionRef, {
          userId: user.uid,
          content: newPostContent,
          imageUrl: null,
          videoUrl: null,
          timestamp: serverTimestamp(),
          likes: [],
          commentCount: 0,
        });
      }

      setNewPostContent('');
      setNewPostImage(null);
      setNewPostVideo(null);
      setIsAddPostModalVisible(false);
    } catch (error: any) {
      console.error('Error creating post:', error.message);
    } finally {
      setPostLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    const user: User | null = auth.currentUser;
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'You need to be logged in to like posts.'
      );
      return;
    }

    const postRef = doc(firestore, 'posts', postId);
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;

    const hasLiked = currentPost.likes?.includes(user.uid);
    updateLocalPostLikes(postId, hasLiked ?? false, user.uid);

    try {
      await updateRemotePostLikes(postRef, hasLiked ?? false, user.uid);
    } catch (error: any) {
      console.error('Error liking post:', error.message);
      revertLocalPostLikes(postId, hasLiked ?? false, user.uid);
    }
  };

  const updateLocalPostLikes = (postId: string, hasLiked: boolean, userId: string) => {
    setPosts(prevPosts => prevPosts.map(p => updatePostLikes(p, postId, hasLiked, userId)));
  };

  const updatePostLikes = (post: Post, postId: string, hasLiked: boolean, userId: string): Post => {
    if (post.id !== postId) return post;

    const updatedLikes = hasLiked
      ? post.likes?.filter(uid => uid !== userId)
      : [...(post.likes || []), userId];

    return { ...post, likes: updatedLikes };
  };

  const updateRemotePostLikes = async (postRef: any, hasLiked: boolean, userId: string) => {
    await updateDoc(postRef, {
      likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
    });
  };

  const revertLocalPostLikes = (postId: string, hasLiked: boolean, userId: string) => {
    setPosts(prevPosts => prevPosts.map(p => revertPostLikes(p, postId, hasLiked, userId)));
  };

  const revertPostLikes = (post: Post, postId: string, hasLiked: boolean, userId: string): Post => {
    if (post.id !== postId) return post;

    const updatedLikes = hasLiked
      ? [...(post.likes || []), userId]
      : post.likes?.filter(uid => uid !== userId);

    return { ...post, likes: updatedLikes };
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(firestore, 'posts', postId));
    } catch (error: any) {
      console.error('Error deleting post:', error);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    const userData = userDataMap[item.userId] || { name: 'User', profilePicture: undefined };
    const user = auth.currentUser;
    const isLiked = user ? item.likes?.includes(user.uid) : false;
    const name = userData?.name;
    const profilePic = userData?.profilePicture;

    const handleDoubleTap = (id: string) => {
      handleLikePost(id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 500);
    };

    return (
      <View style={[styles.postContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSecondary }]}>
        <View style={styles.postHeader}>
          <View style={styles.leftSection}>
            {userData.profilePicture ? (
              <TouchableOpacity onPress={() => navigation.navigate('UserInfo', { user: userData })}>
                <Image source={{ uri: userData.profilePicture }} style={styles.avatar} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundTertiary }]} />
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{userData.name}</Text>
              <Text style={[styles.timestamp, { color: theme.textPlaceholder }]}>{getTimeAgo(item.timestamp)}</Text>
            </View>
          </View>

          <View>
            {user?.uid === item.userId && (
              <Menu
                visible={visiblePostId === item.id}
                onRequestClose={() => setVisiblePostId(null)}
                anchor={
                  <TouchableOpacity onPress={() => setVisiblePostId(item.id)}>
                    <SimpleLineIcons name="options-vertical" size={18} color={theme.iconPrimary} />
                  </TouchableOpacity>
                }
              >
                <MenuItem
                  onPress={() => {
                    setVisiblePostId(null);
                    setEditingPost(item);
                    setEditedContent(item.content);
                    setEditModalVisible(true);
                  }}
                >
                  <Text style={{ color: '#000' }}>Edit Post</Text>
                </MenuItem>
                <MenuItem
                  onPress={() => {
                    Alert.alert(
                      'Delete Post',
                      'Are you sure you want to delete this post?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Yes',
                          onPress: () => {
                            handleDeletePost(item.id); 
                          },
                          style: 'destructive',
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                  textStyle={{ color: theme.textError }}
                >
                  Delete Post
                </MenuItem>
              </Menu>
            )}
          </View>
        </View>

        {item.content ? <Text style={[styles.content, { color: theme.textPrimary }]}>{item.content}</Text> : <></>}

        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          {(() => {
            if (item.videoUrl) {
              return (
                <TapGestureHandler
                  numberOfTaps={2}
                  onActivated={() => {
                    handleDoubleTap(item.id); 
                    setShowHeart(true);
                    setTimeout(() => setShowHeart(false), 500);
                  }}
                >
                  <View>
                    <Video
                      source={{ uri: item.videoUrl }}
                      style={styles.postMedia}
                      resizeMode={ResizeMode.COVER}
                      useNativeControls={true}
                      shouldPlay={!isAddPostModalVisible}
                      isLooping={true}
                    />
                    {showHeart && (
                      <Animated.View>
                        <View style={styles.heartOverlay}>
                          <Image
                            source={require('../../assets/likedIcon.png')}
                            style={{ width: 50, height: 50, tintColor: theme.iconSecondary }}
                          />
                        </View>
                      </Animated.View>
                    )}
                  </View>
                </TapGestureHandler>
              );
            } else if (item.imageUrl) {
              return (
                <TapGestureHandler
                  numberOfTaps={2}
                  onActivated={() => {
                    handleDoubleTap(item.id); 
                    setShowHeart(true);
                    setTimeout(() => setShowHeart(false), 500);
                  }}
                >
                  <View>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.postMedia}
                      resizeMode="cover"
                    />
                    {showHeart && (
                      <Animated.View>
                        <View style={styles.heartOverlay}>
                          <Image
                            source={require('../../assets/likedIcon.png')}
                            style={{ width: 50, height: 50, tintColor: theme.iconSecondary }}
                          />
                        </View>
                      </Animated.View>
                    )}
                  </View>
                </TapGestureHandler>
              );
            } else {
              return null;
            }
          })()}
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (likingPostId !== item.id) {
                setLikingPostId(item.id);
                handleLikePost(item.id).finally(() => setLikingPostId(null)); 
                setLikingPostId(null);
              }
            }}
            disabled={likingPostId === item.id}
          >
            <Image
              source={
                isLiked
                  ? require('../../assets/likedIcon.png')
                  : require('../../assets/likeIcon.png')
              }
              style={[styles.likeIcon, !isLiked && { tintColor: theme.iconPrimary }]}
            />
            <Text style={[styles.actionText, { color: theme.textPrimary }]}>
              {item.likes ? item.likes.length : 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Post', { item, name, profilePic })}
          >
            <SimpleLineIcons name="bubble" size={20} color={theme.iconPrimary} />
            <Text style={[styles.actionText, { color: theme.textPrimary }]}>
              {item.commentCount ?? 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.backgroundButtonPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Community</Text>
          <Text style={[{ color: theme.textError }]}>Error loading posts: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={[styles.drawerContainer]}
          onPress={() => navigation.openDrawer()}
        >
          <Image
            source={require('../../assets/drawerIcon.png')}
            style={[styles.drawerIcon, { tintColor: theme.iconPrimary }]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Community</Text>
            <View style={{ flexDirection: 'row', marginTop: height * 0.008 }}>
              <TouchableOpacity onPress={() => {
                  if(!isConnected) {
                    Alert.alert(
                      'No Internet Connection',
                      'You are currently offline. Please connect to the internet to add story.'
                    );
                    return;
                  }

                  handlePickStoryMedia()
                }}
                style={{ paddingVertical: height * 0.03, paddingHorizontal: width * 0.02 }}
              >
                <Feather name="plus-square" size={24} color={theme.iconPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: height * 0.03, paddingHorizontal: width * 0.02 }}
                onPress={() => {
                  if (!isConnected) {
                    Alert.alert(
                      'No Internet Connection',
                      'You are currently offline. Please connect to the internet to add post.'
                    );
                    return;
                  }
                
                  setIsAddPostModalVisible(true);
                }}
              >
                <Feather name="inbox" size={24} color={theme.iconPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.suggestedUsersContainer}>
          <InstaStory
            key={JSON.stringify(storiesData)}
            data={storiesData}
            duration={10}
            avatarSize={RFValue(65 * scaleFactor, height)}
            showAvatarText={false}
            unPressedBorderColor="#7A5FFF"
            pressedBorderColor="#d3d3d3"
            avatarWrapperStyle={{
              alignItems: 'center',
              marginHorizontal: width * 0.009 * scaleFactor,
              paddingHorizontal: 0,
              borderWidth: 38
            }}
          />
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          contentContainerStyle={styles.postsListContainer}
          onEndReached={() => loadRemainingPosts()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={!isConnected || hasMore ? <ActivityIndicator size='large' color='#d3d3d3'  /> : <></>}
        />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddPostModalVisible}
        onRequestClose={() => {
          setIsAddPostModalVisible(!isAddPostModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Create New Post</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.borderPrimary, color: theme.textPrimary}]}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.textPlaceholder}
              multiline
              value={newPostContent}
              onChangeText={setNewPostContent}
            />

            <TouchableOpacity style={[styles.modalImagePlaceholder, { borderColor: theme.borderPrimary}]} onPress={handlePickMedia}>
              {!newPostImage && !newPostVideo ? (
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#757575' }}>Tap to add Media</Text>
                  <SimpleLineIcons name="cloud-upload" size={20} color="#757575" />
                </View>
              ) : null}

              {uploadingImage && <ActivityIndicator size="small" color="#7A5FFF" />}

              {newPostImage && (
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: newPostImage }} style={styles.modalImagePreview} />
                  <TouchableOpacity
                    onPress={() => setNewPostImage(null)}
                    style={styles.closeButton}
                  >
                    <SimpleLineIcons name="close" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              )}

              {newPostVideo && (
                <View style={{ position: 'relative' }}>
                  <Video
                    source={{ uri: newPostVideo }}
                    style={styles.modalImagePreview}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                  />
                  <TouchableOpacity
                    onPress={() => setNewPostVideo(null)}
                    style={styles.closeButton}
                  >
                    <SimpleLineIcons name="close" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, {backgroundColor: 'transparent'}]}
                onPress={() => {
                  setIsAddPostModalVisible(false);
                  setNewPostImage(null);
                  setNewPostVideo(null);
                  setNewPostContent('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#7A5FFF' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPostButton, !(newPostContent || newPostImage || newPostVideo ) ? {backgroundColor: '#d3d3d3'} : null]}
                onPress={handleCreateNewPost}
                disabled={uploadingImage || postLoading || !(newPostContent || newPostImage || newPostVideo )}
              >
                {postLoading ? <ActivityIndicator size='small' color='#d3d3d3' /> : <Text style={styles.modalButtonText}>{uploadingImage ? 'Posting...' : 'Post'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setEditModalVisible(false)}
        style={{}}
      >
        <View style={[styles.modalOverlay]}>
          <View style={[styles.editModalContainer, {backgroundColor: theme.backgroundSecondary, borderColor: theme.borderPrimary}]}>
            <Text style={[styles.editModalTitle, {color: theme.textPrimary}]}>Edit Post</Text>
            <TextInput
              style={[styles.editInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
              value={editedContent}
              onChangeText={setEditedContent}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.modalButtonText, { color: '#a8a8a8', marginRight: 15 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!editedContent.trim()) return;

                  if (editingPost) {
                    await updateDoc(doc(firestore, 'posts', editingPost.id), {
                      content: editedContent.trim(),
                    });
                  }
                  setEditModalVisible(false);
                }}
                disabled={!editedContent.trim()}
              >
                <Text style={[styles.modalButtonText, { color: !editedContent.trim() ? '#a8a8a8' : '#007AFF', marginTop: 0.5 }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');
const scaleFactor = 1.1;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05 * scaleFactor,
    backgroundColor: '#F5F7FA',
  },
  fixedHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04 * scaleFactor,
    paddingVertical: height * 0.02 * scaleFactor,
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04 * scaleFactor,
    marginTop: -height * 0.018 * scaleFactor,
    marginBottom: height * 0.01 * scaleFactor,
  },
  drawerContainer: {
    marginTop: height * 0.006 * scaleFactor,
    marginLeft: width * 0.001 * scaleFactor,
    width: '10%'
  },
  drawerIcon: {
    width: RFValue(30 * scaleFactor, height),
    height: RFValue(30 * scaleFactor, height),
  },
  headerTitle: {
    fontSize: RFPercentage(4 * scaleFactor),
    fontWeight: 'bold',
    marginLeft: width * 0.01 * scaleFactor,
    marginVertical: height * 0.02 * scaleFactor,
  },
  suggestedUsersContainer: {
    paddingBottom: RFValue(25 * scaleFactor, height),
    paddingHorizontal: RFValue(7 * scaleFactor, width),
  },
  title: {
    fontSize: RFPercentage(3.5 * scaleFactor),
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: height * 0.012 * scaleFactor,
    textAlign: 'center',
  },
  createPostContainer: {
    backgroundColor: 'white',
    padding: RFValue(15 * scaleFactor, height),
    marginHorizontal: width * 0.04 * scaleFactor,
    marginBottom: height * 0.012 * scaleFactor,
    borderRadius: RFValue(8 * scaleFactor, height),
    borderColor: '#E0E0E0',
    borderWidth: 1 * scaleFactor,
  },
  input: {
    borderWidth: 1 * scaleFactor,
    borderColor: '#E0E0E0',
    padding: RFValue(10 * scaleFactor, height),
    marginBottom: height * 0.012 * scaleFactor,
    minHeight: RFValue(40 * scaleFactor, height),
    textAlignVertical: 'top',
    fontSize: RFValue(16 * scaleFactor, height),
  },
  postButton: {
    backgroundColor: '#6200EE',
    borderRadius: RFValue(5 * scaleFactor, height),
    paddingVertical: RFValue(10 * scaleFactor, height),
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(16 * scaleFactor),
  },
  postsListContainer: {
    paddingBottom: RFValue(20 * scaleFactor, height),
  },
  postContainer: {
    backgroundColor: 'white',
    paddingHorizontal: width * 0.06 * scaleFactor,
    paddingVertical: height * 0.025 * scaleFactor,
    marginBottom: height * 0.012 * scaleFactor,
    borderRadius: RFValue(8 * scaleFactor, height),
    borderColor: '#E0E0E0',
    borderWidth: 1 * scaleFactor,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.024 * scaleFactor,
    justifyContent: 'space-between'
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },  
  avatar: {
    width: RFValue(50 * scaleFactor, height),
    height: RFValue(50 * scaleFactor, height),
    borderRadius: RFValue(25 * scaleFactor, height),
    marginRight: width * 0.023 * scaleFactor
  },
  avatarPlaceholder: {
    width: RFValue(50 * scaleFactor, height),
    height: RFValue(50 * scaleFactor, height),
    borderRadius: RFValue(25 * scaleFactor, height),
    backgroundColor: '#EEEEEE',
    marginRight: width * 0.023 * scaleFactor,
  },
  userInfo: {
    flexDirection: 'column',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: RFValue(17 * scaleFactor, height),
    color: '#212121',
  },
  timestamp: {
    fontSize: RFValue(12 * scaleFactor, height),
    color: '#757575',
  },
  content: {
    fontSize: RFValue(17 * scaleFactor, height),
    color: '#212121',
    lineHeight: RFValue(20 * scaleFactor, height),
    marginBottom: height * 0.027 * scaleFactor,
  },
  postMedia: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: RFValue(10 * scaleFactor, height),
    maxHeight: height * 0.31 * scaleFactor,
  },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -160,
    zIndex: 10,
  },
  postActions: {
    flexDirection: 'row',
    paddingVertical: height * 0.024 * scaleFactor,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: width * 0.03 * scaleFactor,
    paddingLeft: width * 0.009 * scaleFactor,
  },
  likeIcon: {
    width: RFValue(20 * scaleFactor, height),
    height: RFValue(20 * scaleFactor, height),
  },
  actionText: {
    marginLeft: width * 0.012 * scaleFactor,
    fontSize: RFValue(14 * scaleFactor, height),
    fontWeight: 'bold',
    color: '#000'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: RFValue(10 * scaleFactor, height),
    padding: RFValue(20 * scaleFactor, height),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  modalTitle: {
    fontSize: RFPercentage(3 * scaleFactor),
    fontWeight: 'bold',
    marginBottom: height * 0.02 * scaleFactor,
    color: '#212121',
  },
  modalInput: {
    borderWidth: 1 * scaleFactor,
    borderColor: '#E0E0E0',
    borderRadius: RFValue(8 * scaleFactor, height),
    padding: RFValue(10 * scaleFactor, height),
    marginBottom: height * 0.02 * scaleFactor,
    width: '100%',
    minHeight: height * 0.1 * scaleFactor,
    textAlignVertical: 'top',
    fontSize: RFValue(16 * scaleFactor, height),
  },
  modalImagePlaceholder: {
    borderWidth: 1 * scaleFactor,
    borderColor: '#E0E0E0',
    borderRadius: RFValue(8 * scaleFactor, height),
    padding: RFValue(15 * scaleFactor, height),
    marginBottom: height * 0.02 * scaleFactor,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImagePreview: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: RFValue(8 * scaleFactor, height),
    resizeMode: 'cover',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    borderRadius: RFValue(8 * scaleFactor, height),
    paddingVertical: RFValue(10 * scaleFactor, height),
    paddingHorizontal: RFValue(15 * scaleFactor, height),
    alignItems: 'center',
    flex: 1,
    marginHorizontal: width * 0.01 * scaleFactor,
  },
  modalCancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#7A5FFF',
  },
  modalPostButton: {
    backgroundColor: '#7A5FFF',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(16 * scaleFactor),
  },
  storyModalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  suggestedUserAvatarContainer: {
    width: RFValue(70 * scaleFactor, height),
    height: RFValue(70 * scaleFactor, height),
    borderRadius: RFValue(40 * scaleFactor, height),
    marginBottom: height * 0.006 * scaleFactor,
    borderWidth: 2 * scaleFactor,
    borderColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  editModalContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    borderColor: '#d3d3d3',
    borderWidth: 1
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  editInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewMedia: {
    width: '90%',
    height: 300,
    borderRadius: 12,
  },
  previewButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  cancelText: {
    color: 'red',
    fontSize: 16,
  },
  uploadText: {
    color: 'blue',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    backgroundColor: "#ededed",
    top: 6,
    right: -8,
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  
});

export default Community;