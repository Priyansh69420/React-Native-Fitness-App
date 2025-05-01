import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, getDoc, where, limit, getDocs, deleteDoc } from 'firebase/firestore';
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
import { TapGestureHandler } from 'react-native-gesture-handler';
import { Menu, MenuItem } from 'react-native-material-menu';
import { ResizeMode, Video } from 'expo-av';
import InstaStory, { IUserStory, IUserStoryItem } from 'react-native-insta-story';

type NavigationProp = DrawerNavigationProp<CommunityStackParamList, 'Community'>;

export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp?: any;
  likes?: string[];
  commentCount?: number;
}

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

const getTimeAgo = (timestamp: any) => {
  if (!timestamp) return 'Just now';

  const date = timestamp.toDate();
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
  const [suggestedUsers, setSuggestedUsers] = useState<UserData[]>([]);
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
  const [newStoryImage, setNewStoryImage] = useState<string | null>(null);

  const navigation = useNavigation<NavigationProp>();setNewPostVideo

  useEffect(() => {
    const postsCollection = collection(firestore, 'posts');
    const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));

    const unsubscribePosts = onSnapshot(
      postsQuery,
      async (snapshot) => {
        const allPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

        const userIds = [...new Set(allPosts.map(post => post.userId))];
        const userDataPromises = userIds.map(userId =>
          getDoc(doc(firestore, 'users', userId)).then(doc =>
            doc.exists() ? doc.data() as UserData : {
              name: 'User',
              profilePicture: undefined
            }
          )
        );

        const userDataResults = await Promise.all(userDataPromises);
        const newUserDataMap = userIds.reduce((acc, id, index) => {
          acc[id] = userDataResults[index];
          return acc;
        }, {} as Record<string, UserData>);

        setUserDataMap(newUserDataMap);
        setPosts(allPosts);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching posts:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    const fetchSuggestedUsers = async () => {
      try {
        const usersCollection = collection(firestore, 'users');
        const usersQuery = query(usersCollection, limit(20));
        const snapshot = await getDocs(usersQuery);
    
        const updatedSuggestedUsers = snapshot.docs.map((doc) => {
          return doc.data() as UserData;
        });
    
        setSuggestedUsers(updatedSuggestedUsers);
      } catch (e) {
        console.error('Error fetching suggested users', e);
      }
    };
    fetchSuggestedUsers();

    return () => {
      unsubscribePosts();
    };
  }, []);

  useEffect(() => {
    const fetchRecentStories = async () => {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const usersCollection = collection(firestore, 'users');
        const snapshot = await getDocs(usersCollection);
        const allStories: IUserStory[] = []; 
  
        for (const userDoc of snapshot.docs) {
          const userData = userDoc.data() as UserData;
          if (userData?.stories) {
            const userStoryItems: IUserStoryItem[] = []; 
            let storyIdCounter = 0; 
  
            for (const storyKey in userData.stories) {
              const story = userData.stories[storyKey];
              if (story?.timestamp?.toDate() > twentyFourHoursAgo && story?.imageUrl) {
                userStoryItems.push({
                  story_id: storyIdCounter++, 
                  story_image: story.imageUrl,
                });
              }
            }
  
            if (userStoryItems.length > 0) {
              allStories.push({
                user_id: userDoc.id as any, 
                user_name: userData.name || 'User',
                user_image: userData.profilePicture,
                stories: userStoryItems,
              });
            }
          }
        }
        setStoriesData(allStories);
      } catch (error) {
        console.error('Error fetching recent stories:', error);
      }
    };
  
    fetchRecentStories();
  }, []);

  const handlePickMedia = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please grant permission to access your media library.');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,  
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: true,
        aspect: [9, 16], 
        quality: 0.7,
      });
  
      if (!result.canceled && result.assets.length > 0) {
        setNewStoryImage(result.assets[0].uri);
        handleUploadNewStory(result.assets[0].uri); 
      }
    } catch (error: any) {
      console.error('Error picking story media:', error.message);
    }
  };
  
  const handleUploadNewStory = async (uri: string) => {
    setUploadingImage(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Required', 'You need to be logged in to add a story.');
        return;
      }
  
      const fileName = uri.split('/').pop() || `story_${Date.now()}.jpg`;
      const fileType = uri.split('.').pop() || 'jpeg';
      const filePath = `stories/${fileName}`; 
  
      const base64Image = await RNFS.readFile(uri, 'base64');
  
      if (!base64Image) {
        throw new Error('Failed to convert image to Base64');
      }
  
      const binaryString = atob(base64Image);
      const fileArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileArray[i] = binaryString.charCodeAt(i);
      }
  
      const { data, error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, fileArray, {
          contentType: `image/${fileType}`,
          upsert: false,
        });
  
      if (uploadError) {
        throw new Error(uploadError.message);
      }
  
      const { data: urlData } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);
  
      if (!urlData?.publicUrl) {
        throw new Error('Failed to retrieve public URL');
      }
  
      const userRef = doc(firestore, 'users', user.uid);
      const timestamp = serverTimestamp();
      await updateDoc(userRef, {
        [`stories.${Date.now()}`]: { imageUrl: urlData.publicUrl, timestamp }, 
      });
  
      setNewStoryImage(null); 
    } catch (error: any) {
      console.error('Error uploading story:', error.message);
      Alert.alert('Error', 'Failed to upload story.');
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadImageForPosts = async (uri: string): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const fileName = uri.split('/').pop() || `post_${Date.now()}.jpg`;
      const fileType = uri.split('.').pop() || 'jpeg';
      const filePath = `userposts/${fileName}`;

      const base64Image = await RNFS.readFile(uri, 'base64');

      if (!base64Image) {
        throw new Error('Failed to convert image to Base64');
      }

      const binaryString = atob(base64Image);
      const fileArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileArray[i] = binaryString.charCodeAt(i);
      }

      const { data, error: uploadError } = await supabase.storage
        .from('userposts')
        .upload(filePath, fileArray, {
          contentType: `image/${fileType}`,
          upsert: false, 
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('userposts')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to retrieve public URL');
      }

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image to Supabase:', error.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadVideoForPosts = async (uri: string): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const fileName = uri.split('/').pop() || `post_${Date.now()}.mp4`;
      const fileType = uri.split('.').pop() || 'mp4';
      const filePath = `userposts/videos/${fileName}`;
  
      const base64Data = await RNFS.readFile(uri, 'base64');
      if (!base64Data) throw new Error('Failed to convert video to Base64');
  
      const binaryString = atob(base64Data);
      const fileArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileArray[i] = binaryString.charCodeAt(i);
      }
  
      const { error: uploadError } = await supabase
        .storage
        .from('userposts')
        .upload(filePath, fileArray, {
          contentType: `video/${fileType}`,
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);
  
      const { data: urlData } = supabase
        .storage
        .from('userposts')
        .getPublicUrl(filePath);
      if (!urlData?.publicUrl) throw new Error('Failed to retrieve public URL');
  
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Error uploading video to Supabase:', err.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateNewPost = async () => {
    setPostLoading(true);
  
    if (!newPostContent.trim() && !newPostImage && !newPostVideo) {
      setPostLoading(false);
      return;
    }
  
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Required', 'You need to be logged in to create a post.');
        return;
      }
  
      let imageUrl: string | null = null;
      let videoUrl: string | null = null;
  
      if (newPostImage) {
        imageUrl = await uploadImageForPosts(newPostImage);
        if (!imageUrl) return;
      }
  
      if (newPostVideo) {
        videoUrl = await uploadVideoForPosts(newPostVideo);
        if (!videoUrl) return;
      }
  
      const postsCollectionRef = collection(firestore, 'posts');
      await addDoc(postsCollectionRef, {
        userId: user.uid,
        content: newPostContent,
        imageUrl,  
        videoUrl,   
        timestamp: serverTimestamp(),
        likes: [],
        commentCount: 0,
      });
  
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
    try {
      const user: User | null = auth.currentUser;
      if (!user) {
        Alert.alert(
          'Authentication Required',
          'You need to be logged in to like posts.'
        );
        return;
      }

      const postRef = doc(firestore, 'posts', postId);
      const postSnapshot = await getDoc(postRef);
      const postData = postSnapshot.data() as Post | undefined;

      const hasLiked = postData?.likes?.includes(user.uid);

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: hasLiked
                  ? p.likes?.filter((uid) => uid !== user.uid)
                  : [...(p.likes || []), user.uid],
              }
            : p
        )
      );

      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (error: any) {
      console.error('Error liking post:', error.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(firestore, 'posts', postId));
    } catch (error: any) {
      console.error('Error deleting post:', error);
    }
  }

  const renderPostItem = ({ item }: { item: Post }) => {
    const userData = userDataMap[item.userId] || { name: 'User', profilePicture: undefined };
    const user = auth.currentUser;
    const isLiked = user ? item.likes?.includes(user.uid) : false;
    const name = userData?.name;
    const profilePic = userData?.profilePicture;
  
    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <View style={styles.leftSection}>
            {userData.profilePicture ? (
              <TouchableOpacity onPress={() => navigation.navigate('UserInfo', { user: userData })}>
                <Image source={{ uri: userData.profilePicture }} style={styles.avatar} />
              </TouchableOpacity>
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.timestamp}>{getTimeAgo(item.timestamp)}</Text>
            </View>
          </View>
  
          <View>
            {user?.uid === item.userId && (
              <Menu
                visible={visiblePostId === item.id}
                onRequestClose={() => setVisiblePostId(null)}
                anchor={
                  <TouchableOpacity onPress={() => setVisiblePostId(item.id)}>
                    <SimpleLineIcons name="options-vertical" size={18} color="#555" />
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
                  Edit Post
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
                          onPress: () => handleDeletePost(item.id),
                          style: 'destructive',
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                  textStyle={{ color: 'red' }}
                >
                  Delete Post
                </MenuItem>
              </Menu>
            )}
          </View>
        </View>
  
        <Text style={styles.content}>{item.content}</Text>
  
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          {item.videoUrl ? (
            <TapGestureHandler
            numberOfTaps={2}
            onActivated={() => {
              handleLikePost(item.id);
              setShowHeart(true);
              setTimeout(() => setShowHeart(false), 600);
            }}
          >
            <View>
              <Video
                source={{ uri: item.videoUrl }}
                style={styles.postMedia}              
                resizeMode={ResizeMode.COVER}         
                useNativeControls={true}                 
                shouldPlay={true}                    
                isLooping={false}      
              />
              {showHeart && (
                <Animated.View>
                  <View style={styles.heartOverlay}>
                    <Image
                      source={require('../../assets/likedIcon.png')}
                      style={{ width: 50, height: 50, tintColor: 'white' }}
                    />
                  </View>
                </Animated.View>
              )}
            </View>
          </TapGestureHandler>
          ) : item.imageUrl ? (
            <TapGestureHandler
              numberOfTaps={2}
              onActivated={() => {
                handleLikePost(item.id);
                setShowHeart(true);
                setTimeout(() => setShowHeart(false), 600);
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
                        style={{ width: 50, height: 50, tintColor: 'white' }}
                      />
                    </View>
                  </Animated.View>
                )}
              </View>
            </TapGestureHandler>
          ) : null}
        </View>
  
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikePost(item.id)}
          >
            <Image
              source={
                isLiked
                  ? require('../../assets/likedIcon.png')
                  : require('../../assets/likeIcon.png')
              }
              style={styles.likeIcon}
            />
            <Text style={styles.actionText}>
              {item.likes ? item.likes.length : 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Post', { item, name, profilePic })}
          >
            <SimpleLineIcons name="bubble" size={20} color="#d3d3d3" />
            <Text style={styles.actionText}>
              {item.commentCount || 0}
            </Text>
          </TouchableOpacity>
        </View>
  
        <Modal
          visible={editModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModalContainer}>
              <Text style={styles.editModalTitle}>Edit Post</Text>
              <TextInput
                style={styles.editInput}
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
                    if (editingPost) {
                      await updateDoc(doc(firestore, 'posts', editingPost.id), {
                        content: editedContent.trim(),
                      });
                    }
                    setEditModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: 'blue', marginTop: 0.5 }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A5FFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Community</Text>
          <Text>Error loading posts: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.drawerContainer}
          onPress={() => navigation.openDrawer()}
        >
          <Image
            source={require('../../assets/drawerIcon.png')}
            style={styles.drawerIcon}
          />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Community</Text>
          <View style={{ flexDirection: 'row', marginTop: height * 0.008 }}>
            <TouchableOpacity onPress={handlePickStoryMedia} style={{ paddingVertical: height * 0.03, paddingHorizontal: width * 0.02 }}>
              <Feather name="plus-square" size={24} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: height * 0.03, paddingHorizontal: width * 0.02 }}
              onPress={() => setIsAddPostModalVisible(true)}
            >
              <Feather name="inbox" size={24} color="#222" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.suggestedUsersContainer}>
        <InstaStory
          data={storiesData}
          duration={10}
          avatarSize={RFValue(65 * scaleFactor, height)} 
          avatarTextStyle={{
            fontSize: RFValue(0 * scaleFactor, height), 
          }}
          unPressedBorderColor="#EEEEEE"
          pressedBorderColor="#7A5FFF"
          avatarWrapperStyle={{
            alignItems: 'center',
            marginHorizontal: width * 0.009 * scaleFactor, 
            paddingHorizontal: 0,
          }}
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        contentContainerStyle={styles.postsListContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddPostModalVisible}
        onRequestClose={() => {
          setIsAddPostModalVisible(!isAddPostModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Create New Post</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="What's on your mind?"
              multiline
              value={newPostContent}
              onChangeText={setNewPostContent}
            />

            <TouchableOpacity style={styles.modalImagePlaceholder} onPress={handlePickMedia}>
              <Text style={{ color: '#757575' }}>Tap to add image</Text>
              {uploadingImage && <ActivityIndicator size="small" color="#7A5FFF" />}
              {newPostImage && <Image source={{ uri: newPostImage }} style={styles.modalImagePreview} />}
            </TouchableOpacity>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setIsAddPostModalVisible(false)
                  setNewPostImage(null)
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPostButton]}
                onPress={handleCreateNewPost}
                disabled={uploadingImage}
              >
                {postLoading ? <ActivityIndicator size='small' color='#d3d3d3' /> : <Text style={styles.modalButtonText}>{uploadingImage ? 'Posting...' : 'Post'}</Text>}
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
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04 * scaleFactor,
    paddingVertical: height * 0.02 * scaleFactor,
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
    paddingLeft: width * 0.009 * scaleFactor
  },
  likeIcon: {
    width: RFValue(20 * scaleFactor, height),
    height: RFValue(20 * scaleFactor, height),
  },
  actionText: {
    marginLeft: width * 0.012 * scaleFactor,
    fontSize: RFValue(14 * scaleFactor, height),
    fontWeight: 'bold',
    color: '#d3d3d3'
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
    backgroundColor: '#d3d3d3',
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
    marginHorizontal: 15
  },
  editModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
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
});

export default Community;