import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { RFValue } from 'react-native-responsive-fontsize';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Goals">;

const logo = require('../../assets/logo.png');
const backIcon = require('../../assets/backIcon.png');
const checkIcon = require('../../assets/checkIcon.png');

const goals = [
  { id: 1, label: 'Weight Loss' },
  { id: 2, label: 'Better sleeping habit' },
  { id: 3, label: 'Track my nutrition' },
  { id: 4, label: 'Improve overall fitness' },
];

export default function SetGoalsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const {updateOnboardingData, onboardingData} = useOnboarding();

  useEffect(() => {
    if(onboardingData.goals) setSelectedGoals(onboardingData.goals)
  }, [])

  const handleGoalPress = (goalId: number) => {
    const selectedGoal = goals.find(goal => goal.id === goalId);
    if (selectedGoal) {
      if (selectedGoals.includes(selectedGoal.label)) {
        setSelectedGoals(selectedGoals.filter(label => label !== selectedGoal.label));
      } else {
        setSelectedGoals([...selectedGoals, selectedGoal.label]);
      }
    }
  };

  const handleContinuePress = () => {
    if (selectedGoals.length > 0) {
      updateOnboardingData({goals: selectedGoals});
      navigation.navigate('Intrests');
    } else {
      setError('Please select at least one goal');
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

          <Text style={styles.title}>Let us know how we can help you</Text>

          <Text style={styles.subtitle}>You can always change this later</Text>

          <View style={styles.goalsContainer}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalItem}
                onPress={() => handleGoalPress(goal.id)}
              >
                <Text style={styles.goalText}>{goal.label}</Text>
                <View
                  style={[
                    styles.checkbox,
                    selectedGoals.includes(goal.label) && styles.selectedCheckbox,
                  ]}
                >
                  {selectedGoals.includes(goal.label) && (
                    <Image source={checkIcon} style={styles.checkIcon} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {error ? <Text style={{color: 'gray', width: '100%', textAlign: 'center'}}>{error}</Text>: <></>}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleContinuePress}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const baseWidth = 430;
const baseHeight = 932;

const widthRatio = width / baseWidth;
const heightRatio = height / baseHeight;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 10 * widthRatio,
    paddingTop: 20 * heightRatio,
  },
  backButton: {
    position: 'absolute',
    top: 40 * heightRatio,
    left: 20 * widthRatio,
    zIndex: 1,
  },
  backIcon: {
    width: 30 * widthRatio,
    height: 30 * widthRatio,
    resizeMode: 'contain',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20 * widthRatio,
    
  },
  appLogo: {
    width: 50 * widthRatio,
    height: 50 * widthRatio,
    borderRadius: 25 * widthRatio,
    marginBottom: 50 * heightRatio,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10 * heightRatio,
    width: '75%',
  },
  subtitle: {
    fontSize: RFValue(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: 40 * heightRatio,
  },
  goalsContainer: {
    width: '100%',
    marginBottom: 60 * heightRatio,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10 * widthRatio,
    paddingVertical: 25 * heightRatio,
    paddingHorizontal: 15 * widthRatio,
    marginBottom: 20 * heightRatio,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 * heightRatio },
    shadowOpacity: 0.1,
    shadowRadius: 4 * widthRatio,
    elevation: 2,
  },
  goalText: {
    fontSize: RFValue(16),
    color: '#333',
  },
  checkbox: {
    width: 24 * widthRatio,
    height: 24 * widthRatio,
    borderRadius: 12 * widthRatio,
    borderWidth: 1,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  selectedCheckbox: {
    backgroundColor: '#7A5FFF',
    borderColor: '#7A5FFF',
  },
  checkIcon: {
    width: 21 * widthRatio,
    height: 21 * widthRatio,
    tintColor: '#FFF',
  },
  button: {
    backgroundColor: '#7A5FFF',
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.1,
    borderRadius: 50 * widthRatio,
    width: width * 0.75,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: RFValue(18),
    fontWeight: 'bold',
  },
});