import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../../firebaseConfig';
import { saveDailyProgress } from '../../utils/monthlyProgressUtils';
import PerformanceContainer from '../../components/PerformanceContainer';

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'Water'>;

const { width, height } = Dimensions.get('window');

const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // e.g., "2025-03-31"
};

const getUserStorageKey = (baseKey: string) => {
  const userId = auth.currentUser?.uid;
  return userId ? `${userId}_${baseKey}` : '';
};

export const loadData = async (setGlassDrunk: React.Dispatch<React.SetStateAction<number>>) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  try {
    const storedDateKey = getUserStorageKey('lastDate');
    const storedGlassDrunkKey = getUserStorageKey('glassDrunk');

    const storedDate = await AsyncStorage.getItem(storedDateKey);
    const storedGlassDrunk = await AsyncStorage.getItem(storedGlassDrunkKey);

    const currentDate = getCurrentDate();

    if (storedDate && storedDate !== currentDate) {
      setGlassDrunk(0);
      await AsyncStorage.setItem(storedGlassDrunkKey, '0');
      await AsyncStorage.setItem(storedDateKey, currentDate);
    } else if (storedGlassDrunk) {
      setGlassDrunk(parseInt(storedGlassDrunk, 10));
    }

    if (!storedDate) {
      await AsyncStorage.setItem(storedDateKey, currentDate);
    }
  } catch (error) {
    console.error('Error loading data from AsyncStorage:', error);
  }
};

export default function Water() {
  const totalGlasses = 8;
  const [glassDrunk, setGlassDrunk] = useState<number>(0);
  const [weeklyPerformance, setWeeklyPerformance] = useState<{ day: string; count: number }[]>([]);
  const [bestPerformance, setBestPerformance] = useState<{ day: string; count: number } | null>(null);
  const [worstPerformance, setWorstPerformance] = useState<{ day: string; count: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchData = async () => {
      await loadData(setGlassDrunk); 
      await loadWeeklyPerformance(); 
    };
    fetchData().finally(() => setLoading(false));
  }, []);

  const loadWeeklyPerformance = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const storedWeeklyPerformanceKey = getUserStorageKey('weeklyPerformance');
      const storedWeeklyPerformance = await AsyncStorage.getItem(storedWeeklyPerformanceKey);

      if (storedWeeklyPerformance) {
        const parsedData = JSON.parse(storedWeeklyPerformance);
        setWeeklyPerformance(parsedData);
        updateBestAndWorstPerformance(parsedData);
      }
    } catch (error) {
      console.error('Error loading weekly performance from AsyncStorage:', error);
    }
  };

  const saveGlassDrunk = async (newCount: number) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const storedGlassDrunkKey = getUserStorageKey('glassDrunk');
      const storedWeeklyPerformanceKey = getUserStorageKey('weeklyPerformance');

      await AsyncStorage.setItem(storedGlassDrunkKey, newCount.toString());

      const currentDate = getCurrentDate();
      const currentDay = getDayOfWeek(currentDate);

      const updatedPerformance = weeklyPerformance.map((item) =>
        item.day === currentDay ? { ...item, count: newCount } : item
      );

      const dayExists = updatedPerformance.some((item) => item.day === currentDay);
      if (!dayExists) {
        updatedPerformance.push({ day: currentDay, count: newCount });
      }

      setWeeklyPerformance(updatedPerformance);
      await AsyncStorage.setItem(storedWeeklyPerformanceKey, JSON.stringify(updatedPerformance));
      updateBestAndWorstPerformance(updatedPerformance);

      const waterLiters = newCount * 0.25;
      await saveDailyProgress({ water: waterLiters });
    } catch (error) {
      console.error('Error saving glass count to AsyncStorage:', error);
    }
  };

  const updateBestAndWorstPerformance = (performanceData: { day: string; count: number }[]) => {
    if (performanceData.length === 0) {
      setBestPerformance(null);
      setWorstPerformance(null);
      return;
    }

    const uniqueDays = new Set(performanceData.map(item => item.day));

    if (uniqueDays.size === 1) {
      setBestPerformance(performanceData[0]);
      setWorstPerformance(null);
      return;
    }

    let best = performanceData[0];
    let worst = performanceData[0];

    for (const dayData of performanceData) {
      if (dayData.count >= best.count) best = dayData;
      if (dayData.count < worst.count) worst = dayData;
    }

    setBestPerformance(best);
    setWorstPerformance(worst);
  };

  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const handleGlassPress = (index: number) => {
    const newCount = index + 1;

    if (index < glassDrunk) {
      setGlassDrunk(index);
      saveGlassDrunk(index);
    } else if (index >= glassDrunk) {
      setGlassDrunk(newCount);
      saveGlassDrunk(newCount);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7A5FFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
            <Image
              source={require('../../assets/backArrowIcon.png')}
              style={styles.backIcon}
            />
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          You drank <Text style={styles.highlight}>{glassDrunk} glasses</Text> today
        </Text>

        <View style={styles.glassesContainer}>
          {[...Array(totalGlasses)].map((_, index) => (
            <TouchableOpacity
              key={`glass-${getCurrentDate()}-${index}`}
              style={styles.glassWrapper}
              onPress={() => handleGlassPress(index)}
            >
              <Image
                source={
                  index < glassDrunk
                    ? require('../../assets/filledGlass.png')
                    : require('../../assets/emptyGlass.png')
                }
                style={styles.glassIcon}
              />
              {index >= glassDrunk && (
                <Text style={styles.plusSign}>+</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{glassDrunk * 250} ml</Text>
            <Text style={styles.statLabel}>Water Drank</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalGlasses} glasses</Text>
            <Text style={styles.statLabel}>Daily goal</Text>
          </View>
        </View>

        {glassDrunk < totalGlasses ? (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>You didn’t drink enough water for today.</Text>
          </View>
        ) : (
          <View />
        )}

        <PerformanceContainer
          showBorderTop={true}
          bestPerformance={bestPerformance}
          worstPerformance={worstPerformance}
        />
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    marginTop: (height * 0.015),
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    left: width * 0.009,
    top: height * 0.002,
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
  title: {
    fontSize: RFPercentage(3.0),
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
    width: '70%',
    marginLeft: width * 0.15,
    marginBottom: height * 0.03,
  },
  highlight: {
    color: '#6B4EFF',
  },
  glassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: height * 0.03,
  },
  glassWrapper: {
    width: (width - RFValue(30, width) * 3) / 4,
    height: (width - RFValue(30, width) * 3) / 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.05,
    position: 'relative',
    marginHorizontal: RFValue(10, width),
  },
  glassIcon: {
    width: RFValue(60, height),
    height: RFValue(60, height),
  },
  plusSign: {
    position: 'absolute',
    fontSize: RFPercentage(3),
    color: '#6B4EFF',
    fontWeight: 'bold',
    top: '28%',
    left: '38%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.03,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: RFPercentage(2.2),
    color: '#333',
  },
  statLabel: {
    fontSize: RFPercentage(1.8),
    color: '#999',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#D3D3D3',
  },
  warningContainer: {
    backgroundColor: '#FFE5E5',
    padding: width * 0.05,
  },
  warningText: {
    fontSize: RFPercentage(1.8),
    fontWeight: 'bold',
    color: '#FF6347',
  },
});