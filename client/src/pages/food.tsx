import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import MealCard from "@/components/food/meal-card";
import AddMealDialog from "@/components/food/add-meal-dialog";
import FoodSuggestions from "@/components/food/food-suggestions";
import { type Meal, type FoodItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Food() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Hard-coded demo user for now (id: 1)
  const userId = 1;
  
  // Fetch meals
  const { data: meals = [], isLoading: isLoadingMeals } = useQuery<Meal[]>({
    queryKey: [
      `/api/meals?userId=${userId}&date=${selectedDate.toISOString()}`
    ],
  });
  
  // Fetch all food items
  const { data: foodItems = [], isLoading: isLoadingFoodItems } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
  });
  
  // Filter food items based on search term
  const filteredFoodItems = foodItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="meals">Meals</TabsTrigger>
              <TabsTrigger value="search">Food Database</TabsTrigger>
            </TabsList>
            
            <TabsContent value="meals">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Your Meals</h2>
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
            
            <TabsContent value="search">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search food..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {isLoadingFoodItems ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ) : filteredFoodItems.length > 0 ? (
                <div className="space-y-3">
                  {filteredFoodItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{item.calories} cal</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{item.protein}g protein</span>
                            </div>
                            <div className="flex items-center mt-2">
                              <span className="text-xs font-medium mr-2">Quality:</span>
                              <div className="flex">
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <span 
                                    key={i}
                                    className={`inline-block w-4 h-4 rounded-full mr-1 ${
                                      i < item.ingredientQuality 
                                        ? 'bg-green-500' 
                                        : 'bg-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">Add</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    {searchTerm 
                      ? `No food items found matching "${searchTerm}"` 
                      : "Start typing to search for food items"}
                  </p>
                </div>
              )}
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
