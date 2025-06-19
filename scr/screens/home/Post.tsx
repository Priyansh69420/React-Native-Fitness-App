import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, Alert, TextInput, FlatList, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PostScreenRouteProp } from '../../navigations/CommunityStack';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, increment, getDoc, where } from 'firebase/firestore';
import { auth, firestore } from '../../../firebaseConfig';
import { SimpleLineIcons } from '@expo/vector-icons';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { CommunityStackParamList } from '../../navigations/CommunityStackParamList';
import { ResizeMode, Video } from 'expo-av';
import { getTimeAgo } from './Community';

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

interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  timestamp?: any;
}

interface UserData {
  name?: string;
  profilePicture?: string;
}

export default function Post() {
  const route = useRoute<PostScreenRouteProp>();
  const initialItem = route.params?.item || {} as Post;
  const { name, profilePic } = route.params;
  const [post, setPost] = useState<Post>(initialItem);
    const [loading, setLoading] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [userDataMap, setUserDataMap] = useState<Record<string, UserData>>({});
  const [loadingAuthor, setLoadingAuthor] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const user = auth.currentUser;
  const isLiked = user ? post.likes?.includes(user.uid) : false;
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchPostAuthorData = async () => {
      setLoadingAuthor(true);
      try {
        const userDoc = await getDoc(doc(firestore, 'users', post.userId));
        if (userDoc.exists()) {
          setUserDataMap((prevMap) => ({ ...prevMap, [post.userId]: userDoc.data() as UserData }));
        } else {
          setUserDataMap((prevMap) => ({ ...prevMap, [post.userId]: { name: 'User', profilePicture: undefined } }));
        }
      } catch (error) {
        console.error('Error fetching post author data:', error);
      } finally {
        setLoadingAuthor(false);
      }
    };

    fetchPostAuthorData();
  }, [post.userId]);

  useEffect(() => {
    setLoadingComments(true);
    const commentsRef = collection(firestore, 'comments');
    const commentsQuery = query(
      commentsRef,
      where('postId', '==', post.id),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeComments = onSnapshot(
      commentsQuery,
      async (snapshot) => {
        try {
          const fetchedComments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Comment[];

          const commenterIds = [...new Set(fetchedComments.map((comment) => comment.userId))];
          const newUserDataMap = await fetchCommenterData(commenterIds);

          setUserDataMap((prevMap) => ({ ...prevMap, ...newUserDataMap }));
          setComments(fetchedComments);
        } catch (error) {
          console.error('Error processing comments:', error);
        } finally {
          setLoadingComments(false);
        }
      },
      (error) => {
        console.error('Error fetching comments', error);
        setLoadingComments(false);
      }
    );

    return () => unsubscribeComments();
  }, [post.id]);

  const fetchCommenterData = async (commenterIds: string[]) => {
    const commenterDataPromises = commenterIds.map((userId) =>
      getDoc(doc(firestore, 'users', userId)).then((doc) =>
        doc.exists() ? (doc.data() as UserData) : { name: 'User' }
      )
    );
    const commenterDataResults = await Promise.all(commenterDataPromises);
    return commenterIds.reduce((acc, id, index) => {
      acc[id] = commenterDataResults[index];
      return acc;
    }, {} as Record<string, UserData>);
  };

  const handleLikePost = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'You need to be logged in to like posts.');
      return;
    }
  
    const postRef = doc(firestore, 'posts', post.id);
    const hasLiked = post.likes?.includes(user.uid);
  
    setPost((prevPost) => ({
      ...prevPost,
      likes: hasLiked
        ? prevPost.likes?.filter((uid) => uid !== user.uid)
        : [...(prevPost.likes || []), user.uid],
    }));
  
    try {
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (error: any) {
      console.error('Error liking post:', error.message);
  
      setPost((prevPost) => ({
        ...prevPost,
        likes: hasLiked
          ? [...(prevPost.likes || []), user.uid]
          : prevPost.likes?.filter((uid) => uid !== user.uid),
      }));
    }
  };
  

  const handleAddComment = async () => {
    setLoading(true);
    if (!commentText.trim()) {
      setLoading(false);
      return;
    }
  
    if (!user) {
      Alert.alert('Authentication Required', 'You need to be logged in to comment.');
      return;
    }
  
    try {
      const commentsCollectionRef = collection(firestore, 'comments');
  
      setPost(prevPost => ({
        ...prevPost,
        commentCount: (prevPost.commentCount ?? 0) + 1,
      }));
  
      await addDoc(commentsCollectionRef, {
        postId: post.id,
        userId: user.uid,
        content: commentText,
        timestamp: serverTimestamp(),
      });
  
      const postDocRef = doc(firestore, 'posts', post.id);
      await updateDoc(postDocRef, {
        commentCount: increment(1),
      });
  
      setCommentText('');
    } catch (error: any) {
      console.error('Error adding comment:', error.message);
      Alert.alert('Error', 'Could not add comment.');
  
      setPost(prevPost => ({
        ...prevPost,
        commentCount: (prevPost.commentCount ?? 1) - 1,
      }));
    } finally {
      setLoading(false);
    }
  };

  const renderCommentItem = ({ item: comment }: { item: Comment }) => {
    const commentUserData = userDataMap[comment.userId] || { name: 'User' };

    return (
      <View style={styles.commentItem}>
        {commentUserData?.profilePicture ? (
          <Image source={{ uri: commentUserData.profilePicture }} style={styles.commentAvatar} />
        ) : (
          <View style={styles.commentAvatarPlaceholder} />
        )}
        <View style={styles.commentTextContainer}>
          <Text style={styles.commentUserId}>{commentUserData.name}</Text>
          <Text style={styles.commentTimestamp}>
            {getTimeAgo(comment.timestamp)}
          </Text>
          <Text style={styles.commentContent}>{comment.content}</Text>
        </View>
      </View>
    );
  };

  if (loadingAuthor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7A5FFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header1}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer1}>
          <Image source={require('../../assets/backArrowIcon.png')} style={styles.backIcon1} />
          <Text style={styles.backButton1}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{name ?? 'User'}</Text>
              <Text style={styles.timestamp}>
                {getTimeAgo(post.timestamp)}
              </Text>
            </View>
          </View>

          <Text style={styles.content}>{post.content}</Text>

          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            {post.videoUrl && (
              <Video
                source={{ uri: post.videoUrl }}
                  style={styles.postImage}              
                  resizeMode={ResizeMode.COVER}         
                  useNativeControls={true}                 
                  shouldPlay={true}                    
                  isLooping={true}                    
              />
            )}

            {post.imageUrl && (
              <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
            )}
          </View>

          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLikePost}>
              <Image source={isLiked ? require('../../assets/likedIcon.png') : require('../../assets/likeIcon.png')} 
                     style={[styles.likeIcon, !isLiked && {tintColor: '#000'}]} />
              <Text style={styles.actionText}>{post.likes ? post.likes.length : 0}</Text>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <SimpleLineIcons name="bubble" size={20} color="#000" />
              <Text style={styles.actionText}>{post.commentCount ?? 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.commentsHeader}>
          <Text style={styles.commentsHeaderText}>Comments</Text>
        </View>
        {loadingComments ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#7A5FFF" />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(comment) => comment.id}
            renderItem={renderCommentItem}
            style={styles.commentsList}
          />
        )}

      </ScrollView>

      <View style={styles.newAddCommentContainer}>
        <TextInput
          style={styles.newCommentInput}
          placeholder="Write comment..."
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity style={styles.newPostCommentButton} onPress={handleAddComment}>
          {loading ? <ActivityIndicator size='small' color='#d3d3d3' /> : <Text style={styles.newPostCommentButtonText}>Post</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');
const scaleFactor = 1.1;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(2.4),
    paddingTop: RFPercentage(4),
    paddingBottom: RFPercentage(1),
    backgroundColor: '#FFF',
  },
  backButtonContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon1: {
    width: RFValue(24, height),
    height: RFValue(24, height),
    marginRight: -(width * 0.02),
  },
  backButton1: {
    fontSize: RFPercentage(1.8),
    color: '#007AFF',
    fontWeight: '500',
  },
  postContainer: {
    backgroundColor: 'white',
    paddingHorizontal: width * 0.06 * scaleFactor,
    paddingVertical: height * 0.01 * scaleFactor,
    marginBottom: height * 0.005 * scaleFactor,
    borderRadius: RFValue(8 * scaleFactor, height),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015 * scaleFactor,
  },
  avatar: {
    width: RFValue(50 * scaleFactor, height),
    height: RFValue(50 * scaleFactor, height),
    borderRadius: RFValue(25 * scaleFactor, height),
    marginRight: width * 0.02 * scaleFactor,
  },
  avatarPlaceholder: {
    width: RFValue(40 * scaleFactor, height),
    height: RFValue(40 * scaleFactor, height),
    borderRadius: RFValue(20 * scaleFactor, height),
    backgroundColor: '#EEEEEE',
    marginRight: width * 0.02 * scaleFactor,
  },
  userInfo: {
    flexDirection: 'column',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: RFValue(16 * scaleFactor, height),
    color: '#212121',
  },
  timestamp: {
    fontSize: RFValue(11 * scaleFactor, height),
    color: '#757575',
  },
  content: {
    fontSize: RFValue(16 * scaleFactor, height),
    color: '#212121',
    lineHeight: RFValue(20 * scaleFactor, height),
    marginBottom: height * 0.02 * scaleFactor,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: RFValue(8 * scaleFactor, height),
    maxHeight: height * 0.4 * scaleFactor,
    marginBottom: height * 0.015 * scaleFactor,
  },
  postActions: {
    flexDirection: 'row',
    paddingVertical: height * 0.015 * scaleFactor,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: width * 0.05 * scaleFactor,
  },
  likeIcon: {
    width: RFValue(18 * scaleFactor, height),
    height: RFValue(18 * scaleFactor, height),
  },
  actionText: {
    marginLeft: width * 0.01 * scaleFactor,
    fontSize: RFValue(14 * scaleFactor, height),
    fontWeight: 'bold',
    color: '#000',
  },
  commentsHeader: {
    paddingHorizontal: width * 0.06 * scaleFactor,
    paddingBottom: height * 0.03 * scaleFactor,
  },
  commentsHeaderText: {
    fontSize: RFValue(22 * scaleFactor, height),
    fontWeight: 'bold',
    color: '#212121',
  },
  commentsList: {
    paddingHorizontal: width * 0.06 * scaleFactor,
  },
  commentItem: {
    paddingVertical: height * 0.008 * scaleFactor,
    borderBottomWidth: 1 * scaleFactor,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'flex-start', 
  },
  commentAvatar: {
    width: RFValue(40 * scaleFactor, height),
    height: RFValue(40 * scaleFactor, height),
    borderRadius: RFValue(20 * scaleFactor, height),
    marginRight: width * 0.02 * scaleFactor,
  },
  commentAvatarPlaceholder: {
    width: RFValue(35 * scaleFactor, height),
    height: RFValue(35 * scaleFactor, height),
    borderRadius: RFValue(20 * scaleFactor, height),
    backgroundColor: '#EEEEEE',
    marginRight: width * 0.02 * scaleFactor,
  },
  commentTextContainer: {
    flexShrink: 1,
  },
  commentUserId: {
    fontWeight: 'bold',
    marginRight: width * 0.01 * scaleFactor,
    color: '#212121',
    fontSize: RFValue(17 * scaleFactor, height),
  },
  commentContent: {
    fontSize: RFValue(16 * scaleFactor, height),
    color: '#424242',
    lineHeight: RFValue(18 * scaleFactor, height),
    marginBottom: height * 0.01 * scaleFactor,
  },
  commentTimestamp: {
    fontSize: RFValue(10 * scaleFactor, height),
    color: '#757575',
    marginLeft: width * 0.005 * scaleFactor,
    marginBottom: height * 0.02 * scaleFactor,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.06 * scaleFactor,
    paddingVertical: height * 0.01 * scaleFactor,
    borderTopWidth: 1 * scaleFactor,
    borderTopColor: '#E0E0E0',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1 * scaleFactor,
    borderColor: '#E0E0E0',
    borderRadius: RFValue(5 * scaleFactor, height),
    paddingHorizontal: width * 0.02 * scaleFactor,
    paddingVertical: height * 0.008 * scaleFactor,
    marginRight: width * 0.02 * scaleFactor,
    fontSize: RFValue(16 * scaleFactor, height),
  },
  newAddCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.03 * scaleFactor,
    paddingVertical: width * 0.01 * scaleFactor,
    backgroundColor: '#fff', 
  },
  newCommentInput: {
    flex: 1,
    borderWidth: 1 * scaleFactor,
    borderColor: '#E0E0E0',
    borderRadius: RFValue(20 * scaleFactor, height), 
    paddingHorizontal: width * 0.04 * scaleFactor,
    paddingVertical: height * 0.01 * scaleFactor,
    marginRight: width * 0.02 * scaleFactor,
    fontSize: RFValue(16 * scaleFactor, height),
    backgroundColor: 'white', 
  },
  newPostCommentButton: {
    backgroundColor: '#7A5FFF', 
    borderRadius: RFValue(20 * scaleFactor, height),
    paddingVertical: height * 0.011 * scaleFactor,
    paddingHorizontal: width * 0.04 * scaleFactor,
  },
  newPostCommentButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(16 * scaleFactor),
  },
});