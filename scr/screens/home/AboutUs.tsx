import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { SettingStackParamList } from '../../navigations/SettingStackParamList'; 

type NavigationProp = DrawerNavigationProp<SettingStackParamList, 'AboutUs'>;

const { width, height } = Dimensions.get('window');

export default function AboutUs() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/backArrowIcon.png')} 
            style={styles.backIcon}
          />
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
            <Image
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            />
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>About Us</Text>
      </View>

      <Text style={styles.description}>
        Welcome to our Fitness App, your ultimate companion for a healthier lifestyle! We are a
        passionate team dedicated to helping you achieve your fitness goals through personalized
        workouts, nutrition plans, and community support. Whether you're a beginner or a seasoned
        athlete, our app is designed to empower you on your wellness journey.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA', 
    marginTop: -(height * 0.015),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    position: 'relative', 
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute', 
    left: width * 0.042,
    top: height * 0.02,
  },
  backIcon: {
    width: RFValue(24, height),
    height: RFValue(24, height),
    marginRight: -(width * 0.02), 
  },
  backButton: {
    fontSize: RFPercentage(1.8), 
    color: '#007AFF',
    fontWeight: '500',
  },
  logoContainer: {
    width: RFValue(80, height), 
    height: RFValue(80, height),
    borderRadius: RFValue(40, height),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, 
    marginTop: height * 0.1,
    marginBottom: height * 0.01,
  },
  logo: {
    width: RFValue(60, height), 
    height: RFValue(60, height),
  },
  titleContainer: {
    paddingHorizontal: 60,
  },
  title: {
    fontSize: RFPercentage(4),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', 
    marginVertical: height * 0.015,
    marginBottom: height * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#D3D3D3',
  },
  description: {
    fontSize: RFPercentage(2),
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.03,
    lineHeight: RFPercentage(3),
  },
});