import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Dimensions, ScrollView, Modal, FlatList, ActivityIndicator, Animated, Easing, Alert, Pressable, Keyboard, Button } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeStackParamList } from '../../navigations/HomeStackParamList';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '../../../firebaseConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setCalories } from '../../store/slices/userSlice';
import { doc, updateDoc, collection, getDocs, addDoc } from '@firebase/firestore';
import { TextInput } from 'react-native-gesture-handler';
import { saveDailyProgress } from '../../utils/monthlyProgressUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRealm } from '../../../realmConfig';
import { useNetInfo } from '@react-native-community/netinfo';
import { UpdateMode } from 'realm';
import { useTheme } from '../../contexts/ThemeContext';
import { RootState } from '../../store/store';
import { TEXT } from '../../constants/text';

type NavigationProp = DrawerNavigationProp<HomeStackParamList, 'Nutrition'>;

const { width, height } = Dimensions.get('window');

interface FoodItem {
  name: string;
  quantity: number;
  calories: number;
  fat: number;
  carb: number;
  protein: number;
  portion: number;
}

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay );
  }
}

async function getNutritionInfoFromApi(query: string) {
  try {
    const res = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'x-app-id': '2e6c66f5',
        'x-app-key': '5574feb8fa38679a6ba1d6034bb950f1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if(!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.foods;
  } catch (error: any) {
    console.error('Error fetching from Nutritionix API:', error);
    return null;
  }
}

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [nutritionInfo, setNutritionInfo] = useState<FoodItem[]>([]);
  const [expandedMealCards, setExpandedMealCards] = useState<{ [key in MealType]?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const darkMode = useSelector((state: RootState) => state.user?.userData?.darkMode);
  const theme = useTheme();
  const realm = useRealm()
  const isConnected = useNetInfo();
	const [nutritionData, setNutritionData] = useState([
    { name: 'Fat', percentage: 0, color: '#66D3C8' },
    { name: 'Carbs', percentage: 0, color: '#9D6DEB' },
    { name: 'Protein', percentage: 0, color: '#FFA500' },
  ]);
	const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const [consumedFoods, setConsumedFoods] = useState<{
    Breakfast: FoodItem[];
    Lunch: FoodItem[];
    Dinner: FoodItem[];
    Snacks: FoodItem[];
  }>({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snacks: [],
  });
  const [cardAnimations] = useState<{ [key in MealType]: Animated.Value }>(() => {
    const animations: { [key in MealType]?: Animated.Value } = {};
    Object.keys(consumedFoods).forEach((mealType) => {
        animations[mealType as MealType] = new Animated.Value(0);
    });
    return animations as { [key in MealType]: Animated.Value };
});

  const baseRadius = width * 0.22; 
  const strokeWidth = 18;
  const center = baseRadius + strokeWidth / 2;
  const separation = 10;
  const backgroundColor = darkMode ? '#3f3f3f': '#E6E6FA';

  useEffect(() => {
    loadAndResetData();
  }, []);

  useEffect(() => {
    if (isConnected?.isConnected !== null) {
      fetchNutritionInfo();
    }
  }, [isConnected?.isConnected]);

  useEffect(() => {
    calculateTotal();
    saveData();
  }, [consumedFoods, totalCalories]);

  useEffect(() => {
    const keyboardDidOpen = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    })

    const keyboardDidClose = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    })
  
    return () => {
      keyboardDidOpen.remove();
      keyboardDidClose.remove();
    }
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
  }, [])
  
  const fetchNutritionInfo = async () => {
    try {
      const localData = realm.objects('NutritionInfo');
  
      const nutritionArray = Array.from(localData).map(item => ({
        id: item.id,
        name: item.name,
        calories: item.calories,
        carb: item.carb,
        fat: item.fat,
        protein: item.protein,
        quantity: item.quantity,
        portion: typeof item.portion === 'number' ? item.portion : 1,
      })) as FoodItem[];
  
      setNutritionInfo(nutritionArray);
  
      if (isConnected?.isConnected) {
        const snapshot = await getDocs(collection(firestore, 'nutritionInfo'));
  
        realm.write(() => {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
  
            realm.create('NutritionInfo', {
              id: doc.id,
              calories: data.calories,
              carb: data.carb,
              fat: data.fat,
              name: data.name,
              protein: data.protein,
              quantity: data.quantity,
            }, UpdateMode.Modified);
          });
        });
  
        const updatedLocal = realm.objects('NutritionInfo');
        const updatedArray = Array.from(updatedLocal).map(item => ({
          id: item.id,
          name: item.name,
          calories: item.calories,
          carb: item.carb,
          fat: item.fat,
          protein: item.protein,
          quantity: item.quantity,
          portion: typeof item.portion === 'number' ? item.portion : 1,
        })) as FoodItem[];
  
        setNutritionInfo(updatedArray);
      }
    } catch (error) {
      console.error('[ERROR] Failed to fetch nutrition info:', error);
    }
  };
  
  
  useEffect(() => {
    Object.keys(expandedMealCards).forEach((mealType) => {
        const isExpanded = expandedMealCards[mealType as MealType];
        Animated.timing(cardAnimations[mealType as MealType], {
            toValue: isExpanded ? -15 : 0,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start();
    });
}, [expandedMealCards, cardAnimations]);

	const handleMealTypeSelect = (meal: string) => {
    setSelectedMeal(meal === selectedMeal ? null : meal); 
  };

	const handleAddButtonPress = () => {
    if (selectedFoods.length === 0 || !selectedMeal) return;
  
    setConsumedFoods((prevConsumedFoods) => {
      return updateConsumedFoods(prevConsumedFoods, selectedMeal as MealType, selectedFoods);
    });
  
    clearSelections();
    setSearchQuery('');
  };
  
  const updateConsumedFoods = (
    prevConsumedFoods: Record<MealType, FoodItem[]>,
    meal: MealType,
    newFoods: FoodItem[]
  ): Record<MealType, FoodItem[]> => {
    const existingFoods = prevConsumedFoods[meal] || [];
    const newUniqueFoods: FoodItem[] = [];
    const duplicates: FoodItem[] = [];
  
    newFoods.forEach((food) => {
      if (existingFoods.some((existingFood) => existingFood.name === food.name)) {
        duplicates.push(food);
      } else {
        newUniqueFoods.push(food);
      }
    });
  
    const foodsWithPortion = newUniqueFoods.map((food) => ({
      ...food,
      portion: 1,
      calories: food.calories,
      fat: food.fat,
      carb: food.carb,
      protein: food.protein,
    }));
  
    const updatedFoods = existingFoods.map((food) => {
      const dup = duplicates.find((d) => d.name === food.name);
      if (dup) {
        const newPortion = food.portion + 1;
        return {
          ...food,
          portion: newPortion,
          calories: dup.calories * newPortion,
          fat: dup.fat * newPortion,
          carb: dup.carb * newPortion,
          protein: dup.protein * newPortion,
        };
      }
      return food;
    });
  
    return {
      ...prevConsumedFoods,
      [meal]: [...updatedFoods, ...foodsWithPortion],
    };
  };
  
  const clearSelections = () => {
    setSelectedFoods([]);
    setSelectedMeal('');
    setModalVisible(false);
  };
  
  
  const handleFoodSelection = (foodItem: FoodItem) => {
    if (selectedFoods.some((item) => item.name === foodItem.name)) {
      setSelectedFoods(selectedFoods.filter((item) => item.name !== foodItem.name));
    } else {
      setSelectedFoods([...selectedFoods, foodItem]);
    }
  };

	const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity style={[styles.foodItem, { backgroundColor: theme.backgroundSecondary}]} onPress={() => handleFoodSelection(item)}>
      <Text style={[styles.foodName, { color: theme.textSecondary }]}>{item.name}</Text>
      <View style={[styles.selectionIndicator, {backgroundColor: theme.backgroundSecondary, borderColor: darkMode ? '#575757' : '#ccc'}]}>
        {selectedFoods.some((selectedItem) => selectedItem.name === item.name) && (
          <Image
            source={require('../../assets/check.png')}
            style={{ width: RFValue(18), height: RFValue(18), justifyContent: 'center', alignItems: 'center'}}
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
        { name: 'Carbs', percentage: carbPct, color: '#9D6DEB' },
        { name: 'Protein', percentage: proteinPct, color: '#FFA500' },
      ]);
    } else {
      setNutritionData([
        { name: 'Fat', percentage: 0, color: '#66D3C8' },
        { name: 'Carbs', percentage: 0, color: '#9D6DEB' },
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
  
        await saveDailyProgress({ calories: totalCalories });
      } catch (error: any) {
        console.error('Nutrition Screen: Error while saving data-', error);
      }
    }
  };

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
          setConsumedFoods({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
          setTotalCalories(0);
          setTotalFat(0);
          setTotalCarbs(0);
          setTotalProtein(0);
          setNutritionData([
            { name: 'Fat', percentage: 0, color: '#66D3C8' },
            { name: 'Carbs', percentage: 0, color: '#9D6DEB' },
            { name: 'Protein', percentage: 0, color: '#FFA500' },
          ]);
        }
      } catch (error) {
        console.error('Nutrtiton Screen: Error while loading data-', error);
        setConsumedFoods({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
        setTotalCalories(0);
        setTotalFat(0);
        setTotalCarbs(0);
        setTotalProtein(0);
        setNutritionData([
          { name: 'Fat', percentage: 0, color: '#66D3C8' },
          { name: 'Carbs', percentage: 0, color: '#9D6DEB' },
          { name: 'Protein', percentage: 0, color: '#FFA500' },
        ]);
      }
    } else {
      setConsumedFoods({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
      setTotalCalories(0);
      setTotalFat(0);
      setTotalCarbs(0);
      setTotalProtein(0);
      setNutritionData([
        { name: 'Fat', percentage: 0, color: '#66D3C8' },
        { name: 'Carbs', percentage: 0, color: '#9D6DEB' },
        { name: 'Protein', percentage: 0, color: '#FFA500' },
      ]);
    }
  }
  
  const filteredNutritionInfo = nutritionInfo.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if(!query.trim()) return;
      setIsLoading(true);

      const filtered = nutritionInfo.filter((item) => 
        item.name.toLowerCase().includes(query.toLowerCase())
      );

      if(filtered.length === 0) {
        const apiFoods = await getNutritionInfoFromApi(query)
        if(apiFoods && apiFoods.length > 0) {
          const newFoodItem: FoodItem[] = apiFoods.map((food: any) => ({
            name: food.food_name.charAt(0).toUpperCase() + food.food_name.slice(1),
            quantity: Math.round(food.serving_weight_grams) ?? 100,
            calories: Math.round(food.nf_calories ?? 0),
            fat: Math.round(food.nf_total_fat ?? 0),
            carb: Math.round(food.nf_total_carbohydrate ?? 0),
            protein: Math.round(food.nf_protein ?? 0),
          }));

          const existingNames = new Set(nutritionInfo.map(item => item.name.toLowerCase()));
          const uniqueNewFoodItems = newFoodItem.filter(item => !existingNames.has(item.name.toLowerCase()));

          if(uniqueNewFoodItems.length > 0) {
            try {
              const batchUploads = newFoodItem.map((item) => 
                addDoc(collection(firestore, 'nutritionInfo'), item)
              );
  
              await Promise.all(batchUploads);
              console.log('New food items added to Firestore')
              setNutritionInfo(prev => [...prev, ...newFoodItem]);
            } catch (error: any) {
                console.error('Error saving new food items to Firestore:', error);
                setIsLoading(false);
                return;
            }
          }
        } 
      }
      setIsLoading(false);
    }, 500), [nutritionInfo]
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  const toggleMealCard = (mealType: MealType) => {
    setExpandedMealCards((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  const updateFoodPortion = (mealType: MealType, foodName: string, increment: boolean) => {
  setConsumedFoods((prevConsumedFoods) => {
    const updatedFoods = prevConsumedFoods[mealType].map((food) => {
      if (food.name === foodName) {
        const newPortion = increment ? food.portion + 1 : Math.max(food.portion - 1, 1);
        const baseCalories = food.calories / food.portion;
        const baseFat = food.fat / food.portion;
        const baseCarb = food.carb / food.portion;
        const baseProtein = food.protein / food.portion;
        return {
          ...food,
          portion: newPortion,
          calories: baseCalories * newPortion,
          fat: baseFat * newPortion,
          carb: baseCarb * newPortion,
          protein: baseProtein * newPortion,
        };
      }
      return food;
    });

    return {
      ...prevConsumedFoods,
      [mealType]: updatedFoods,
    };
  });
};

  function handleDeleteItem(mealType: MealType, foodName: string): void {
    setConsumedFoods((prevConsumedFoods) => {
      const updatedFoods = prevConsumedFoods[mealType].filter((food) => food.name !== foodName);
      return {
        ...prevConsumedFoods,
        [mealType]: updatedFoods,
      };
    });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
      <View style={[styles.header, { backgroundColor: theme.backgroundPrimary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backContainer}>
          <Image
            source={require('../../assets/backArrowIcon.png')}
            style={styles.backlogo}
          />          
          <Text style={styles.backButton1}>{TEXT.nutrition.back}</Text>
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
          <Text style={[styles.title, { color: theme.textPrimary }]}>{TEXT.nutrition.title} <Text style={styles.highlight}>{totalCalories}</Text> {TEXT.nutrition.caloriesToday}</Text>
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
                  <G key={item.name}>
                    <Circle
                      key={`bg-circle-${item.name}`} 
                      cx={center}
                      cy={center}
                      r={currentRadius}
                      stroke={backgroundColor}
                      strokeWidth={strokeWidth}
                      fill="none"
                    />

                    <Circle
                      key={`fg-circle-${item.name}`} 
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
                  </G>
                );
              })}
            </Svg>
          </View>

          <View style={styles.legendContainer}>
            {nutritionData.map((item, index) => (
              <View key={`legend-item-${item.name}`} style={styles.legendItem}>
                <View style={{ backgroundColor: item.color, width: 20, height: 20, borderRadius: 10 }} />
                <Text style={{ color: item.color, marginLeft: 10, fontSize: 12 }}>{item.name} {Math.round(item.percentage * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.nutritionContainer}>
          <View style={{flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d6d6d6', paddingVertical: 20, paddingLeft: 15, paddingRight: 20}}>
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: "60%"}}>
                <View style={{flexDirection: 'row'}}>
                  <View style={{height: 20, width: 20, backgroundColor: '#66D3C8', borderRadius: 6, marginRight: 10}} />
                  <Text style={{fontSize: 17, color: theme.textPrimary }}>{TEXT.nutrition.fat}</Text>
                </View>
                <Text style={{fontSize: 17, color: theme.textPrimary}}>{totalFat}g</Text>
              </View>
              <Text style={{fontSize: 17, fontWeight: 'bold', color: theme.textPrimary}}>{Math.round(nutritionData[0].percentage * 100)}%</Text>
            </View>
          </View>
          
          <View style={{flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d6d6d6', paddingVertical: 20, paddingLeft: 15, paddingRight: 20}}>
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: "60%"}}>
                <View style={{flexDirection: 'row'}}>
                  <View style={{height: 20, width: 20, backgroundColor: '#9D6DEB', borderRadius: 6, marginRight: 10}} />
                  <Text style={{fontSize: 17, color: theme.textPrimary}}>{TEXT.nutrition.carbs}</Text>
                </View>
                <Text style={{fontSize: 17, color: theme.textPrimary}}>{totalCarbs}g</Text>
              </View>
              <Text style={{fontSize: 17, fontWeight: 'bold', color: theme.textPrimary}}>{Math.round(nutritionData[1].percentage * 100)}%</Text>
            </View>
          </View>

          <View style={{flexDirection: 'row', paddingVertical: 20, paddingLeft: 15, paddingRight: 20}}>
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: "60%"}}>
                <View style={{flexDirection: 'row'}}>
                  <View style={{height: 20, width: 20, backgroundColor: 'orange', borderRadius: 6, marginRight: 10}} />
                  <Text style={{fontSize: 17, color: theme.textPrimary}}>{TEXT.nutrition.protein}</Text>
                </View>
                <Text style={{fontSize: 17, color: theme.textPrimary}}>{totalProtein}g</Text>
              </View>
              <Text style={{fontSize: 17, fontWeight: 'bold', color: theme.textPrimary}}>{Math.round(nutritionData[2].percentage * 100)}%</Text>
            </View>
          </View>
        </View>

        <View>
          {Object.keys(consumedFoods).map((mealType) => {
            if (consumedFoods[mealType as MealType].length > 0) {
              const foodList = consumedFoods[mealType as MealType];
              const totalFat = foodList.reduce((sum, food) => sum + food.fat, 0);
              const totalProtein = foodList.reduce((sum, food) => sum + food.protein, 0);
              const totalCarbs = foodList.reduce((sum, food) => sum + food.carb, 0);
              const totalCalories = foodList.reduce((sum, food) => sum + food.calories, 0);

              return (
                <Animated.View key={mealType} 
                  style={[
                    styles.mealCard,
                    { backgroundColor: theme.backgroundSecondary },
                    {
                        transform: [{ translateY: cardAnimations[mealType as MealType] }],
                    },
                  ]}
                >
                  <Pressable
                    style={styles.deleteCardButton}
                    onPress={() => 
                      Alert.alert(
                        TEXT.nutrition.deleteMealTitle,
                        TEXT.nutrition.deleteMealMessage,
                        [
                          {
                            text: TEXT.nutrition.cancel,
                          },
                          {
                            text: TEXT.nutrition.ok,
                            onPress: () => handleDeleteCard(mealType as MealType),
                          },
                        ],
                        { cancelable: true } 
                      )}
                  >
                    <Text style={[styles.deleteCardText, { color: theme.textSecondary }]}>{TEXT.nutrition.close}</Text>
                  </Pressable>
                    <Text style={[styles.mealCardTitle, { color: theme.textPrimary }]}>{mealType}</Text>
                  <View style={[styles.macroSummaryContainer, { backgroundColor: darkMode ? '#575757' : '#f9f9f9' }]}>
                    <View style={styles.macroRow}>
                      <View style={styles.macroItem}>
                        <View style={[styles.macroColorBox, { backgroundColor: 'red' }]} />
                        <Text style={[styles.macroText, { color: theme.textPrimary }]}>{TEXT.nutrition.calories}: {totalCalories} kcal</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <View style={[styles.macroColorBox, styles.proteinColor]} />
                        <Text style={[styles.macroText, { color: theme.textPrimary }]}>{TEXT.nutrition.protein}: {totalProtein}g</Text>
                      </View>
                    </View>
                    <View style={styles.macroRow}>
                      <View style={styles.macroItem}>
                        <View style={[styles.macroColorBox, styles.carbsColor]} />
                        <Text style={[styles.macroText, { color: theme.textPrimary }]}>{TEXT.nutrition.carbs}: {totalCarbs}g</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <View style={[styles.macroColorBox, styles.fatColor]} />
                        <Text style={[styles.macroText, { color: theme.textPrimary }]}>{TEXT.nutrition.fat}: {totalFat}g</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={{alignItems: 'center'}}
                    onPress={() => toggleMealCard(mealType as MealType)}
                  >
                    <Ionicons
                        name={expandedMealCards[mealType as MealType] ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color="#666"
                      />
                  </TouchableOpacity>
                  {expandedMealCards[mealType as MealType] && (
                    <View>
                      {foodList.map((food, index) => (
                        <View
                          key={food.name}
                          style={[
                            styles.foodCardItem,
                            index < foodList.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d6d6d6' },
                          ]}
                        >
                          <View style={{ flexDirection: 'column', position: 'relative' }}>
                            <View style={styles.nameContainer}>
                              <TouchableOpacity onPress={() => handleDeleteItem(mealType as MealType, food.name)}>
                                <Image source={require('../../assets/cross-Icon.png')} style={styles.crossIcon} /> 
                              </TouchableOpacity>
                              <Text style={[styles.foodCardName, { color: theme.textPrimary }]}>{food.name}</Text>
                            </View>
                            <Text style={[styles.foodQuantity, { color: theme.textPrimary }]}>{food.quantity * food.portion} grams</Text>
                          </View>
                          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                            <Text style={[styles.foodCalories, { color: theme.textPrimary }]}>
                              {String(food.calories).padStart(3, '0')} <Text style={{ fontSize: 15, color: 'gray' }}>Cal</Text>
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <TouchableOpacity onPress={() => updateFoodPortion(mealType as MealType, food.name, false)} style={{justifyContent: 'center', alignItems: 'center', height: 20, width: 20}} disabled={food.portion === 1}>
                                <Image source={require('../../assets/minus-Icon.png')} style={{height: 16, width: 16, tintColor: food.portion === 1 ? '#d9d9d9' : '#a9a4ff'}} />                              
                              </TouchableOpacity>
                              <Text style={{ fontSize: 14, marginVertical: 7, marginHorizontal: 7, color: theme.textSecondary }}>{food.portion}</Text>
                              <TouchableOpacity onPress={() => updateFoodPortion(mealType as MealType, food.name, true)} style={{justifyContent: 'center', alignItems: 'center', height: 20, width: 20}}>
                                <Image source={require('../../assets/plus-Icon.png')} style={{height: 16, width: 16, tintColor: '#a9a4ff'}} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </Animated.View>
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
            <View style={[styles.modalContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.modalHeader}>
                <Image source={require('../../assets/plateIcon.png')} style={{height: RFValue(60), width: RFValue(55)}} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{TEXT.nutrition.chooseFoodTitle}</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>{TEXT.nutrition.chooseFoodSubtitle}</Text>
              </View>

              <View style={styles.mealTypeCheckboxes}>
                {mealTypes.map((meal) => (
                  <Pressable
                    key={meal}
                    style={styles.mealCheckboxContainerVertical} 
                    onPress={() => handleMealTypeSelect(meal)}
                  >
                    <View style={[styles.checkbox, { borderColor: darkMode ? '#575757' : '#ccc', backgroundColor: selectedMeal === meal ? theme.backgroundBadge : theme.backgroundSecondary }]}>
                      {selectedMeal === meal && (
                        <Image
                          source={require('../../assets/check.png')}
                          style={styles.checkboxIcon} 
                          resizeMode="contain"
                        />
                      )}
                    </View>
                    <Text style={[styles.mealCheckboxText, { color: theme.textSecondary }]}>{meal}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput 
                placeholder={TEXT.nutrition.searchPlaceholder} 
                style={[styles.inputContainer, { borderColor: theme.borderPrimary, backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {searchQuery && filteredNutritionInfo.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="#7A5FFF" />
                  ) : (
                    <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>{TEXT.nutrition.noResults(searchQuery)}</Text>
                  )}
                </View>
              ) : (
                <FlatList
                  data={searchQuery ? filteredNutritionInfo : nutritionInfo}
                  renderItem={renderFoodItem}
                  keyExtractor={(item) => item.name}
                  style={styles.foodList}
                />
              )}

              {selectedFoods.length > 0 && selectedMeal && !isKeyboardVisible && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddButtonPress}>
                <Text style={styles.addButtonText}>{TEXT.nutrition.addFood}</Text>
              </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={() => {
                setModalVisible(false)
                setSearchQuery('')
                setSelectedFoods([]);
                setSelectedMeal('');
                setIsLoading(false);
              }}>
                <Text style={{fontSize: RFValue(20), marginTop: -5, color: theme.textPrimary}}>{TEXT.nutrition.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safeArea: {
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
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backlogo: {
    width: RFValue(24, height),
    height: RFValue(24, height),
    marginRight: -(width * 0.02),
  },
  backButton1: {
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
    paddingLeft: RFPercentage(2.5),
    paddingRight: RFPercentage(1)
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
    marginHorizontal: RFValue(0.03 * width)
  },
  deleteCardButton: {
    position: 'absolute',
    top: 12,
    right: 15,
    paddingHorizontal: 5,
    height: 25,
    width: 25,
  },
  deleteCardText: {
    fontSize: RFValue(16),
    color: 'gray',
    fontWeight: 'bold',
    lineHeight: RFValue(16), 
    transform: [{ scaleX: 1.5 }]
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
    height: '89%', 
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
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 100, 
  },
  noResultsText: {
    fontSize: RFValue(16),
    color: '#666',
    textAlign: 'center',
  },
  selectionIndicator: {
    width: RFValue(18),
    height: RFValue(19),
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
  inputContainer: {
    backgroundColor: '#F5F5F5', 
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.04,
    height: height * 0.05,
    marginBottom: width * 0.005,
    justifyContent: 'center', 
    borderWidth: 1,
    borderColor: '#E0E0E0', 
  },
  macroSummaryContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 10,
    paddingVertical: 10,
    alignItems: 'center', 
    flexDirection: 'row',
    paddingHorizontal: 50
  },
  macroRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '60%', 
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5
  },
  macroColorBox: {
    height: 10,
    width: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  fatColor: {
    backgroundColor: '#66D3C8',
  },
  proteinColor: {
    backgroundColor: 'orange',
  },
  carbsColor: {
    backgroundColor: '#9D6DEB',
  },
  macroText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  nameContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: -27,
  },
  crossIcon: {
    marginRight: RFPercentage(1), 
    height: 18, 
    width: 18, 
    tintColor: '#f77d73'
  },
});