import { 
  users, type User, type InsertUser,
  foodItems, type FoodItem, type InsertFoodItem,
  meals, type Meal, type InsertMeal,
  exercises, type Exercise, type InsertExercise,
  workouts, type Workout, type InsertWorkout,
  dailyProgress, type DailyProgress, type InsertDailyProgress,
  foodSuggestions, type FoodSuggestion, type InsertFoodSuggestion,
  workoutSuggestions, type WorkoutSuggestion, type InsertWorkoutSuggestion,
  type WorkoutDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import * as schema from "@shared/schema";

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
    
    // Extract rowing meters if this is a rowing workout
    let rowingMeters = 0;
    if (workout.type === 'rowing' && workout.details && typeof workout.details === 'object') {
      rowingMeters = (workout.details as WorkoutDetails).rowingMeters || 0;
    }
    
    if (dailyProgress) {
      const key = `${workout.userId}-${date.toISOString().split('T')[0]}`;
      const updatedProgress: DailyProgress = {
        ...dailyProgress,
        workoutMinutes: dailyProgress.workoutMinutes + workout.durationMinutes,
        caloriesBurned: dailyProgress.caloriesBurned + workout.caloriesBurned,
        rowingMeters: dailyProgress.rowingMeters + rowingMeters
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
        rowingMeters: rowingMeters
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
      { name: "HIIT Cardio", type: "cardio", caloriesPerMinute: 12, instructions: "20 seconds on, 10 seconds rest", intensity: "high", durationMinutes: 20 },
      { name: "Rowing", type: "cardio", caloriesPerMinute: 11, instructions: "Maintain proper form and consistent pace", intensity: "medium", durationMinutes: 25 }
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

// Create a DatabaseStorage class that implements IStorage
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Food items methods
  async getFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems);
  }
  
  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    const [item] = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return item || undefined;
  }
  
  async createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem> {
    const [item] = await db.insert(foodItems).values(foodItem).returning();
    return item;
  }
  
  // Meal methods
  async getMeals(userId: number): Promise<Meal[]> {
    return await db.select().from(meals).where(eq(meals.userId, userId));
  }
  
  async getMealsByDate(userId: number, date: Date): Promise<Meal[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          gte(meals.date, startOfDay),
          lte(meals.date, endOfDay)
        )
      );
  }
  
  async getMeal(id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal || undefined;
  }
  
  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [newMeal] = await db.insert(meals).values({
      ...meal,
      date: meal.date || new Date(),
      qualityNotes: meal.qualityNotes ?? null
    }).returning();
    
    // Update daily progress
    await this.updateDailyProgressAfterMeal(newMeal);
    return newMeal;
  }
  
  async deleteMeal(id: number): Promise<boolean> {
    const meal = await this.getMeal(id);
    if (!meal) {
      return false;
    }
    
    await db.delete(meals).where(eq(meals.id, id));
    
    // Update daily progress
    const startOfDay = new Date(meal.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(meal.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all meals for the day
    const dayMeals = await db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, meal.userId),
          gte(meals.date, startOfDay),
          lte(meals.date, endOfDay)
        )
      );
    
    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalSugar = 0;
    
    for (const m of dayMeals) {
      totalCalories += m.totalCalories;
      totalProtein += m.totalProtein;
      // Parse items to get carbs, fat, sugar
      const items = m.items as any[];
      for (const item of items) {
        totalCarbs += item.carbs || 0;
        totalFat += item.fat || 0;
        totalSugar += item.sugar || 0;
      }
    }
    
    // Update or create progress
    const progress = await this.getDailyProgress(meal.userId, meal.date);
    if (progress) {
      await db
        .update(dailyProgress)
        .set({
          caloriesConsumed: totalCalories,
          proteinConsumed: totalProtein,
          carbsConsumed: totalCarbs,
          fatConsumed: totalFat,
          sugarConsumed: totalSugar
        })
        .where(eq(dailyProgress.id, progress.id));
    }
    
    return true;
  }
  
  // Exercise methods
  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises);
  }
  
  async getExercise(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise || undefined;
  }
  
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values({
      ...exercise,
      instructions: exercise.instructions ?? null
    }).returning();
    return newExercise;
  }
  
  // Workout methods
  async getWorkouts(userId: number): Promise<Workout[]> {
    return await db.select().from(workouts).where(eq(workouts.userId, userId));
  }
  
  async getWorkoutsByDate(userId: number, date: Date): Promise<Workout[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, userId),
          gte(workouts.date, startOfDay),
          lte(workouts.date, endOfDay)
        )
      );
  }
  
  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout || undefined;
  }
  
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values({
      ...workout,
      date: workout.date || new Date()
    }).returning();
    
    // Update daily progress
    await this.updateDailyProgressAfterWorkout(newWorkout);
    return newWorkout;
  }
  
  async deleteWorkout(id: number): Promise<boolean> {
    const workout = await this.getWorkout(id);
    if (!workout) {
      return false;
    }
    
    await db.delete(workouts).where(eq(workouts.id, id));
    
    // Update daily progress
    const startOfDay = new Date(workout.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(workout.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all workouts for the day
    const dayWorkouts = await db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, workout.userId),
          gte(workouts.date, startOfDay),
          lte(workouts.date, endOfDay)
        )
      );
    
    // Calculate totals
    let totalMinutes = 0;
    let totalCaloriesBurned = 0;
    
    for (const w of dayWorkouts) {
      totalMinutes += w.durationMinutes;
      totalCaloriesBurned += w.caloriesBurned;
    }
    
    // Update or create progress
    const progress = await this.getDailyProgress(workout.userId, workout.date);
    if (progress) {
      await db
        .update(dailyProgress)
        .set({
          workoutMinutes: totalMinutes,
          caloriesBurned: totalCaloriesBurned
        })
        .where(eq(dailyProgress.id, progress.id));
    }
    
    return true;
  }
  
  // Progress methods
  async getDailyProgress(userId: number, date: Date): Promise<DailyProgress | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [progress] = await db
      .select()
      .from(dailyProgress)
      .where(
        and(
          eq(dailyProgress.userId, userId),
          gte(dailyProgress.date, startOfDay),
          lte(dailyProgress.date, endOfDay)
        )
      );
    
    return progress || undefined;
  }
  
  async createOrUpdateDailyProgress(progress: InsertDailyProgress): Promise<DailyProgress> {
    // Ensure date is not undefined
    if (!progress.date) {
      progress.date = new Date();
    }
    
    const existing = await this.getDailyProgress(progress.userId, progress.date);
    
    if (existing) {
      // Update existing
      const [updated] = await db
        .update(dailyProgress)
        .set(progress)
        .where(eq(dailyProgress.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new
      const [newProgress] = await db
        .insert(dailyProgress)
        .values({
          ...progress,
          caloriesConsumed: progress.caloriesConsumed ?? 0,
          proteinConsumed: progress.proteinConsumed ?? 0,
          carbsConsumed: progress.carbsConsumed ?? 0,
          fatConsumed: progress.fatConsumed ?? 0,
          sugarConsumed: progress.sugarConsumed ?? 0,
          workoutMinutes: progress.workoutMinutes ?? 0,
          caloriesBurned: progress.caloriesBurned ?? 0
        })
        .returning();
      
      return newProgress;
    }
  }
  
  // Suggestions methods
  async getFoodSuggestions(): Promise<FoodSuggestion[]> {
    return await db.select().from(foodSuggestions);
  }
  
  async getWorkoutSuggestions(): Promise<WorkoutSuggestion[]> {
    return await db.select().from(workoutSuggestions);
  }
  
  async createFoodSuggestion(suggestion: InsertFoodSuggestion): Promise<FoodSuggestion> {
    const [newSuggestion] = await db.insert(foodSuggestions).values({
      ...suggestion,
      image: suggestion.image ?? null
    }).returning();
    return newSuggestion;
  }
  
  async createWorkoutSuggestion(suggestion: InsertWorkoutSuggestion): Promise<WorkoutSuggestion> {
    const [newSuggestion] = await db.insert(workoutSuggestions).values({
      ...suggestion,
      type: suggestion.type ?? 'Workout',
      instructions: suggestion.instructions ?? null
    }).returning();
    return newSuggestion;
  }
  
  // Helper methods
  private async updateDailyProgressAfterMeal(meal: Meal): Promise<void> {
    const progress = await this.getDailyProgress(meal.userId, meal.date);
    
    if (progress) {
      // Get all meals for today
      const meals = await this.getMealsByDate(meal.userId, meal.date);
      
      // Calculate total nutrients
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalSugar = 0;
      
      for (const m of meals) {
        totalCalories += m.totalCalories;
        totalProtein += m.totalProtein;
        // Parse items to get carbs, fat, sugar
        const items = m.items as any[];
        for (const item of items) {
          totalCarbs += item.carbs || 0;
          totalFat += item.fat || 0;
          totalSugar += item.sugar || 0;
        }
      }
      
      // Update progress
      await db
        .update(dailyProgress)
        .set({
          caloriesConsumed: totalCalories,
          proteinConsumed: totalProtein,
          carbsConsumed: totalCarbs,
          fatConsumed: totalFat,
          sugarConsumed: totalSugar
        })
        .where(eq(dailyProgress.id, progress.id));
    } else {
      // Create new progress entry
      // Parse items to get carbs, fat, sugar
      const items = meal.items as any[];
      let totalCarbs = 0;
      let totalFat = 0;
      let totalSugar = 0;
      
      for (const item of items) {
        totalCarbs += item.carbs || 0;
        totalFat += item.fat || 0;
        totalSugar += item.sugar || 0;
      }
      
      await db.insert(dailyProgress).values({
        userId: meal.userId,
        date: meal.date,
        caloriesConsumed: meal.totalCalories,
        proteinConsumed: meal.totalProtein,
        carbsConsumed: totalCarbs,
        fatConsumed: totalFat,
        sugarConsumed: totalSugar,
        workoutMinutes: 0,
        caloriesBurned: 0
      });
    }
  }
  
  private async updateDailyProgressAfterWorkout(workout: Workout): Promise<void> {
    const progress = await this.getDailyProgress(workout.userId, workout.date);
    
    if (progress) {
      // Get all workouts for today
      const workouts = await this.getWorkoutsByDate(workout.userId, workout.date);
      
      // Calculate total workout stats
      let totalMinutes = 0;
      let totalCaloriesBurned = 0;
      let totalRowingMeters = 0;
      
      // Loop through each workout and extract metrics
      for (const w of workouts) {
        totalMinutes += w.durationMinutes;
        totalCaloriesBurned += w.caloriesBurned;
        
        // Add rowing meters if this is a rowing workout
        if (w.type === 'rowing' && w.details && typeof w.details === 'object') {
          const details = w.details as Record<string, any>;
          if (details.rowingMeters) {
            totalRowingMeters += Number(details.rowingMeters) || 0;
          }
        }
      }
      
      // Update progress
      await db
        .update(dailyProgress)
        .set({
          workoutMinutes: totalMinutes,
          caloriesBurned: totalCaloriesBurned,
          rowingMeters: totalRowingMeters
        })
        .where(eq(dailyProgress.id, progress.id));
    } else {
      // Extract rowing meters if this is a rowing workout
      let rowingMeters = 0;
      if (workout.type === 'rowing' && workout.details && typeof workout.details === 'object') {
        const details = workout.details as Record<string, any>;
        if (details.rowingMeters) {
          rowingMeters = Number(details.rowingMeters) || 0;
        }
      }
      
      // Create new progress entry
      await db.insert(dailyProgress).values({
        userId: workout.userId,
        date: workout.date,
        caloriesConsumed: 0,
        proteinConsumed: 0,
        carbsConsumed: 0,
        fatConsumed: 0,
        sugarConsumed: 0,
        workoutMinutes: workout.durationMinutes,
        caloriesBurned: workout.caloriesBurned,
        rowingMeters: rowingMeters
      });
    }
  }
}

// Initialize the database with sample data
export async function initDatabase() {
  // Create a user if none exists
  const users = await db.select().from(schema.users);
  if (users.length === 0) {
    await db.insert(schema.users).values({
      username: "demo",
      password: "password123",
      calorieGoal: 2000,
      proteinGoal: 120,
      carbsGoal: 250,
      fatGoal: 65,
      sugarGoal: 50,
      workoutGoal: 45
    });
  }
  
  // Add sample food items if none exist
  const foodItemsList = await db.select().from(schema.foodItems);
  if (foodItemsList.length === 0) {
    const sampleFoodItems = [
      {
        name: "Banana",
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        sugar: 14,
        ingredientQuality: 9,
        qualityNotes: "Whole fruit, high in potassium and natural sugars"
      },
      {
        name: "Greek Yogurt",
        calories: 130,
        protein: 17,
        carbs: 6,
        fat: 4,
        sugar: 4,
        ingredientQuality: 8,
        qualityNotes: "High protein dairy, probiotics for gut health"
      },
      {
        name: "Grilled Chicken Breast",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        sugar: 0,
        ingredientQuality: 7,
        qualityNotes: "Lean protein source, low in fat"
      },
      {
        name: "Avocado",
        calories: 234,
        protein: 2.9,
        carbs: 12,
        fat: 21,
        sugar: 0.7,
        ingredientQuality: 9,
        qualityNotes: "Healthy fats, fiber, and vitamins"
      }
    ];
    
    for (const item of sampleFoodItems) {
      await db.insert(schema.foodItems).values(item);
    }
  }
  
  // Add sample exercises if none exist
  const exercisesList = await db.select().from(schema.exercises);
  if (exercisesList.length === 0) {
    const sampleExercises = [
      {
        name: "Running",
        type: "Cardio",
        caloriesPerMinute: 10,
        intensity: "High",
        durationMinutes: 30,
        instructions: "Maintain a steady pace, focus on proper form"
      },
      {
        name: "Cycling",
        type: "Cardio",
        caloriesPerMinute: 8,
        intensity: "Medium",
        durationMinutes: 45,
        instructions: "Adjust resistance as needed, maintain cadence"
      },
      {
        name: "Push-Ups",
        type: "Strength",
        caloriesPerMinute: 7,
        intensity: "Medium",
        durationMinutes: 10,
        instructions: "Keep body straight, lower until elbows at 90 degrees"
      },
      {
        name: "Squats",
        type: "Strength",
        caloriesPerMinute: 8,
        intensity: "Medium",
        durationMinutes: 15,
        instructions: "Keep weight in heels, knees tracking over toes"
      }
    ];
    
    for (const exercise of sampleExercises) {
      await db.insert(schema.exercises).values(exercise);
    }
  }
  
  // Add sample food suggestions if none exist
  const foodSuggestionsList = await db.select().from(schema.foodSuggestions);
  if (foodSuggestionsList.length === 0) {
    const sampleFoodSuggestions = [
      {
        name: "Mediterranean Bowl",
        description: "Quinoa bowl with grilled chicken, feta, olives, and vegetables",
        mealType: "Lunch",
        calories: 450,
        protein: 35,
        carbs: 40,
        fat: 15,
        sugar: 5,
        ingredientQuality: 9,
        ingredients: "Quinoa, chicken breast, feta cheese, olives, cucumber, tomato, olive oil"
      },
      {
        name: "Protein Smoothie",
        description: "Quick protein-packed smoothie with fruit and greens",
        mealType: "Breakfast",
        calories: 320,
        protein: 24,
        carbs: 35,
        fat: 8,
        sugar: 18,
        ingredientQuality: 8,
        ingredients: "Greek yogurt, banana, spinach, protein powder, almond milk, chia seeds"
      },
      {
        name: "Veggie Stir Fry",
        description: "Colorful vegetable stir fry with tofu and brown rice",
        mealType: "Dinner",
        calories: 380,
        protein: 18,
        carbs: 50,
        fat: 10,
        sugar: 8,
        ingredientQuality: 9,
        ingredients: "Tofu, broccoli, bell peppers, carrots, brown rice, soy sauce, ginger"
      }
    ];
    
    for (const suggestion of sampleFoodSuggestions) {
      await db.insert(schema.foodSuggestions).values(suggestion);
    }
  }
  
  // Add sample workout suggestions if none exist
  const workoutSuggestionsList = await db.select().from(schema.workoutSuggestions);
  if (workoutSuggestionsList.length === 0) {
    const sampleWorkoutSuggestions = [
      {
        title: "Upper Body Strength",
        description: "Focus on chest, shoulders, and arms",
        durationMinutes: 45,
        intensity: "Medium",
        type: "Strength",
        caloriesBurned: 320,
        instructions: "Complete 3 sets of each exercise with 60 seconds rest between sets",
        exercises: "Push-ups, dumbbell rows, shoulder press, bicep curls, tricep dips"
      },
      {
        title: "HIIT Cardio",
        description: "High-intensity interval training for maximum calorie burn",
        durationMinutes: 30,
        intensity: "High",
        type: "Cardio",
        caloriesBurned: 450,
        instructions: "Work for 40 seconds, rest for 20 seconds, repeat for each exercise",
        exercises: "Jumping jacks, burpees, mountain climbers, high knees, squat jumps"
      },
      {
        title: "Lower Body Power",
        description: "Strengthen legs and glutes",
        durationMinutes: 40,
        intensity: "Medium-High",
        type: "Strength",
        caloriesBurned: 380,
        instructions: "Complete each exercise for 45 seconds with minimal rest between movements",
        exercises: "Squats, lunges, deadlifts, calf raises, glute bridges"
      }
    ];
    
    for (const suggestion of sampleWorkoutSuggestions) {
      await db.insert(schema.workoutSuggestions).values(suggestion);
    }
  }
  
  // For a demo user, create some example meals, workouts and progress
  const userId = 1; // Assuming first user is id 1
  
  // Check if meals exist for this user
  const userMeals = await db.select().from(schema.meals).where(eq(schema.meals.userId, userId));
  if (userMeals.length === 0) {
    // Create a meal
    const today = new Date();
    
    // Breakfast
    await db.insert(schema.meals).values({
      userId,
      title: "Breakfast",
      time: "08:30 AM",
      date: today,
      totalCalories: 435,
      totalProtein: 24,
      ingredientQuality: 8,
      qualityNotes: "Balanced breakfast with good protein",
      items: JSON.stringify([
        {
          name: "Greek Yogurt",
          servings: 1,
          calories: 130,
          protein: 17,
          carbs: 6,
          fat: 4,
          sugar: 4
        },
        {
          name: "Banana",
          servings: 1,
          calories: 105,
          protein: 1.3,
          carbs: 27,
          fat: 0.4,
          sugar: 14
        },
        {
          name: "Granola",
          servings: 0.5,
          calories: 200,
          protein: 6,
          carbs: 24,
          fat: 8,
          sugar: 8
        }
      ])
    });
    
    // Lunch
    await db.insert(schema.meals).values({
      userId,
      title: "Lunch",
      time: "12:30 PM",
      date: today,
      totalCalories: 550,
      totalProtein: 40,
      ingredientQuality: 7,
      qualityNotes: "Good protein source with vegetables",
      items: JSON.stringify([
        {
          name: "Grilled Chicken Breast",
          servings: 1,
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          sugar: 0
        },
        {
          name: "Brown Rice",
          servings: 1,
          calories: 215,
          protein: 5,
          carbs: 45,
          fat: 1.8,
          sugar: 0
        },
        {
          name: "Mixed Vegetables",
          servings: 1,
          calories: 120,
          protein: 4,
          carbs: 23,
          fat: 0.5,
          sugar: 4
        },
        {
          name: "Olive Oil",
          servings: 1,
          calories: 50,
          protein: 0,
          carbs: 0,
          fat: 5.5,
          sugar: 0
        }
      ])
    });
  }
  
  // Check if workouts exist for this user
  const userWorkouts = await db.select().from(schema.workouts).where(eq(schema.workouts.userId, userId));
  if (userWorkouts.length === 0) {
    // Create a workout
    const today = new Date();
    
    await db.insert(schema.workouts).values({
      userId,
      title: "Morning Run",
      type: "Cardio",
      date: today,
      durationMinutes: 30,
      startTime: "07:00 AM",
      endTime: "07:30 AM",
      caloriesBurned: 300,
      details: JSON.stringify({
        distance: 5,
        pace: "6:00 min/km",
        heartRate: 150,
        exercises: ["Running"]
      })
    });
    
    await db.insert(schema.workouts).values({
      userId,
      title: "Evening Strength Training",
      type: "Strength",
      date: today,
      durationMinutes: 45,
      startTime: "06:00 PM",
      endTime: "06:45 PM",
      caloriesBurned: 350,
      details: JSON.stringify({
        sets: 3,
        reps: "8-12",
        rest: "60 seconds",
        exercises: ["Push-Ups", "Squats", "Dumbbell Rows", "Lunges"]
      })
    });
  }
  
  // Add daily progress if none exists
  const userProgress = await db.select().from(schema.dailyProgress).where(eq(schema.dailyProgress.userId, userId));
  if (userProgress.length === 0) {
    const today = new Date();
    
    await db.insert(schema.dailyProgress).values({
      userId,
      date: today,
      caloriesConsumed: 1800,
      proteinConsumed: 95,
      carbsConsumed: 200,
      fatConsumed: 60,
      sugarConsumed: 45,
      workoutMinutes: 75,
      caloriesBurned: 650,
      rowingMeters: 0
    });
  }
}

// Export an instance of the database storage
export const storage = new DatabaseStorage();
