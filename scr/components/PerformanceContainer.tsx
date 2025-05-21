import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';

const { width, height } = Dimensions.get('window');

interface PerformanceContainerProps {
  showBorderTop?: boolean;
  bestPerformance?: { day: string; count: number } | null;
  worstPerformance?: { day: string; count: number } | null;
}

const PerformanceContainer: React.FC<PerformanceContainerProps> = ({
  showBorderTop = false,
  bestPerformance = null,
  worstPerformance = null,
}) => {
  return (
    <View style={[styles.performanceContainer, showBorderTop && { borderTopWidth: 1, borderTopColor: '#E5E5E5' }]}>
      <View style={[styles.performanceBox, { borderBottomWidth: 0.5, borderBottomColor: '#d9d9d9' }]}>
        <View style={styles.performanceRow}>
          <View style={styles.smileyContainer}>
            <Image
              source={require('../assets/greenSmiley.png')}
              style={styles.smileyIcon}
            />
          </View>
          <Text style={styles.performanceText}>Best Performance</Text>
          <Text style={styles.performanceValue}>{bestPerformance?.count ?? '-'}</Text>
        </View>
        <Text style={styles.performanceDay}>{bestPerformance?.day ?? '-'}</Text>
      </View>

      <View style={styles.performanceBox}>
        <View style={styles.performanceRow}>
          <View style={styles.smileyContainer}>
            <Image
              source={require('../assets/pinkSmiley.png')}
              style={styles.smileyIcon}
            />
          </View>
          <Text style={styles.performanceText}>Worst Performance</Text>
          <Text style={styles.performanceValue}>{worstPerformance?.count ?? '-'}</Text>
        </View>
        <Text style={styles.performanceDay}>{worstPerformance?.day ?? '-'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  performanceContainer: {
    backgroundColor: '#F8F8F8',
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

export default PerformanceContainer;