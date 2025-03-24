import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { type FoodSuggestion } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreVertical } from "lucide-react";

export default function FoodSuggestions() {
  const { data: suggestions = [], isLoading } = useQuery<FoodSuggestion[]>({
    queryKey: ["/api/food-suggestions"],
  });
  
  return (
    <section className="px-4 py-2">
      <h2 className="text-lg font-semibold mb-3">Food Suggestions</h2>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm mb-3">Based on your nutrition targets and preferences:</p>
        
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                className="bg-white rounded-lg p-3 shadow-sm flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={suggestion.image}
                    alt={suggestion.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{suggestion.name}</h4>
                  <p className="text-xs text-gray-500">{suggestion.description}</p>
                  <div className="flex mt-1">
                    <span className={`text-xs ${
                      suggestion.ingredientQuality === 4 ? "bg-green-100 text-green-600" : 
                      suggestion.ingredientQuality === 3 ? "bg-yellow-100 text-yellow-600" : 
                      "bg-orange-100 text-orange-600"
                    } px-2 py-0.5 rounded-full`}>
                      {suggestion.ingredientQuality === 4 ? "Excellent" : 
                       suggestion.ingredientQuality === 3 ? "Good" : 
                       "Fair"} ingredients
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0 text-gray-400">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-center text-sm text-primary font-medium py-2"
        >
          View All Food Suggestions
        </Button>
      </div>
    </section>
  );
}
