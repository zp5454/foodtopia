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

  // Food items routes removed - using FDA API only

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

  // FDA API routes
  app.get("/api/fda/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const apiKey = process.env.FDA_API_KEY;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      if (!apiKey) {
        return res.status(500).json({ message: "FDA API key is not configured" });
      }
      
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=${pageSize}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get("/api/fda/barcode/:upc", async (req, res) => {
    try {
      const upc = req.params.upc;
      const apiKey = process.env.FDA_API_KEY;
      
      if (!upc) {
        return res.status(400).json({ message: "UPC barcode is required" });
      }
      
      if (!apiKey) {
        return res.status(500).json({ message: "FDA API key is not configured" });
      }
      
      // First try searching with gtinUpc parameter which is more accurate for barcodes
      let url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=&pageSize=25&gtinUpc=${upc}`;
      
      let response = await fetch(url);
      let data = await response.json();
      
      // If no results using gtinUpc, try regular search
      if (!data.foods || data.foods.length === 0) {
        url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${upc}`;
        response = await fetch(url);
        data = await response.json();
      }
      
      // Filter out results that don't match the UPC exactly
      const exactMatches = data.foods?.filter((food: any) => 
        food.gtinUpc === upc || 
        food.fdcId === upc || 
        (food.foodCode && food.foodCode === upc)
      );
      
      if (exactMatches && exactMatches.length > 0) {
        res.json({ foods: exactMatches });
      } else {
        // If no exact matches, return all results
        res.json(data);
      }
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get("/api/fda/food/:fdcId", async (req, res) => {
    try {
      const fdcId = req.params.fdcId;
      const apiKey = process.env.FDA_API_KEY;
      
      if (!fdcId) {
        return res.status(400).json({ message: "Food ID is required" });
      }
      
      if (!apiKey) {
        return res.status(500).json({ message: "FDA API key is not configured" });
      }
      
      const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
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
