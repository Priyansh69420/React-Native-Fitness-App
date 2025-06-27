import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { auth } from '../../../firebaseConfig';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { fetchUserData, loadUserDataFromRealm } from '../../store/slices/userSlice';
import { loadData } from './Water';
import { fetchSteps } from '../../store/slices/footstepSlice';
import { useRealm } from '../../../realmConfig';
import { useTheme } from '../../contexts/ThemeContext';

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'Home'>;

const { width, height } = Dimensions.get('window');

export default function Home() {
  const { userData, loading } = useSelector((state: RootState) => state.user);
  let { steps } = useSelector((state: RootState) => state.footsteps);
  const [glassDrunk, setGlassDrunk] = useState<number>(0);
  const [rehydrated, setRehydrated] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const realm = useRealm();
  const theme = useTheme();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable));
    });
    setRehydrated(true);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (rehydrated && !userData) {
      if (!isOffline) {
        dispatch(loadUserDataFromRealm(realm));
      } else {
        dispatch(fetchUserData()).then((result) => {
          if (result.meta.requestStatus === 'rejected') {
            dispatch(loadUserDataFromRealm(realm));
          }
        });
      }
    }
  }, [rehydrated, dispatch, userData, isOffline, realm]);

  useEffect(() => {
    loadData(setGlassDrunk);
    dispatch(fetchSteps()).then((result) => {
      if (result.meta.requestStatus === 'rejected') {
        const user = realm.objects('User')[0];
        if (user) {
          steps = 0;
        }
      }
    });

    const unsubscribe = navigation.addListener('focus', () => {
      loadData(setGlassDrunk);
      dispatch(fetchSteps()).then((result) => {
        if (result.meta.requestStatus === 'rejected') {
          const user = realm.objects('User')[0];
          if (user) {
            steps = 0;
          }
        }
      });
    });

    return unsubscribe;
  }, [navigation, dispatch, realm]);

  if (loading || !rehydrated || (!userData && !loading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.backgroundButtonPrimary} />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={[styles.greeting, { color: theme.textPrimary }]}>Welcome, User!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Please complete your profile setup.</Text>
        <TouchableOpacity onPress={() => auth.signOut()}>
          <Text style={[styles.signOut, { color: theme.textError }]}>Sign-Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profileImageSource = typeof userData?.profilePicture === 'string'
    ? { uri: userData.profilePicture }
    : undefined;

  const isCustomImg = typeof userData?.profilePicture === 'string' &&
    !userData.profilePicture.includes('avatar');

  const profilePictureStyle = {
    width: isCustomImg ? RFValue(65, height) : RFValue(70, height),
    height: isCustomImg ? RFValue(65, height) : RFValue(70, height),
    borderRadius: RFValue(50, height),
    marginRight: RFPercentage(1),
  };

  const nutritionProgress = Math.min((userData?.calories || 0) / userData?.calorieGoal, 1);
  const waterProgress = glassDrunk / userData?.glassGoal;
  const stepsProgress = Math.min(steps / userData?.stepGoal, 1);

  return (
    <ScrollView>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.drawerContainer}
            onPress={() => navigation.openDrawer()}
          >
            <Image
              source={require('../../assets/drawerIcon.png')}
              style={[styles.drawerIcon, { tintColor: theme.iconPrimary }]}
            />
          </TouchableOpacity>
          <View style={styles.profileContainer}>
            <View style={styles.imageWrapper}>
              {imageLoading && (
                <ActivityIndicator
                  size="small"
                  color="#b3b3b3"
                  style={styles.activityIndicator}
                />
              )}
              {profileImageSource ? (
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                  <Image
                    source={profileImageSource}
                    style={profilePictureStyle}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                  <View style={[styles.editIcon, { backgroundColor: theme.backgroundButtonPrimary, borderColor: theme.backgroundPrimary }]}>
                    <Image
                      source={require('../../assets/editIon.png')}
                      style={{ height: 12, width: 12, alignContent: 'center', tintColor: theme.textButtonPrimary }}
                    />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.placeholderProfile} />
              )}
            </View>
          </View>
        </View>

        <Text style={[styles.greeting, { color: theme.textPrimary }]}>Greetings, {userData.name || 'User'}</Text>
        <Text style={[styles.subtitle, { color: theme.textPrimary }]}>
          Eat the right amount of food and stay hydrated through the day
        </Text>

        <TouchableOpacity style={styles.detailsOption} onPress={() => navigation.navigate('MoreDetail')}>
          <Text style={[styles.detailsText, { color: theme.textButtonSecondary }]}>More Details</Text>
        </TouchableOpacity>

        <View>
          <TouchableOpacity
            style={[styles.section, { backgroundColor: theme.backgroundSecondary, borderTopColor: theme.borderTertiary, borderBottomColor: theme.borderTertiary }]}
            onPress={() => navigation.navigate('Nutrition')}
          >
            <View style={styles.sectionContent}>
              <View style={styles.sectionRow}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('../../assets/nutritionIcon.png')}
                    style={styles.sectionIcon}
                  />
                </View>
                <View style={styles.sectionDetails}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Nutrition</Text>
                    <TouchableOpacity 
                      style={[
                        styles.warningButton, 
                        userData?.calories >= userData?.calorieGoal ? { backgroundColor: '#C8F2C8' } : null
                      ]}
                    >
                      <Text style={[styles.toggleText, styles.warningText, userData?.calories >= userData?.calorieGoal ? { color: 'green' } : null]}>
                        {userData?.calories >= userData?.calorieGoal ? 'Completed' : 'Warning'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.sectionProgress, { color: theme.textPlaceholder }]}>
                    {userData?.calories ?? 0} cal / {userData?.calorieGoal ?? 2000} cal
                  </Text>
                  <View style={[styles.progressBarContainer, { backgroundColor: theme.backgroundBadge }]}>
                    <LinearGradient
                      colors={['#66D3C8', '#66D3C8', '#9D6DEB', '#9D6DEB', '#FFA500', '#FFA500']}
                      locations={[0, 0.33, 0.33, 0.66, 0.66, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBar, { width: `${nutritionProgress * 100}%` }]}
                    />
                    <View
                      style={[styles.progressMarker, { left: `${nutritionProgress * 100}%` }]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.section, { backgroundColor: theme.backgroundSecondary, borderTopColor: theme.borderTertiary, borderBottomColor: theme.borderTertiary }]} onPress={() => navigation.navigate('Water')}>
            <View style={styles.sectionContent}>
              <View style={styles.sectionRow}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('../../assets/waterIcon.png')}
                    style={styles.sectionIcon}
                  />
                </View>
                <View style={styles.sectionDetails}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Water</Text>
                    <TouchableOpacity 
                      style={[
                        styles.warningButton, 
                        glassDrunk >= userData?.glassGoal ? { backgroundColor: '#C8F2C8' } : null
                      ]}
                    >
                      <Text style={[styles.toggleText, styles.warningText, glassDrunk >= userData?.glassGoal ? { color: 'green' } : null]}>
                        {glassDrunk >= userData?.glassGoal ? 'Completed' : 'Warning'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.sectionProgress, { color: theme.textPlaceholder }]}>
                    {glassDrunk} / {userData?.glassGoal ?? 8} glasses
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <LinearGradient
                      colors={['#66D3C8', '#66D3C8', '#9D6DEB', '#9D6DEB', '#FFA500', '#FFA500']}
                      locations={[0, 0.33, 0.33, 0.66, 0.66, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBar, { width: `${waterProgress * 100}%` }]}
                    />
                    <View
                      style={[styles.progressMarker, { left: `${waterProgress * 100}%` }]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.section, { backgroundColor: theme.backgroundSecondary, borderTopColor: theme.borderTertiary, borderBottomColor: theme.borderTertiary }]}
            onPress={() => navigation.navigate('DailySteps')}
          >
            <View style={styles.sectionContent}>
              <View style={styles.sectionRow}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('../../assets/stepsIcon.png')}
                    style={styles.sectionIcon}
                  />
                </View>
                <View style={styles.sectionDetails}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Daily Steps</Text>
                    <TouchableOpacity style={styles.toggleButton}>
                      <Text style={styles.toggleText}>On</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.sectionProgress, { color: theme.textPlaceholder }]}>
                    {steps} steps / {userData?.stepGoal ?? 10000} steps
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <LinearGradient
                      colors={['#66D3C8', '#66D3C8', '#9D6DEB', '#9D6DEB', '#FFA500', '#FFA500']}
                      locations={[0, 0.33, 0.33, 0.66, 0.66, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBar, { width: `${stepsProgress * 100}%` }]}
                    />
                    <View
                      style={[styles.progressMarker, { left: `${stepsProgress * 100}%` }]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: theme.backgroundPrimary, height: '100%' }} />
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.025,
  },
  drawerContainer: {
    marginTop: -(height * 0.011),
    marginLeft: width * 0.006,
  },
  drawerIcon: {
    width: RFValue(31, height),
    height: RFValue(31, height),
  },
  profileContainer: {
    width: RFValue(50, height),
    height: RFValue(50, height),
    borderRadius: RFValue(25, height),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: width * 0.03,
  },
  placeholderProfile: {
    width: RFValue(65, height),
    height: RFValue(65, height),
    borderRadius: RFValue(33, height),
    backgroundColor: '#D6D6D6',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    overflow: 'hidden', 
    position: 'relative', 
  },
  activityIndicator: {
    position: 'absolute',
    zIndex: 1,
  },
  editIcon: {
    position: 'absolute',
    bottom: 2, 
    right: 3, 
    backgroundColor: '#7A5FFF', 
    borderRadius: 10, 
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F5F7FA',
  },
  greeting: {
    fontSize: RFPercentage(3.8),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: width * 0.05,
    marginTop: height * 0.03,
  },
  subtitle: {
    fontSize: RFPercentage(2),
    color: '#666',
    width: width * 0.8,
    marginLeft: width * 0.05,
    marginTop: height * 0.01,
    marginBottom: height * 0.023,
  },
  detailsOption: {
    marginBottom: height * 0.043, 
    marginLeft: width * 0.05,
    maxWidth: '30%'
  },
  detailsText: {
    fontSize: RFPercentage(2.2), 
    fontWeight: 'bold', 
    color: '#7A5FFF'
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.2,
    borderBottomColor: '#999',
    borderTopWidth: 0.2,
    borderTopColor: '#999',
    marginBottom: 0.5
  },
  sectionContent: {
    padding: width * 0.04,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: RFValue(30, height),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.06,
  },
  sectionIcon: {
    width: RFValue(35, height),
    height: RFValue(35, height),
  },
  sectionDetails: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.005, 
  },
  sectionTitle: {
    fontSize: RFPercentage(2.2),
    fontWeight: '600',
    color: '#333',
  },
  sectionProgress: {
    fontSize: RFPercentage(1.8),
    color: '#999',
    marginBottom: height * 0.03,
    marginTop: -(height * 0.01) 
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E6E6FA',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: height * 0.02,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressMarker: {
    position: 'absolute',
    top: -4,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerLine: {
    fontSize: RFPercentage(1),
    color: '#000',
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: '#E6E0FF',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.09,
    borderRadius: 20,
  },
  toggleText: {
    fontSize: RFPercentage(1.5),
    color: '#6B4EFF',
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#FFE5D0',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.05,
    borderRadius: 20,
  },
  warningText: {
    color: '#FF9500',
  },
  signOut: {
    fontSize: RFPercentage(2),
    color: '#FF0000',
    marginTop: height * 0.02,
  },
});
