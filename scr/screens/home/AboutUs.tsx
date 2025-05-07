import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Linking, // For social media links
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

      {/* Mission Statement */}
      <Text style={styles.missionStatement}>
        "Empowering Your Fitness Journey"
      </Text>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>About Us</Text>
      </View>

      <Text style={styles.description}>
        Welcome to our Fitness App, your ultimate companion for a healthier lifestyle! We are a
        passionate team dedicated to helping you achieve your fitness goals through personalized
        workouts, nutrition plans, and community support. Whether you're a beginner or a seasoned
        athlete, our app is designed to empower you on your wellness journey.
      </Text>

      {/* Team Section */}
      <View style={styles.teamContainer}>
        <Text style={styles.teamTitle}>Meet Our Team</Text>
        <View style={styles.teamMembers}>
          <View style={styles.teamMember}>
            <Image
              source={require('../../assets/team_icon_1.jpg')} 
              style={styles.teamIcon}
            />
            <Text style={styles.teamName}>Jane Doe</Text>
            <Text style={styles.teamRole}>Founder & Fitness Coach</Text>
          </View>
          <View style={styles.teamMember}>
            <Image
              source={require('../../assets/team_icon_2.jpg')} 
              style={styles.teamIcon}
            />
            <Text style={styles.teamName}>John Smith</Text>
            <Text style={styles.teamRole}>Nutrition Expert</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginTop: height * 0.03,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: width * 0.03,
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
  missionStatement: {
    fontSize: RFPercentage(2.5),
    fontWeight: 'bold',
    color: '#7A5FFF', // Accent color to make it stand out
    textAlign: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
  },
  titleContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#D3D3D3',
    marginHorizontal: width * 0.15,
    paddingBottom: height * 0.015,
    alignItems: 'center',
    marginVertical: height * 0.02,
  },
  title: {
    fontSize: RFPercentage(4),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: RFPercentage(2),
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: width * 0.08,
    marginBottom: height * 0.03,
    lineHeight: RFPercentage(3),
  },
  teamContainer: {
    marginTop: height * 0.03,
    marginHorizontal: width * 0.08,
    marginBottom: height * 0.03,
    justifyContent: 'space-evenly',
  },
  teamTitle: {
    fontSize: RFPercentage(2.5),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.015,
  },
  teamMembers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: height * 0.01,
  },
  teamMember: {
    alignItems: 'center',
  },
  teamIcon: {
    width: RFValue(50, height),
    height: RFValue(50, height),
    borderRadius: RFValue(25, height),
    marginBottom: height * 0.01,
  },
  teamName: {
    fontSize: RFPercentage(1.8),
    fontWeight: '600',
    color: '#333',
  },
  teamRole: {
    fontSize: RFPercentage(1.6),
    color: '#666',
  },
  socialContainer: {
    marginHorizontal: width * 0.08,
    marginBottom: height * 0.03,
  },
  socialTitle: {
    fontSize: RFPercentage(2.5),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.015,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: width * 0.05,
  },
  socialIcon: {
    width: RFValue(30, height),
    height: RFValue(30, height),
  },
  ctaButton: {
    backgroundColor: '#7A5FFF',
    borderRadius: RFValue(10, height),
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.08,
    alignSelf: 'center',
    marginBottom: height * 0.03,
  },
  ctaText: {
    fontSize: RFPercentage(2),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});