import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Modal, Image } from 'react-native';
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

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'DailySteps'>;

const { width, height } = Dimensions.get('window');
const CIRCLE_RADIUS = width * 0.35; 
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const graphData = [15.5, 31, 46.5, 62, 77.5, 46.5, 31]; 

interface Avatar {
  id: number;
  source: any;
}

const avatars: Avatar[] = [
  { id: 1, source: require('../../assets/avatar5.png') },
  { id: 2, source: require('../../assets/avatar2.png') },
  { id: 3, source: require('../../assets/avatar4.png') },
];

const getAvatarSource = (id: number): any => {
  const avatar = avatars.find((item) => item.id === id);
  return avatar ? avatar.source : null;
};

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
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [weeklySteps, setWeeklySteps] = useState<DailyStepsPerformance[]>([]);
  const [bestPerformance, setBestPerformance] = useState<DailyStepsPerformance | null>(null);
  const [worstPerformance, setWorstPerformance] = useState<DailyStepsPerformance | null>(null);
  
  useEffect(() => {
    dispatch(fetchSteps());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
  if (!loading && !error) {
    saveDailySteps();
  }
}, [useSelector((state: RootState) => state.footsteps.steps), loading, error]);

  const progress = Math.min(steps / 10000, 1); 
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  const caloriesBurned = Math.round(steps * 0.03);

  const graphWidth = width * 0.85;
  const graphHeight = height * 0.15;
  const maxValue = Math.max(...graphData, 77.5); 
  const points = graphData.map((value, index) => {
    const x = (index / (graphData.length - 1)) * graphWidth;
    const y = graphHeight - (value / maxValue) * graphHeight;
    return `${x},${y}`;
  });
  const pathData = `M0,${graphHeight} ${points.join(' L ')} L${graphWidth},${graphHeight} Z`;

  const profileImageSource =
      typeof userData?.profilePicture === 'string'
        ? { uri: userData.profilePicture }
        : userData?.profilePicture
        ? getAvatarSource(userData.profilePicture)
        : null;
  
    const isCustomImg = typeof profileImageSource === 'object';
  
    const profilePictureStyle = {
      width: isCustomImg ? RFValue(50, height) : RFValue(60, height),
      height: isCustomImg ? RFValue(50, height) : RFValue(60, height),
      borderRadius: RFValue(50, height),
      marginRight: RFPercentage(1),
    };

    const loadData = async () => {
      try {
        const storedDate = await AsyncStorage.getItem('stepsLastDate');
        const storedWeeklySteps = await AsyncStorage.getItem('weeklyStepsPerformance');
        const currentDate = new Date().toISOString().split('T')[0];
    
        if (storedDate && storedDate !== currentDate) {
          setWeeklySteps([]);
          await AsyncStorage.removeItem('weeklyStepsPerformance');
          await AsyncStorage.setItem('stepsLastDate', currentDate);
        }
    
        if (storedWeeklySteps) {
          setWeeklySteps(JSON.parse(storedWeeklySteps));
          updateBestAndWorstPerformance(JSON.parse(storedWeeklySteps));
        } else if (storedDate === currentDate && steps > 0) {
          const currentDay = getDayOfWeek(currentDate);
          setWeeklySteps([{ day: currentDay, count: steps }]); 
          await AsyncStorage.setItem('weeklyStepsPerformance', JSON.stringify([{ day: currentDay, count: steps }]));
        }
      } catch (error) {
        console.error('Error loading steps data from AsyncStorage:', error);
      } finally {
        dispatch(fetchSteps());
      }
    };

    const saveDailySteps = async () => {
      if (steps > 0) { 
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const currentDay = getDayOfWeek(currentDate);

      const updatedPerformance = weeklySteps.map((item) =>
        item.day === currentDay ? { ...item, count: steps } : item 
      );

      const dayExists = updatedPerformance.some((item) => item.day === currentDay);
      if (!dayExists) {
        updatedPerformance.push({ day: currentDay, count: steps }); 
      }

      setWeeklySteps(updatedPerformance);
      await AsyncStorage.setItem('weeklyStepsPerformance', JSON.stringify(updatedPerformance));
      updateBestAndWorstPerformance(updatedPerformance);
    } catch (error) {
      console.error('Error saving weekly steps performance to AsyncStorage:', error);
    }
  }
    };
    

    const updateBestAndWorstPerformance = (performanceData: DailyStepsPerformance[]) => {
      if (performanceData.length > 0) {
        let best = performanceData[0];
        let worst = performanceData[0];
  
        performanceData.forEach((dayData) => {
          if (dayData.count > best.count) {
            best = dayData;
          }
          if (dayData.count < worst.count) {
            worst = dayData;
          }
        });
  
        setBestPerformance(best);
        setWorstPerformance(worst);
      } else {
        setBestPerformance(null);
        setWorstPerformance(null);
      }
    };
  
    const getDayOfWeek = (dateString: string): string => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
      return new Intl.DateTimeFormat('en-US', options).format(date);
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
          <Text style={styles.title}>You walked <Text style={styles.highlight}>{loading ? '...' : error ? 'Error' : steps}</Text> steps today</Text>
        </View>

        <View style={styles.progressContainer}>
          <Svg
            height={CIRCLE_RADIUS * 1.5} 
            width={CIRCLE_RADIUS * 1.5} 
            style={styles.svg} 
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
          </Svg>
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

        <View style={styles.performanceContainer}>
          <View style={[styles.performanceBox, {borderBottomWidth: 0.5, borderBottomColor: "#d9d9d9"}]}>
            <View style={styles.performanceRow}>
              <View style={styles.smileyContainer}>
                <Image
                  source={require('../../assets/greenSmiley.png')}
                  style={styles.smileyIcon}
                />
              </View>
              <Text style={styles.performanceText}>Best Performance</Text>
              <Text style={styles.performanceValue}>{bestPerformance?.count || '-'}</Text>
            </View>
            <Text style={styles.performanceDay}>{bestPerformance?.day || ''}</Text>
          </View>

          <View style={styles.performanceBox}>
            <View style={styles.performanceRow}>
              <View style={styles.smileyContainer}>
                <Image
                  source={require('../../assets/pinkSmiley.png')}
                  style={styles.smileyIcon}
                />
              </View>
              <Text style={styles.performanceText}>Worst Performance</Text>
              <Text style={styles.performanceValue}>{worstPerformance?.count || '-'}</Text>
            </View>
            <Text style={styles.performanceDay}>{worstPerformance?.day || ''}</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
      style={{height: height, width: width}}
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
                    <Circle cx={CIRCLE_RADIUS * 0.75} cy={CIRCLE_RADIUS * 0.75} r={(CIRCLE_RADIUS - 10) * 0.75} stroke="#d9d9d9" strokeWidth={13} fill="none"/>
                    <Circle cx={CIRCLE_RADIUS * 0.75} cy={CIRCLE_RADIUS * 0.75} r={(CIRCLE_RADIUS - 10) * 0.75} stroke="#7A5FFF" strokeWidth={9} fill="none" strokeDasharray={CIRCLE_CIRCUMFERENCE * 0.75} strokeDashoffset={strokeDashoffset * 0.75} strokeLinecap="round" transform={`rotate(-90 ${CIRCLE_RADIUS * 0.75} ${CIRCLE_RADIUS * 0.75})`}/>
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
            <TouchableOpacity style={styles.shareButton}>
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
    paddingVertical: RFPercentage(0.5),
    backgroundColor: '#F5F7FA',
    marginBottom: RFPercentage(1.5),
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
  shareIcon: {
    width: RFValue(30, height),
    height: RFValue(30, height),
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
  svg: {
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginTop: RFPercentage(3),
  },   stat: {
    alignItems: 'center',
    justifyContent: 'center', 
  },
  statValue: { 
    fontSize: RFPercentage(2.5),
    color: '#333',
  },
  statLabel: { 
    fontSize: RFPercentage(1.7), 
    color: '#888', 
  },
  statValueGray: { 
    fontSize: RFPercentage(2.4), 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: RFValue(3, height), 
  },
  divider: { 
    width: 1,
    height: '100%', 
    backgroundColor: '#e0e0e0', 
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
  performanceContainer: {
    backgroundColor: '#F8F8F8',
  },
  performanceBox: {
    backgroundColor: '#FFFFFF',
    padding: width * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBlock: height * 0.001,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
    width: '90%',
  },
  smileyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  smileyIcon: {
    width: RFValue(24, height),
    height: RFValue(24, height),
    marginRight: width * 0.03,
  },
  performanceText: {
    fontSize: RFPercentage(2.2),
    color: '#333',
    flex: 1,
  },
  performanceValue: {
    fontSize: RFPercentage(2.4),
    color: '#333',
  },
  performanceDay: {
    fontSize: RFPercentage(1.7),
    color: '#888',
    marginLeft: width * 0.088,
    marginTop: -(height * 0.009),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05, 
  },
  modalContainer: {
    width: width * 0.9, 
    height: height * 0.85, 
    borderRadius: RFValue(20, height),
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
    top: RFPercentage(1.5),
    right: RFPercentage(1.5),
    padding: 10, 
    zIndex: 10, 
  },
  modalCloseButtonText: {
    fontSize: RFPercentage(2.8),
    color: '#FFFFFF',
    fontWeight: 'normal',
  },
  modalHeaderArea: {
    paddingTop: RFPercentage(4), 
    paddingHorizontal: RFPercentage(2),
    alignItems: 'center',
    zIndex: 1, 
    marginBottom: RFPercentage(4),
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
    marginTop: RFValue(5, height),
  },
  floatingCardScrollView: {
    flex: 1, 
    alignItems: 'center',
    zIndex: 1, 
    marginHorizontal: width * 0.05, 
  },
  floatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RFValue(15, height),
    padding: RFPercentage(2.5),
    alignItems: 'center',
    width: '100%',
    marginBottom: RFPercentage(2), 
    paddingBottom: RFPercentage(7),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(2.5),
    paddingBottom: RFPercentage(1.5),
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
    width: RFValue(35, height), 
    height: RFValue(35, height), 
    resizeMode: 'contain',
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
  modalProgressContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative', 
    width: CIRCLE_RADIUS * 1.5, 
    height: CIRCLE_RADIUS * 1.5, 
    marginBottom: RFPercentage(3),
  },
  modalSvg: {}, 
  progressIcon: { 
    position: 'absolute', 
    width: RFValue(35, height), 
    height: RFValue(35, height), 
    resizeMode: 'contain', 
    top: '30%', 
    transform: [{ translateY: -RFValue(17.5, height) }],
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
    marginTop: RFValue(2, height),
  },
  modalStatsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    width: '90%', 
    marginTop: RFPercentage(1), 
    marginBottom: RFPercentage(1), 
    alignItems: 'center',
  },
  modalFooterArea: {
    paddingBottom: RFPercentage(3), 
    paddingHorizontal: RFPercentage(2),
    alignItems: 'center',
    width: '100%',
    zIndex: 1, 
    marginBottom: RFPercentage(1.3),
  },
  shareButton: { 
    backgroundColor: '#7A5FFF', 
    borderRadius: RFValue(40, height), 
    paddingVertical: RFPercentage(1.5), 
    width: '85%', 
    alignItems: 'center', 
    marginTop: RFPercentage(1), 
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
    marginTop: RFPercentage(1),
    fontWeight: '700',
  },
});