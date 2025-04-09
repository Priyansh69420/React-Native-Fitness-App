import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const LineGraphSVG = () => {
  const data = [35, 20, 80, 50, 70, 30, 85, 40];
  const graphWidth = width * 0.8;
  const graphHeight = 200;
  const customYLabels = [300, 250, 200, 150, 100];
  const customYPositions = [20, 60, 100, 140, 180];

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * graphWidth;
    const y = graphHeight - (value / Math.max(...data)) * graphHeight;
    return { x, y };
  });

  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M0,${graphHeight} L${point.x},${point.y}`;
    } else {
      const prevPoint = points[index - 1];
      const controlPointX = (prevPoint.x + point.x) / 2;
      return `${acc} C${controlPointX},${prevPoint.y} ${controlPointX},${point.y} ${point.x},${point.y}`;
    }
  }, '');

  const pathDataWithFill = `${pathData} L${graphWidth},${graphHeight} L0,${graphHeight} Z`;

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
        <Path d={pathDataWithFill} fill="url(#grad)" stroke="orange" strokeWidth="2" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  yAxisContainer: {
    width: 50,
    paddingRight: 10,
  },
  yAxisLabel: {
    position: 'absolute',
    left: 0,
  },
  graphSvg: {
    marginLeft: 0,
  },
});

export default LineGraphSVG;