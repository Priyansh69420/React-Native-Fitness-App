import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, ScrollView, StyleSheet, Dimensions, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { auth } from '../../../firebaseConfig';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { updateUserProfile } from '../../store/slices/userSlice';
import { AppDispatch, RootState } from '../../store/store';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingStackParamList } from '../../navigations/SettingStackParamList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { supabase } from '../../../supabaseConfig';
import * as ImagePicker from 'expo-image-picker';
import RNFS from 'react-native-fs';
import { Ionicons } from '@expo/vector-icons';
import { useRealm } from '../../../realmConfig';
import { useTheme } from '../../contexts/ThemeContext';
import { TEXT } from '../../constants/text';

type NavigationProp = StackNavigationProp<SettingStackParamList, 'Profile'>;

interface UserData {
  email: string;
  name: string;
  faceId: boolean;
  profilePicture: string;
  goals: string[];
  interests: string[];
  gender: string;
  onboardingCompleted: boolean;
  userHeight: number;
  userWeight: number;
  calorieGoal: number;
  glassGoal: number;
  stepGoal: number;
}

interface DetailError {
  nameError: string;
  heightError: string;
  weightError: string;
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

const goalsOptions = ['Weight Loss', 'Better sleeping habit', 'Track my nutrition', 'Improve overall fitness'];
const interestsOptions = ['Fashion', 'Organic', 'Meditation', 'Fitness', 'Smoke Free', 'Sleep', 'Health', 'Running', 'Vegan'];
const genderOptions = ['Male', 'Female'];

const { width, height } = Dimensions.get('window');
const responsiveWidth = (percentage: number) => width * (percentage / 100);
const responsiveHeight = (percentage: number) => height * (percentage / 100);

export default function Profile() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const userData = useSelector((state: RootState) => state.user.userData);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const realm = useRealm();
  const theme = useTheme();

  const [name, setName] = useState(userData?.name ?? '');
  const [height, setHeight] = useState(userData?.userHeight?.toString() ?? '');
  const [weight, setWeight] = useState(userData?.userWeight?.toString() ?? '');
  const [profilePicture, setProfilePicture] = useState<string>(
    userData && typeof userData.profilePicture === 'string' ? userData.profilePicture : ''
  );
  const [goals, setGoals] = useState<string[]>(userData?.goals ?? []);
  const [interests, setInterests] = useState<string[]>(userData?.interests || []);
  const [gender, setGender] = useState<string>(userData?.gender ?? '');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);
  const [showCurrent, setShowCurrent] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [calorieGoal, setCalorieGoal] = useState<string>(userData?.calorieGoal?.toString() ?? '2000');
  const [glassGoal, setGlassGoal] = useState<string>(userData?.glassGoal?.toString() ?? '8');
  const [stepGoal, setStepGoal] = useState<string>(userData?.stepGoal?.toString() ?? '10000');
  const [calorieGoalError, setCalorieGoalError] = useState<string>('');
  const [glassGoalError, setGlassGoalError] = useState<string>('');
  const [stepGoalError, setStepGoalError] = useState<string>('');
  const [goalError, setGoalError] = useState<string>('');
  const [interestError, setInterestError] = useState<string>('');
  const [detailError, setDetailError] = useState<DetailError>({ nameError: '', heightError: '', weightError: '' });
  const [showPasswordSection, setShowPasswordSection] = useState<boolean>(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name);
      setHeight(userData.userHeight?.toString() || '');
      setWeight(userData.userWeight?.toString() || '');
      if (typeof userData.profilePicture === 'string') {
        setProfilePicture(userData.profilePicture);
      } else {
        setProfilePicture('');
      }
      setGoals(userData.goals);
      setInterests(userData.interests);
      setGender(userData.gender);
      setCalorieGoal(userData.calorieGoal?.toString() || '2000');
      setGlassGoal(userData.glassGoal?.toString() || '8');
      setStepGoal(userData.stepGoal?.toString() || '10000');
    }
  }, [userData]);  

  useEffect(() => {
    setError('');
    
    if(interests.length !== 0) setInterestError('');
    if(goals.length !== 0) setGoalError('');
    if(name.trim().length !== 0) setDetailError(prev => ({
      ...prev,
      nameError: '',
    }));
    if(height.trim() !== '0' && height.trim() !== '') setDetailError(prev => ({
      ...prev,
      heightError: ''
    }))
    if(weight.trim() !== '0' && weight.trim() !== '') setDetailError(prev => ({
      ...prev,
      weightError: ''
    }))
  }, [currentPassword, newPassword, confirmNewPassword, interests, goals, name, height, weight]);

  useEffect(() => {
    validateDailyMilestones();
  }, [calorieGoal, glassGoal, stepGoal])

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
      const permissionGranted = await requestMediaLibraryPermission();
      if (!permissionGranted) return;

      const imageResult = await pickImage();
      if (!imageResult) return;

      setLoading(true);

      const { fileType, filePath, base64Image } = await processImage(imageResult);
      if (!base64Image) throw new Error('Failed to convert image to Base64');

      await deleteOldProfilePicture();

      await uploadImageToSupabase(filePath, base64Image, fileType);

      const publicUrl = await getPublicUrl(filePath);
      setProfilePicture(publicUrl);
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission Denied. Please grant permission to select an image.');
      return false;
    }
    return true;
  };

  const pickImage = async (): Promise<ImagePicker.ImagePickerResult | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    return !result.canceled && result.assets.length > 0 ? result : null;
  };

  const processImage = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.assets || result.assets.length === 0) {
      throw new Error('No assets found in the result.');
    }
    const uri = result.assets[0].uri;
    const fileName = uri.split('/').pop() ?? `profile_${Date.now()}.jpg`;
    const fileType = result.assets[0].type?.split('/')[1] ?? fileName.split('.').pop() ?? 'jpeg';
    const filePath = `profile_pictures/${fileName}`;

    const base64Image = await convertToBase64(uri);
    return { uri, fileName, fileType, filePath, base64Image };
  };

  const convertToBase64 = async (uri: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise<string | null>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result.split(',')[1] : null);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      return await RNFS.readFile(uri, 'base64');
    }
  };

  const deleteOldProfilePicture = async () => {
    if (typeof profilePicture === 'string' && profilePicture.includes('supabase.co')) {
      const oldFilePath = profilePicture.split('/storage/v1/object/public/profileimages/')[1]?.split('?')[0];
      if (oldFilePath) {
        const { error: deleteError } = await supabase.storage.from('profileimages').remove([oldFilePath]);
        if (deleteError) console.log('Failed to delete old image:', deleteError.message);
      }
    }
  };

  const uploadImageToSupabase = async (filePath: string, base64Image: string, fileType: string) => {
    const binaryString = atob(base64Image);
    const fileArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      fileArray[i] = binaryString.charCodeAt(i);
    }

    const { error: uploadError } = await supabase.storage.from('profileimages').upload(filePath, fileArray, {
      contentType: `image/${fileType}`,
      upsert: true,
    });

    if (uploadError) throw new Error(uploadError.message);
  };

  const getPublicUrl = async (filePath: string): Promise<string> => {
    const { data: urlData } = supabase.storage.from('profileimages').getPublicUrl(filePath);
    if (!urlData.publicUrl) throw new Error('Failed to retrieve public URL');
    return `${urlData.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async (partialData?: Partial<UserData>) => {
    if (!validateDailyMilestones()) {
      return;
    }

    if (
      interests.length === 0 ||
      goals.length === 0 ||
      name.trim().length < 2 ||
      /\d/.test(name.trim()) ||
      height.trim() === '0' || height.trim() === '' ||
      weight.trim() === '0' || weight.trim() === '' ||
      Number(height) <= 0 || Number(height) > 300 ||
      Number(weight) <= 0 || Number(weight) > 300
    ) {
      if (interests.length === 0) {
        setInterestError('Select at least one field from here');
      }
    
      if (goals.length === 0) {
        setGoalError('Select at least one field from here');
      }
    
      if (name.trim().length < 2) {
        setDetailError(prev => ({
          ...prev,
          nameError: 'Name must be at least 2 characters long',
        }));
      } else if (/\d/.test(name.trim())) {
        setDetailError(prev => ({
          ...prev,
          nameError: 'Name should not contain numbers',
        }));
      }
    
      if (height.trim() === '' || height.trim() === '0') {
        setDetailError(prev => ({
          ...prev,
          heightError: 'Height is required.',
        }));
      } else if (Number(height) <= 0 || Number(height) > 300) {
        setDetailError(prev => ({
          ...prev,
          heightError: 'Height must be between 1 and 300',
        }));
      }
    
      if (weight.trim() === '' || weight.trim() === '0') {
        setDetailError(prev => ({
          ...prev,
          weightError: 'Weight is required.',
        }));
      } else if (Number(weight) <= 0 || Number(weight) > 300) {
        setDetailError(prev => ({
          ...prev,
          weightError: 'Weight must be between 1 and 300',
        }));
      }
    
      return;
    }

    setLoading(true);

    try {
      const updatedUserData: Partial<UserData> = partialData || {
        name,
        userHeight: parseFloat(height) || 0,
        userWeight: parseFloat(weight) || 0,
        profilePicture,
        goals,
        interests,
        gender,
        calorieGoal: parseFloat(calorieGoal) || 2000,
        glassGoal: parseFloat(glassGoal) || 8,
        stepGoal: parseFloat(stepGoal) || 10000,
      };

      await dispatch(updateUserProfile({ updatedData: updatedUserData, realm })).unwrap();
      navigation.goBack();
    } catch (error: any) {
      alert('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordRequirements = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    return { minLength, hasUpperCase, hasNumber };
  };

  const handleChangePassword = async () => {
    let hasError = false;
    const {hasUpperCase, hasNumber, minLength} = checkPasswordRequirements(newPassword)
  
    setError('');
  
    if (!currentPassword) {
      setError('Please enter your current password.');
      hasError = true;
    } else if (!newPassword) {
      setError('Please enter a new password.');
      hasError = true;
    } else if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      hasError = true;
    } else if (!confirmNewPassword) {
      setError('Please confirm your new password.');
      hasError = true;
    } else if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      hasError = true;
    } else if (!hasUpperCase || !hasNumber || !minLength) {
      setError('New password should have atleast one UpperCase, one number and should be 8 characters long.')
      hasError = true;
    }
  
    if (hasError) return;
  
    const user = auth.currentUser;
    if (!user?.email) {
      setError('No user is currently signed in.');
      return;
    }
  
    try {
      setUpdatingPassword(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
  
      await updatePassword(user, newPassword);
  
      Alert.alert('Success', 'Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect current password.');
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const validateDailyMilestones = () => {
    let isValid = true;

    const calorieValue = parseFloat(calorieGoal);
    if (isNaN(calorieValue) || calorieGoal === '') {
      setCalorieGoalError('Calorie goal must be a valid number');
      isValid = false;
    } else if (calorieValue < 500) {
      setCalorieGoalError('Calorie goal must be at least 500');
      isValid = false;
    } else if (calorieValue > 5000) {
      setCalorieGoalError('Calorie goal cannot exceed 5000');
      isValid = false;
    } else {
      setCalorieGoalError('');
    }

    const glassValue = parseFloat(glassGoal);
    if (isNaN(glassValue) || glassGoal === '') {
      setGlassGoalError('Water intake goal must be a valid number');
      isValid = false;
    } else if (glassValue < 1) {
      setGlassGoalError('Water intake goal must be at least 1 glass');
      isValid = false;
    } else if (glassValue > 16) {
      setGlassGoalError('Water intake goal cannot exceed 16 glasses');
      isValid = false;
    } else {
      setGlassGoalError('');
    }

    const stepValue = parseFloat(stepGoal);
    if (isNaN(stepValue) || stepGoal === '') {
      setStepGoalError('Step goal must be a valid number');
      isValid = false;
    } else if (stepValue < 1000) {
      setStepGoalError('Step goal must be at least 1000 steps');
      isValid = false;
    } else if (stepValue > 50000) {
      setStepGoalError('Step goal cannot exceed 50000 steps');
      isValid = false;
    } else {
      setStepGoalError('');
    }

    return isValid;
  };

  const disableSave = () => {
    if(!calorieGoalError && !glassGoalError && !stepGoalError && !error) {
      return false
    }
    return true;
  }

  const profileImageSource = profilePicture ? { uri: profilePicture } : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/backArrowIcon.png')} style={styles.backArrowIcon} />
            <Text style={[styles.backButtonText, { color: theme.textButtonTertiary }]}>{TEXT.editProfile.back}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{TEXT.editProfile.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{TEXT.editProfile.profilePicture}</Text>
          <View style={styles.profilePictureContainer}>
            {imageLoading && (
              <ActivityIndicator 
                size="small" 
                color={theme.activityIndicatorPrimary} 
                style={styles.activityIndicator} 
              /> 
            )}

            {profileImageSource && (
              <TouchableOpacity onPress={handleAddCustomPhoto}>
                <Image source={profileImageSource} style={[styles.profilePicture, { borderColor: theme.borderAccent }]} onLoad={() => setImageLoading(true)} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            horizontal
            data={avatars}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.avatarList}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.avatarItem, profilePicture === item.source.uri && [styles.selectedAvatar, { borderColor: theme.borderAccent }]]}
                onPress={() => setProfilePicture(item.source.uri)}
              >
                <Image source={item.source} style={styles.avatarImage} />
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={[styles.addPhotoButton, { backgroundColor: theme.backgroundButtonPrimary }]} onPress={handleAddCustomPhoto}>
            <Text style={[styles.addPhotoText, { color: theme.textButtonPrimary }]}>{TEXT.editProfile.addCustomPhoto}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{TEXT.editProfile.details}</Text>
          
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{TEXT.editProfile.name}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
            value={name}
            onChangeText={setName}
            placeholder={TEXT.editProfile.namePlaceholder}
            placeholderTextColor={theme.textPlaceholder}
            maxLength={20}
          />
          {detailError.nameError ? (<Text style={[styles.errorText, { color: theme.textError }]}>{detailError.nameError}</Text>) : null}

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{TEXT.editProfile.height}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
            value={height}
            onChangeText={(text) => {
              const filtered = text.replace(',', '.'); 
              if (/^\d*\.?\d*$/.test(filtered)) {
                setHeight(filtered);
              }
            }}
            placeholder={TEXT.editProfile.heightPlaceholder}
            placeholderTextColor={theme.textPlaceholder}
            keyboardType="numeric"
            maxLength={6}
          />
          {detailError.heightError ? (
            <Text style={[styles.errorText, { color: theme.textError }]}>{detailError.heightError}</Text>
          ) : null}

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{TEXT.editProfile.weight}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
            value={weight}
            onChangeText={(text) => {
              const filtered = text.replace(',', '.'); 
              if (/^\d*\.?\d*$/.test(filtered)) {
                setWeight(filtered);
              }
            }}
            placeholder={TEXT.editProfile.weightPlaceholder}
            placeholderTextColor={theme.textPlaceholder}
            keyboardType="numeric"
            maxLength={6}
          />
          {detailError.weightError ? (
            <Text style={[styles.errorText, { color: theme.textError }]}>{detailError.weightError}</Text>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{TEXT.editProfile.dailyMilestones}</Text>
          
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{TEXT.editProfile.dailyCalories}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
            value={String(calorieGoal ?? '')}
            onChangeText={(text) => {
              const filtered = text.replace(/[^0-9.]/g, '');
              setCalorieGoal(filtered);
              validateDailyMilestones(); 
            }}
            placeholder={TEXT.editProfile.caloriePlaceholder}
            placeholderTextColor={theme.textPlaceholder}
            keyboardType="numeric"
          />
          {calorieGoalError ? (
            <Text style={[styles.errorText, { color: theme.textError }]}>{calorieGoalError}</Text>
          ) : null}

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{TEXT.editProfile.dailyWater}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
            value={String(glassGoal ?? '')}
            onChangeText={(text) => {
              const filtered = text.replace(/[^0-9.]/g, '');
              setGlassGoal(filtered);
              validateDailyMilestones(); 
            }}
            placeholder={TEXT.editProfile.waterPlaceholder}
            placeholderTextColor={theme.textPlaceholder}
            keyboardType="numeric"
          />
          {glassGoalError ? (
            <Text style={[styles.errorText, { color: theme.textError }]}>{glassGoalError}</Text>
          ) : null}

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{TEXT.editProfile.dailySteps}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
            value={String(stepGoal ?? '')}
            onChangeText={(text) => {
              const filtered = text.replace(/[^0-9.]/g, '');
              setStepGoal(filtered);
              validateDailyMilestones(); 
            }}
            placeholder={TEXT.editProfile.stepsPlaceholder}
            placeholderTextColor={theme.textPlaceholder}
            keyboardType="numeric"
          />
          {stepGoalError ? (
            <Text style={[styles.errorText, { color: theme.textError }]}>{stepGoalError}</Text>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{TEXT.editProfile.goals}</Text>
          <View style={styles.toggleContainer}>
            {goalsOptions.map((goal) => (
              <TouchableOpacity
                key={goal}
                onPress={() => toggleGoal(goal)}
                style={[styles.toggleButton, { backgroundColor: theme.backgroundButtonSecondary }, goals.includes(goal) && { backgroundColor: theme.backgroundButtonPrimary }]}
              >
                <Text
                  style={[styles.toggleText, { color: theme.textPrimary }, goals.includes(goal) && { color: theme.textButtonPrimary }]}
                >
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {goalError ? (<Text style={[styles.errorText, { color: theme.textError }]}>{goalError}</Text>) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{TEXT.editProfile.interests}</Text>
          <View style={styles.toggleContainer}>
            {interestsOptions.map((interest) => (
              <TouchableOpacity
                key={interest}
                onPress={() => toggleInterests(interest)}
                style={[styles.toggleButton, { backgroundColor: theme.backgroundButtonSecondary }, interests.includes(interest) && { backgroundColor: theme.backgroundButtonPrimary }]}
              >
                <Text
                  style={[styles.toggleText, { color: theme.textPrimary }, interests.includes(interest) && { color: theme.textButtonPrimary }]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {interestError ? (<Text style={[styles.errorText, { color: theme.textError }]}>{interestError}</Text>) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{TEXT.editProfile.gender}</Text>
          <View style={styles.toggleContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setGender(option)}
                style={[styles.toggleButton, { backgroundColor: theme.backgroundButtonSecondary }, gender === option && { backgroundColor: theme.backgroundButtonPrimary }]}
              >
                <Text
                  style={[styles.toggleText, { color: theme.textPrimary }, gender === option && { color: theme.textButtonPrimary }]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }, !showPasswordSection && { paddingBottom: 2 }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Text style={[styles.sectionTitle, { marginBottom: 0, color: theme.textPrimary }]}>
              {TEXT.editProfile.changePassword}
            </Text>
            <Ionicons
              name={showPasswordSection ? 'chevron-down' : 'chevron-forward'}
              size={22}
              color={theme.iconSecondary}
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
                  placeholder={TEXT.editProfile.currentPassword}
                  placeholderTextColor={theme.textPlaceholder}
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrent(prev => !prev)} style={styles.eyeButton}>
                  <Ionicons
                    name={showCurrent ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={theme.iconSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
                  placeholder={TEXT.editProfile.newPassword}
                  placeholderTextColor={theme.textPlaceholder}
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNew(prev => !prev)} style={styles.eyeButton}>
                  <Ionicons
                    name={showNew ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={theme.iconSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.borderPrimary }]}
                  placeholder={TEXT.editProfile.confirmNewPassword}
                  placeholderTextColor={theme.textPlaceholder}
                  secureTextEntry={!showConfirm}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(prev => !prev)} style={styles.eyeButton}>
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={theme.iconSecondary}
                  />
                </TouchableOpacity>
              </View>

              {error ? (
                <Text style={[styles.errorText, { color: theme.textError }]}>{error}</Text>
              ) : null}

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  onPress={handleChangePassword}
                  style={[styles.addPhotoButton, { backgroundColor: theme.backgroundButtonPrimary }]}
                >
                  {updatingPassword ? (
                    <ActivityIndicator size="small" color={theme.activityIndicatorSecondary} />
                  ) : (
                    <Text style={[styles.addPhotoText, { color: theme.textButtonPrimary }]}>{TEXT.editProfile.updatePassword}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 60 }}>
          <TouchableOpacity onPress={() => handleSave()} style={[styles.saveButton, { backgroundColor: theme.backgroundButtonPrimary }]} disabled={disableSave()}>
            {loading ? <ActivityIndicator size='small' color={theme.activityIndicatorSecondary} /> : <Text style={[styles.buttonText, { color: theme.textButtonPrimary }]}>{TEXT.editProfile.saveChanges}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.cancelButton, { backgroundColor: theme.backgroundButtonSecondary }]}>
            <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>{TEXT.editProfile.cancel}</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  sectionTitle: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: responsiveHeight(1),
  },
  subtitle: {
    fontSize: RFValue(14),
    fontWeight: '500',
    color: '#666',
    marginBottom: responsiveHeight(0.5),
    marginTop: responsiveHeight(1),
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: RFValue(13),
    backgroundColor: '#F9F9F9',
    color: '#333',
  },  
  profilePictureContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: responsiveHeight(1), 
    position: 'relative',
  },
  profilePicture: {
    width: responsiveWidth(25), 
    height: responsiveWidth(25), 
    borderRadius: responsiveWidth(12.5), 
    borderWidth: 2,
    borderColor: '#7A5FFF',
    marginBottom: responsiveHeight(2)
  },
  activityIndicator: {
    position: 'absolute',
    top: -15,
    left: 0,
    right: 0, 
    bottom: 0, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  avatarList: {
    paddingVertical: responsiveHeight(0.5),
    justifyContent: 'center',
    width: '102%'
  },
  avatarItem: {
    marginRight: responsiveWidth(2.5),
    marginHorizontal: responsiveWidth(2)
  },
  avatarImage: {
    width: responsiveWidth(12), 
    height: responsiveWidth(12), 
    borderRadius: responsiveWidth(6), 
  },
  selectedAvatar: {
    borderWidth: 2,
    borderColor: '#7A5FFF',
    borderRadius: RFValue(50)
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
  inputWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -11 }],
    padding: 2,
    marginHorizontal: 10
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
});