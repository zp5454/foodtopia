import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { type Meal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MealCardProps {
  meal: Meal;
}

export default function MealCard({ meal }: MealCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Get quality indicator based on meal.ingredientQuality (1-4 scale)
  const qualityText = () => {
    switch (meal.ingredientQuality) {
      case 4: return "Excellent";
      case 3: return "Good";
      case 2: return "Fair";
      case 1: return "Poor";
      default: return "Unknown";
    }
  };
  
  const qualityColor = () => {
    switch (meal.ingredientQuality) {
      case 4: return "bg-green-500 text-green-500";
      case 3: return "bg-yellow-500 text-yellow-500";
      case 2: return "bg-orange-500 text-orange-500";
      case 1: return "bg-red-500 text-red-500";
      default: return "bg-gray-500 text-gray-500";
    }
  };
  
  // Delete meal mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      return await apiRequest("DELETE", `/api/meals/${meal.id}`, undefined);
    },
    onSuccess: () => {
      // Get the date from the meal to use in the query key
      const date = new Date(meal.date);
      // Invalidate both the meals list and the daily progress
      queryClient.invalidateQueries({ queryKey: [`/api/meals?userId=${meal.userId}&date=${date.toISOString()}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-progress?userId=${meal.userId}&date=${date.toISOString()}`] });
      
      toast({
        title: "Meal deleted",
        description: `${meal.title} has been removed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete meal",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });
  
  const handleDelete = () => {
    deleteMutation.mutate();
  };
  
  return (
    <Card className="mb-3 overflow-hidden border border-gray-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {meal.title === "Breakfast" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              {meal.title === "Lunch" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {meal.title === "Dinner" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              {meal.title !== "Breakfast" && meal.title !== "Lunch" && meal.title !== "Dinner" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-medium">{meal.title}</h3>
              <p className="text-xs text-gray-500">{meal.time}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{meal.totalCalories} cal</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{meal.totalProtein}g protein</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-red-500" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Meal"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <ul className="space-y-2">
            {Array.isArray(meal.items) && meal.items.map((item: any, index: number) => (
              <li key={index} className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="text-gray-500">{item.calories} cal</span>
              </li>
            ))}
          </ul>
          
          {/* Rating and analysis */}
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-xs font-medium mr-2">Ingredient Quality:</span>
                <div className="flex">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span 
                      key={i}
                      className={cn(
                        "inline-block w-4 h-4 rounded-full mr-1", 
                        i < meal.ingredientQuality ? qualityColor() : "bg-gray-200"
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className={cn(
                "text-xs font-medium", 
                meal.ingredientQuality === 4 ? "text-green-500" : 
                meal.ingredientQuality === 3 ? "text-yellow-500" : 
                meal.ingredientQuality === 2 ? "text-orange-500" : 
                "text-red-500"
              )}>
                {qualityText()}
              </span>
            </div>
            {meal.qualityNotes && (
              <p className="text-xs text-gray-500 mt-1">{meal.qualityNotes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
