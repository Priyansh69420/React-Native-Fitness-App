import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Image, ScrollView, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadMonthlyProgress } from '../../utils/monthlyProgressUtils'; 

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'MoreDetail'>;

interface DailyProgress {
  date: string; 
  steps: number;
  calories: number;
  water: number; 
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MoreDetail() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedMetric, setSelectedMetric] = useState<'steps' | 'calories' | 'water'>('calories');
  const [monthlyData, setMonthlyData] = useState<DailyProgress[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadMonthlyProgress();
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMonthlyData(data);
    };
    fetchData();
  }, []);

  const totalSteps = monthlyData.reduce((sum, entry) => sum + entry.steps, 0);
  const totalCalories = monthlyData.reduce((sum, entry) => sum + entry.calories, 0);
  const totalWater = monthlyData.reduce((sum, entry) => sum + entry.water, 0).toFixed(1);
  
  const formattedData = monthlyData.map((entry) => {
    const date = new Date(entry.date);
    const month = monthNames[date.getMonth()];
    
    return {
      ...entry,
      displayDate: `${month} ${date.getDate()}`,
    };
  });

  const renderDailyEntry = ({ item }: { item: typeof formattedData[0] }) => (
    <View style={styles.dailyEntry}>
      <Text style={styles.dailyEntryDate}>{item.displayDate}</Text>
      <View style={styles.dailyEntryValueContainer}>
        {selectedMetric === 'steps' && (
          <>
            <Ionicons name="walk" size={20} color="#7A5FFF" style={styles.dailyEntryIcon} />
            <Text style={styles.dailyEntryValue}>{item.steps.toLocaleString()} steps</Text>
          </>
        )}
        {selectedMetric === 'calories' && (
          <>
            <Ionicons name="restaurant" size={20} color="#7A5FFF" style={styles.dailyEntryIcon} />
            <Text style={styles.dailyEntryValue}>{item.calories.toLocaleString()} cal</Text>
          </>
        )}
        {selectedMetric === 'water' && (
          <>
            <Ionicons name="water" size={20} color="#7A5FFF" style={styles.dailyEntryIcon} />
            <Text style={styles.dailyEntryValue}>{item.water.toFixed(1)} L</Text>
          </>
        )}
      </View>
    </View>
  );

  const trendTitle = (() => {
    switch (selectedMetric) {
      case 'steps':
        return 'Steps';
      case 'calories':
        return 'Calories';
      case 'water':
        return 'Water';
      default:
        return '';
    }
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
            <Image
              source={require('../../assets/backArrowIcon.png')}
              style={styles.backIcon}
            />
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Monthly Progress</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Ionicons name='walk' size={30} color='#7A5FFF' />
            <Text style={styles.summaryValue}>{totalSteps.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Steps</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name='restaurant' size={30} color='#7A5FFF' />
            <Text style={styles.summaryValue}>{totalCalories.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Calories</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name='water' size={30} color='#7A5FFF' />
            <Text style={styles.summaryValue}>{totalWater.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Water (L)</Text>
          </View>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, selectedMetric === 'steps' && styles.toggleButtonSelected]}
            onPress={() => setSelectedMetric('steps')}
          >
            <Text style={[styles.toggleText, selectedMetric === 'steps' && styles.toggleTextSelected]}>Steps</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toggleButton, selectedMetric === 'calories' && styles.toggleButtonSelected]}
            onPress={() => setSelectedMetric('calories')}
          >
            <Text style={[styles.toggleText, selectedMetric === 'calories' && styles.toggleTextSelected]}>Nutrition</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toggleButton, selectedMetric === 'water' && styles.toggleButtonSelected]}
            onPress={() => setSelectedMetric('water')}
          >
            <Text style={[styles.toggleText, selectedMetric === 'water' && styles.toggleTextSelected]}>Water</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trendContainer}>
            <Text style={styles.trendTitle}>
            {trendTitle} Stats
            </Text>

          {formattedData.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendGraphContent}
              style={styles.trendGraph}
            >
              {formattedData.map((entry, index) => {
                let barHeight = 0;
                if (selectedMetric === 'steps') {
                  barHeight = ((entry.steps || 0) / 15000) * 100;
                } else if (selectedMetric === 'calories') {
                  barHeight = ((entry.calories || 0) / 3000) * 100;
                } else {
                  barHeight = ((entry.water || 0) / 2) * 100;
                }

                return (
                  <View style={styles.trendPoint} key={entry.date}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          height: barHeight,
                          backgroundColor: '#7A5FFF',
                        },
                      ]}
                    ></View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>No data available for this month.</Text>
          )}
        </View>

        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Daily Breakdown</Text>
          {formattedData.length > 0 ? (
            <FlatList 
              data={formattedData}
              renderItem={renderDailyEntry}
              keyExtractor={(item) => item.date}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noDataText}>No data available for this month</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    height: height,
  },
  headerContainer: {
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    marginTop: height * 0.015,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    left: width * 0.009,
    top: height * 0.003,
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
    fontSize: RFPercentage(3.8),
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
    paddingBottom: height * 0.02,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.03,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.03,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    width: width * 0.28,
    padding: height * 0.015,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: RFValue(20, height),
    fontWeight: '700',
    color: '#333',
    marginTop: height * 0.01,
  },
  summaryLabel: {
    fontSize: RFValue(12, height),
    color: '#666',
    marginTop: height * 0.005,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: height * 0.03,
  },
  toggleButton: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginHorizontal: width * 0.02,
  },
  toggleButtonSelected: {
    backgroundColor: '#7A5FFF',
  },
  toggleText: {
    fontSize: RFValue(14, height),
    color: '#333',
  },
  toggleTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  trendContainer: {
    backgroundColor: '#FFF',
    padding: width * 0.04,
    borderRadius: 12,
    marginBottom: height * 0.03,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trendTitle: {
    fontSize: RFValue(18, height),
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.015,
  },
  trendGraph: {
    height: height * 0.15,
  },
  trendGraphContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: width * 0.02,
  },
  trendPoint: {
    alignItems: 'center',
    width: 15,
    marginHorizontal: 2,
  },
  trendBar: {
    width: 8,
    borderRadius: 4,
  },
  trendLabel: {
    fontSize: RFValue(10, height),
    color: '#666',
    marginTop: height * 0.005,
  },
  noDataText: {
    fontSize: RFValue(14, height),
    color: '#666',
    textAlign: 'center',
  },
  breakdownContainer: {
    backgroundColor: '#FFF',
    padding: width * 0.04,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: RFValue(18, height),
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.015,
  },
  dailyEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dailyEntryDate: {
    fontSize: RFValue(14, height),
    color: '#333',
    fontWeight: '500',
  },
  dailyEntryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyEntryIcon: {
    marginRight: width * 0.005,
  },
  dailyEntryValue: {
    fontSize: RFValue(14, height),
    color: '#333',
  },
});