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
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../store/slices/userSlice';
import { auth, firestore } from '../../../firebaseConfig';
import { doc, setDoc } from '@firebase/firestore';
import { RootState } from '../../store/store';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BUTTON_HORIZONTAL_MARGIN_PERCENTAGE = 6;

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
    title: 'Go premium, full access!',
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
  const [loading, setLoading] = useState<boolean>(false);
  const isPremium = useSelector((state: RootState) => state.user.userData?.isPremium ?? false);
  const dispatch = useDispatch();

  const getSelectedPlanDetails = () => {
    if (selectedPlan === 'monthly') {
      return { name: 'Monthly', price: '$4.99' };
    } else if (selectedPlan === 'yearly') {
      return { name: 'Yearly', price: '$89.99' };
    }
    return null;
  };

  const handlePurchase = async () => {
    setLoading(true);

    const planDetails = getSelectedPlanDetails();
    if (planDetails) {
      Alert.alert(
        'Confirm Purchase',
        `Are you sure you want to purchase the ${planDetails.name} plan for ${planDetails.price}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              const user = auth.currentUser;
              if(!user) alert('User not logged in');

              try {
                if(user) {
                  await setDoc(doc(firestore, 'users', user.uid), {
                    isPremium: true,
                  }, { merge: true });
                }

                dispatch(updateUser({ isPremium: true }));
                Alert.alert('Purchase Successful', 'You are now a premium member!');
              } catch {
                Alert.alert('Error', 'Something went wrong while processing your purchase.');
              } finally {
                setLoading(false);
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert('Error', 'Please select a plan before purchasing.');
    } 
  };

  const renderCarouselItem = ({ item }: { item: CarouselItem }) => (
    <View style={styles.carouselItem}>
      <Image source={item.image} style={styles.carouselImage} />
      <View style={styles.carouselTextContainer}>
        <Text style={styles.carouselTitle}>{item.title}</Text>
        <Text style={styles.carouselDescription}>{item.description}</Text>
      </View>
    </View>
  );

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

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            isPremium && { backgroundColor: '#ccc' },
          ]}
          onPress={handlePurchase}
          disabled={isPremium}
        >
          <Text style={styles.purchaseButtonText}>
            {isPremium ? 'Already Premium' : 'Purchase'}
          </Text>
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
    marginBottom: 15,
  },
  carouselTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
    width: '90%',
  },
  header: {
    position: 'absolute',
    top: RFPercentage(1.8),
    left: RFPercentage(2.5),
    zIndex: 1,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrowIcon: {
    width: RFValue(24, screenHeight),
    height: RFValue(24, screenHeight),
    marginRight: -(screenWidth * 0.02),
    tintColor: '#007AFF',
  },
  backButton: {
    fontSize: RFValue(15),
    color: '#007AFF',
    fontWeight: '500',
  },
  carouselTitle: {
    fontSize: RFValue(26, screenHeight),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: RFPercentage(1.2),
    marginBottom: RFPercentage(0.6),
    paddingHorizontal: RFPercentage(2.5),
  },
  carouselDescription: {
    fontSize: RFValue(16, screenHeight),
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: RFPercentage(2.5),
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: RFPercentage(1.2),
    marginBottom: RFPercentage(1.2),
  },
  dotStyle: {
    width: RFValue(10, screenHeight),
    height: RFValue(10, screenHeight),
    borderRadius: RFValue(5, screenHeight),
    backgroundColor: '#E0E0E0',
    marginHorizontal: RFValue(5, screenWidth),
  },
  activeDotStyle: {
    backgroundColor: '#7A5FFF',
  },
  planContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: RFValue(10, screenHeight),
    padding: RFPercentage(3.1),
    marginBottom: RFPercentage(2.8),
    marginHorizontal: RFPercentage(2.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: RFValue(2, screenHeight) },
    shadowOpacity: 0.1,
    shadowRadius: RFValue(4, screenHeight),
    elevation: 2,
  },
  selectedPlan: {
    borderWidth: RFValue(2, screenHeight),
    borderColor: '#7A5FFF',
  },
  planDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: RFValue(20, screenHeight),
    height: RFValue(20, screenHeight),
    borderRadius: RFValue(10, screenHeight),
    borderWidth: RFValue(2, screenHeight),
    borderColor: '#E0E0E0',
    marginRight: RFValue(10, screenWidth),
  },
  radioSelected: {
    width: RFValue(20, screenHeight),
    height: RFValue(20, screenHeight),
    borderRadius: RFValue(10, screenHeight),
    borderWidth: RFValue(2, screenHeight),
    borderColor: '#7A5FFF',
    marginRight: RFValue(10, screenWidth),
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: RFValue(10, screenHeight),
    height: RFValue(10, screenHeight),
    borderRadius: RFValue(5, screenHeight),
    backgroundColor: '#7A5FFF',
  },
  planPrice: {
    fontSize: RFValue(18, screenHeight),
    fontWeight: 'bold',
    color: '#333',
  },
  freeTrialBadge: {
    backgroundColor: '#E6E6FA',
    borderRadius: RFValue(15, screenHeight),
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.6),
  },
  freeTrialText: {
    fontSize: RFValue(14, screenHeight),
    color: '#7A5FFF',
    fontWeight: 'bold',
  },
  billingTitle: {
    fontSize: RFValue(16, screenHeight),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: RFPercentage(0.6),
    textAlign: 'center',
  },
  billingDescription: {
    fontSize: RFValue(13, screenHeight),
    color: '#666',
    textAlign: 'center',
    marginBottom: RFPercentage(2.5),
    paddingHorizontal: RFPercentage(2.5),
  },
  purchaseButton: {
    backgroundColor: '#7A5FFF',
    borderRadius: RFValue(25, screenHeight),
    paddingVertical: RFPercentage(1.8),
    alignItems: 'center',
    marginHorizontal: RFPercentage(BUTTON_HORIZONTAL_MARGIN_PERCENTAGE),
  },
  purchaseButtonText: {
    fontSize: RFValue(18, screenHeight),
    fontWeight: 'bold',
    color: '#FFF',
  },
});