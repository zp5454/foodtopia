import { 
  users, type User, type InsertUser,
  foodItems, type FoodItem, type InsertFoodItem,
  meals, type Meal, type InsertMeal,
  exercises, type Exercise, type InsertExercise,
  workouts, type Workout, type InsertWorkout,
  dailyProgress, type DailyProgress, type InsertDailyProgress,
  foodSuggestions, type FoodSuggestion, type InsertFoodSuggestion,
  workoutSuggestions, type WorkoutSuggestion, type InsertWorkoutSuggestion
} from "@shared/schema";

// Define storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Food items methods
  getFoodItems(): Promise<FoodItem[]>;
  getFoodItem(id: number): Promise<FoodItem | undefined>;
  createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem>;
  
  // Meal methods
  getMeals(userId: number): Promise<Meal[]>;
  getMealsByDate(userId: number, date: Date): Promise<Meal[]>;
  getMeal(id: number): Promise<Meal | undefined>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  deleteMeal(id: number): Promise<boolean>;
  
  // Exercise methods
  getExercises(): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Workout methods
  getWorkouts(userId: number): Promise<Workout[]>;
  getWorkoutsByDate(userId: number, date: Date): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  deleteWorkout(id: number): Promise<boolean>;
  
  // Progress methods
  getDailyProgress(userId: number, date: Date): Promise<DailyProgress | undefined>;
  createOrUpdateDailyProgress(progress: InsertDailyProgress): Promise<DailyProgress>;
  
  // Suggestions methods
  getFoodSuggestions(): Promise<FoodSuggestion[]>;
  getWorkoutSuggestions(): Promise<WorkoutSuggestion[]>;
  createFoodSuggestion(suggestion: InsertFoodSuggestion): Promise<FoodSuggestion>;
  createWorkoutSuggestion(suggestion: InsertWorkoutSuggestion): Promise<WorkoutSuggestion>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private foodItems: Map<number, FoodItem>;
  private meals: Map<number, Meal>;
  private exercises: Map<number, Exercise>;
  private workouts: Map<number, Workout>;
  private dailyProgressRecords: Map<string, DailyProgress>; // key is userId-date
  private foodSuggestionsList: Map<number, FoodSuggestion>;
  private workoutSuggestionsList: Map<number, WorkoutSuggestion>;
  
  private userIdCounter: number;
  private foodItemIdCounter: number;
  private mealIdCounter: number;
  private exerciseIdCounter: number;
  private workoutIdCounter: number;
  private dailyProgressIdCounter: number;
  private foodSuggestionIdCounter: number;
  private workoutSuggestionIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.foodItems = new Map();
    this.meals = new Map();
    this.exercises = new Map();
    this.workouts = new Map();
    this.dailyProgressRecords = new Map();
    this.foodSuggestionsList = new Map();
    this.workoutSuggestionsList = new Map();
    
    this.userIdCounter = 1;
    this.foodItemIdCounter = 1;
    this.mealIdCounter = 1;
    this.exerciseIdCounter = 1;
    this.workoutIdCounter = 1;
    this.dailyProgressIdCounter = 1;
    this.foodSuggestionIdCounter = 1;
    this.workoutSuggestionIdCounter = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Food items methods
  async getFoodItems(): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values());
  }
  
  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    return this.foodItems.get(id);
  }
  
  async createFoodItem(insertFoodItem: InsertFoodItem): Promise<FoodItem> {
    const id = this.foodItemIdCounter++;
    const foodItem: FoodItem = { ...insertFoodItem, id };
    this.foodItems.set(id, foodItem);
    return foodItem;
  }
  
  // Meal methods
  async getMeals(userId: number): Promise<Meal[]> {
    return Array.from(this.meals.values()).filter(meal => meal.userId === userId);
  }
  
  async getMealsByDate(userId: number, date: Date): Promise<Meal[]> {
    const formattedDate = date.toISOString().split('T')[0];
    return Array.from(this.meals.values())
      .filter(meal => {
        const mealDate = new Date(meal.date).toISOString().split('T')[0];
        return meal.userId === userId && mealDate === formattedDate;
      });
  }
  
  async getMeal(id: number): Promise<Meal | undefined> {
    return this.meals.get(id);
  }
  
  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    const id = this.mealIdCounter++;
    const meal: Meal = { ...insertMeal, id };
    this.meals.set(id, meal);
    
    // Update daily progress
    await this.updateDailyProgressAfterMeal(meal);
    
    return meal;
  }
  
  async deleteMeal(id: number): Promise<boolean> {
    const meal = this.meals.get(id);
    if (!meal) return false;
    
    // Update daily progress (subtract calories and nutrients)
    const date = new Date(meal.date);
    const dailyProgress = await this.getDailyProgress(meal.userId, date);
    if (dailyProgress) {
      const key = `${meal.userId}-${date.toISOString().split('T')[0]}`;
      const updatedProgress: DailyProgress = {
        ...dailyProgress,
        caloriesConsumed: Math.max(0, dailyProgress.caloriesConsumed - meal.totalCalories),
        proteinConsumed: Math.max(0, dailyProgress.proteinConsumed - meal.totalProtein),
        // Update other nutrients as needed
      };
      this.dailyProgressRecords.set(key, updatedProgress);
    }
    
    return this.meals.delete(id);
  }
  
  // Exercise methods
  async getExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }
  
  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }
  
  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseIdCounter++;
    const exercise: Exercise = { ...insertExercise, id };
    this.exercises.set(id, exercise);
    return exercise;
  }
  
  // Workout methods
  async getWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(workout => workout.userId === userId);
  }
  
  async getWorkoutsByDate(userId: number, date: Date): Promise<Workout[]> {
    const formattedDate = date.toISOString().split('T')[0];
    return Array.from(this.workouts.values())
      .filter(workout => {
        const workoutDate = new Date(workout.date).toISOString().split('T')[0];
        return workout.userId === userId && workoutDate === formattedDate;
      });
  }
  
  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }
  
  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.workoutIdCounter++;
    const workout: Workout = { ...insertWorkout, id };
    this.workouts.set(id, workout);
    
    // Update daily progress
    await this.updateDailyProgressAfterWorkout(workout);
    
    return workout;
  }
  
  async deleteWorkout(id: number): Promise<boolean> {
    const workout = this.workouts.get(id);
    if (!workout) return false;
    
    // Update daily progress (subtract workout minutes and calories burned)
    const date = new Date(workout.date);
    const dailyProgress = await this.getDailyProgress(workout.userId, date);
    if (dailyProgress) {
      const key = `${workout.userId}-${date.toISOString().split('T')[0]}`;
      const updatedProgress: DailyProgress = {
        ...dailyProgress,
        workoutMinutes: Math.max(0, dailyProgress.workoutMinutes - workout.durationMinutes),
        caloriesBurned: Math.max(0, dailyProgress.caloriesBurned - workout.caloriesBurned),
      };
      this.dailyProgressRecords.set(key, updatedProgress);
    }
    
    return this.workouts.delete(id);
  }
  
  // Progress methods
  async getDailyProgress(userId: number, date: Date): Promise<DailyProgress | undefined> {
    const key = `${userId}-${date.toISOString().split('T')[0]}`;
    return this.dailyProgressRecords.get(key);
  }
  
  async createOrUpdateDailyProgress(progress: InsertDailyProgress): Promise<DailyProgress> {
    const date = progress.date || new Date();
    const key = `${progress.userId}-${date.toISOString().split('T')[0]}`;
    
    const existingProgress = this.dailyProgressRecords.get(key);
    
    if (existingProgress) {
      const updatedProgress: DailyProgress = {
        ...existingProgress,
        ...progress,
      };
      this.dailyProgressRecords.set(key, updatedProgress);
      return updatedProgress;
    } else {
      const id = this.dailyProgressIdCounter++;
      const newProgress: DailyProgress = { ...progress, id, date };
      this.dailyProgressRecords.set(key, newProgress);
      return newProgress;
    }
  }
  
  // Suggestion methods
  async getFoodSuggestions(): Promise<FoodSuggestion[]> {
    return Array.from(this.foodSuggestionsList.values());
  }
  
  async getWorkoutSuggestions(): Promise<WorkoutSuggestion[]> {
    return Array.from(this.workoutSuggestionsList.values());
  }
  
  async createFoodSuggestion(suggestion: InsertFoodSuggestion): Promise<FoodSuggestion> {
    const id = this.foodSuggestionIdCounter++;
    const foodSuggestion: FoodSuggestion = { ...suggestion, id };
    this.foodSuggestionsList.set(id, foodSuggestion);
    return foodSuggestion;
  }
  
  async createWorkoutSuggestion(suggestion: InsertWorkoutSuggestion): Promise<WorkoutSuggestion> {
    const id = this.workoutSuggestionIdCounter++;
    const workoutSuggestion: WorkoutSuggestion = { ...suggestion, id };
    this.workoutSuggestionsList.set(id, workoutSuggestion);
    return workoutSuggestion;
  }
  
  // Helper methods
  private async updateDailyProgressAfterMeal(meal: Meal): Promise<void> {
    const date = new Date(meal.date);
    const dailyProgress = await this.getDailyProgress(meal.userId, date);
    
    if (dailyProgress) {
      const key = `${meal.userId}-${date.toISOString().split('T')[0]}`;
      const updatedProgress: DailyProgress = {
        ...dailyProgress,
        caloriesConsumed: dailyProgress.caloriesConsumed + meal.totalCalories,
        proteinConsumed: dailyProgress.proteinConsumed + meal.totalProtein,
        // Update other nutrients as needed
      };
      this.dailyProgressRecords.set(key, updatedProgress);
    } else {
      const id = this.dailyProgressIdCounter++;
      const newProgress: DailyProgress = {
        id,
        userId: meal.userId,
        date,
        caloriesConsumed: meal.totalCalories,
        proteinConsumed: meal.totalProtein,
        carbsConsumed: 0, // Would be calculated from meal items
        fatConsumed: 0, // Would be calculated from meal items
        sugarConsumed: 0, // Would be calculated from meal items
        workoutMinutes: 0,
        caloriesBurned: 0,
      };
      const key = `${meal.userId}-${date.toISOString().split('T')[0]}`;
      this.dailyProgressRecords.set(key, newProgress);
    }
  }
  
  private async updateDailyProgressAfterWorkout(workout: Workout): Promise<void> {
    const date = new Date(workout.date);
    const dailyProgress = await this.getDailyProgress(workout.userId, date);
    
    if (dailyProgress) {
      const key = `${workout.userId}-${date.toISOString().split('T')[0]}`;
      const updatedProgress: DailyProgress = {
        ...dailyProgress,
        workoutMinutes: dailyProgress.workoutMinutes + workout.durationMinutes,
        caloriesBurned: dailyProgress.caloriesBurned + workout.caloriesBurned,
      };
      this.dailyProgressRecords.set(key, updatedProgress);
    } else {
      const id = this.dailyProgressIdCounter++;
      const newProgress: DailyProgress = {
        id,
        userId: workout.userId,
        date,
        caloriesConsumed: 0,
        proteinConsumed: 0,
        carbsConsumed: 0,
        fatConsumed: 0,
        sugarConsumed: 0,
        workoutMinutes: workout.durationMinutes,
        caloriesBurned: workout.caloriesBurned,
      };
      const key = `${workout.userId}-${date.toISOString().split('T')[0]}`;
      this.dailyProgressRecords.set(key, newProgress);
    }
  }

  // Initialize sample data
  private initializeSampleData(): void {
    // Create default user
    const user: User = {
      id: this.userIdCounter++,
      username: "demo",
      password: "password",
      calorieGoal: 2000,
      proteinGoal: 120,
      carbsGoal: 250,
      fatGoal: 65,
      sugarGoal: 50,
      workoutGoal: 45
    };
    this.users.set(user.id, user);
    
    // Create sample food items
    const foodItemsData: InsertFoodItem[] = [
      { name: "Greek Yogurt with Berries", calories: 250, protein: 15, carbs: 30, fat: 8, sugar: 15, ingredientQuality: 4, qualityNotes: "High in protein and probiotics" },
      { name: "Whole Grain Toast", calories: 120, protein: 4, carbs: 22, fat: 2, sugar: 2, ingredientQuality: 4, qualityNotes: "Good source of fiber" },
      { name: "Coffee with Almond Milk", calories: 80, protein: 1, carbs: 2, fat: 5, sugar: 0, ingredientQuality: 4, qualityNotes: null },
      { name: "Chicken Caesar Salad", calories: 420, protein: 30, carbs: 15, fat: 25, sugar: 3, ingredientQuality: 3, qualityNotes: "Caesar dressing contains preservatives" },
      { name: "Whole Grain Roll", calories: 150, protein: 5, carbs: 30, fat: 2, sugar: 3, ingredientQuality: 4, qualityNotes: null },
      { name: "Sparkling Water", calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, ingredientQuality: 4, qualityNotes: null },
      { name: "Grilled Salmon", calories: 350, protein: 35, carbs: 0, fat: 20, sugar: 0, ingredientQuality: 4, qualityNotes: "Rich in omega-3 fatty acids" },
      { name: "Quinoa", calories: 120, protein: 4, carbs: 22, fat: 2, sugar: 0, ingredientQuality: 4, qualityNotes: "Complete protein source" },
      { name: "Roasted Vegetables", calories: 110, protein: 3, carbs: 22, fat: 2, sugar: 6, ingredientQuality: 4, qualityNotes: "High in vitamins and minerals" }
    ];
    
    foodItemsData.forEach(item => {
      const id = this.foodItemIdCounter++;
      const foodItem: FoodItem = { ...item, id };
      this.foodItems.set(id, foodItem);
    });
    
    // Create sample meals
    const mealsData: InsertMeal[] = [
      { 
        userId: user.id, 
        title: "Breakfast", 
        date: new Date(), 
        time: "8:30 AM", 
        totalCalories: 450, 
        totalProtein: 20, 
        items: [
          { id: 1, name: "Greek Yogurt with Berries", calories: 250, protein: 15 },
          { id: 2, name: "Whole Grain Toast", calories: 120, protein: 4 },
          { id: 3, name: "Coffee with Almond Milk", calories: 80, protein: 1 }
        ],
        ingredientQuality: 4,
        qualityNotes: null
      },
      { 
        userId: user.id, 
        title: "Lunch", 
        date: new Date(), 
        time: "12:45 PM", 
        totalCalories: 570, 
        totalProtein: 35, 
        items: [
          { id: 4, name: "Chicken Caesar Salad", calories: 420, protein: 30 },
          { id: 5, name: "Whole Grain Roll", calories: 150, protein: 5 },
          { id: 6, name: "Sparkling Water", calories: 0, protein: 0 }
        ],
        ingredientQuality: 3,
        qualityNotes: "Caesar dressing contains preservatives and processed ingredients."
      },
      { 
        userId: user.id, 
        title: "Dinner", 
        date: new Date(), 
        time: "7:15 PM", 
        totalCalories: 580, 
        totalProtein: 42, 
        items: [
          { id: 7, name: "Grilled Salmon", calories: 350, protein: 35 },
          { id: 8, name: "Quinoa", calories: 120, protein: 4 },
          { id: 9, name: "Roasted Vegetables", calories: 110, protein: 3 }
        ],
        ingredientQuality: 4,
        qualityNotes: "Rich in omega-3 fatty acids and antioxidants."
      }
    ];
    
    mealsData.forEach(meal => {
      const id = this.mealIdCounter++;
      const newMeal: Meal = { ...meal, id };
      this.meals.set(id, newMeal);
    });
    
    // Create sample exercises
    const exercisesData: InsertExercise[] = [
      { name: "Running", type: "cardio", caloriesPerMinute: 10, instructions: "Maintain steady pace", intensity: "medium", durationMinutes: 25 },
      { name: "Upper Body Strength", type: "strength", caloriesPerMinute: 8, instructions: "Focus on proper form", intensity: "medium", durationMinutes: 30 },
      { name: "HIIT Cardio", type: "cardio", caloriesPerMinute: 12, instructions: "20 seconds on, 10 seconds rest", intensity: "high", durationMinutes: 20 }
    ];
    
    exercisesData.forEach(exercise => {
      const id = this.exerciseIdCounter++;
      const newExercise: Exercise = { ...exercise, id };
      this.exercises.set(id, newExercise);
    });
    
    // Create sample workouts
    const workoutsData: InsertWorkout[] = [
      {
        userId: user.id,
        title: "Morning Run",
        date: new Date(),
        startTime: "6:30 AM",
        endTime: "6:55 AM",
        caloriesBurned: 180,
        durationMinutes: 25,
        type: "cardio",
        details: {
          distance: 2.4,
          pace: "10:25 min/mile",
          heartRate: 142
        }
      }
    ];
    
    workoutsData.forEach(workout => {
      const id = this.workoutIdCounter++;
      const newWorkout: Workout = { ...workout, id };
      this.workouts.set(id, newWorkout);
    });
    
    // Create daily progress for the user
    const dailyProgressData: InsertDailyProgress = {
      userId: user.id,
      date: new Date(),
      caloriesConsumed: 1450,
      proteinConsumed: 89,
      carbsConsumed: 185,
      fatConsumed: 48,
      sugarConsumed: 36,
      workoutMinutes: 25,
      caloriesBurned: 180
    };
    
    const id = this.dailyProgressIdCounter++;
    const progress: DailyProgress = { ...dailyProgressData, id };
    const key = `${user.id}-${new Date().toISOString().split('T')[0]}`;
    this.dailyProgressRecords.set(key, progress);
    
    // Create food suggestions
    const foodSuggestionsData: InsertFoodSuggestion[] = [
      {
        name: "Mediterranean Bowl",
        description: "High protein, balanced carbs",
        calories: 450,
        protein: 25,
        carbs: 50,
        fat: 15,
        ingredientQuality: 4,
        mealType: "lunch",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&h=100&fit=crop&crop=center&q=80"
      },
      {
        name: "Protein Smoothie",
        description: "Post-workout recovery",
        calories: 320,
        protein: 30,
        carbs: 35,
        fat: 8,
        ingredientQuality: 4,
        mealType: "snack",
        image: "https://images.unsplash.com/photo-1593001872095-7d5b3668adbb?w=100&h=100&fit=crop&crop=center&q=80"
      }
    ];
    
    foodSuggestionsData.forEach(suggestion => {
      const id = this.foodSuggestionIdCounter++;
      const foodSuggestion: FoodSuggestion = { ...suggestion, id };
      this.foodSuggestionsList.set(id, foodSuggestion);
    });
    
    // Create workout suggestions
    const workoutSuggestionsData: InsertWorkoutSuggestion[] = [
      {
        title: "Upper Body Strength",
        description: "Focus on chest, shoulders, and arms",
        durationMinutes: 30,
        intensity: "medium",
        type: "strength",
        caloriesBurned: 240,
        instructions: "3 sets of 12 reps for each exercise"
      },
      {
        title: "HIIT Cardio",
        description: "Alternating high-intensity and rest periods",
        durationMinutes: 20,
        intensity: "high",
        type: "cardio",
        caloriesBurned: 240,
        instructions: "20 seconds work, 10 seconds rest, repeat for 8 rounds"
      }
    ];
    
    workoutSuggestionsData.forEach(suggestion => {
      const id = this.workoutSuggestionIdCounter++;
      const workoutSuggestion: WorkoutSuggestion = { ...suggestion, id };
      this.workoutSuggestionsList.set(id, workoutSuggestion);
    });
  }
}

export const storage = new MemStorage();
