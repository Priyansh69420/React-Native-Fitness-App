import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { RFValue } from 'react-native-responsive-fontsize';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SetProfile">;

const logo = require("../../assets/logo.png");
const backIcon = require("../../assets/backIcon.png");

interface items {
  id: number,
  label: string,
  source: any,
}

const interests: items[] = [
  {id: 1, label: "Fashion", source: require("../../assets/fashionIcon.png")},
  {id: 2, label: "Organic", source: require("../../assets/organicIcon.png")},
  {id: 3, label: "Meditation", source: require("../../assets/meditationIcon.png")},
  {id: 4, label: "Fitness", source: require("../../assets/fitnessIcon.png")},
  {id: 5, label: "Smoke Free", source: require("../../assets/smokeIcon.png")},
  {id: 6, label: "Sleep", source: require("../../assets/sleepIcon.png")},
  {id: 7, label: "Health", source: require("../../assets/healthIcon.png")},
  {id: 8, label: "Running", source: require("../../assets/runningIcon.png")},
  {id: 9, label: "Vegan", source: require("../../assets/veganIcon.png")}
];

export default function Intrests() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedInterest, setSelectedInterest] = useState<number[]>([]);
  const {updateOnboardingData} = useOnboarding();

  const handleInterestsPress = (interestId: number) => {
    if(selectedInterest.includes(interestId)) {
      setSelectedInterest(selectedInterest.filter((id) => id != interestId));
    } else {
      setSelectedInterest([...selectedInterest, interestId]);
    }
  };

  const handleContinuePress = () => {
    if(selectedInterest.length > 0) {
      updateOnboardingData({interests: selectedInterest});
      navigation.navigate('Gender');
    }
    else Alert.alert('Please select at least one interest');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} >
          <Image source={backIcon} style={styles.backIcon}/>
        </TouchableOpacity>

        <View style={styles.centeredContent}>
          <Image source={logo} style={styles.appLogo} resizeMode='contain' />

          <Text style={styles.title}>Time to customize your interests</Text>

          <View style={styles.interestsContainer}>
            {interests.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.interestItem}
                onPress={() => handleInterestsPress(item.id)}
              >
                <View
                  style={[
                    styles.iconContainer,
                    selectedInterest.includes(item.id) && styles.selectedIconContainer,
                  ]}
                >
                  <Image 
                    source={item.source} 
                    style={styles.interestIcon}
                    resizeMode='contain'
                  />
                </View>
                <Text style={styles.interestLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleContinuePress} >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const { width, height } = Dimensions.get('window');

const guidelineBaseWidth = 390; // Width of iPhone 15 Pro Max
const guidelineBaseHeight = 844; // Height of iPhone 15 Pro Max

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
  },
  backButton: {
    position: 'absolute',
    top: verticalScale(40),
    left: scale(20),
    zIndex: 1,
  },
  backIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
  },
  appLogo: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginBottom: verticalScale(40), // Adjusted marginBottom
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: RFValue(26),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: verticalScale(30), // Adjusted marginBottom
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around', // Changed to space-around
    width: '115%', // Use full width
    marginBottom: verticalScale(40), // Adjusted marginBottom
    
  },
  interestItem: {
    width: '30%', // Adjusted width for better spacing
    alignItems: 'center',
    marginBottom: verticalScale(15), // Adjusted marginBottom
  },
  iconContainer: {
    width: scale(90), // Slightly smaller icon container
    height: scale(90), // Slightly smaller icon container
    borderRadius: scale(50),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
    marginBottom: verticalScale(5), // Adjusted marginBottom
  },
  selectedIconContainer: {
    backgroundColor: '#7A5FFF',
  },
  interestIcon: {
    width: scale(40), // Slightly smaller icon
    height: scale(40), // Slightly smaller icon
    tintColor: '#333',
  },
  interestLabel: {
    fontSize: RFValue(16), // Slightly smaller font
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.018, // Slightly adjusted padding
    paddingHorizontal: width * 0.15, // Slightly adjusted padding
    borderRadius: scale(50),
    width: width * 0.8, // Use a more consistent percentage
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(18),
    fontWeight: 'bold',
  },
});

