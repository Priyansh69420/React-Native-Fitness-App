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
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, getDoc, where, limit, getDocs } from 'firebase/firestore';
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

type NavigationProp = DrawerNavigationProp<CommunityStackParamList, 'Community'>;

export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
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
  stories?: {imageUrl: string; timestamp: any}[];
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
  const [error, setError] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<UserData[]>([]);
  const [userDataMap, setUserDataMap] = useState<Record<string, UserData>>({});
  const [isAddPostModalVisible, setIsAddPostModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null); 
  const [uploadingImage, setUploadingImage] = useState(false); 
  const [currentStoryUrl, setCurrentStoryUrl] = useState<string>('');
  const [isStoryModalVisible, setIsStoryModalVisible] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();

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
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
        const updatedSuggestedUsers = snapshot.docs.map((doc) => {
          const user = doc.data() as UserData;
  
          if (user?.stories) {
            const filteredStories = Object.values(user.stories).filter((story: any) => { // Iterate over object values
              if (!story) {
                console.warn('Story object is null or undefined');
                return false;
              }
  
              try {
                if (story.timestamp?.toDate) {
                  return story.timestamp.toDate() > twentyFourHoursAgo;
                } else {
                  console.warn('Invalid timestamp format:', story.timestamp);
                  return false;
                }
              } catch (e) {
                console.error('Error processing story timestamp:', e);
                return false;
              }
            });
  
            return { ...user, stories: filteredStories };
          }
          return user;
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

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please grant permission to access your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3], 
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setNewPostImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error.message);
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

  const uploadImageForStory = async (uri: string): Promise<string | null> => {
    try {
      const fileName = uri.split('/').pop() || `post_${Date.now()}.jpg`;
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

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image to Supabase:', error.message);
      return null;
    } 
  };

  const handleCreateNewPostWithImage = async () => {
    if (!newPostContent.trim() && !newPostImage) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(
          'Authentication Required',
          'You need to be logged in to create a post.'
        );
        return;
      }

      let imageUrl: string | null = null;
      if (newPostImage) {
        imageUrl = await uploadImageForPosts(newPostImage);
        if (!imageUrl) {
          return; 
        }
      }

      const postsCollectionRef = collection(firestore, 'posts');
      await addDoc(postsCollectionRef, {
        userId: user.uid,
        content: newPostContent,
        imageUrl: imageUrl,
        timestamp: serverTimestamp(),
        likes: [],
        commentCount: 0,
      });

      setNewPostContent('');
      setNewPostImage(null);
      setIsAddPostModalVisible(false);

    } catch (error: any) {
      console.error('Error creating post:', error.message);
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

  const handleAddStory = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Denied',
          'Please grant permission to access your photo library.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16], 
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const imageUrl = await uploadImageForStory(result.assets[0].uri);
        if (imageUrl && auth.currentUser) {
          const userRef = doc(firestore, 'users', auth.currentUser.uid);
          const timestamp = serverTimestamp(); 
 
          const userSnap = await getDoc(userRef);
          const existingStories = userSnap.data()?.stories || [];
 
          const newStoryId = Date.now().toString(); 
          await updateDoc(userRef, {
            stories: {
              ...existingStories, 
              [newStoryId]: { imageUrl, timestamp: serverTimestamp() }
            }
          });           
          Alert.alert("Story Added", "Your story has been posted!");
        } else {
          Alert.alert("Error", "Failed to add story.");
        }
      }
    } catch (error: any) {
      console.error("Error adding story:", error.message);
      Alert.alert("Error", "Could not add story.");
    }
  };

  const handleStoryPress = async (userEmail: string) => {
    try {
      const usersCollection = collection(firestore, 'users');
      const q = query(usersCollection, where('email', '==', userEmail), limit(1));
      const snapshot = await getDocs(q);
 
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data() as UserData;
 
        if (!userData.stories || Object.keys(userData.stories).length === 0) { 
          return;
        }
 
        const recentStories = Object.values(userData.stories).filter((story: any) => {
          if (!story) {
            return false;
          }
          if (!story.timestamp) {
            console.warn('Story timestamp is null or undefined:', story);
            return false;
          }
          if (typeof story.timestamp?.toDate !== 'function') {
            console.warn('Story timestamp is not a valid Timestamp:', story);
            return false;
          }
          try {
            const storyTimestamp = story.timestamp.toDate().getTime();
            const isRecent = Date.now() - storyTimestamp < 24 * 60 * 60 * 1000;
            return isRecent;
          } catch (e) {
            console.error('Error processing timestamp:', e);
            return false;
          }
        });
  
        if (recentStories && recentStories.length > 0) {
          const latestStory = recentStories.reduce((latest: any, current: any) => {
            if (!latest || !latest.timestamp || !latest.timestamp.toDate) return current;
            if (!current || !current.timestamp || !current.timestamp.toDate) return latest;
            try {
              const latestTime = latest.timestamp.toDate().getTime();
              const currentTime = current.timestamp.toDate().getTime();
              return latestTime > currentTime ? latest : current;
            } catch (e) {
              console.error('Error comparing timestamps:', e);
              return latest;
            }
          });
 
          setCurrentStoryUrl(latestStory.imageUrl);
          setIsStoryModalVisible(true);
        } 
      } else {
        console.warn("Could not find user with email:", userEmail);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    const userData = userDataMap[item.userId] || { name: 'User', profilePicture: undefined };
    const user = auth.currentUser;
    const isLiked = user ? item.likes?.includes(user.uid) : false;
    const name = userData?.name;
    const profilePic = userData?.profilePicture;

    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          {userData.profilePicture ? (
            <TouchableOpacity onPress={() => navigation.navigate('UserInfo', {user: userData})}>
              <Image source={{ uri: userData.profilePicture }} style={styles.avatar} />
            </TouchableOpacity>
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.timestamp}>
              {getTimeAgo(item.timestamp)}
            </Text>
          </View>
        </View>

        <Text style={styles.content}>{item.content}</Text>

        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikePost(item.id)}
          >
            <Image
              source={isLiked ? require('../../assets/likedIcon.png') : require('../../assets/likeIcon.png')}
              style={[styles.likeIcon]}
            />
            <Text style={styles.actionText}>
              {item.likes ? item.likes.length : 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Post', { item, name, profilePic })}
          >
            <SimpleLineIcons name="bubble" size={20} color='#d3d3d3' />
            <Text style={styles.actionText}>
              {item.commentCount || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStoryView = () => {
    if (!currentStoryUrl) return null;
 
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isStoryModalVisible}
        onRequestClose={() => setIsStoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.storyModalContainer}
          onPress={() => setIsStoryModalVisible(false)}
        >
          <Image
            source={{ uri: currentStoryUrl }}
            style={styles.storyImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderSuggestedUserItem = (user: UserData): React.ReactNode => {
    const hasRecentStory =
      user.stories &&
      user.stories.some((story) => {
        if (!story) return false;
        if (!story.timestamp) return false;
        if (typeof story.timestamp?.toDate !== 'function') return false;
        try {
          return (
            Date.now() - story.timestamp.toDate().getTime() < 24 * 60 * 60 * 1000
          );
        } catch (e) {
          console.error('Error processing timestamp in suggested user:', e);
          return false;
        }
      });
   
    return (
      <TouchableOpacity
        key={user.email}  
        style={styles.suggestedUserItem}
        onPress={() => handleStoryPress(user.email!)}
      >
        <View
          style={[
            styles.suggestedUserAvatarContainer,
            hasRecentStory && {borderWidth: 2, borderColor: '#7A5FFF'},
          ]}
        >
          {user?.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={styles.suggestedUserAvatar}
            />
          ) : (
            <View style={styles.suggestedUserAvatarPlaceholder} />
          )}
        </View>
      </TouchableOpacity>
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
            <TouchableOpacity onPress={handleAddStory} style={{ paddingVertical: height * 0.03, paddingHorizontal: width * 0.02 }}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {suggestedUsers.map(renderSuggestedUserItem)}
        </ScrollView>
      </View>

      {renderStoryView()}

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

            <TouchableOpacity style={styles.modalImagePlaceholder} onPress={handlePickImage}>
              <Text style={{ color: '#757575' }}>Tap to add image</Text>
              {uploadingImage && <ActivityIndicator size="small" color="#7A5FFF" />}
              {newPostImage && <Image source={{ uri: newPostImage }} style={styles.modalImagePreview} />}
            </TouchableOpacity>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setIsAddPostModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPostButton]}
                onPress={handleCreateNewPostWithImage}
                disabled={uploadingImage}
              >
                <Text style={styles.modalButtonText}>{uploadingImage ? 'Posting...' : 'Post'}</Text>
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
    marginLeft: width * 0.007 * scaleFactor,
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
  suggestedUserItem: {
    alignItems: 'center',
    marginHorizontal: width * 0.02 * scaleFactor,
  },
  suggestedUserAvatar: {
    width: RFValue(66 * scaleFactor, height),
    height: RFValue(66 * scaleFactor, height),
    borderRadius: RFValue(35 * scaleFactor, height),
    marginBottom: height * 0.006 * scaleFactor,
  },
  suggestedUserAvatarPlaceholder: {
    width: RFValue(50 * scaleFactor, height),
    height: RFValue(50 * scaleFactor, height),
    borderRadius: RFValue(25 * scaleFactor, height),
    backgroundColor: '#EEEEEE',
    marginBottom: height * 0.006 * scaleFactor,
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
  postImage: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: RFValue(10 * scaleFactor, height),
    maxHeight: height * 0.31 * scaleFactor,
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
});

export default Community;
