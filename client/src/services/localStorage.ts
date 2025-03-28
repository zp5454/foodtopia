import { User, FoodItem, Meal, Exercise, Workout, DailyProgress } from "@shared/schema";

// Type definitions for stored data
type StorageData = {
  users: User[];
  foodItems: FoodItem[];
  meals: Meal[];
  exercises: Exercise[];
  workouts: Workout[];
  dailyProgress: DailyProgress[];
  currentUser: User | null;
};

// Default initial data
const initialData: StorageData = {
  users: [{
    id: 1,
    username: "demo",
    password: "password",
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 70,
    sugarGoal: 50,
    workoutGoal: 30
  }],
  foodItems: [],
  meals: [],
  exercises: [],
  workouts: [],
  dailyProgress: [],
  currentUser: null
};

// LocalStorage keys
const STORAGE_KEY = 'foodtopia_data';

// Load data from localStorage
export const loadFromStorage = (): StorageData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : initialData;
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return initialData;
  }
};

// Save data to localStorage
export const saveToStorage = (data: StorageData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

// Detect if we're in a GitHub Pages environment (no backend available)
export const isStaticEnvironment = (): boolean => {
  // Check if we're in a GitHub Pages or similar static hosting environment
  // where we can't use our backend
  return window.location.hostname.includes('github.io') || 
         process.env.NODE_ENV === 'production' && !window.location.hostname.includes('localhost');
};

// Helper function to create a fallback API for static deployments
export const createLocalStorageAPI = () => {
  let data = loadFromStorage();
  
  // Save data after any changes
  const saveData = () => {
    saveToStorage(data);
    return data;
  };
  
  // Generate a new ID for a collection
  const getNewId = (collection: any[]): number => {
    return collection.length > 0 
      ? Math.max(...collection.map(item => item.id)) + 1 
      : 1;
  };
  
  // Format dates for comparison
  const formatDate = (date: Date): string => {
    return new Date(date).toISOString().split('T')[0];
  };
  
  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return formatDate(date1) === formatDate(date2);
  };
  
  return {
    // User methods
    getUser: async (id: number): Promise<User | undefined> => {
      return data.users.find(user => user.id === id);
    },
    
    getUserByUsername: async (username: string): Promise<User | undefined> => {
      return data.users.find(user => user.username === username);
    },
    
    createUser: async (user: Omit<User, 'id'>): Promise<User> => {
      const newUser = { ...user, id: getNewId(data.users) };
      data.users.push(newUser);
      saveData();
      return newUser;
    },
    
    // Food items methods
    getFoodItems: async (): Promise<FoodItem[]> => {
      return data.foodItems;
    },
    
    getFoodItem: async (id: number): Promise<FoodItem | undefined> => {
      return data.foodItems.find(item => item.id === id);
    },
    
    createFoodItem: async (foodItem: Omit<FoodItem, 'id'>): Promise<FoodItem> => {
      const newFoodItem = { ...foodItem, id: getNewId(data.foodItems) };
      data.foodItems.push(newFoodItem);
      saveData();
      return newFoodItem;
    },
    
    // Meal methods
    getMeals: async (userId: number): Promise<Meal[]> => {
      return data.meals.filter(meal => meal.userId === userId);
    },
    
    getMealsByDate: async (userId: number, date: Date): Promise<Meal[]> => {
      return data.meals.filter(meal => 
        meal.userId === userId && isSameDay(new Date(meal.date), date)
      );
    },
    
    getMeal: async (id: number): Promise<Meal | undefined> => {
      return data.meals.find(meal => meal.id === id);
    },
    
    createMeal: async (meal: Omit<Meal, 'id'>): Promise<Meal> => {
      const newMeal = { ...meal, id: getNewId(data.meals) };
      data.meals.push(newMeal);
      
      // Update daily progress
      updateDailyProgressAfterMeal(newMeal);
      
      saveData();
      return newMeal;
    },
    
    deleteMeal: async (id: number): Promise<boolean> => {
      const mealIndex = data.meals.findIndex(meal => meal.id === id);
      if (mealIndex >= 0) {
        const meal = data.meals[mealIndex];
        data.meals.splice(mealIndex, 1);
        
        // Update daily progress after deletion
        updateDailyProgressAfterMealDeletion(meal);
        
        saveData();
        return true;
      }
      return false;
    },
    
    // Exercise methods
    getExercises: async (): Promise<Exercise[]> => {
      return data.exercises;
    },
    
    getExercise: async (id: number): Promise<Exercise | undefined> => {
      return data.exercises.find(exercise => exercise.id === id);
    },
    
    createExercise: async (exercise: Omit<Exercise, 'id'>): Promise<Exercise> => {
      const newExercise = { ...exercise, id: getNewId(data.exercises) };
      data.exercises.push(newExercise);
      saveData();
      return newExercise;
    },
    
    // Workout methods
    getWorkouts: async (userId: number): Promise<Workout[]> => {
      return data.workouts.filter(workout => workout.userId === userId);
    },
    
    getWorkoutsByDate: async (userId: number, date: Date): Promise<Workout[]> => {
      return data.workouts.filter(workout => 
        workout.userId === userId && isSameDay(new Date(workout.date), date)
      );
    },
    
    getWorkout: async (id: number): Promise<Workout | undefined> => {
      return data.workouts.find(workout => workout.id === id);
    },
    
    createWorkout: async (workout: Omit<Workout, 'id'>): Promise<Workout> => {
      const newWorkout = { ...workout, id: getNewId(data.workouts) };
      data.workouts.push(newWorkout);
      
      // Update daily progress
      updateDailyProgressAfterWorkout(newWorkout);
      
      saveData();
      return newWorkout;
    },
    
    deleteWorkout: async (id: number): Promise<boolean> => {
      const workoutIndex = data.workouts.findIndex(workout => workout.id === id);
      if (workoutIndex >= 0) {
        const workout = data.workouts[workoutIndex];
        data.workouts.splice(workoutIndex, 1);
        
        // Update daily progress after deletion
        updateDailyProgressAfterWorkoutDeletion(workout);
        
        saveData();
        return true;
      }
      return false;
    },
    
    // Progress methods
    getDailyProgress: async (userId: number, date: Date): Promise<DailyProgress | undefined> => {
      return data.dailyProgress.find(progress => 
        progress.userId === userId && isSameDay(new Date(progress.date), date)
      );
    },
    
    createOrUpdateDailyProgress: async (progress: Omit<DailyProgress, 'id'>): Promise<DailyProgress> => {
      const existingIndex = data.dailyProgress.findIndex(p => 
        p.userId === progress.userId && isSameDay(new Date(p.date), new Date(progress.date))
      );
      
      if (existingIndex >= 0) {
        // Update existing record
        const updatedProgress = { ...data.dailyProgress[existingIndex], ...progress };
        data.dailyProgress[existingIndex] = updatedProgress;
        saveData();
        return updatedProgress;
      } else {
        // Create new record
        const newProgress = { ...progress, id: getNewId(data.dailyProgress) };
        data.dailyProgress.push(newProgress);
        saveData();
        return newProgress;
      }
    }
  };
};

// Helper functions for updating daily progress
function updateDailyProgressAfterMeal(meal: Meal) {
  let data = loadFromStorage();
  
  const dateKey = new Date(meal.date).toISOString().split('T')[0];
  const existingProgress = data.dailyProgress.find(p => 
    p.userId === meal.userId && new Date(p.date).toISOString().split('T')[0] === dateKey
  );
  
  if (existingProgress) {
    // Update existing progress
    existingProgress.caloriesConsumed = (existingProgress.caloriesConsumed || 0) + meal.totalCalories;
    existingProgress.proteinConsumed = (existingProgress.proteinConsumed || 0) + meal.totalProtein;
    
    // Find the index and replace
    const index = data.dailyProgress.findIndex(p => p.id === existingProgress.id);
    if (index >= 0) {
      data.dailyProgress[index] = existingProgress;
    }
  } else {
    // Create new progress
    const newProgress: DailyProgress = {
      id: Math.max(...data.dailyProgress.map(p => p.id), 0) + 1,
      userId: meal.userId,
      date: new Date(meal.date),
      caloriesConsumed: meal.totalCalories,
      proteinConsumed: meal.totalProtein,
      caloriesBurned: 0,
      carbsConsumed: 0,
      fatConsumed: 0,
      sugarConsumed: 0,
      workoutMinutes: 0,
      rowingMeters: 0
    };
    data.dailyProgress.push(newProgress);
  }
  
  saveToStorage(data);
}

function updateDailyProgressAfterMealDeletion(meal: Meal) {
  let data = loadFromStorage();
  
  const dateKey = new Date(meal.date).toISOString().split('T')[0];
  const existingProgress = data.dailyProgress.find(p => 
    p.userId === meal.userId && new Date(p.date).toISOString().split('T')[0] === dateKey
  );
  
  if (existingProgress) {
    // Update existing progress
    existingProgress.caloriesConsumed = Math.max(0, (existingProgress.caloriesConsumed || 0) - meal.totalCalories);
    existingProgress.proteinConsumed = Math.max(0, (existingProgress.proteinConsumed || 0) - meal.totalProtein);
    
    // Find the index and replace
    const index = data.dailyProgress.findIndex(p => p.id === existingProgress.id);
    if (index >= 0) {
      data.dailyProgress[index] = existingProgress;
    }
  }
  
  saveToStorage(data);
}

function updateDailyProgressAfterWorkout(workout: Workout) {
  let data = loadFromStorage();
  
  // Extract workout details from items JSON
  let workoutDetails;
  try {
    if (typeof workout.details === 'string') {
      workoutDetails = JSON.parse(workout.details);
    } else {
      workoutDetails = workout.details;
    }
  } catch (e) {
    workoutDetails = {};
    console.error('Error parsing workout details:', e);
  }
  
  const dateKey = new Date(workout.date).toISOString().split('T')[0];
  const existingProgress = data.dailyProgress.find(p => 
    p.userId === workout.userId && new Date(p.date).toISOString().split('T')[0] === dateKey
  );
  
  // Calculate calories burned and workout minutes
  const caloriesBurned = workout.caloriesBurned || 0;
  const workoutMinutes = workout.durationMinutes || 0;
  
  // Get rowing meters if available
  const rowingMeters = workoutDetails?.rowingMeters || 0;
  
  if (existingProgress) {
    // Update existing progress
    existingProgress.caloriesBurned = (existingProgress.caloriesBurned || 0) + caloriesBurned;
    existingProgress.workoutMinutes = (existingProgress.workoutMinutes || 0) + workoutMinutes;
    existingProgress.rowingMeters = (existingProgress.rowingMeters || 0) + rowingMeters;
    
    // Find the index and replace
    const index = data.dailyProgress.findIndex(p => p.id === existingProgress.id);
    if (index >= 0) {
      data.dailyProgress[index] = existingProgress;
    }
  } else {
    // Create new progress
    const newProgress: DailyProgress = {
      id: Math.max(...data.dailyProgress.map(p => p.id), 0) + 1,
      userId: workout.userId,
      date: new Date(workout.date),
      caloriesConsumed: 0,
      proteinConsumed: 0,
      caloriesBurned: caloriesBurned,
      carbsConsumed: 0,
      fatConsumed: 0,
      sugarConsumed: 0,
      workoutMinutes: workoutMinutes,
      rowingMeters: rowingMeters
    };
    data.dailyProgress.push(newProgress);
  }
  
  saveToStorage(data);
}

function updateDailyProgressAfterWorkoutDeletion(workout: Workout) {
  let data = loadFromStorage();
  
  // Extract workout details from items JSON
  let workoutDetails;
  try {
    if (typeof workout.details === 'string') {
      workoutDetails = JSON.parse(workout.details);
    } else {
      workoutDetails = workout.details;
    }
  } catch (e) {
    workoutDetails = {};
    console.error('Error parsing workout details:', e);
  }
  
  const dateKey = new Date(workout.date).toISOString().split('T')[0];
  const existingProgress = data.dailyProgress.find(p => 
    p.userId === workout.userId && new Date(p.date).toISOString().split('T')[0] === dateKey
  );
  
  // Calculate calories burned and workout minutes
  const caloriesBurned = workout.caloriesBurned || 0;
  const workoutMinutes = workout.durationMinutes || 0;
  
  // Get rowing meters if available
  const rowingMeters = workoutDetails?.rowingMeters || 0;
  
  if (existingProgress) {
    // Update existing progress
    existingProgress.caloriesBurned = Math.max(0, (existingProgress.caloriesBurned || 0) - caloriesBurned);
    existingProgress.workoutMinutes = Math.max(0, (existingProgress.workoutMinutes || 0) - workoutMinutes);
    existingProgress.rowingMeters = Math.max(0, (existingProgress.rowingMeters || 0) - rowingMeters);
    
    // Find the index and replace
    const index = data.dailyProgress.findIndex(p => p.id === existingProgress.id);
    if (index >= 0) {
      data.dailyProgress[index] = existingProgress;
    }
  }
  
  saveToStorage(data);
}