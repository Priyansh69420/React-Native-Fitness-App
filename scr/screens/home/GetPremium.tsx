import React, { useState, useRef, useEffect } from 'react';
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
import { useNetInfo } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { TEXT } from '../../constants/text';

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
    title: 'Go Premium, Get More',
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
  const userPlanType = useSelector((state: RootState) => state.user.userData?.planType);
  const isPremium = useSelector((state: RootState) => state.user.userData?.isPremium);
  const dispatch = useDispatch();
  const isConnected = useNetInfo().isConnected;
  const theme = useTheme();

  const getSelectedPlanDetails = () => {
    if (selectedPlan === 'monthly') {
      return { name: 'Monthly', price: '$4.99' };
    } else if (selectedPlan === 'yearly') {
      return { name: 'Yearly', price: '$89.99' };
    }
    return null;
  };

  const handlePurchase = async () => {
    const planDetails = getSelectedPlanDetails();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    if (!planDetails) {
      Alert.alert('Error', 'Please select a plan.');
      return;
    }

    let confirmText = `Are you sure you want to purchase the ${planDetails.name} plan for ${planDetails.price}?`;

    if (userPlanType === 'monthly' && selectedPlan === 'yearly') {
      confirmText = `Upgrade to Yearly for ${planDetails.price}?`;
    }

    const handlePurchaseConfirmation = async () => {
      try {
        await setDoc(doc(firestore, 'users', user.uid), {
          isPremium: true,
          planType: selectedPlan,
        }, { merge: true });

        dispatch(updateUser({
          isPremium: true,
          planType: selectedPlan,
        }));

        const successMessage =
          selectedPlan === 'yearly' && userPlanType === 'monthly'
            ? 'You have successfully upgraded to the Yearly Premium plan!'
            : 'You are now a premium member!';

        const alertTitle =
          selectedPlan === 'yearly' && userPlanType === 'monthly'
            ? 'Upgraded!'
            : 'Purchase Successful';

        Alert.alert(alertTitle, successMessage, [
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.setItem('firstPurchase', 'true');
              navigation.navigate('HomeStack');
            },
          },
        ]);
      } catch {
        Alert.alert('Error', 'Something went wrong while processing your purchase.');
      }
    };

    Alert.alert('Confirm Purchase', confirmText, [
      { text: 'Cancel' },
      {
        text: 'Yes',
        onPress: () => {
          handlePurchaseConfirmation();
        },
      },
    ]);
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Are you sure?',
      'Do you really want to cancel your premium subscription?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
              if (!isPremium) throw new Error();

              await setDoc(doc(firestore, 'users', user.uid), {
                isPremium: false,
                planType: '',
              }, { merge: true });

              dispatch(updateUser({
                isPremium: false,
                planType: '',
              }));

              await AsyncStorage.removeItem('firstPurchase');

              Alert.alert('Subscription Cancelled', 'Your premium subscription has been cancelled.', [
                {
                  text: 'OK',
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Something went wrong while cancelling your subscription.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  let buttonText: string;
  let isDisabled = false;

  if (userPlanType === selectedPlan || userPlanType === 'yearly') {
    buttonText = 'Already Purchased';
    isDisabled = true;
  } else if (userPlanType === 'monthly' && selectedPlan === 'yearly') {
    buttonText = 'Upgrade to Yearly';
  } else if (!isConnected) {
    isDisabled = true;
    buttonText = 'No internet';
  } else {
    buttonText = 'Purchase';
  }

  const renderCarouselItem = ({ item }: { item: CarouselItem }) => (
    <View style={styles.carouselItem}>
      <Image source={item.image} style={styles.carouselImage} />
      <View style={styles.carouselTextContainer}>
        <Text style={[styles.carouselTitle, { color: theme.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.carouselDescription, { color: theme.textSecondary }]}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundSecondary }]}>
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
                style={[styles.backArrowIcon, { tintColor: theme.textButtonTertiary }]}
              />
              <Text style={[styles.backButton, { color: theme.textButtonTertiary }]}>{TEXT.subscription.back}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paginationContainer}>
            {carouselItems.map((item) => (
              <View
                key={item.title}
                style={[styles.dotStyle, { backgroundColor: theme.borderPrimary }, activeSlide === carouselItems.indexOf(item) && { backgroundColor: theme.borderAccent }]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.planContainer, { backgroundColor: theme.backgroundPrimary, shadowColor: theme.shadow }, , selectedPlan === 'monthly' && styles.selectedPlan]}
          onPress={() => setSelectedPlan('monthly')}
        >
          <View style={styles.planDetails}>
            {selectedPlan === 'monthly' ? (
              <View style={[styles.radioSelected, { borderColor: theme.borderAccent }]}>
                <View style={[styles.radioInner, { backgroundColor: theme.borderAccent }]} />
              </View>
            ) : (
              <View style={[styles.radio, { borderColor: theme.borderPrimary }]} />
            )}
            <Text style={[styles.planPrice, { color: theme.textPrimary }]}>{TEXT.subscription.monthlyPrice}</Text>
          </View>
          <View style={[styles.freeTrialBadge, { backgroundColor: theme.backgroundBadge }]}>
            <Text style={[styles.freeTrialText, { color: theme.textButtonSecondary }]}>{TEXT.subscription.freeTrial}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planContainer, { backgroundColor: theme.backgroundPrimary, shadowColor: theme.shadow }, , selectedPlan === 'yearly' && styles.selectedPlan]}
          onPress={() => setSelectedPlan('yearly')}
        >
          <View style={styles.planDetails}>
            {selectedPlan === 'yearly' ? (
              <View style={[styles.radioSelected, { borderColor: theme.borderAccent }]}>
                <View style={[styles.radioInner, { backgroundColor: theme.borderAccent }]} />
              </View>
            ) : (
              <View style={[styles.radio, { borderColor: theme.borderPrimary }]} />
            )}
            <Text style={[styles.planPrice, { color: theme.textPrimary }]}>{TEXT.subscription.yearlyPrice}</Text>
          </View>
          <View style={[styles.freeTrialBadge, { backgroundColor: theme.backgroundBadge }]}>
            <Text style={[styles.freeTrialText, { color: theme.textButtonSecondary }]}>{TEXT.subscription.freeTrial}</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.billingTitle, { color: theme.textPrimary }]}>{TEXT.subscription.billingTitle}</Text>
        <Text style={[styles.billingDescription, { color: theme.textSecondary }]}>
          {TEXT.subscription.billingDescription}
        </Text>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            { backgroundColor: theme.backgroundButtonPrimary },
            isDisabled && { backgroundColor: theme.backgroundButtonDisabled },
          ]}
          onPress={handlePurchase}
          disabled={isDisabled}
        >
          <Text style={[styles.purchaseButtonText, { color: theme.textButtonPrimary }]}>{buttonText}</Text>
        </TouchableOpacity>
        {isPremium ? (
          <TouchableOpacity style={styles.cancelContainer} onPress={handleCancelSubscription}>
            <Text style={[styles.cancelText, { color: theme.textButtonTertiary }]}>{TEXT.subscription.cancelSubscription}</Text>
          </TouchableOpacity>
        ) : null}
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
    marginBottom: 15,
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
  cancelContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 5
  },
  cancelText: {
    fontSize: 14,
    color: '#0000FF',
    textAlign: 'center',
    fontWeight: '500',
    justifyContent: 'flex-end',
  },
});