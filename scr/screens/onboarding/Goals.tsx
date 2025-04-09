import { View, Text, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../contexts/OnboardingContext';

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
  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
  const {updateOnboardingData} = useOnboarding();

  const handleGoalPress = (goalId: number) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((id) => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleContinuePress = () => {
    if (selectedGoals.length > 0) {
      updateOnboardingData({goals: selectedGoals});
      navigation.navigate('Intrests');
    } else {
      Alert.alert('Please select at least one goal');
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
                    selectedGoals.includes(goal.id) && styles.selectedCheckbox,
                  ]}
                >
                  {selectedGoals.includes(goal.id) && (
                    <Image source={checkIcon} style={styles.checkIcon} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleContinuePress}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
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
    marginTop: -130,
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  goalsContainer: {
    width: '100%',
    marginBottom: 60,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalText: {
    fontSize: 16,
    color: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    width: 21,
    height: 21,
    tintColor: '#FFF', 
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