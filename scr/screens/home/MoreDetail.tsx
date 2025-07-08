import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Image, ScrollView, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadMonthlyProgress } from '../../utils/monthlyProgressUtils';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Dropdown } from 'react-native-element-dropdown';
import { format, subMonths, isSameMonth } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRealm } from '../../../realmConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart } from 'react-native-gifted-charts';
import { TEXT } from '../../constants/text';

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
  const { userData } = useSelector((state: RootState) => state.user);
  const [selectedMetric, setSelectedMetric] = useState<'steps' | 'calories' | 'water'>('calories');
  const [monthlyData, setMonthlyData] = useState<DailyProgress[]>([]);
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const realm = useRealm();
  const theme = useTheme();
  const darkMode = userData?.darkMode;

  const availableMonths = Array.from({ length: 3 }, (_, i) => {
    const month = subMonths(new Date(), i);
    return {
      label: `${monthNames[month.getMonth()]} ${month.getFullYear()}`,
      value: format(month, 'yyyy-MM'),
    };
  });

  useEffect(() => {
    const syncData = async () => {
      try {
        const lastSavedMonth = await AsyncStorage.getItem('lastSavedMonth');
        const currentDate = new Date();
        const currentMonth = format(currentDate, 'yyyy-MM');

        if (lastSavedMonth && !isSameMonth(new Date(lastSavedMonth), currentDate)) {
          const prevMonthData = realm
            .objects('DailyProgress')
            .filtered('date BEGINSWITH $0', lastSavedMonth)
            .map((item) => ({
              date: item.date,
              steps: item.steps,
              calories: item.calories,
              water: item.water,
            }));
          realm.write(() => {
            const cutoffDate = format(subMonths(currentDate, 3), 'yyyy-MM-dd');
            const oldData = realm
              .objects('DailyProgress')
              .filtered('date < $0', cutoffDate);
            realm.delete(oldData);

            prevMonthData.forEach((entry) => {
              realm.create(
                'DailyProgress',
                {
                  date: entry.date,
                  steps: entry.steps,
                  calories: entry.calories,
                  water: entry.water,
                },
                Realm.UpdateMode.Modified
              );
            });
          });
          await AsyncStorage.setItem('lastSavedMonth', currentMonth);
        } else if (!lastSavedMonth) {
          await AsyncStorage.setItem('lastSavedMonth', currentMonth);
        }

        let data: DailyProgress[] = [];
        if (selectedMonth === currentMonth) {
          data = await loadMonthlyProgress();
          realm.write(() => {
            data.forEach((entry) => {
              realm.create(
                'DailyProgress',
                {
                  date: entry.date,
                  steps: entry.steps,
                  calories: entry.calories,
                  water: entry.water,
                },
                Realm.UpdateMode.Modified
              );
            });
          });
        } else {
          data = realm
            .objects('DailyProgress')
            .filtered('date BEGINSWITH $0', selectedMonth)
            .map((item) => ({
              date: item.date as string,
              steps: item.steps as number,
              calories: item.calories as number,
              water: item.water as number,
            }));
        }

        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setMonthlyData(data);
      } catch (error) {
        console.error('Error syncing progress:', error);
        const monthData = realm
          .objects('DailyProgress')
          .filtered('date BEGINSWITH $0', selectedMonth)
          .map((item) => ({
            date: item.date,
            steps: item.steps,
            calories: item.calories,
            water: item.water,
          }))
          .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime());
          setMonthlyData(monthData as DailyProgress[]);
      }
    };

    syncData();
  }, [selectedMonth, realm]);

  const totalSteps = monthlyData.reduce((sum, entry) => sum + entry.steps, 0);
  const totalCalories = monthlyData.reduce((sum, entry) => sum + entry.calories, 0);
  const totalWater = monthlyData.reduce((sum, entry) => sum + entry.water, 0).toFixed(2);

  const formattedData = monthlyData.map((entry) => {
    const date = new Date(entry.date);
    const month = monthNames[date.getMonth()];
    return {
      ...entry,
      displayDate: `${month} ${date.getDate()}`,
    };
  });

  const renderDailyEntry = ({ item }: { item: typeof formattedData[0] }) => (
    <View style={styles.dailyEntry} key={item.date}>
      <Text style={[styles.dailyEntryDate, { color: theme.textSecondary }]}>{item.displayDate}</Text>
      <View style={styles.dailyEntryValueContainer}>
        {selectedMetric === 'steps' && (
          <>
            <Ionicons name="walk" size={20} color="#7A5FFF" style={styles.dailyEntryIcon} />
            <Text style={[styles.dailyEntryValue, { color: theme.textSecondary }]}>{item.steps.toLocaleString()} steps</Text>
          </>
        )}
        {selectedMetric === 'calories' && (
          <>
            <Ionicons name="restaurant" size={20} color="#7A5FFF" style={styles.dailyEntryIcon} />
            <Text style={[styles.dailyEntryValue, { color: theme.textSecondary }]}>{item.calories.toLocaleString()} cal</Text>
          </>
        )}
        {selectedMetric === 'water' && (
          <>
            <Ionicons name="water" size={20} color="#7A5FFF" style={styles.dailyEntryIcon} />
            <Text style={[styles.dailyEntryValue, { color: theme.textSecondary }]}>{item.water.toFixed(2)} L</Text>
          </>
        )}
      </View>
    </View>
  );

  const trendTitle = (() => {
    switch (selectedMetric) {
      case 'steps': return 'Steps';
      case 'calories': return 'Calories';
      case 'water': return 'Water';
      default: return '';
    }
  })();

  function removeLeadingZeros(str: string) {
    return str.replace(/^0+/, '');
  }

  const chartData = formattedData.map((entry) => {
    let actualValue = 0;
    let maxGoal = 1;
  
    if (selectedMetric === 'steps') {
      actualValue = entry.steps;
      maxGoal = userData?.stepGoal ?? 10000;
    } else if (selectedMetric === 'calories') {
      actualValue = entry.calories;
      maxGoal = userData?.calorieGoal ?? 2000;
    } else {
      actualValue = Number(entry.water.toFixed(2));
      maxGoal = (userData?.glassGoal ?? 8) * 0.25;
    }
  
    const clampedValue = Math.min(actualValue, maxGoal); 
    return {
      value: clampedValue,
      actualValue,
      label: removeLeadingZeros(entry.displayDate.slice(-2)),
      frontColor: '#7A5FFF',
      date: entry.displayDate,
    };
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
      <View style={[styles.headerContainer, { backgroundColor: theme.backgroundPrimary }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/backArrowIcon.png')} style={styles.backIcon} />
            <Text style={styles.backButton}>{TEXT.moreDetails.back}</Text>
          </TouchableOpacity>
          <View style={styles.monthSelectorContainer}>
            <LinearGradient colors={['#b6b4ff', '#6952de']} style={styles.monthPickerGradient}>
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.dropdownItemText}
                selectedTextStyle={styles.selectedText}
                data={availableMonths}
                labelField="label"
                valueField="value"
                value={selectedMonth}
                onChange={(item) => setSelectedMonth(item.value)}
                iconStyle={{ tintColor: '#fff' }}
              />
            </LinearGradient>
          </View>
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{TEXT.moreDetails.title}</Text>
      </View>
  
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="walk" size={30} color="#7A5FFF" />
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{totalSteps.toLocaleString()}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{TEXT.moreDetails.totalSteps}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="restaurant" size={30} color="#7A5FFF" />
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{totalCalories.toLocaleString()}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{TEXT.moreDetails.totalCalories}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="water" size={30} color="#7A5FFF" />
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{totalWater}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{TEXT.moreDetails.totalWater}</Text>
          </View>
        </View>
  
        <View style={[styles.toggleContainer]}>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: theme.backgroundButtonSecondary }, selectedMetric === 'steps' && styles.toggleButtonSelected]}
            onPress={() => {
              if (selectedMetric !== 'steps') {
                setSelectedMetric('steps');
                setSelectedInfo('');
              }
            }}
          >
            <Text style={[styles.toggleText, { color: darkMode ? '#fff' : '#000' }, selectedMetric === 'steps' && styles.toggleTextSelected]}>
              {TEXT.moreDetails.steps}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: theme.backgroundButtonSecondary }, selectedMetric === 'calories' && styles.toggleButtonSelected]}
            onPress={() => {
              if (selectedMetric !== 'calories') {
                setSelectedMetric('calories');
                setSelectedInfo('');
              }
            }}
          >
            <Text style={[styles.toggleText, { color: darkMode ? '#fff' : '#000' }, selectedMetric === 'calories' && styles.toggleTextSelected]}>
              {TEXT.moreDetails.calories}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: theme.backgroundButtonSecondary }, selectedMetric === 'water' && styles.toggleButtonSelected]}
            onPress={() => {
              if (selectedMetric !== 'water') {
                setSelectedMetric('water');
                setSelectedInfo('');
              }
            }}
          >
            <Text style={[styles.toggleText, { color: darkMode ? '#fff' : '#000' }, selectedMetric === 'water' && styles.toggleTextSelected]}>
              {TEXT.moreDetails.water}
            </Text>
          </TouchableOpacity>
        </View>
  
        <View style={[styles.trendContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.trendTitle, { color: theme.textPrimary }]}>{trendTitle} {TEXT.moreDetails.stats}</Text>
          {monthlyData.length !== 0 ? (
            <View style={styles.selectedInfoContainer}>
              {selectedInfo ? (
                <Text style={styles.selectedInfoText}>{selectedInfo}</Text>
              ) : (
                <Text style={[styles.selectedInfoText, { color: '#999' }]}>{TEXT.moreDetails.tapToSee}</Text>
              )}
            </View>
          ) : null}
  
          {formattedData.length > 0 ? (
            <View style={{ marginLeft: -20 }}>
              <BarChart
                data={chartData}
                barWidth={10}
                height={140}
                spacing={14}
                frontColor="#7A5FFF"
                hideRules
                noOfSections={1}
                yAxisThickness={0}
                yAxisTextStyle={{ display: 'none' }}
                xAxisThickness={0}
                initialSpacing={0}
                barBorderRadius={3}
                hideAxesAndRules
                isAnimated
                xAxisLabelTextStyle={{
                  color: theme.textSecondary,
                  fontSize: 14,
                  fontWeight: '300',
                  marginVeritcal: 6,
                }}
                barStyle={{
                  borderRadius: 6,
                  backgroundColor: 'transparent',
                }}
                onPress={(item: any) => {
                  setSelectedInfo(
                    `${item.date}, ${
                      selectedMetric === 'steps'
                        ? `${item.actualValue} steps / ${userData?.stepGoal}`
                        : selectedMetric === 'calories'
                        ? `${item.actualValue} cal / ${userData?.calorieGoal}`
                        : `${item.actualValue.toFixed(2)} L / ${((userData?.glassGoal ?? 8) * 0.25).toFixed(2)} L`
                    }`
                  );
                }}
                maxValue={
                  selectedMetric === 'steps'
                    ? userData?.stepGoal ?? 10000
                    : selectedMetric === 'calories'
                    ? userData?.calorieGoal ?? 2000
                    : (userData?.glassGoal ?? 8) * 0.25
                }
              />
            </View>
          ) : (
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>{TEXT.moreDetails.noData}</Text>
          )}
        </View>
  
        <View style={[styles.breakdownContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.breakdownTitle, { color: theme.textPrimary }]}>{TEXT.moreDetails.dailyBreakdown}</Text>
          {formattedData.length > 0 ? (
            formattedData.map((item) => renderDailyEntry({ item }))
          ) : (
            <Text style={[styles.noDataText, { marginBottom: 10, color: theme.textSecondary }]}>
              {TEXT.moreDetails.noData}
            </Text>
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
    justifyContent: 'space-between',
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
  monthSelectorContainer: {
    position: 'absolute',
    right: width * 0.04, 
    top: height * 0.02,
    width: width * 0.35,
    height: RFValue(28, height), 
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  monthPickerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.4,
    height: RFValue(35, height),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdown: {
    flex: 1,
    height: RFValue(28, height),
    width: width * 0.28,
    backgroundColor: 'transparent',
    paddingHorizontal: width * 0.02,
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdownItemText: {
    fontSize: RFValue(12, height),
    fontWeight: '600',
    color: '#000',
  },
  selectedText: {
    fontSize: RFValue(12, height),
    fontWeight: '600',
    color: '#FFF',
  },
  dropdownIcon: {
    marginRight: width * 0.015,
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
    height: height * 0.165,
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
    marginBottom: 10,
  },
  trendBar: {
    width: 8,
    borderRadius: 10,
  },
  noDataText: {
    fontSize: RFValue(14, height),
    color: '#666',
    textAlign: 'center',
    textAlignVertical: 'center',
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
    marginBottom: height * 0.01,
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
  selectedInfoContainer: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
    marginBottom: height * 0.03,
    backgroundColor: '#e1e1ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedInfoText: {
    fontSize: RFValue(14, height),
    fontWeight: '300',
    color: '#333',
  },
});