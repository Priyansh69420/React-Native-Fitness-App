import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Modal, Button, Platform, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../contexts/OnboardingContext';
import * as ImagePicker from "expo-image-picker";
import RNFS from 'react-native-fs';
import { supabase } from '../../../supabaseConfig';
import { RFValue } from 'react-native-responsive-fontsize';
import { TEXT } from '../../constants/text';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SetProfile">;
const logo = require('../../assets/logo.png');
const backIcon = require('../../assets/backIcon.png'); 

interface Item {
  id: number; 
  source: any;
}

const avatars: Item[] = [
  { id: 1, source: { uri: 'https://dojvycwbetqfeutcvsqe.supabase.co/storage/v1/object/public/profileimages/profile_pictures/avatar5-Photoroom-Photoroom.jpg' } },
  { id: 2, source: { uri: 'https://dojvycwbetqfeutcvsqe.supabase.co/storage/v1/object/public/profileimages/profile_pictures/avatar2-Photoroom-Photoroom.jpg' } },
  { id: 3, source: { uri: 'https://dojvycwbetqfeutcvsqe.supabase.co/storage/v1/object/public/profileimages/profile_pictures/avatar4-Photoroom-Photoroom%20(1).jpg' } },
];

export default function SetProfile() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [customImg, setCustomImg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const {updateOnboardingData, onboardingData} = useOnboarding();

  useEffect(() => {
    if (!customImg && typeof onboardingData.profilePicture === 'string') {
      setCustomImg(onboardingData.profilePicture);
    }
  }, []);

  useEffect(() => {
    if(customImg) setSelectedAvatar(null);
  }, [customImg, selectedAvatar])

  const handleAddCustomPhoto = async () => {
    try {
      if (!(await requestPermission())) return;

      const result = await pickImage();
      if (!result.canceled && result.assets.length > 0) {
        setButtonLoading(true);

        const uri = result.assets[0].uri;
        const fileName = getFileName(uri);
        const fileType = getFileType(result.assets[0], fileName);

        const base64Image = await getBase64Image(uri);
        if (!base64Image) throw new Error('Failed to convert image to Base64');

        const fileArray = convertBase64ToUint8Array(base64Image);

        const publicUrlWithCacheBust = await uploadImage(fileName, fileType, fileArray);
        setCustomImg(publicUrlWithCacheBust);
        setModalVisible(true);
      }
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setButtonLoading(false);
    }
  };

  const requestPermission = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission Denied. Please grant permission to select an image.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  };

  const getFileName = (uri: string) => {
    return uri.split('/').pop() ?? `profile_${Date.now()}.jpg`;
  };

  const getFileType = (asset: any, fileName: string) => {
    return asset.type?.split('/')[1] ?? fileName.split('.').pop() ?? 'jpeg';
  };

  const getBase64Image = async (uri: string) => {
    return Platform.OS === 'web'
      ? await getBase64ImageWeb(uri)
      : await getBase64ImageNative(uri);
  };

  const getBase64ImageWeb = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return readBlobAsBase64(blob);
  };

  const readBlobAsBase64 = (blob: Blob): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => handleReaderLoadEnd(reader, resolve, reject);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  const handleReaderLoadEnd = (
    reader: FileReader,
    resolve: (value: string | null) => void,
    reject: (reason?: any) => void
  ) => {
    if (typeof reader.result === 'string') {
      resolve(reader.result.split(',')[1]);
    } else {
      reject(new Error('Failed to read as Data URL'));
    }
  };

  const getBase64ImageNative = async (uri: string) => {
    return await RNFS.readFile(uri, 'base64');
  };

  const convertBase64ToUint8Array = (base64Image: string) => {
    const binaryString = atob(base64Image);
    const fileArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      fileArray[i] = binaryString.charCodeAt(i);
    }
    return fileArray;
  };

  const uploadImage = async (fileName: string, fileType: string, fileArray: Uint8Array) => {
    const { error } = await supabase.storage
      .from('profileimages')
      .upload(`profile_pictures/${fileName}`, fileArray, {
        contentType: `image/${fileType}`,
        upsert: true,
      });
    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage
      .from('profileimages')
      .getPublicUrl(`profile_pictures/${fileName}`);
    if (!urlData.publicUrl) throw new Error('Failed to retrieve public URL');

    return `${urlData.publicUrl}?t=${Date.now()}`;
  };

  const confirmCustomImage = () => {
    if(customImg || avatars.some(item => item.source.uri === selectedAvatar)) {
      setError('');
      setSelectedAvatar(null);
      setModalVisible(false);
      navigation.navigate('Goals');
    }
    else alert('No Image, Please select an image before confirming.');
  }

  const cancelCustomImage = () => {
    setCustomImg(null);
    setModalVisible(false);
    updateOnboardingData({profilePicture: null})
  }

  const handleContinuePress = async () => {
    if (customImg) {
      updateOnboardingData({ profilePicture: customImg });
      navigation.navigate('Goals');
    } else if (selectedAvatar) {
      updateOnboardingData({ profilePicture: selectedAvatar });
      navigation.navigate('Goals');
    } else {
      setError('Please select an avatar or add a Custom Photo');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={backIcon} style={styles.backIcon} />
        </TouchableOpacity>
  
        <View style={styles.centeredContent}>
          <Image source={logo} style={styles.appLogo} resizeMode="contain" />
  
          <View style={styles.avatarRow}>
            {avatars.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setError('');
                  setSelectedAvatar(item.source.uri);
                }}
                disabled={buttonLoading}
              >
                <View
                  style={[
                    styles.avatarContainer,
                    selectedAvatar === item.source.uri && styles.selectedAvatarContainer,
                    !selectedAvatar && error && styles.errorAvatar,
                  ]}
                >
                  <Image
                    source={item.source}
                    style={[
                      styles.avatarImage,
                      selectedAvatar === item.source.uri && styles.selectedAvatar,
                    ]}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
  
          <Text style={styles.title}>{TEXT.onboarding.setProfile.title}</Text>
  
          <Text style={styles.subtitle}>{TEXT.onboarding.setProfile.subtitle}</Text>
  
          <View style={{ marginBottom: height * 0.07, alignItems: 'center' }}>
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddCustomPhoto} disabled={buttonLoading}>
              <Text style={styles.addPhotoText}>{TEXT.onboarding.setProfile.addPhoto}</Text>
            </TouchableOpacity>
  
            {error ? (
              <Text style={{ color: 'red', width: '85%', textAlign: 'center', maxWidth: '70%' }}>
                {error}
              </Text>
            ) : null}
          </View>
  
          <TouchableOpacity style={styles.button} onPress={handleContinuePress}>
            {buttonLoading ? (
              <ActivityIndicator size="large" color="#b3b3b3" />
            ) : (
              <Text style={styles.buttonText}>{TEXT.onboarding.setProfile.continue}</Text>
            )}
          </TouchableOpacity>
  
          <TouchableOpacity
            style={[styles.addPhotoButton, { marginBottom: -20, marginTop: -5 }]}
            onPress={() => setModalVisible((prev) => true)}
          >
            <Text style={[styles.addPhotoText, { fontSize: 14 }]}>
              {TEXT.onboarding.setProfile.viewImage}
            </Text>
          </TouchableOpacity>
  
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>{TEXT.onboarding.setProfile.modalTitle}</Text>
                <View style={styles.modalImagePreviewContainer}>
                  {imageLoading && (
                    <ActivityIndicator size="large" color="#b6b6b6" style={styles.activityIndicator} />
                  )}
  
                  {customImg || onboardingData.profilePicture ? (
                    <Image
                      source={{ uri: String(customImg || onboardingData.profilePicture) }}
                      style={styles.modalImagePreview}
                      resizeMode="cover"
                      onLoad={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                    />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <Text style={styles.placeholderText}>{TEXT.onboarding.setProfile.modalPlaceholder}</Text>
                    </View>
                  )}
                </View>
  
                <View style={styles.modalButtonContainer}>
                  <Button title={TEXT.onboarding.setProfile.modalCancel} onPress={cancelCustomImage} color="#FF3B30" />
                  <Button title={TEXT.onboarding.setProfile.modalConfirm} onPress={confirmCustomImage} color="#007AFF" />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </SafeAreaView>
  );  
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: width * 0.05, 
    paddingTop: height * 0.02, 
  },
  backButton: {
    position: 'absolute',
    top: height * 0.05, 
    left: width * 0.05,
    zIndex: 1,
  },
  backIcon: {
    width: width * 0.08, 
    height: width * 0.08, 
    resizeMode: 'contain',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.05, 
    marginTop: -height * 0.15, 
  },
  appLogo: {
    width: width * 0.13, 
    height: width * 0.13, 
    borderRadius: width * 0.065, 
    marginBottom: height * 0.05,
    backgroundColor: 'transparent',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: height * 0.04, 
  },
  avatarContainer: {
    width: width * 0.26, 
    height: width * 0.26, 
    borderRadius: width * 0.13, 
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15
  },
  selectedAvatarContainer: {
    backgroundColor: '#7A5FFF',
  },
  avatarImage: {
    width: width * 0.25, 
    height: width * 0.25, 
    borderRadius: width * 0.125, 
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedAvatar: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  errorAvatar: {
    borderWidth: 3,
    borderColor: 'red',
  },
  title: {
    fontSize: RFValue(28, height), 
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.01, 
  },
  subtitle: {
    fontSize: RFValue(18, height), 
    width: '75%',
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.005, 
  },
  addPhotoButton: {
    paddingVertical: height * 0.015, 
    paddingHorizontal: width * 0.10, 
    borderRadius: width * 0.065, 
    width: '100%',
    alignItems: 'center', 
    marginBottom: height * 0.01
  },
  addPhotoText: {
    color: '#7A5FFF',
    fontSize: RFValue(19, height), 
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.02, 
    paddingHorizontal: width * 0.10,
    borderRadius: width * 0.075, 
    width: '85%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(19, height), 
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: width * 0.04,
    padding: width * 0.05, 
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: RFValue(20, height), 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.02, 
  },
  modalImagePreviewContainer: {
    width: width * 0.38, 
    height: width * 0.38, 
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalImagePlaceholder: {
    width: width * 0.38, 
    height: width * 0.38, 
    backgroundColor: '#E0E0E0',
    borderRadius: width * 0.19, 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.02, 
  },
  modalImagePreview: {
    width: width * 0.38, 
    height: width * 0.38, 
    borderRadius: width * 0.19, 
    marginBottom: height * 0.02, 
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
  placeholderText: {
    color: '#666',
    fontSize: RFValue(16, height), 
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
});
