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
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
  increment,
  getDoc,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { auth, firestore } from '../../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { User } from '@firebase/auth';
import { Feather, SimpleLineIcons } from '@expo/vector-icons';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { SettingStackParamList } from '../../navigations/SettingStackParamList';

type NavigationProp = DrawerNavigationProp<SettingStackParamList, 'Settings'>;

interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  timestamp?: any;
  likes?: string[];
  commentCount?: number;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  timestamp?: any;
}

interface UserData {
  email?: string;
  name?: string;
  faceId?: boolean;
  profilePicture?: string;
  goals?: string[];
  interests?: string[];
  gender?: string;
  calories?: number;
}

const CommunityScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postIdWithOpenComments, setPostIdWithOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [postContent, setPostContent] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<UserData[]>([]);
  const [userDataMap, setUserDataMap] = useState<Record<string, UserData>>({});
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
        
        // Fetch user data for all unique user IDs in posts
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
        const usersQuery = query(usersCollection, limit(5));
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs.map(
          (doc) => doc.data() as UserData
        );
        setSuggestedUsers(usersData);
      } catch (e) {
        console.error("Error fetching suggested users", e);
      }
    };
    fetchSuggestedUsers();

    return () => {
      unsubscribePosts();
    };
  }, []);

  useEffect(() => {
    if (postIdWithOpenComments) {
      const commentsRef = collection(firestore, 'comments');
      const commentsQuery = query(
        commentsRef,
        where('postId', '==', postIdWithOpenComments),
        orderBy('timestamp', 'desc')
      );

      const unsubscribeComments = onSnapshot(
        commentsQuery,
        (snapshot) => {
          const fetchedComments = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Comment)
          );
          setComments((prev) => ({
            ...prev,
            [postIdWithOpenComments]: fetchedComments,
          }));
        },
        (error) => {
          console.error("Error fetching comments", error);
        }
      );

      return () => unsubscribeComments();
    }
  }, [postIdWithOpenComments]);

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
      Alert.alert('Error', 'Could not like/unlike the post.');
    }
  };

  const handleToggleComments = (postId: string) => {
    setPostIdWithOpenComments((prevId) =>
      prevId === postId ? null : postId
    );
    setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentTexts[postId] || '';
    if (!commentText.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(
          'Authentication Required',
          'You need to be logged in to comment.'
        );
        return;
      }

      const commentsCollectionRef = collection(firestore, 'comments');
      await addDoc(commentsCollectionRef, {
        postId,
        userId: user.uid,
        content: commentText,
        timestamp: serverTimestamp(),
      });

      const postDocRef = doc(firestore, 'posts', postId);
      await updateDoc(postDocRef, {
        commentCount: increment(1),
      });

      setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
    } catch (error: any) {
      console.error('Error adding comment:', error.message);
      Alert.alert('Error', 'Could not add comment.');
    }
  };

  const handleCreateNewPost = async () => {
    if (!postContent.trim()) {
      Alert.alert('Warning', 'Post content cannot be empty.');
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

      const postsCollectionRef = collection(firestore, 'posts');
      await addDoc(postsCollectionRef, {
        userId: user.uid,
        content: postContent,
        timestamp: serverTimestamp(),
        likes: [],
        commentCount: 0,
      });

      setPostContent('');
    } catch (error: any) {
      console.error('Error creating post:', error.message);
      Alert.alert('Error', 'Could not create the post.');
    }
  };

  const renderCommentItem = ({ item }: { item: Comment }) => {
    const userData = userDataMap[item.userId] || { name: 'User' };
    
    return (
      <View style={styles.commentItem}>
        <Text style={styles.commentUserId}>{userData.name}:</Text>
        <Text style={styles.commentContent}>{item.content}</Text>
        <Text style={styles.commentTimestamp}>
          {item.timestamp?.toDate().toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    const userData = userDataMap[item.userId] || { name: 'User', profilePicture: undefined };

    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          {userData.profilePicture ? (
            <Image source={{ uri: userData.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.timestamp}>
              {item.timestamp?.toDate().toLocaleTimeString()}
            </Text>
          </View>
        </View>

        <Text style={styles.content}>{item.content}</Text>
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikePost(item.id)}
          >
            <Feather name="heart" size={20} color="#757575" />
            <Text style={styles.actionText}>
              {item.likes ? item.likes.length : 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleComments(item.id)}
          >
            <SimpleLineIcons name="bubble" size={20} color="#757575" />
            <Text style={styles.actionText}>
              {item.commentCount || 0}
            </Text>
          </TouchableOpacity>
        </View>

        {postIdWithOpenComments === item.id && (
          <View style={styles.commentSection}>
            <FlatList
              data={comments[item.id] || []}
              keyExtractor={(comment) => comment.id}
              renderItem={renderCommentItem}
            />
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentTexts[item.id] || ''}
                onChangeText={(text) =>
                  setCommentTexts((prev) => ({
                    ...prev,
                    [item.id]: text,
                  }))
                }
              />
              <TouchableOpacity
                style={styles.postCommentButton}
                onPress={() => handleAddComment(item.id)}
              >
                <Text style={styles.postCommentButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={styles.headerTitle}>Community</Text>
          <TouchableOpacity 
            style={{paddingVertical: height * 0.03, paddingHorizontal: width * 0.02,}}
            
          >
            <Feather name="inbox" size={24} color="#222" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.suggestedUsersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {suggestedUsers.map((user, index) => (
            <TouchableOpacity key={index} style={styles.suggestedUserItem}>
              {user?.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.suggestedUserAvatar}
                />
              ) : (
                <View style={styles.suggestedUserAvatarPlaceholder} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        contentContainerStyle={styles.postsListContainer}
      />
    </SafeAreaView>
  );
};

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

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
    padding: width * 0.05,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
  },
  drawerContainer: {
    marginTop: (height * 0.006),
    marginLeft: width * 0.007,
  },
  drawerIcon: {
    width: RFValue(30, height),
    height: RFValue(30, height),
  },
  headerTitle: {
    fontSize: RFPercentage(4),
    fontWeight: 'bold',
    marginLeft: width * 0.01,
    marginVertical: height * 0.02,
  },
  suggestedUsersContainer: {
    paddingBottom: 25,
    paddingLeft: 15, // Added padding to align with the start of the list
  },
  suggestedUserItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  suggestedUserAvatar: {
    width: RFValue(65, height), // Slightly smaller avatars
    height: RFValue(65, height),
    borderRadius: 35,
    marginBottom: 5,
  },
  suggestedUserAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEEEEE', // Lighter grey placeholder
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 10,
    textAlign: 'center',
  },
  createPostContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15, // Added horizontal margin
    marginBottom: 10,
    borderRadius: 8,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  input: {
    borderWidth: 0, // Removed border from input
    padding: 10,
    marginBottom: 10,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: '#6200EE', // Primary color from the image
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  postsListContainer: {
    paddingBottom: 20,
  },
  postContainer: {
    backgroundColor: 'white',
    padding: 15,
   
    marginBottom: 10,
    borderRadius: 8,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
    marginRight: 10,
  },
  userInfo: {
    flexDirection: 'column',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#212121',
  },
  timestamp: {
    fontSize: 12,
    color: '#757575',
  },
  content: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1, // Changed to 1:1 aspect ratio to match image
    borderRadius: 8,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8
  },
  actionText: {
    marginLeft: 5,
    color: '#757575',
  },
  commentSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F5F5F5', // Slightly darker background for comments
    borderRadius: 8,
  },
  commentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  commentUserId: {
    fontWeight: 'bold',
    marginRight: 5,
    color: '#212121',
  },
  commentContent: {
    fontSize: 14,
    color: '#424242', // Slightly darker for comment content
  },
  commentTimestamp: {
    fontSize: 10,
    color: '#757575',
    marginLeft: 5,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
  },
  postCommentButton: {
    backgroundColor: '#6200EE',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  postCommentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CommunityScreen;
