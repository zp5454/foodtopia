import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import MealCard from "@/components/food/meal-card";
import AddMealDialog from "@/components/food/add-meal-dialog";
import FoodSuggestions from "@/components/food/food-suggestions";
import { type Meal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Food() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  
  // Hard-coded demo user for now (id: 1)
  const userId = 1;
  
  // Fetch meals
  const { data: meals = [], isLoading: isLoadingMeals } = useQuery<Meal[]>({
    queryKey: [
      `/api/meals?userId=${userId}&date=${selectedDate.toISOString().split('T')[0]}`
    ],
  });
  
  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(new Date(date));
  };
  
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative pb-20">
      <Header />
      
      <main className="pt-16 pb-4">
        <div className="px-4 py-4">
          <Tabs defaultValue="meals">
            <TabsList className="grid grid-cols-1 mb-4">
              <TabsTrigger value="meals">Your Meals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="meals">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Daily Log</h2>
                <Button 
                  onClick={() => setIsAddMealOpen(true)}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Meal
                </Button>
              </div>
              
              <div className="mb-4">
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full"
                />
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
                  <p className="text-gray-500">No meals logged for this day</p>
                  <button 
                    className="mt-3 text-primary font-medium"
                    onClick={() => setIsAddMealOpen(true)}
                  >
                    Add a meal
                  </button>
                </div>
              )}
              
              <FoodSuggestions />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <BottomNavigation currentPath="/food" />
      
      <AddMealDialog 
        open={isAddMealOpen} 
        onOpenChange={setIsAddMealOpen} 
        userId={userId}
        date={selectedDate}
      />
    </div>
  );
}
