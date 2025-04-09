import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { DrawerParamList } from '../../navigations/DrawerParamList';
import { RFValue } from 'react-native-responsive-fontsize';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type NavigationProp = DrawerNavigationProp<DrawerParamList, 'GetPremium'>;

interface CarouselItem {
  image: any;
  title: string;
  description: string;
}

const carouselItems: CarouselItem[] = [
  {
    image: require('../../assets/premium1.jpg'),
    title: 'Get a Personal Trainer',
    description: 'Our premium package includes a weekly 1-hour session with a personal trainer.',
  },
  {
    image: require('../../assets/premium2.jpg'),
    title: 'Go premium, get unlimited access!',
    description: 'When you subscribe, you get instant unlimited access to all resources.',
  },
  {
    image: require('../../assets/premium3.jpg'),
    title: 'Achieve Your Goals',
    description: 'Unlock personalized plans to help you reach your fitness goals faster.',
  },
];

const CAROUSEL_HEIGHT = screenHeight * 0.4; 

export default function GetPremium() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);

  const renderCarouselItem = ({ item }: { item: CarouselItem }) => (
    <View style={styles.carouselItem}>
      <Image source={item.image} style={styles.carouselImage} />
      <View style={styles.carouselTextContainer}>
        <Text style={styles.carouselTitle}>{item.title}</Text>
        <Text style={styles.carouselDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const handlePurchase = () => {
    Alert.alert('Purchase', 'This feature is coming soon!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.carouselContainer}>
          <Carousel
            ref={carouselRef}
            data={carouselItems}
            renderItem={renderCarouselItem}
            width={screenWidth}
            height={CAROUSEL_HEIGHT}
            autoPlay
            autoPlayInterval={2000}
            loop
            onSnapToItem={(index) => setActiveSlide(index)}
          />

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButtonContainer}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={require('../../assets/backArrowIcon.png')}
                style={styles.backArrowIcon}
              />
              <Text style={styles.backButton}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paginationContainer}>
            {carouselItems.map((_, index) => (
              <View
                key={index}
                style={[styles.dotStyle, activeSlide === index && styles.activeDotStyle]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.planContainer, selectedPlan === 'monthly' && styles.selectedPlan]}
          onPress={() => setSelectedPlan('monthly')}
        >
          <View style={styles.planDetails}>
            {selectedPlan === 'monthly' ? (
              <View style={styles.radioSelected}>
                <View style={styles.radioInner} />
              </View>
            ) : (
              <View style={styles.radio} />
            )}
            <Text style={styles.planPrice}>$4.99/month</Text>
          </View>
          <View style={styles.freeTrialBadge}>
            <Text style={styles.freeTrialText}>Free Trial</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planContainer, selectedPlan === 'yearly' && styles.selectedPlan]}
          onPress={() => setSelectedPlan('yearly')}
        >
          <View style={styles.planDetails}>
            {selectedPlan === 'yearly' ? (
              <View style={styles.radioSelected}>
                <View style={styles.radioInner} />
              </View>
            ) : (
              <View style={styles.radio} />
            )}
            <Text style={styles.planPrice}>$89.99/year</Text>
          </View>
          <View style={styles.freeTrialBadge}>
            <Text style={styles.freeTrialText}>Free Trial</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.billingTitle}>Recurring billing, cancel anytime</Text>
        <Text style={styles.billingDescription}>
          Contrary to what many people think, eating healthy is not easier said than done. Just a few good habits can make a great difference.
        </Text>

        <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
          <Text style={styles.purchaseButtonText}>Purchase</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    height: screenHeight,
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  carouselContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  carouselItem: {
    alignItems: 'center',
    flex: 1, 
  },
  carouselImage: {
    width: screenWidth,
    height: CAROUSEL_HEIGHT * 0.7, 
    resizeMode: 'cover',
    marginBottom: 15
  },
  carouselTextContainer: {
    flex: 1, 
    justifyContent: 'center', 
    paddingBottom: 20, 
    width: '90%'
  },
  header: {
    position: 'absolute',
    top: 15,
    left: 20,
    zIndex: 1,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrowIcon: {
    width: RFValue(24, screenHeight),
    height: RFValue(24, screenHeight),
    marginRight: -8,
    tintColor: '#007AFF', 
  },
  backButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
  },
  carouselTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 20,
  },
  carouselDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  dotStyle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  activeDotStyle: {
    backgroundColor: '#7A5FFF',
  },
  planContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 25,
    marginBottom: 25,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPlan: {
    borderWidth: 2,
    borderColor: '#7A5FFF',
  },
  planDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7A5FFF',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7A5FFF',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  freeTrialBadge: {
    backgroundColor: '#E6E6FA',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  freeTrialText: {
    fontSize: 14,
    color: '#7A5FFF',
    fontWeight: 'bold',
  },
  billingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  billingDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  purchaseButton: {
    backgroundColor: '#7A5FFF',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 65,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});