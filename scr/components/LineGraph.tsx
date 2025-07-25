import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface DailyStepsPerformance {
  day: string;
  count: number;
}

const LineGraphSVG = () => {
  const [weeklySteps, setWeeklySteps] = useState<DailyStepsPerformance[]>([]);
  const theme = useTheme();

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const today = new Date();
    const todayStr = today.toDateString(); 
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  
    try {
      const lastClearedDate = await AsyncStorage.getItem('lastWeeklyReset');
  
      if (dayName === 'Monday' && lastClearedDate !== todayStr) {
        const todayEntry: DailyStepsPerformance = {
          day: dayName,
          count: 0,
        };
  
        await AsyncStorage.setItem('weeklyStepsPerformance', JSON.stringify([todayEntry]));
        await AsyncStorage.setItem('lastWeeklyReset', todayStr);
        setWeeklySteps([todayEntry]);
        return;
      }
  
      const storedWeeklySteps = await AsyncStorage.getItem('weeklyStepsPerformance');
      if (storedWeeklySteps) {
        const parsedData: DailyStepsPerformance[] = JSON.parse(storedWeeklySteps);
        setWeeklySteps(parsedData);
      } else {
        setWeeklySteps([]);
      }
    } catch (error) {
      console.error('Error loading weekly steps from AsyncStorage:', error);
    }
  };

  const convertStepstoCalories = () => {
    return weeklySteps.map((item) => ({
      value: Math.round(item.count * 0.03),
      label: item.day.slice(0, 3),
    }));
  };

  const data = convertStepstoCalories();
  const graphWidth = width * 0.8;
  const graphHeight = 200;
  const hasValidData = data.length > 1 && data.some(item => item.value > 0);

  return (
    <View style={[styles.container, {backgroundColor: theme.backgroundSecondary}]}>
      <View style={styles.chartContainer}>
        <Text style={[styles.yAxisLabel, {color: theme.textSecondary}]}>Calories Burned</Text>
        <View style={{ height: graphHeight, width: graphWidth }}>
          {hasValidData ? (
            <LineChart
              data={data}
              height={graphHeight}
              width={graphWidth}
              thickness={2}
              color="orange"
              hideRules
              yAxisColor="transparent"
              xAxisColor="transparent"
              showVerticalLines={false}
              areaChart
              startFillColor="orange"
              endFillColor="orange"
              startOpacity={0.9}
              endOpacity={0.2}
              noOfSections={4}
              spacing={graphWidth / (data.length - 1)}
              hideDataPoints
              curved
              curvature={0.1}
              yAxisOffset={-25}
              xAxisLabelTextStyle={{color: theme.textSecondary}}
              yAxisTextStyle={{color: theme.textSecondary}}
            />
          ) : (
            <View style={styles.emptyGraphPlaceholder}>
              <Text style={[styles.noDataText, , {color: theme.textSecondary}]}>Not enough data to show stats.</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: 30,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisLabel: {
    position: 'absolute',
    left: -55, 
    top: '50%',
    transform: [{ rotate: '-90deg' }], 
    fontSize: 14,
    color: 'gray',
  },
  noDataText: {
    fontSize: 14,
    color: 'gray',
    paddingLeft: 60,
  },
  emptyGraphPlaceholder: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LineGraphSVG;