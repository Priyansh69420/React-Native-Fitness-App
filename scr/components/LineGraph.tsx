import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface DailyStepsPerformance {
  day: string;
  count: number;
}

const LineGraphSVG = () => {
  const [weeklySteps, setWeeklySteps] = useState<DailyStepsPerformance[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedWeeklySteps = await AsyncStorage.getItem('weeklyStepsPerformance');
      if (storedWeeklySteps) {
        setWeeklySteps(JSON.parse(storedWeeklySteps));
      }
    } catch (error) {
      console.error('Error loading weekly steps from AsyncStorage:', error);
    }
  };

  const convertStepstoCalories = () => {
    return weeklySteps.map(item => Math.round(item.count * 0.01));
    
  };

  const data = convertStepstoCalories();
  const graphWidth = width * 0.8;
  const graphHeight = 200;
  const customYLabels = [300, 250, 200, 150, 100];
  const customYPositions = [20, 60, 100, 140, 180];

  const hasValidData = data.length > 1 && Math.max(...data) > 0;

  const points = hasValidData
    ? data.map((value, index) => {
        const x = (index / (data.length - 1)) * graphWidth;
        const y = graphHeight - (value / Math.max(...data)) * graphHeight;
        return { x, y };
      })
    : [];

  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M${point.x},${point.y}`;
    } else {
      const prevPoint = points[index - 1];
      const controlPointX = (prevPoint.x + point.x) / 2;
      return `${acc} C${controlPointX},${prevPoint.y} ${controlPointX},${point.y} ${point.x},${point.y}`;
    }
  }, '');

  const pathDataWithFill = hasValidData
    ? `${pathData} L${graphWidth},${graphHeight} L0,${graphHeight} Z`
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.yAxisContainer}>
        {customYLabels.map((yValue, index) => {
          const yPos = customYPositions[index];
          return (
            <Text key={index} style={[styles.yAxisLabel, { top: yPos }]}>
              {yValue}
            </Text>
          );
        })}
      </View>
      <Svg width={graphWidth} height={graphHeight} style={styles.graphSvg}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="orange" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="orange" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {hasValidData && (
          <Path d={pathDataWithFill} fill="url(#grad)" stroke="orange" strokeWidth="2" />
        )}
      </Svg>
      {!hasValidData && (
        <Text style={styles.noDataText}>Not enough data to show graph.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
  },
  yAxisContainer: {
    width: 50,
    paddingRight: 10,
  },
  yAxisLabel: {
    position: 'absolute',
    left: 0,
    color: '#333',
    fontSize: 12,
  },
  graphSvg: {
    marginLeft: 0,
  },
  noDataText: {
    position: 'absolute',
    top: '50%',
    left: '30%',
    fontSize: 14,
    color: 'gray',
  },
});

export default LineGraphSVG;
