import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Dimensions, ScrollView, Modal, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '../../../firebaseConfig';
import { useDispatch } from 'react-redux';
import { setCalories } from '../../store/slices/userSlice';
import { doc, updateDoc } from '@firebase/firestore';

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'Nutrition'>;

const { width, height } = Dimensions.get('window');

interface FoodItem {
  name: string;
  quantity: number;
  calories: number;
  fat: number;
  carb: number;
  protein: number;
}

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export default function Nutrition() {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
	const [selectedMeal, setSelectedMeal] = useState<string | null>('');
	const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
	const [nutritionData, setNutritionData] = useState([
    { name: 'Fat', percentage: 0, color: '#66D3C8' },
    { name: 'Carb', percentage: 0, color: '#9D6DEB' },
    { name: 'Protein', percentage: 0, color: '#FFA500' },
  ]);
	const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const [consumedFoods, setConsumedFoods] = useState<{
    Breakfast: FoodItem[];
    Lunch: FoodItem[];
    Dinner: FoodItem[];
    Snack: FoodItem[];
  }>({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: [],
  });

  const baseRadius = width * 0.22; 
  const strokeWidth = 18;
  const center = baseRadius + strokeWidth / 2;
  const separation = 10;
  const backgroundColor = '#E6E6FA';

	const nutritionInfo = [
    { name: 'Eggs', quantity: 200, calories: 300, fat: 15, carb: 2, protein: 26 },
    { name: 'Rice', quantity: 200, calories: 260, fat: 0.5, carb: 57, protein: 5 },
    { name: 'Chapati', quantity: 100, calories: 240, fat: 3.5, carb: 49, protein: 8 },
    { name: 'Dal', quantity: 150, calories: 180, fat: 1, carb: 30, protein: 12 },
    { name: 'Paneer', quantity: 100, calories: 265, fat: 20, carb: 2, protein: 18 },
    { name: 'Chicken Curry', quantity: 200, calories: 300, fat: 15, carb: 5, protein: 30 },
    { name: 'Fish Curry', quantity: 200, calories: 250, fat: 10, carb: 4, protein: 28 },
    { name: 'Vegetable Pulao', quantity: 200, calories: 280, fat: 8, carb: 50, protein: 6 },
    { name: 'Samosa', quantity: 100, calories: 260, fat: 17, carb: 25, protein: 4 },
    { name: 'Idli', quantity: 150, calories: 150, fat: 0.5, carb: 33, protein: 3 },
    { name: 'Dosa', quantity: 150, calories: 170, fat: 4, carb: 30, protein: 4 },
    { name: 'Upma', quantity: 150, calories: 200, fat: 6, carb: 35, protein: 5 },
    { name: 'Poha', quantity: 150, calories: 180, fat: 4, carb: 30, protein: 4 },
    { name: 'Chole', quantity: 200, calories: 280, fat: 8, carb: 40, protein: 12 },
    { name: 'Rajma', quantity: 200, calories: 290, fat: 6, carb: 45, protein: 13 },
    { name: 'Aloo Paratha', quantity: 150, calories: 290, fat: 12, carb: 40, protein: 6 },
    { name: 'Pav Bhaji', quantity: 200, calories: 300, fat: 10, carb: 45, protein: 7 },
    { name: 'Biryani', quantity: 200, calories: 320, fat: 12, carb: 45, protein: 18 },
    { name: 'Curd', quantity: 100, calories: 60, fat: 3, carb: 4, protein: 3 },
    { name: 'Raita', quantity: 100, calories: 80, fat: 4, carb: 5, protein: 3 },
    { name: 'Butter Chicken', quantity: 200, calories: 400, fat: 25, carb: 8, protein: 30 },
    { name: 'Palak Paneer', quantity: 200, calories: 280, fat: 18, carb: 10, protein: 12 },
    { name: 'Bhindi Masala', quantity: 150, calories: 120, fat: 6, carb: 12, protein: 3 },
    { name: 'Aloo Gobi', quantity: 150, calories: 150, fat: 7, carb: 18, protein: 3 },
    { name: 'Kheer', quantity: 150, calories: 200, fat: 6, carb: 35, protein: 5 },
    { name: 'Gulab Jamun', quantity: 100, calories: 300, fat: 15, carb: 40, protein: 4 },
    { name: 'Lassi', quantity: 200, calories: 260, fat: 8, carb: 40, protein: 6 },
    { name: 'Pani Puri', quantity: 100, calories: 150, fat: 5, carb: 25, protein: 2 },
    { name: 'Halwa', quantity: 150, calories: 300, fat: 12, carb: 45, protein: 5 },
    { name: 'Thepla', quantity: 100, calories: 200, fat: 8, carb: 30, protein: 5 },
    { name: 'Pizza', quantity: 200, calories: 500, fat: 20, carb: 60, protein: 15 },
    { name: 'Burger', quantity: 200, calories: 450, fat: 18, carb: 40, protein: 25 },
    { name: 'Pasta', quantity: 200, calories: 400, fat: 15, carb: 50, protein: 10 },
    { name: 'French Fries', quantity: 150, calories: 300, fat: 15, carb: 40, protein: 3 },
    { name: 'Fried Chicken', quantity: 200, calories: 480, fat: 25, carb: 15, protein: 35 },
    { name: 'Sushi', quantity: 150, calories: 200, fat: 2, carb: 40, protein: 5 },
    { name: 'Tacos', quantity: 150, calories: 250, fat: 10, carb: 30, protein: 15 },
    { name: 'Spring Rolls', quantity: 150, calories: 220, fat: 10, carb: 30, protein: 5 },
    { name: 'Chocolate Cake', quantity: 100, calories: 400, fat: 20, carb: 50, protein: 5 },
    { name: 'Ice Cream', quantity: 100, calories: 200, fat: 10, carb: 25, protein: 3 },
    { name: 'Donuts', quantity: 100, calories: 250, fat: 12, carb: 35, protein: 4 },
    { name: 'Hot Dog', quantity: 150, calories: 300, fat: 15, carb: 30, protein: 12 },
    { name: 'Pancakes', quantity: 150, calories: 350, fat: 10, carb: 60, protein: 6 },
    { name: 'Falafel', quantity: 150, calories: 300, fat: 15, carb: 30, protein: 10 },
    { name: 'Hummus with Pita Bread', quantity: 150, calories: 250, fat: 10, carb: 30, protein: 8 },
    { name: 'Nachos with Cheese', quantity: 150, calories: 350, fat: 20, carb: 40, protein: 8 },
    { name: 'Dim Sum', quantity: 150, calories: 200, fat: 5, carb: 30, protein: 8 },
    { name: 'Croissant', quantity: 100, calories: 300, fat: 15, carb: 35, protein: 5 },
    { name: 'Waffles', quantity: 150, calories: 400, fat: 20, carb: 50, protein: 6 },
    { name: 'Shawarma', quantity: 200, calories: 450, fat: 20, carb: 40, protein: 25 },
  ];

  useEffect(() => {
    loadAndResetData();
  }, []);

  useEffect(() => {
    calculateTotal();
    saveData();
  }, [consumedFoods]);

	const handleMealTypeSelect = (meal: string) => {
    setSelectedMeal(meal === selectedMeal ? null : meal); 
  };

	const handleAddButtonPress = () => {
    if (selectedFoods.length > 0 && selectedMeal) {
      setConsumedFoods(prevConsumedFoods => ({
        ...prevConsumedFoods,
        [selectedMeal]: [...(prevConsumedFoods[selectedMeal as MealType] || []), ...selectedFoods],
      }));
      setSelectedFoods([]); 
			setSelectedMeal('');
      setModalVisible(false);
    }
  };
  
  const handleFoodSelection = (foodItem: FoodItem) => {
    if (selectedFoods.some((item) => item.name === foodItem.name)) {
      setSelectedFoods(selectedFoods.filter((item) => item.name !== foodItem.name));
    } else {
      setSelectedFoods([...selectedFoods, foodItem]);
    }
  };

	const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity style={styles.foodItem} onPress={() => handleFoodSelection(item)}>
      <Text style={styles.foodName}>{item.name}</Text>
      <View style={styles.selectionIndicator}>
        {selectedFoods.some((selectedItem) => selectedItem.name === item.name) && (
          <Image
            source={require('../../assets/check.png')} 
            style={{ width: RFValue(18), height: RFValue(18), justifyContent: 'center', alignItems: 'center' }}
            resizeMode="contain" 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const calculateTotal = async () => {
    let calories = 0;
    let fat = 0;
    let carb = 0;
    let protein = 0;

    for (const mealType in consumedFoods) {
      consumedFoods[mealType as keyof typeof consumedFoods].forEach(food => { 
        calories += food.calories;
        fat += food.fat;
        carb += food.carb;
        protein +=food.protein;
      })
    }

    setTotalCalories(calories);
    setTotalFat(fat);
    setTotalCarbs(carb);
    setTotalProtein(protein);

    const totalNutrients = fat + carb + protein;

    if(totalNutrients > 0) {
      const fatPct = fat / totalNutrients;
      const carbPct = carb / totalNutrients;
      const proteinPct = protein / totalNutrients;

      setNutritionData([
        { name: 'Fat', percentage: fatPct, color: '#66D3C8' },
        { name: 'Carb', percentage: carbPct, color: '#9D6DEB' },
        { name: 'Protein', percentage: proteinPct, color: '#FFA500' },
      ]);
    } else {
      setNutritionData([
        { name: 'Fat', percentage: 0, color: '#66D3C8' },
        { name: 'Carb', percentage: 0, color: '#9D6DEB' },
        { name: 'Protein', percentage: 0, color: '#FFA500' },
      ]);
    }
    dispatch(setCalories(calories));
    const userId = auth.currentUser?.uid;
    if (userId) {
      try {
        await updateDoc(doc(firestore, 'users', userId), {
          calories: calories,
        });
      } catch (error) {
        console.error('Error updating total calories in Firestore:', error);
      }
    }
  }

  const handleDeleteCard = (mealTypeToDelete: MealType) => {
    setConsumedFoods(prevConsumedFoods => {
      const newConsumedFoods = { ...prevConsumedFoods };
      delete newConsumedFoods[mealTypeToDelete];
      return newConsumedFoods;
    });
  };

  const saveData = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      try {
        const now = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(`consumedFoods_${userId}`, JSON.stringify(consumedFoods));
        await AsyncStorage.setItem(`lastSavedDate_${userId}`, now);
      } catch (error: any) {
        console.error('Nutrition Screen: Error while saving data-', error);
      }
    } 
  }

  const loadAndResetData = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      try {
        const storedFoods = await AsyncStorage.getItem(`consumedFoods_${userId}`);
        const lastSaved = await AsyncStorage.getItem(`lastSavedDate_${userId}`);
        const today = new Date().toISOString().split('T')[0];

        if (storedFoods && lastSaved === today) {
          setConsumedFoods(JSON.parse(storedFoods));
        } else {
          setConsumedFoods({ Breakfast: [], Lunch: [], Dinner: [], Snack: [] });
          setTotalCalories(0);
          setTotalFat(0);
          setTotalCarbs(0);
          setTotalProtein(0);
          setNutritionData([
            { name: 'Fat', percentage: 0, color: '#66D3C8' },
            { name: 'Carb', percentage: 0, color: '#9D6DEB' },
            { name: 'Protein', percentage: 0, color: '#FFA500' },
          ]);
        }
      } catch (error) {
        console.error('Nutrtiton Screen: Error while loading data-', error);
        setConsumedFoods({ Breakfast: [], Lunch: [], Dinner: [], Snack: [] });
        setTotalCalories(0);
        setTotalFat(0);
        setTotalCarbs(0);
        setTotalProtein(0);
        setNutritionData([
          { name: 'Fat', percentage: 0, color: '#66D3C8' },
          { name: 'Carb', percentage: 0, color: '#9D6DEB' },
          { name: 'Protein', percentage: 0, color: '#FFA500' },
        ]);
      }
    } else {
      setConsumedFoods({ Breakfast: [], Lunch: [], Dinner: [], Snack: [] });
      setTotalCalories(0);
      setTotalFat(0);
      setTotalCarbs(0);
      setTotalProtein(0);
      setNutritionData([
        { name: 'Fat', percentage: 0, color: '#66D3C8' },
        { name: 'Carb', percentage: 0, color: '#9D6DEB' },
        { name: 'Protein', percentage: 0, color: '#FFA500' },
      ]);
    }
  }

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
          <Text style={styles.title}>You consumed <Text style={styles.highlight}>{totalCalories}</Text> calories today</Text>
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
                  <View key={`nutrition-arc-${index}`}>
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
                  </View>
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

        <View style={styles.nutritionContainer}>
          <View style={{flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d6d6d6', paddingVertical: 20, paddingHorizontal: 20}}>
            <View style={{height: 20, width: 20, backgroundColor: 'orange', borderRadius: 6}} />
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10}}>
              <Text style={{fontSize: 17}}>Protein</Text>
              <Text style={{fontSize: 17, marginLeft: -20}}>{totalProtein}g</Text>
              <Text style={{fontSize: 17, fontWeight: 'bold'}}>{Math.round(nutritionData[2].percentage * 100)}%</Text>
            </View>
          </View>
          
          <View style={{flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d6d6d6', paddingVertical: 20, paddingHorizontal: 20}}>
            <View style={{height: 20, width: 20, backgroundColor: '#9D6DEB', borderRadius: 6}} />
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10}}>
              <Text style={{fontSize: 17}}>Carb</Text>
              <Text style={{fontSize: 17}}>{totalCarbs}g</Text>
              <Text style={{fontSize: 17, fontWeight: 'bold'}}>{Math.round(nutritionData[1].percentage * 100)}%</Text>
            </View>
          </View>

          <View style={{flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 20}}>
            <View style={{height: 20, width: 20, backgroundColor: '#66D3C8', borderRadius: 6}} />
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12}}>
              <Text style={{fontSize: 17}}>Fats</Text>
              <Text style={{fontSize: 17}}>{totalFat}g</Text>
              <Text style={{fontSize: 17, fontWeight: 'bold'}}>{Math.round(nutritionData[0].percentage * 100)}%</Text>
            </View>
          </View>
        </View>

        <View>
          {Object.keys(consumedFoods).map((mealType) => {
            if (consumedFoods[mealType as MealType].length > 0) {
              const foodList = consumedFoods[mealType as MealType];
              return (
                <View key={mealType} style={styles.mealCard}>
                  <TouchableOpacity
                    style={styles.deleteCardButton}
                    onPress={() => handleDeleteCard(mealType as MealType)}
                  >
                    <Text style={styles.deleteCardText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.mealCardTitle}>{mealType}</Text>
                  {foodList.map((food, index) => (
                    <View
                      key={food.name}
                      style={[
                        styles.foodCardItem,
                        index < foodList.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d6d6d6' },
                      ]}
                    >
                      <View style={{ flexDirection: 'column' }}>
                        <Text style={styles.foodCardName}>{food.name}</Text>
                        <Text style={styles.foodQuantity}>{food.quantity} grams</Text>
                      </View>
                      <Text style={styles.foodCalories}>{food.calories}</Text>
                    </View>
                  ))}
                </View>
              );
            }
            return null;
          })}
        </View>

				<Modal
					animationType='slide'
					transparent={true}
					visible={modalVisible}
					onRequestClose={() => setModalVisible(false)}
					style={{height: height, width: width}}
				>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContainer}>
							<View style={styles.modalHeader}>
								<Image source={require('../../assets/plateIcon.png')} style={{height: RFValue(60), width: RFValue(55)}} />
								<Text style={styles.modalTitle}>Choose Food</Text>
								<Text style={styles.modalSubtitle}>Select your meal and your foods that you consume today</Text>
							</View>

							<View style={styles.mealTypeCheckboxes}>
								{mealTypes.map((meal) => (
									<TouchableOpacity
										key={meal}
										style={styles.mealCheckboxContainerVertical} 
										onPress={() => handleMealTypeSelect(meal)}
									>
										<View style={styles.checkbox}>
											{selectedMeal === meal && (
												<Image
													source={require('../../assets/check.png')}
													style={styles.checkboxIcon} 
													resizeMode="contain"
												/>
											)}
										</View>
										<Text style={styles.mealCheckboxText}>{meal}</Text>
									</TouchableOpacity>
								))}
							</View>

							<FlatList 
								data={nutritionInfo}
								renderItem={renderFoodItem}
								keyExtractor={(item) => item.name}
								style={styles.foodList}
							/>

							{selectedFoods.length > 0 && (
							<TouchableOpacity style={styles.addButton} onPress={handleAddButtonPress}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
							)}

							<TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
								<Text style={{fontSize: RFValue(25), marginTop: -5}}>✕</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
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
    paddingVertical: RFPercentage(3),
    backgroundColor: '#F5F7FA',
    marginBottom: RFPercentage(0),
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
    fontSize: RFPercentage(3.1), 
    fontWeight: '700',
    color: '#1A1A1A',
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
  nutritionContainer: {
    flexDirection: 'column', 
    paddingHorizontal: 10, 
    marginTop: 10
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: RFPercentage(3),
    padding: 15,
  },
  mealCardTitle: {
    fontSize: RFValue(25),
    fontWeight: 'bold',
    color: '#333',
    marginVertical: RFPercentage(0.8)
  },
  foodCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
  },
  foodCardName: {
    fontSize: RFValue(18),
    color: '#444',
    fontWeight: '400',
    marginBottom: RFPercentage(0.5),
  },
  foodQuantity: {
    fontSize: RFValue(12),
    color: 'gray',
    marginBottom: RFPercentage(0.5),
  },
  foodCalories: {
    fontSize: RFValue(18),
    fontWeight: '400',
    marginRight: RFValue(0.04 * width)
  },
  deleteCardButton: {
    position: 'absolute',
    top: 12,
    right: 15,
  },
  deleteCardText: {
    fontSize: RFValue(16),
    color: 'gray',
    fontWeight: 'bold',
    lineHeight: RFValue(16), 
  },
	modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: RFValue(15),
    padding: RFPercentage(2),
    width: '95%',
    maxHeight: '89%', 
  },
  modalHeader: {
    alignItems: 'center',
		marginTop: RFPercentage(6),
    marginBottom: RFPercentage(4),
  },
  modalTitle: {
    fontSize: RFValue(24),
    fontWeight: 'bold',
    color: '#333',
    marginTop: RFPercentage(1),
  },
  modalSubtitle: {
    fontSize: RFValue(14),
    color: '#666',
    textAlign: 'center',
    marginTop: RFPercentage(0.5),
    marginBottom: RFPercentage(1.5),
		width: '85%'
  },
  mealTypeTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: RFPercentage(1.5),
  },
  mealTypeTab: {
    paddingVertical: RFPercentage(1),
    paddingHorizontal: RFPercentage(2),
    borderRadius: RFValue(20),
  },
  activeMealTypeTab: {
    backgroundColor: '#f0f0f0',
  },
  mealTypeText: {
    fontSize: RFValue(16),
    color: '#555',
  },
  activeMealTypeText: {
    fontWeight: 'bold',
    color: '#333',
  },
	mealTypeCheckboxes: {
    flexDirection: 'row', 
    justifyContent: 'space-around',
    marginBottom: RFPercentage(2.5),
  },
  mealCheckboxContainerVertical: { 
    flexDirection: 'column',
    alignItems: 'center', 
  },
  checkbox: {
    width: RFValue(18), 
    height: RFValue(18), 
    borderRadius: RFValue(9),
    borderWidth: 0.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RFValue(5), 
		backgroundColor: '#f0f0f0'
  },
  checkboxIcon: {
    width: RFValue(18), 
    height: RFValue(18),
  },
  mealCheckboxText: {
    fontSize: RFValue(16),
    color: '#555',
    textAlign: 'center', 
  },
  foodList: {
    flexGrow: 1, 
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: RFPercentage(1.8),
    borderBottomWidth: 0.5,
    borderBottomColor: '#d3d3d3',
		paddingHorizontal: RFPercentage(1.5)
  },
  foodName: {
    fontSize: RFValue(16),
    color: '#444',
  },
  selectionIndicator: {
    width: RFValue(20),
    height: RFValue(20),
    borderRadius: RFValue(10),
    borderWidth: 0.5,
    borderColor: '#ccc',
		backgroundColor: '#f0f0f0'
  },
  selectedIndicator: {
    backgroundColor: '#7B68EE',
    borderColor: '#7B68EE',
  },
  addButton: {
    backgroundColor: '#7B68EE',
    borderRadius: RFValue(20),
    paddingVertical: RFPercentage(1.5),
    alignItems: 'center',
    marginTop: RFPercentage(2),
    marginHorizontal: RFPercentage(2),
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: RFValue(18),
  },
  closeButton: {
    position: 'absolute',
    top: RFPercentage(1),
    right: RFPercentage(1),
    padding: RFPercentage(1),
  },
});