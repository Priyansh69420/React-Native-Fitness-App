import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'Nutrition'>;

const { width, height } = Dimensions.get('window');

export default function Nutrition() {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const baseRadius = width * 0.22; 
  const strokeWidth = 18;
  const center = baseRadius + strokeWidth / 2;
  const separation = 10;
  const backgroundColor = '#E6E6FA';

  const nutritionData = [
    { name: 'Fat', percentage: 0.27, color: '#9A7FFF' },
    { name: 'Carb', percentage: 0.30, color: '#A98FFF' },
    { name: 'Protein', percentage: 0.63, color: '#9A9CFF' },
  ];


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
            source={require('../../assets/addIcon.png')}
            style={styles.addIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.stepsContainer}>
          <Text style={styles.title}>You consumed <Text style={styles.highlight}>850</Text> calories today</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.svgContainer}>
            <Svg width={center * 2} height={center * 2}>
              {nutritionData.map((item, index) => {
                const currentRadius = baseRadius - index * (strokeWidth + separation);
                const circumference = 2 * Math.PI * currentRadius;
                const strokeDasharrayValue = `${circumference * item.percentage} ${circumference * (1 - item.percentage)}`;
                const rotation = -90;

                return (
                  <>
                    <Circle
                      key={`bg-circle-${index}`} 
                      cx={center}
                      cy={center}
                      r={currentRadius}
                      stroke={backgroundColor}
                      strokeWidth={strokeWidth}
                      fill="none"
                    />

                    <Circle
                      key={`fg-circle-${index}`} 
                      cx={center}
                      cy={center}
                      r={currentRadius}
                      stroke={item.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={strokeDasharrayValue}
                      strokeDashoffset={0}
                      transform={`rotate(${rotation}, ${center}, ${center})`}
                      fill="none"
                    />
                  </>
                );
              })}
            </Svg>
          </View>

  <View style={styles.legendContainer}>
    {nutritionData.map((item, index) => (
      <View key={`legend-item-${index}`} style={styles.legendItem}>
        <View style={{ backgroundColor: item.color, width: 20, height: 20, borderRadius: 10 }} />
        <Text style={{ color: item.color, marginLeft: 10, fontSize: 12 }}>{item.name} {Math.round(item.percentage * 100)}%</Text>
      </View>
    ))}
  </View>
</View>
      </ScrollView>
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
    paddingHorizontal: RFPercentage(2.4),
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
  addIcon: {
    width: RFValue(40, height),
    height: RFValue(40, height),
    marginRight: RFPercentage(0.5)
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
    fontSize: RFPercentage(2.9), 
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: RFPercentage(0),
    textAlign: 'center',
  },
  highlight: {
    color: '#6B4EFF',
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    flexDirection: 'row',
  },
  svgContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    marginLeft: RFPercentage(4),
    justifyContent: 'flex-start', 
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: RFPercentage(1.5), 
    marginRight: -RFPercentage(5)
  },
});