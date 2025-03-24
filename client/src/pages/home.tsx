import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import DailySummary from "@/components/dashboard/daily-summary";
import MealCard from "@/components/food/meal-card";
import AddMealDialog from "@/components/food/add-meal-dialog";
import WorkoutCard from "@/components/workout/workout-card";
import WorkoutSuggestions from "@/components/workout/workout-suggestions";
import FoodSuggestions from "@/components/food/food-suggestions";
import AddWorkoutDialog from "@/components/workout/add-workout-dialog";
import { type Meal, type Workout, type DailyProgress } from "@shared/schema";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  
  // Hard-coded demo user for now (id: 1)
  const userId = 1;
  
  // Fetch daily progress
  const { data: dailyProgress, isLoading: isLoadingProgress } = useQuery<DailyProgress>({
    queryKey: [
      `/api/daily-progress?userId=${userId}&date=${selectedDate.toISOString()}`
    ],
  });
  
  // Fetch meals
  const { data: meals = [], isLoading: isLoadingMeals } = useQuery<Meal[]>({
    queryKey: [
      `/api/meals?userId=${userId}&date=${selectedDate.toISOString()}`
    ],
  });
  
  // Fetch workouts
  const { data: workouts = [], isLoading: isLoadingWorkouts } = useQuery<Workout[]>({
    queryKey: [
      `/api/workouts?userId=${userId}&date=${selectedDate.toISOString()}`
    ],
  });
  
  // Function to format date display
  const formattedDate = format(selectedDate, "EEEE, MMMM d");
  
  // Handle navigation between days
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };
  
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };
  
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative pb-20">
      <Header />
      
      {/* Main content */}
      <main className="pt-16 pb-4">
        <DailySummary 
          dailyProgress={dailyProgress}
          isLoading={isLoadingProgress}
          date={selectedDate}
          formattedDate={formattedDate}
          onPrevDay={goToPreviousDay}
          onNextDay={goToNextDay}
        />
        
        {/* Meals Section */}
        <section className="px-4 py-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Today's Meals</h2>
            <button 
              className="flex items-center text-primary text-sm font-medium"
              onClick={() => setIsAddMealOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Meal
            </button>
          </div>
          
          {isLoadingMeals ? (
            <div className="animate-pulse space-y-3">
              <div className="h-40 bg-gray-200 rounded-xl"></div>
              <div className="h-40 bg-gray-200 rounded-xl"></div>
            </div>
          ) : meals.length > 0 ? (
            meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-500">No meals logged for today</p>
              <button 
                className="mt-3 text-primary font-medium"
                onClick={() => setIsAddMealOpen(true)}
              >
                Add your first meal
              </button>
            </div>
          )}
        </section>
        
        {/* Workouts Section */}
        <section className="px-4 py-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Today's Workouts</h2>
            <button 
              className="flex items-center text-primary text-sm font-medium"
              onClick={() => setIsAddWorkoutOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Workout
            </button>
          </div>
          
          {isLoadingWorkouts ? (
            <div className="animate-pulse h-32 bg-gray-200 rounded-xl"></div>
          ) : workouts.length > 0 ? (
            workouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-500">No workouts logged for today</p>
              <button 
                className="mt-3 text-primary font-medium"
                onClick={() => setIsAddWorkoutOpen(true)}
              >
                Add your first workout
              </button>
            </div>
          )}
          
          <WorkoutSuggestions />
        </section>
        
        {/* Food Suggestions */}
        <FoodSuggestions />
      </main>
      
      <BottomNavigation />
      
      {/* Dialogs */}
      <AddMealDialog 
        open={isAddMealOpen} 
        onOpenChange={setIsAddMealOpen} 
        userId={userId}
        date={selectedDate}
      />
      <AddWorkoutDialog 
        open={isAddWorkoutOpen} 
        onOpenChange={setIsAddWorkoutOpen} 
        userId={userId}
        date={selectedDate}
      />
    </div>
  );
}
