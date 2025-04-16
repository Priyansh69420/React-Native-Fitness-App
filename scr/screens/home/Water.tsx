import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Button,
  ActivityIndicator,
} from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../../firebaseConfig';

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'Water'>;

const { width, height } = Dimensions.get('window');

const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // e.g., "2025-03-31"
};

const getUserStorageKey = (baseKey: string) => {
  const userId = auth.currentUser?.uid;
  return userId ? `${userId}_${baseKey}` : '';
}

export const loadData = async (setGlassDrunk: any) => {
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
    try {
      loadData();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return; 

    try {
      const storedDateKey = getUserStorageKey('lastDate');
      const storedGlassDrunkKey = getUserStorageKey('glassDrunk');
      const storedWeeklyPerformanceKey = getUserStorageKey('weeklyPerformance');

      const storedDate = await AsyncStorage.getItem(storedDateKey);
      const storedGlassDrunk = await AsyncStorage.getItem(storedGlassDrunkKey);
      const storedWeeklyPerformance = await AsyncStorage.getItem(storedWeeklyPerformanceKey);

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

      if (storedWeeklyPerformance) {
        setWeeklyPerformance(JSON.parse(storedWeeklyPerformance));
        updateBestAndWorstPerformance(JSON.parse(storedWeeklyPerformance)); 
      }
    } catch (error) {
      console.error('Error loading data from AsyncStorage:', error);
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
    } catch (error) {
      console.error('Error saving glass count to AsyncStorage:', error);
    }
  };

  const updateBestAndWorstPerformance = (performanceData: { day: string; count: number }[]) => {
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
  

  const handleGlassPress = (index: number) => {
    if (index >= glassDrunk) {
      const newCount = glassDrunk + 1;
      setGlassDrunk(newCount);
      saveGlassDrunk(newCount); 
    }
  };

  const resetData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const storedGlassDrunkKey = getUserStorageKey('glassDrunk');
      const storedDateKey = getUserStorageKey('lastDate');

      await AsyncStorage.setItem(storedGlassDrunkKey, '0');
      await AsyncStorage.setItem(storedDateKey, getCurrentDate()); 

      setGlassDrunk(0);
      setBestPerformance(null);
      setWorstPerformance(null);
    } catch (error) {
      console.error('Error resetting data in AsyncStorage:', error);
    }
  }

  if (loading) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#7A5FFF" />
          </View>
        </SafeAreaView>
      );
    }

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
      </View>

      <Text style={styles.title}>
        You drank <Text style={styles.highlight}>{glassDrunk} glasses</Text> today
      </Text>

      <View style={styles.glassesContainer}>
        {[...Array(totalGlasses)].map((_, index) => (
          <TouchableOpacity
            key={index}
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
      ) : (<View />)}

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
          <Text style={styles.performanceDay}>{bestPerformance?.day || '-'}</Text>
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
          <Text style={styles.performanceDay}>{worstPerformance?.day || '-'}</Text>
        </View>
      </View>
      <Button title='Reset Data' onPress={resetData} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    marginTop: (height * 0.015),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
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
  performanceContainer: {
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  performanceBox: {
    backgroundColor: '#FFFFFF',
    padding: width * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});