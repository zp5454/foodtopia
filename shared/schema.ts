import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  calorieGoal: integer("calorie_goal").default(2000),
  proteinGoal: integer("protein_goal").default(120),
  carbsGoal: integer("carbs_goal").default(250),
  fatGoal: integer("fat_goal").default(65),
  sugarGoal: integer("sugar_goal").default(50),
  workoutGoal: integer("workout_goal").default(45), // minutes
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  calorieGoal: true,
  proteinGoal: true,
  carbsGoal: true,
  fatGoal: true,
  sugarGoal: true,
  workoutGoal: true,
});

// Food Item Schema
export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  sugar: real("sugar").notNull(),
  ingredientQuality: integer("ingredient_quality").notNull(), // 1-4 scale
  qualityNotes: text("quality_notes"),
});

export const insertFoodItemSchema = createInsertSchema(foodItems).pick({
  name: true,
  calories: true,
  protein: true,
  carbs: true,
  fat: true,
  sugar: true,
  ingredientQuality: true,
  qualityNotes: true,
});

// Meal Schema
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  time: text("time").notNull(),
  totalCalories: integer("total_calories").notNull(),
  totalProtein: real("total_protein").notNull(),
  items: json("items").notNull(), // Array of food items with quantities
  ingredientQuality: integer("ingredient_quality").notNull(), // 1-4 scale
  qualityNotes: text("quality_notes"),
});

export const insertMealSchema = createInsertSchema(meals)
  .pick({
    userId: true,
    title: true,
    date: true,
    time: true,
    totalCalories: true,
    totalProtein: true,
    items: true,
    ingredientQuality: true,
    qualityNotes: true,
  })
  .extend({
    // Add transform to ensure dates are properly handled 
    // whether they're strings or Date objects
    date: z.coerce.date(),
  });

// Exercise Schema
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // cardio, strength, flexibility, etc.
  caloriesPerMinute: integer("calories_per_minute").notNull(),
  instructions: text("instructions"),
  intensity: text("intensity").notNull(), // low, medium, high
  durationMinutes: integer("duration_minutes").notNull(),
});

export const insertExerciseSchema = createInsertSchema(exercises).pick({
  name: true,
  type: true,
  caloriesPerMinute: true,
  instructions: true,
  intensity: true,
  durationMinutes: true,
});

// Workout Schema
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  caloriesBurned: integer("calories_burned").notNull(),
  durationMinutes: real("duration_minutes").notNull(), // Using real to support minutes with seconds/milliseconds
  type: text("type").notNull(),
  details: json("details").notNull(), // Additional metrics like distance, pace, etc.
});

export const insertWorkoutSchema = createInsertSchema(workouts)
  .pick({
    userId: true,
    title: true,
    date: true,
    startTime: true,
    endTime: true,
    caloriesBurned: true,
    durationMinutes: true,
    type: true,
    details: true,
  })
  .extend({
    // Add transform to ensure dates are properly handled
    date: z.coerce.date(),
  });

// Progress Schema
export const dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  caloriesConsumed: integer("calories_consumed").default(0),
  proteinConsumed: real("protein_consumed").default(0),
  carbsConsumed: real("carbs_consumed").default(0),
  fatConsumed: real("fat_consumed").default(0),
  sugarConsumed: real("sugar_consumed").default(0),
  workoutMinutes: real("workout_minutes").default(0), // Using real to support minutes with seconds/milliseconds
  caloriesBurned: integer("calories_burned").default(0),
  rowingMeters: integer("rowing_meters").default(0),
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress)
  .pick({
    userId: true,
    date: true,
    caloriesConsumed: true,
    proteinConsumed: true,
    carbsConsumed: true,
    fatConsumed: true,
    sugarConsumed: true,
    workoutMinutes: true,
    caloriesBurned: true,
    rowingMeters: true,
  })
  .extend({
    // Add transform to ensure dates are properly handled
    date: z.coerce.date(),
  });

// Suggestions Schema
export const foodSuggestions = pgTable("food_suggestions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").default(0),
  fat: real("fat").default(0),
  sugar: real("sugar").default(0),
  ingredientQuality: integer("ingredient_quality").default(5),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  image: text("image"), // URL to image
  ingredients: text("ingredients").notNull(), // List of ingredients
});

export const insertFoodSuggestionSchema = createInsertSchema(foodSuggestions).pick({
  name: true,
  description: true,
  calories: true,
  protein: true,
  carbs: true,
  fat: true,
  sugar: true,
  ingredientQuality: true,
  mealType: true,
  image: true,
  ingredients: true,
});

export const workoutSuggestions = pgTable("workout_suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").default(30),
  intensity: text("intensity").notNull(),
  type: text("type").default("Workout"),
  caloriesBurned: integer("calories_burned").default(200),
  instructions: text("instructions"),
  exercises: text("exercises").notNull(),
});

export const insertWorkoutSuggestionSchema = createInsertSchema(workoutSuggestions).pick({
  title: true,
  description: true,
  durationMinutes: true,
  intensity: true,
  type: true,
  caloriesBurned: true,
  instructions: true,
  exercises: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;

export type FoodSuggestion = typeof foodSuggestions.$inferSelect;
export type InsertFoodSuggestion = z.infer<typeof insertFoodSuggestionSchema>;

export type WorkoutSuggestion = typeof workoutSuggestions.$inferSelect;
export type InsertWorkoutSuggestion = z.infer<typeof insertWorkoutSuggestionSchema>;

// Additional zod schemas for form validation
export const mealItemSchema = z.object({
  name: z.string(),
  calories: z.number(),
  protein: z.number().optional(),
  amount: z.number().optional(),
});

export const workoutDetailsSchema = z.object({
  distance: z.number().optional(),
  pace: z.string().optional(),
  heartRate: z.number().optional(),
  sets: z.number().optional(),
  reps: z.number().optional(),
  weight: z.number().optional(),
  // Rowing specific fields
  rowingMeters: z.number().optional(),
  rowingSplit: z.string().optional(), // Format: MM:SS
});

export type MealItem = z.infer<typeof mealItemSchema>;
export type WorkoutDetails = z.infer<typeof workoutDetailsSchema>;
