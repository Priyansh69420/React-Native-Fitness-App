import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingProvider, useOnboarding } from '../../contexts/OnboardingContext';

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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  backIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: -50,
  },
  appLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40, 
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '110%',
    marginBottom: 50,
  },
  interestItem: {
    width: '33.33%', 
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  selectedIconContainer: {
    backgroundColor: '#7A5FFF', 
  },
  interestIcon: {
    width: 50,
    height: 50,
    tintColor: '#333',
  },
  interestLabel: {
    fontSize: 17,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '75%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});