import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Modal, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Svg, { Circle } from 'react-native-svg';
import { AppDispatch, RootState } from '../../store/store';
import { fetchSteps } from '../../store/slices/footstepSlice';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import LineGraph from '../../components/LineGraph';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { saveDailyProgress } from '../../utils/monthlyProgressUtils';
import PerformanceContainer from '../../components/PerformanceContainer';

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'DailySteps'>;

const { width, height } = Dimensions.get('window');
const CIRCLE_RADIUS = width * 0.35;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const graphData = [15.5, 31, 46.5, 62, 77.5, 46.5, 31];

interface DailyStepsPerformance {
  day: string;
  count: number;
}

export default function DailySteps() {
  const dispatch = useDispatch<AppDispatch>();
  const { steps, loading, error } = useSelector((state: RootState) => state.footsteps);
  const { userData } = useSelector((state: RootState) => state.user);
  const navigation = useNavigation<NavigationProp>();
  const [modalVisible, setModalVisible] = useState(false);
  const [bestPerformance, setBestPerformance] = useState<DailyStepsPerformance | null>(null);
  const [worstPerformance, setWorstPerformance] = useState<DailyStepsPerformance | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      // Fetch steps first
      await dispatch(fetchSteps()).unwrap();
      // Then load performance data
      await loadData();
    };
    initializeData();
  }, [dispatch]);

  useEffect(() => {
    if (!loading && !error && steps > 0) {
      saveDailySteps();
    }
  }, [steps, loading, error]);

  const progress = Math.min(steps / 10000, 1);
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  const caloriesBurned = Math.round(steps * 0.03);

  const graphWidth = width * 0.85;
  const graphHeight = height * 0.15;
  const maxValue = Math.max(...graphData, 77.5);
  graphData.forEach((value, index) => {
    const x = (index / (graphData.length - 1)) * graphWidth;
    const y = graphHeight - (value / maxValue) * graphHeight;
    return `${x},${y}`;
  });

  const profileImageSource = typeof userData?.profilePicture === 'string'
    ? { uri: userData.profilePicture }
    : undefined;

  const isCustomImg = typeof userData?.profilePicture === 'string' && !userData.profilePicture.includes('avatar');

  const profilePictureStyle = {
    width: isCustomImg ? RFValue(50, height) : RFValue(65, height),
    height: isCustomImg ? RFValue(50, height) : RFValue(65, height),
    borderRadius: RFValue(50, height),
    marginRight: RFPercentage(1),
  };

  const loadData = async () => {
    try {
      const storedDate = await AsyncStorage.getItem('stepsLastDate');
      const storedWeeklySteps = await AsyncStorage.getItem('weeklyStepsPerformance');
      const currentDate = new Date().toISOString().split('T')[0];

      if (storedDate && storedDate !== currentDate) {
        const currentDayOfWeek = new Date(currentDate).getDay();
        if (currentDayOfWeek === 1) {
          await AsyncStorage.removeItem('weeklyStepsPerformance');
        }
        await AsyncStorage.setItem('stepsLastDate', currentDate);
      }

      if (storedWeeklySteps) {
        const parsedData = JSON.parse(storedWeeklySteps);
        console.log('Loaded Weekly Steps Performance:', parsedData); // Debug log
        updateBestAndWorstPerformance(parsedData);
      } else if (storedDate === currentDate && steps > 0) {
        const currentDay = getDayOfWeek(currentDate);
        const initialData = [{ day: currentDay, count: steps }];
        await AsyncStorage.setItem('weeklyStepsPerformance', JSON.stringify(initialData));
        console.log('Initialized Weekly Steps Performance:', initialData); // Debug log
        updateBestAndWorstPerformance(initialData);
      }
    } catch (error) {
      console.error('Error loading steps data from AsyncStorage:', error);
    }
  };

  const saveDailySteps = async () => {
    if (steps > 0) {
      try {
        const currentDate = new Date().toISOString().split('T')[0];
        const currentDay = getDayOfWeek(currentDate);
        const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const stored = await AsyncStorage.getItem('weeklyStepsPerformance');
        let existingData: DailyStepsPerformance[] = stored ? JSON.parse(stored) : [];

        const baseData = DAYS.map((day) => {
          const existing = existingData.find((item) => item.day === day);
          return existing ?? { day, count: 0 };
        });

        const updatedPerformance = baseData.map((item) =>
          item.day === currentDay ? { ...item, count: steps } : item
        );

        await AsyncStorage.setItem('weeklyStepsPerformance', JSON.stringify(updatedPerformance));
        console.log('Saved Weekly Steps Performance:', updatedPerformance); // Debug log
        updateBestAndWorstPerformance(updatedPerformance);

        await saveDailyProgress({ steps });
      } catch (error) {
        console.error('Error saving weekly steps performance to AsyncStorage:', error);
      }
    }
  };

  const updateBestAndWorstPerformance = (performanceData: DailyStepsPerformance[]) => {
    const nonZeroData = performanceData.filter(day => day.count > 0);

    if (nonZeroData.length === 0) {
      setBestPerformance(null);
      setWorstPerformance(null);
      return;
    }

    if (nonZeroData.length === 1) {
      setBestPerformance(nonZeroData[0]);
      setWorstPerformance(null);
      return;
    }

    let best = nonZeroData[0];
    let worst = nonZeroData[0];

    nonZeroData.forEach((dayData) => {
      if (dayData.count > best.count) {
        best = dayData;
      }
      if (dayData.count < worst.count) {
        worst = dayData;
      }
    });

    setBestPerformance(best);
    setWorstPerformance(worst);
    console.log('Best Performance:', best, 'Worst Performance:', worst); // Debug log
  };

  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const handleShareFriend = async () => {
    try {
      const message = `We have completed a total of ${steps} steps today.`;
      const encodedMessage = encodeURIComponent(message);

      const url =
        Platform.OS === 'ios'
          ? `sms:&body=${encodedMessage}`
          : `sms:?body=${encodedMessage}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Error', 'SMS app is not available.');
      }
    } catch (error: any) {
      console.error('Error', `Could not open SMS app: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Image
            source={require('../../assets/backArrowIcon.png')}
            style={styles.backIcon}
          />
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image
            source={require('../../assets/share-icon.png')}
            style={styles.shareIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.stepsContainer}>
          <Text style={styles.title}>You walked <Text style={styles.highlight}>{loading ? '...' : steps}</Text> steps today</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={{ width: CIRCLE_RADIUS * 1.5, height: CIRCLE_RADIUS * 1.5 }}>
            <Svg
              height={CIRCLE_RADIUS * 1.5}
              width={CIRCLE_RADIUS * 1.5}
              style={StyleSheet.absoluteFill}
            >
              <Circle
                cx={CIRCLE_RADIUS * 0.75}
                cy={CIRCLE_RADIUS * 0.75}
                r={(CIRCLE_RADIUS - 10) * 0.75}
                stroke="#fff"
                strokeWidth={13}
                fill="none"
              />
              <Circle
                cx={CIRCLE_RADIUS * 0.75}
                cy={CIRCLE_RADIUS * 0.75}
                r={(CIRCLE_RADIUS - 10) * 0.75}
                stroke="#7A5FFF"
                strokeWidth={9}
                fill="none"
                strokeDasharray={(CIRCLE_CIRCUMFERENCE * 0.75)}
                strokeDashoffset={strokeDashoffset * 0.75}
                strokeLinecap="round"
                transform={`rotate(-90 ${CIRCLE_RADIUS * 0.75} ${CIRCLE_RADIUS * 0.75})`}
              />
            </Svg>

            <Image
              source={require('../../assets/stepsIcon.png')}
              style={{
                position: 'absolute',
                top: CIRCLE_RADIUS * 0.75 - 75,
                left: CIRCLE_RADIUS * 0.75 - 20,
                width: 40,
                height: 40,
              }}
            />

            <Text
              style={{
                position: 'absolute',
                top: CIRCLE_RADIUS * 0.75 + 10,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 20,
                color: '#000',
                fontWeight: 'bold',
              }}
            >
              {Math.round(progress * 100)}%{'\n'}
              <Text style={{ fontSize: 18, fontWeight: 'normal' }}>
                of daily goal
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{caloriesBurned}</Text>
            <Text style={styles.statLabel}>Cal Burned</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>10000</Text>
            <Text style={styles.statLabel}>Daily goal</Text>
          </View>
        </View>

        <View style={styles.graphContainer}>
          <Text style={styles.graphTitle}>Statistic</Text>
          <LineGraph />
        </View>

        <PerformanceContainer
          bestPerformance={bestPerformance}
          worstPerformance={worstPerformance}
        />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        style={{ height: height, width: width }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalBackground}>
              <View style={styles.topHalfBackground} />
              <View style={styles.bottomHalfBackground} />
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.modalHeaderArea}>
              <Text style={styles.modalHeaderTitle}>{steps >= 10000 ? 'Goal Achieved!' : 'Goal Incomplete!'}</Text>
              <Text style={styles.modalHeaderSubtitle}>{steps >= 10000 ? 'Share with friends!' : `Just ${10000 - steps} steps left`}</Text>
            </View>

            <View style={styles.floatingCardScrollView}>
              <View style={styles.floatingCard}>
                <View style={styles.userInfo}>
                  <Image source={profileImageSource} style={profilePictureStyle} />
                  <Text style={styles.userName}>{userData?.name}</Text>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                  />
                </View>

                <View style={styles.modalProgressContainer}>
                  <Svg
                    height={CIRCLE_RADIUS * 1.5}
                    width={CIRCLE_RADIUS * 1.5}
                    style={styles.modalSvg}
                  >
                    <Circle cx={CIRCLE_RADIUS * 0.75} cy={CIRCLE_RADIUS * 0.75} r={(CIRCLE_RADIUS - 10) * 0.75} stroke="#d9d9d9" strokeWidth={13} fill="none" />
                    <Circle cx={CIRCLE_RADIUS * 0.75} cy={CIRCLE_RADIUS * 0.75} r={(CIRCLE_RADIUS - 10) * 0.75} stroke="#7A5FFF" strokeWidth={9} fill="none" strokeDasharray={CIRCLE_CIRCUMFERENCE * 0.75} strokeDashoffset={strokeDashoffset * 0.75} strokeLinecap="round" transform={`rotate(-90 ${CIRCLE_RADIUS * 0.75} ${CIRCLE_RADIUS * 0.75})`} />
                  </Svg>
                  <Image
                    source={require('../../assets/stepsIcon.png')}
                    style={styles.progressIcon}
                  />
                  <View style={styles.progressTextContainer}>
                    <Text style={styles.progressStepsValue}>{steps}</Text>
                    <Text style={styles.progressStepsLabel}>steps today</Text>
                  </View>
                </View>

                <View style={styles.modalStatsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValueGray}>{caloriesBurned}</Text>
                    <Text style={styles.statLabel}>Cal Burned</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.stat}>
                    <Text style={styles.statValueGray}>10000</Text>
                    <Text style={styles.statLabel}>Daily goal</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modalFooterArea}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShareFriend}>
                <Text style={styles.shareButtonText}>Share to friend</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.notNowText}>Not now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const REFERENCE_HEIGHT = 932;

const MIN_MODAL_WIDTH = 300;
const MAX_MODAL_WIDTH = 400;
const MIN_MODAL_HEIGHT = 500;
const MAX_MODAL_HEIGHT = 750;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(2.5),
    backgroundColor: '#F5F7FA',
    marginTop: (height * 0.009),
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    left: width * 0.008,
    top: height * 0.0015,
  },
  backIcon: {
    width: RFValue(24, REFERENCE_HEIGHT),
    height: RFValue(24, REFERENCE_HEIGHT),
    marginRight: -(width * 0.02),
  },
  backButton: {
    fontSize: RFPercentage(1.8),
    color: '#007AFF',
    fontWeight: '500',
  },
  shareIcon: {
    width: RFValue(30, REFERENCE_HEIGHT),
    height: RFValue(30, REFERENCE_HEIGHT),
  },
  scrollContent: {
    paddingBottom: RFPercentage(5),
    marginTop: RFPercentage(-1.5),
  },
  stepsContainer: {
    alignItems: 'center',
    paddingHorizontal: RFPercentage(2.5),
    paddingVertical: RFPercentage(3),
  },
  title: {
    fontSize: RFPercentage(3.0),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: RFPercentage(0),
    textAlign: 'center',
  },
  highlight: {
    color: '#6B4EFF',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(6),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(2.5),
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.03,
  },
  graphContainer: {
    marginTop: RFPercentage(1),
    marginBottom: RFPercentage(2),
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: RFPercentage(2),
  },
  graphTitle: {
    fontSize: RFPercentage(2.5),
    fontWeight: '400',
    color: '#1A1A1A',
    marginVertical: RFPercentage(1),
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RFValue(16, REFERENCE_HEIGHT),
  },
  modalContainer: {
    width: Math.min(Math.max(width * 0.9, MIN_MODAL_WIDTH), MAX_MODAL_WIDTH),
    height: Math.min(Math.max(height * 0.85, MIN_MODAL_HEIGHT), MAX_MODAL_HEIGHT),
    borderRadius: RFValue(20, REFERENCE_HEIGHT),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    zIndex: 0,
  },
  topHalfBackground: {
    flex: 1,
    backgroundColor: '#7A5FFF',
  },
  bottomHalfBackground: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  modalCloseButton: {
    position: 'absolute',
    top: RFValue(12, REFERENCE_HEIGHT),
    right: RFValue(12, REFERENCE_HEIGHT),
    padding: 10,
    zIndex: 10,
  },
  modalCloseButtonText: {
    fontSize: RFPercentage(2.8),
    color: '#FFFFFF',
    fontWeight: 'normal',
  },
  modalHeaderArea: {
    paddingTop: RFValue(32, REFERENCE_HEIGHT),
    paddingHorizontal: RFValue(16, REFERENCE_HEIGHT),
    alignItems: 'center',
    zIndex: 1,
    marginBottom: RFValue(40, REFERENCE_HEIGHT),
  },
  modalHeaderTitle: {
    fontSize: RFPercentage(3.0),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  modalHeaderSubtitle: {
    fontSize: RFPercentage(2.0),
    color: '#fff',
    textAlign: 'center',
    marginTop: RFValue(5, REFERENCE_HEIGHT),
  },
  floatingCardScrollView: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
    marginHorizontal: RFValue(35, REFERENCE_HEIGHT),
  },
  floatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RFValue(15, REFERENCE_HEIGHT),
    padding: RFValue(20, REFERENCE_HEIGHT),
    alignItems: 'center',
    width: '100%',
    marginBottom: RFValue(16, REFERENCE_HEIGHT),
    paddingBottom: RFValue(56, REFERENCE_HEIGHT),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFValue(20, REFERENCE_HEIGHT),
    paddingBottom: RFValue(12, REFERENCE_HEIGHT),
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    width: '100%',
  },
  userName: {
    fontSize: RFPercentage(2),
    fontWeight: '400',
    color: '#1A1A1A',
    flex: 1,
  },
  logo: {
    width: RFValue(35, REFERENCE_HEIGHT),
    height: RFValue(35, REFERENCE_HEIGHT),
    resizeMode: 'contain',
  },
  modalProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: CIRCLE_RADIUS * 1.5,
    height: CIRCLE_RADIUS * 1.5,
    marginBottom: RFValue(24, REFERENCE_HEIGHT),
  },
  modalSvg: {},
  progressIcon: {
    position: 'absolute',
    width: RFValue(35, REFERENCE_HEIGHT),
    height: RFValue(35, REFERENCE_HEIGHT),
    resizeMode: 'contain',
    top: '30%',
    transform: [{ translateY: -RFValue(17.5, REFERENCE_HEIGHT) }],
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '58%',
  },
  progressStepsValue: {
    fontSize: RFPercentage(2.8),
    color: '#1A1A1A',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressStepsLabel: {
    fontSize: RFPercentage(1.8),
    color: '#555',
    textAlign: 'center',
    marginTop: RFValue(2, REFERENCE_HEIGHT),
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginTop: RFValue(8, REFERENCE_HEIGHT),
    marginBottom: RFValue(8, REFERENCE_HEIGHT),
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: RFPercentage(2.5),
    color: '#333',
  },
  statValueGray: {
    fontSize: RFPercentage(2.4),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: RFValue(3, REFERENCE_HEIGHT),
  },
  statLabel: {
    fontSize: RFPercentage(1.7),
    color: '#888',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  modalFooterArea: {
    paddingBottom: RFValue(24, REFERENCE_HEIGHT),
    paddingHorizontal: RFValue(16, REFERENCE_HEIGHT),
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
    marginBottom: RFValue(5, REFERENCE_HEIGHT),
  },
  shareButton: {
    backgroundColor: '#7A5FFF',
    borderRadius: RFValue(40, REFERENCE_HEIGHT),
    paddingVertical: RFValue(15, REFERENCE_HEIGHT),
    width: '80%',
    alignItems: 'center',
    marginTop: RFValue(12, REFERENCE_HEIGHT),
  },
  shareButtonText: {
    fontSize: RFPercentage(2.1),
    color: '#fff',
    fontWeight: '700',
  },
  notNowText: {
    fontSize: RFPercentage(2.1),
    color: '#7A5FFF',
    textAlign: 'center',
    marginTop: RFValue(12, REFERENCE_HEIGHT),
    fontWeight: '700',
  },
});