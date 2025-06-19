import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Linking,
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

      <View style={styles.teamContainer}>
        <Text style={styles.teamTitle}>Meet Our Team</Text>
        <View style={styles.teamMembers}>
          <View style={[styles.teamMember, {marginLeft: -10}]}>
            <Image
              source={require('../../assets/team_icon_1.jpg')} 
              style={styles.teamIcon}
            />
            <Text style={styles.teamName}>Jane Doe</Text>
            <Text style={styles.teamRole}>Founder & Fitness Coach</Text>
            <View style={{flexDirection: 'row', marginTop: 5, justifyContent: 'space-evenly', marginLeft: 5}}>
              <TouchableOpacity onPress={() => Linking.openURL('https://twitter.com/yourpage')}>
                <Image source={require('../../assets/twitter.png')} style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/yourpage')}>
                <Image source={require('../../assets/instagram.png')} style={styles.socialIcon} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.teamMember}>
            <Image
              source={require('../../assets/team_icon_2.jpg')} 
              style={styles.teamIcon}
            />
            <Text style={[styles.teamName, {marginLeft: 10}]}>John Smith</Text>
            <Text style={[styles.teamRole, {marginLeft: 10}]}>Nutrition Expert</Text>
            <View style={{flexDirection: 'row', marginTop: 5, justifyContent: 'space-evenly', marginLeft: 10}}>
              <TouchableOpacity onPress={() => Linking.openURL('https://twitter.com/yourpage')}>
                <Image source={require('../../assets/twitter.png')} style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/yourpage')}>
                <Image source={require('../../assets/instagram.png')} style={styles.socialIcon} />
              </TouchableOpacity>
            </View>
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
    marginTop: height * 0.05,
  },
  logo: {
    width: RFValue(60, height),
    height: RFValue(60, height),
  },
  missionStatement: {
    fontSize: RFPercentage(2.5),
    fontWeight: 'bold',
    color: '#7A5FFF', 
    textAlign: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
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
    width: '82%'
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
    justifyContent: 'space-evenly',
    marginTop: height * 0.01,
  },
  teamMember: {
    alignItems: 'center',
  },
  teamIcon: {
    width: RFValue(80, height),
    height: RFValue(80, height),
    borderRadius: RFValue(50, height),
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
  socialIcon: {
    width: 16,
    height: 16,
    marginHorizontal: 10,
  },  
});