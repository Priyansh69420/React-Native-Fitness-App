import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Dimensions, ScrollView, Modal, FlatList } from 'react-native'
import React, { useState } from 'react'
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';


type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'Nutrition'>;

const { width, height } = Dimensions.get('window');

interface FoodItem {
  name: string;
  quantity: number;
  calories: number;
  fat: string;
  carb: string;
  protein: string;
}

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export default function Nutrition() {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp>();
	const [selectedMeal, setSelectedMeal] = useState<string | null>('');
	const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
	const [nutritionData, setNutritionData] = useState([
    { name: 'Fat', percentage: 0.27, color: '#9A7FFF' },
    { name: 'Carb', percentage: 0.30, color: '#A98FFF' },
    { name: 'Protein', percentage: 0.63, color: '#9A9CFF' },
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
		{ name: 'Eggs', quantity: 200, calories: 300, fat: '15g', carb: '2g', protein: '26g' },
		{ name: 'Rice', quantity: 200, calories: 260, fat: '0.5g', carb: '57g', protein: '5g' },
		{ name: 'Chapati', quantity: 100, calories: 240, fat: '3.5g', carb: '49g', protein: '8g' },
		{ name: 'Dal', quantity: 150, calories: 180, fat: '1g', carb: '30g', protein: '12g' },
		{ name: 'Paneer', quantity: 100, calories: 265, fat: '20g', carb: '2g', protein: '18g' },
		{ name: 'Chicken Curry', quantity: 200, calories: 300, fat: '15g', carb: '5g', protein: '30g' },
		{ name: 'Fish Curry', quantity: 200, calories: 250, fat: '10g', carb: '4g', protein: '28g' },
		{ name: 'Vegetable Pulao', quantity: 200, calories: 280, fat: '8g', carb: '50g', protein: '6g' },
		{ name: 'Samosa', quantity: 100, calories: 260, fat: '17g', carb: '25g', protein: '4g' },
		{ name: 'Idli', quantity: 150, calories: 150, fat: '0.5g', carb: '33g', protein: '3g' },
		{ name: 'Dosa', quantity: 150, calories: 170, fat: '4g', carb: '30g', protein: '4g' },
		{ name: 'Upma', quantity: 150, calories: 200, fat: '6g', carb: '35g', protein: '5g' },
		{ name: 'Poha', quantity: 150, calories: 180, fat: '4g', carb: '30g', protein: '4g' },
		{ name: 'Chole', quantity: 200, calories: 280, fat: '8g', carb: '40g', protein: '12g' },
		{ name: 'Rajma', quantity: 200, calories: 290, fat: '6g', carb: '45g', protein: '13g' },
		{ name: 'Aloo Paratha', quantity: 150, calories: 290, fat: '12g', carb: '40g', protein: '6g' },
		{ name: 'Pav Bhaji', quantity: 200, calories: 300, fat: '10g', carb: '45g', protein: '7g' },
		{ name: 'Biryani', quantity: 200, calories: 320, fat: '12g', carb: '45g', protein: '18g' },
		{ name: 'Curd', quantity: 100, calories: 60, fat: '3g', carb: '4g', protein: '3g' },
		{ name: 'Raita', quantity: 100, calories: 80, fat: '4g', carb: '5g', protein: '3g' },
		{ name: 'Butter Chicken', quantity: 200, calories: 400, fat: '25g', carb: '8g', protein: '30g' },
		{ name: 'Palak Paneer', quantity: 200, calories: 280, fat: '18g', carb: '10g', protein: '12g' },
		{ name: 'Bhindi Masala', quantity: 150, calories: 120, fat: '6g', carb: '12g', protein: '3g' },
		{ name: 'Aloo Gobi', quantity: 150, calories: 150, fat: '7g', carb: '18g', protein: '3g' },
		{ name: 'Kheer', quantity: 150, calories: 200, fat: '6g', carb: '35g', protein: '5g' },
		{ name: 'Gulab Jamun', quantity: 100, calories: 300, fat: '15g', carb: '40g', protein: '4g' },
		{ name: 'Lassi', quantity: 200, calories: 260, fat: '8g', carb: '40g', protein: '6g' },
		{ name: 'Pani Puri', quantity: 100, calories: 150, fat: '5g', carb: '25g', protein: '2g' },
		{ name: 'Halwa', quantity: 150, calories: 300, fat: '12g', carb: '45g', protein: '5g' },
		{ name: 'Thepla', quantity: 100, calories: 200, fat: '8g', carb: '30g', protein: '5g' },
		{ name: 'Pizza', quantity: 200, calories: 500, fat: '20g', carb: '60g', protein: '15g' },
		{ name: 'Burger', quantity: 200, calories: 450, fat: '18g', carb: '40g', protein: '25g' },
		{ name: 'Pasta', quantity: 200, calories: 400, fat: '15g', carb: '50g', protein: '10g' },
		{ name: 'French Fries', quantity: 150, calories: 300, fat: '15g', carb: '40g', protein: '3g' },
		{ name: 'Fried Chicken', quantity: 200, calories: 480, fat: '25g', carb: '15g', protein: '35g' },
		{ name: 'Sushi', quantity: 150, calories: 200, fat: '2g', carb: '40g', protein: '5g' },
		{ name: 'Tacos', quantity: 150, calories: 250, fat: '10g', carb: '30g', protein: '15g' },
		{ name: 'Spring Rolls', quantity: 150, calories: 220, fat: '10g', carb: '30g', protein: '5g' },
		{ name: 'Chocolate Cake', quantity: 100, calories: 400, fat: '20g', carb: '50g', protein: '5g' },
		{ name: 'Ice Cream', quantity: 100, calories: 200, fat: '10g', carb: '25g', protein: '3g' },
		{ name: 'Donuts', quantity: 100, calories: 250, fat: '12g', carb: '35g', protein: '4g' },
		{ name: 'Hot Dog', quantity: 150, calories: 300, fat: '15g', carb: '30g', protein: '12g' },
		{ name: 'Pancakes', quantity: 150, calories: 350, fat: '10g', carb: '60g', protein: '6g' },
		{ name: 'Falafel', quantity: 150, calories: 300, fat: '15g', carb: '30g', protein: '10g' },
		{ name: 'Hummus with Pita Bread', quantity: 150, calories: 250, fat: '10g', carb: '30g', protein: '8g' },
		{ name: 'Nachos with Cheese', quantity: 150, calories: 350, fat: '20g', carb: '40g', protein: '8g' },
		{ name: 'Dim Sum', quantity: 150, calories: 200, fat: '5g', carb: '30g', protein: '8g' },
		{ name: 'Croissant', quantity: 100, calories: 300, fat: '15g', carb: '35g', protein: '5g' },
		{ name: 'Waffles', quantity: 150, calories: 400, fat: '20g', carb: '50g', protein: '6g' },
		{ name: 'Shawarma', quantity: 200, calories: 450, fat: '20g', carb: '40g', protein: '25g' },
	];

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

  console.log(consumedFoods.Lunch);

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

        <View>
        {Object.keys(consumedFoods).map((mealType) => {
          if (consumedFoods[mealType as MealType].length > 0) {
            return (
              <View key={mealType} style={styles.mealCard}>
                <Text style={styles.mealCardTitle}>{mealType}</Text>
                {consumedFoods[mealType as MealType].map((food) => (
                  <View key={food.name} style={styles.foodCardItem}>
                    <View style={{flexDirection: 'column'}}>
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
    paddingVertical: RFPercentage(0.5),
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
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: RFPercentage(4),
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
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    paddingHorizontal: RFPercentage(2)
  },
  foodCardName: {
    fontSize: RFValue(18),
    color: '#444',
    fontWeight: '400',
    marginBottom: RFPercentage(0.5),
  },
  foodQuantity: {
    fontSize: RFValue(14),
    color: 'gray',
    marginBottom: RFPercentage(0.5),
  },
  foodCalories: {
    fontSize: RFValue(18),
    fontWeight: '400',
    marginRight: RFValue(0.04 * width)
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
    borderRadius: RFValue(10),
    paddingVertical: RFPercentage(1.5),
    alignItems: 'center',
    marginTop: RFPercentage(2),
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