import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';

interface DailyProgress {
  date: string; 
  steps: number;
  calories: number;
  water: number;
}

const getUserStorageKey = (baseKey: string) => {
  const userId = auth.currentUser?.uid;
  return userId ? `${userId}_${baseKey}` : '';
};

const getCurrentDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0]; 
};

const getCurrentMonth = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 7); 
};

export const saveDailyProgress = async (newData: { steps?: number; calories?: number; water?: number }) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  try {
    const key = getUserStorageKey('monthlyProgress');
    const currentDate = getCurrentDate();
    const currentMonth = getCurrentMonth();

    let monthlyData: DailyProgress[] = [];
    const storedData = await AsyncStorage.getItem(key);
    if (storedData) {
      monthlyData = JSON.parse(storedData);
      monthlyData = monthlyData.filter((entry) => entry.date.startsWith(currentMonth));
    }

    let todayEntry = monthlyData.find((entry) => entry.date === currentDate);
    if (!todayEntry) {
      todayEntry = { date: currentDate, steps: 0, calories: 0, water: 0 };
      monthlyData.push(todayEntry);
    }

    if (newData.steps !== undefined) todayEntry.steps = newData.steps;
    if (newData.calories !== undefined) todayEntry.calories = newData.calories;
    if (newData.water !== undefined) todayEntry.water = newData.water;

    await AsyncStorage.setItem(key, JSON.stringify(monthlyData));
  } catch (error) {
    console.error('Error saving daily progress:', error);
  }
};

export const loadMonthlyProgress = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  try {
    const key = getUserStorageKey('monthlyProgress');
    const storedData = await AsyncStorage.getItem(key);
    const monthlyData: DailyProgress[] = storedData ? JSON.parse(storedData) : [];

    const currentMonth = getCurrentMonth();
    return monthlyData.filter((entry) => entry.date.startsWith(currentMonth));
  } catch (error) {
    console.error('Error loading monthly progress:', error);
    return [];
  }
};