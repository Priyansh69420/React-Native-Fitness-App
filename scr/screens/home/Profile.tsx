import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../../firebaseConfig';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { updateUser } from '../../store/slices/userSlice';
import { AppDispatch, RootState } from '../../store/store';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingStackParamList } from '../../navigations/SettingStackParamList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { supabase } from '../../../supabaseConfig';
import * as ImagePicker from 'expo-image-picker';
import RNFS from 'react-native-fs';

type NavigationProp = StackNavigationProp<SettingStackParamList, 'Profile'>;

interface UserData {
  email: string;
  name: string;
  faceId: boolean;
  profilePicture: string | number;
  goals: string[];
  interests: string[];
  gender: string;
  onboardingCompleted: boolean;
}

interface Avatar {
  id: number;
  source: any;
}

const avatars: Avatar[] = [
  { id: 1, source: { uri: 'https://dojvycwbetqfeutcvsqe.supabase.co/storage/v1/object/public/profileimages/profile_pictures/avatar5-Photoroom-Photoroom.jpg' } },
  { id: 2, source: { uri: 'https://dojvycwbetqfeutcvsqe.supabase.co/storage/v1/object/public/profileimages/profile_pictures/avatar2-Photoroom-Photoroom.jpg' } },
  { id: 3, source: { uri: 'https://dojvycwbetqfeutcvsqe.supabase.co/storage/v1/object/public/profileimages/profile_pictures/avatar4-Photoroom-Photoroom%20(1).jpg' } },
];

const getAvatarSource = (id: number): any => {
  const avatar = avatars.find((item) => item.id === id);
  return avatar ? avatar.source : null;
};

const goalsOptions = ['Weight Loss', 'Better sleeping habit', 'Track my nutrition', 'Improve overall fitness'];
const interestsOptions = ['Fashion', 'Organic', 'Meditation', 'Fitness', 'Smoke Free', 'Sleep', 'Health', 'Running', 'Vegan'];
const genderOptions = ['Male', 'Female', 'Other'];

const { width, height } = Dimensions.get('window');
const responsiveWidth = (percentage: number) => width * (percentage / 100);
const responsiveHeight = (percentage: number) => height * (percentage / 100);

export default function Profile() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const userData = useSelector((state: RootState) => state.user.userData);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  const [name, setName] = useState(userData?.name || '');
  const [profilePicture, setProfilePicture] = useState<number | string>(userData?.profilePicture || 1);
  const [goals, setGoals] = useState<string[]>(userData?.goals || []);
  const [interests, setInterests] = useState<string[]>(userData?.interests || []);
  const [gender, setGender] = useState<string>(userData?.gender || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);


  useEffect(() => {
    if (userData) {
      setName(userData.name);
      setProfilePicture(userData.profilePicture);
      setGoals(userData.goals);
      setInterests(userData.interests);
      setGender(userData.gender);
    }
  }, [userData]);

  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter((g) => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const toggleInterests = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleAddCustomPhoto = async () => {
    try {
      setLoading(true);
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          alert('Permission Denied. Please grant permission to select an image.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const fileName = uri.split('/').pop() || `profile_${Date.now()}.jpg`;
        const fileType = result.assets[0].type?.split('/')[1] || fileName.split('.').pop() || 'jpeg';
        const filePath = `profile_pictures/${fileName}`;

        let base64Image: string | null = null;

        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          base64Image = await new Promise<string | null>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
              } else {
                reject('Failed to read as Data URL');
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          base64Image = await RNFS.readFile(uri, 'base64');
        }

        if (!base64Image) {
          throw new Error('Failed to convert image to Base64');
        }

        if (typeof profilePicture === 'string' && profilePicture.includes('supabase.co')) {
          const oldFilePath = profilePicture.split('/storage/v1/object/public/profileimages/')[1]?.split('?')[0];
          if (oldFilePath) {
            console.log('Deleting old file:', oldFilePath);
            const { error: deleteError } = await supabase.storage
              .from('profileimages')
              .remove([oldFilePath]);
    
            if (deleteError) {
              console.log('Failed to delete old image:', deleteError.message);
            } else {
              console.log('Old image deleted successfully');
            }
          }
        }

        const binaryString = atob(base64Image);
        const fileArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          fileArray[i] = binaryString.charCodeAt(i);
        }

        const { data, error: uploadError } = await supabase.storage
          .from('profileimages')
          .upload(filePath, fileArray, {
            contentType: `image/${fileType}`,
            upsert: true,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from('profileimages')
          .getPublicUrl(filePath);

        if (!urlData.publicUrl) {
          throw new Error('Failed to retrieve public URL');
        }

        const publicUrlWithCacheBust = `${urlData.publicUrl}?t=${Date.now()}`;

        setProfilePicture(publicUrlWithCacheBust);
        console.log('New profile picture updated:', publicUrlWithCacheBust);
      }
    } catch (error: any) {
        alert('Error uploading image: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const updatedUserData: Partial<UserData> = {
        name,
        profilePicture,
        goals,
        interests,
        gender,
      };

      dispatch(updateUser(updatedUserData));

      const user = auth.currentUser;
      if (user) {
        const userRefDoc = doc(firestore, 'users', user.uid);
        await setDoc(userRefDoc, updatedUserData, { merge: true });
      }
      navigation.goBack();
    } catch (error: any) {
      alert('Failed to update profile: ' + error.message);
    }
    finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if(!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if(newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    const user = auth.currentUser;
    if(!user || !user.email) {
      setError('No user is currently signed in.');
      return;
    }

    try {
      setUpdatingPassword(true);

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      Alert.alert(
        'Success', 
        'Your password has been updated successfully.', 
        [
          {
            text: 'OK',
            onPress: () => console.log('OK Pressed'),
            style: 'default',
          },
        ],
        { cancelable: true }
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      setError('Wrong Password');
    } finally {
      setUpdatingPassword(false);
    }  
  }

  const profileImageSource =
    typeof profilePicture === 'string'
      ? { uri: profilePicture }
      : typeof profilePicture === 'number'
      ? getAvatarSource(profilePicture)
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/backArrowIcon.png')} style={styles.backArrowIcon} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            {imageLoading && (
              <ActivityIndicator 
                size="small" 
                color="#b6b6b6" 
                style={styles.activityIndicator} 
              /> 
            )}

            {profileImageSource && (
              <Image source={profileImageSource} style={styles.profilePicture} onLoad={() => setImageLoading(false)} />
            )}
          </View>
          <FlatList
            horizontal
            data={avatars}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.avatarList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.avatarItem, profilePicture === item.id && styles.selectedAvatar]}
                onPress={() => setProfilePicture(item.id)}
              >
                <Image source={item.source} style={styles.avatarImage} />
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddCustomPhoto}>
            <Text style={styles.addPhotoText}>Add Custom Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.toggleContainer}>
            {goalsOptions.map((goal) => (
              <TouchableOpacity
                key={goal}
                onPress={() => toggleGoal(goal)}
                style={[styles.toggleButton, goals.includes(goal) && styles.toggleButtonSelected]}
              >
                <Text
                  style={[styles.toggleText, goals.includes(goal) && styles.toggleTextSelected]}
                >
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.toggleContainer}>
            {interestsOptions.map((interest) => (
              <TouchableOpacity
                key={interest}
                onPress={() => toggleInterests(interest)}
                style={[
                  styles.toggleButton,
                  interests.includes(interest) && styles.toggleButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    interests.includes(interest) && styles.toggleTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gender</Text>
          <View style={styles.toggleContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setGender(option)}
                style={[styles.toggleButton, gender === option && styles.toggleButtonSelected]}
              >
                <Text
                  style={[styles.toggleText, gender === option && styles.toggleTextSelected]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {marginBottom: responsiveHeight(2)}]}>Change Password</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Current Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            style={styles.textInput}
            placeholder="New Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Confirm New Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
          />
          {error ? <Text style={{color: 'red', textAlign: 'center'}}>{error}</Text>: <></>}

          <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
          <TouchableOpacity onPress={handleChangePassword}  style={[styles.addPhotoButton, {borderRadius: 20, width: '50%'}]}>
          {updatingPassword ? <ActivityIndicator size='small' color='#d0d0d0'/> : <Text style={styles.addPhotoText}>Update Password</Text>}
          </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 60 }}>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            {loading ? <ActivityIndicator size='small' color='#d0d0d0'/> : <Text style={styles.buttonText}>Save Changes</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: (height * 0.03),
  },
  container: {
    flexGrow: 1, 
    paddingBottom: responsiveHeight(2), 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(2.5), 
    marginTop: responsiveHeight(1), 
  },
  backButton: {
    padding: responsiveWidth(2), 
    flexDirection: 'row',
    alignItems: 'center',
    left: width * 0.021,
    top: height * 0.0001,
  },
  backArrowIcon: {
    width: RFValue(24, height),
    height: RFValue(24, height),
    marginRight: -(width * 0.02),
  },
  backButtonText: {
    fontSize: RFPercentage(1.8),
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: RFValue(25), 
    fontWeight: 600,
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: responsiveWidth(15), 
  },
  section: {
    backgroundColor: '#FFF',
    padding: responsiveWidth(4), 
    borderBottomWidth: 0.2,
    borderBottomColor: '#999',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: responsiveHeight(1),
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: responsiveWidth(1.25), 
    padding: responsiveWidth(2.5), 
    fontSize: RFValue(12),
    backgroundColor: '#F9F9F9',
    color: '#333',
    marginBottom: responsiveHeight(1)
  },
  profilePictureContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: responsiveHeight(1), 
    position: 'relative',
  },
  profilePicture: {
    width: responsiveWidth(15), 
    height: responsiveWidth(15), 
    borderRadius: responsiveWidth(7.5), 
    borderWidth: 2,
    borderColor: '#7A5FFF',
  },
  activityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0, 
    bottom: 0, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  avatarList: {
    paddingVertical: responsiveHeight(0.5),
  },
  avatarItem: {
    marginRight: responsiveWidth(2.5),
  },
  avatarImage: {
    width: responsiveWidth(12), 
    height: responsiveWidth(12), 
    borderRadius: responsiveWidth(6), 
  },
  selectedAvatar: {
    borderWidth: 2,
    borderColor: '#7A5FFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveWidth(2), 
  },
  toggleButton: {
    paddingVertical: responsiveHeight(1), 
    paddingHorizontal: responsiveWidth(4), 
    borderRadius: responsiveWidth(5), 
    backgroundColor: '#E0E0E0',
  },
  toggleButtonSelected: {
    backgroundColor: '#7A5FFF',
  },
  toggleText: {
    fontSize: RFValue(14),
    color: '#333',
  },
  toggleTextSelected: {
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: '#7A5FFF',
    padding: responsiveHeight(1.5), 
    borderRadius: responsiveWidth(2.5), 
    alignItems: 'center',
    marginTop: responsiveHeight(2.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsiveHeight(0.25) }, 
    shadowOpacity: 0.2,
    shadowRadius: responsiveWidth(1.25),
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    padding: responsiveHeight(1.3),
    borderRadius: responsiveWidth(2.5), 
    alignItems: 'center',
    marginTop: responsiveHeight(1), 
    marginBottom: responsiveHeight(2),
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(15), 
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: RFValue(15), 
    fontWeight: '600',
  },
  addPhotoButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#7A5FFF',
    borderRadius: 10,
    alignItems: 'center', 
  },
  addPhotoText: {
    color: '#fff',
    fontSize: 16,
  },
});