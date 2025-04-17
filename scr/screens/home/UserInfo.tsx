import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import React from 'react';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { CommunityStackParamList } from '../../navigations/CommunityStackParamList';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UserInfoScreenRouteProp } from '../../navigations/CommunityStack';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { Feather } from '@expo/vector-icons';

type NavigationProp = DrawerNavigationProp<CommunityStackParamList, 'UserInfo'>;

const UserInfo = () => {
  const route = useRoute<UserInfoScreenRouteProp>();
  const { user } = route.params; 
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Image source={require('../../assets/backArrowIcon.png')} style={styles.backIcon} />
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder} />
          )}
          <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
          {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Feather name="target" size={RFValue(20, height)} color="#27ae60" style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: '#27ae60' }]}>Goals</Text>
          </View>
          {user?.goals && user.goals.length > 0 ? (
            user.goals.map((goal, index) => (
              <Text key={index} style={styles.infoText}>• {goal}</Text>
            ))
          ) : (
            <Text style={styles.emptyText}>No goals specified.</Text>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Feather name="heart" size={RFValue(20, height)} color="#e74c3c" style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: '#e74c3c' }]}>Interests</Text>
          </View>
          {user?.interests && user.interests.length > 0 ? (
            user.interests.map((interest, index) => (
              <Text key={index} style={styles.infoText}>• {interest}</Text>
            ))
          ) : (
            <Text style={styles.emptyText}>No interests specified.</Text>
          )}
        </View>

        {user?.gender && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Feather name="user" size={RFValue(20, height)} color="#3498db" style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: '#3498db' }]}>Gender</Text>
            </View>
            <Text style={styles.infoText}>{user.gender || 'Not specified'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  container: {
    padding: RFPercentage(2.4),
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(2.4),
    paddingTop: RFPercentage(4),
    paddingBottom: RFPercentage(1),
    backgroundColor: '#f4f4f4',
  },
  backButtonContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: RFPercentage(3),
    marginTop: RFPercentage(3),
  },
  profileImage: {
    width: RFValue(120, height),
    height: RFValue(120, height),
    borderRadius: RFValue(60, height),
    marginBottom: RFPercentage(1.2),
    borderWidth: RFValue(3, height),
    borderColor: '#ddd',
    elevation: 8, 
  },
  profileImagePlaceholder: {
    width: RFValue(120, height),
    height: RFValue(120, height),
    borderRadius: RFValue(60, height),
    backgroundColor: '#ddd',
    marginBottom: RFPercentage(1.2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: RFPercentage(3.2),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: RFPercentage(0.5),
  },
  userEmail: {
    fontSize: RFPercentage(1.8),
    color: '#777',
    marginBottom: RFPercentage(2),
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: RFPercentage(2),
    borderRadius: RFValue(10, height),
    marginBottom: RFPercentage(1.8),
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1),
  },
  sectionIcon: {
    marginRight: RFValue(8, height),
  },
  sectionTitle: {
    fontSize: RFPercentage(2.5),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 0,
  },
  infoText: {
    fontSize: RFPercentage(2),
    color: '#444',
    marginBottom: RFPercentage(0.8),
    paddingLeft: RFValue(28, height), 
  },
  emptyText: {
    fontSize: RFPercentage(2),
    color: '#999',
    paddingLeft: RFValue(28, height),
  },
});

export default UserInfo;