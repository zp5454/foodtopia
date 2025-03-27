import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMealSchema, 
  insertWorkoutSchema, 
  insertUserSchema,
  insertFoodItemSchema,
  insertDailyProgressSchema,
  insertFoodSuggestionSchema,
  insertWorkoutSuggestionSchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Helper to handle errors
  const handleError = (res: Response, error: unknown) => {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "An unknown error occurred" });
  };

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Meal routes
  app.get("/api/meals", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const dateStr = req.query.date as string | undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      if (dateStr) {
        // Parse date in YYYY-MM-DD format
        let date;
        if (dateStr.includes('T')) {
          // If it's an ISO string, extract just the date part
          date = new Date(dateStr.split('T')[0]);
        } else {
          // Otherwise assume it's already in YYYY-MM-DD format
          date = new Date(dateStr);
        }
        const meals = await storage.getMealsByDate(userId, date);
        return res.json(meals);
      }
      
      const meals = await storage.getMeals(userId);
      res.json(meals);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/meals/:id", async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      const meal = await storage.getMeal(mealId);
      
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      res.json(meal);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/meals", async (req, res) => {
    try {
      const mealData = insertMealSchema.parse(req.body);
      const meal = await storage.createMeal(mealData);
      res.status(201).json(meal);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/meals/:id", async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      const success = await storage.deleteMeal(mealId);
      
      if (!success) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Workout routes
  app.get("/api/workouts", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const dateStr = req.query.date as string | undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      if (dateStr) {
        // Parse date in YYYY-MM-DD format
        let date;
        if (dateStr.includes('T')) {
          // If it's an ISO string, extract just the date part
          date = new Date(dateStr.split('T')[0]);
        } else {
          // Otherwise assume it's already in YYYY-MM-DD format
          date = new Date(dateStr);
        }
        const workouts = await storage.getWorkoutsByDate(userId, date);
        return res.json(workouts);
      }
      
      const workouts = await storage.getWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const workout = await storage.getWorkout(workoutId);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      res.json(workout);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/workouts", async (req, res) => {
    try {
      const workoutData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(workoutData);
      res.status(201).json(workout);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/workouts/:id", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const success = await storage.deleteWorkout(workoutId);
      
      if (!success) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Food items routes
  app.get("/api/food-items", async (req, res) => {
    try {
      const foodItems = await storage.getFoodItems();
      res.json(foodItems);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/food-items", async (req, res) => {
    try {
      const foodItemData = insertFoodItemSchema.parse(req.body);
      const foodItem = await storage.createFoodItem(foodItemData);
      res.status(201).json(foodItem);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Exercises routes
  app.get("/api/exercises", async (req, res) => {
    try {
      const exercises = await storage.getExercises();
      res.json(exercises);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Daily Progress routes
  app.get("/api/daily-progress", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      // Parse date in YYYY-MM-DD format
      let date;
      if (dateStr.includes('T')) {
        // If it's an ISO string, extract just the date part
        date = new Date(dateStr.split('T')[0]);
      } else {
        // Otherwise assume it's already in YYYY-MM-DD format
        date = new Date(dateStr);
      }
      
      const progress = await storage.getDailyProgress(userId, date);
      
      if (!progress) {
        // Return empty progress
        return res.json({
          userId,
          date,
          caloriesConsumed: 0,
          proteinConsumed: 0,
          carbsConsumed: 0,
          fatConsumed: 0,
          sugarConsumed: 0,
          workoutMinutes: 0,
          caloriesBurned: 0
        });
      }
      
      res.json(progress);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/daily-progress", async (req, res) => {
    try {
      const progressData = insertDailyProgressSchema.parse(req.body);
      const progress = await storage.createOrUpdateDailyProgress(progressData);
      res.status(201).json(progress);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Config routes
  app.get("/api/config/fda-api-key", (req, res) => {
    const apiKey = process.env.FDA_API_KEY || "";
    res.status(200).json({ apiKey });
  });
  
  // Suggestions routes
  app.get("/api/food-suggestions", async (req, res) => {
    try {
      const suggestions = await storage.getFoodSuggestions();
      res.json(suggestions);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/workout-suggestions", async (req, res) => {
    try {
      const suggestions = await storage.getWorkoutSuggestions();
      res.json(suggestions);
    } catch (error) {
      handleError(res, error);
    }
  });

  return httpServer;
}
