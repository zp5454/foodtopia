import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type WorkoutSuggestion } from "@shared/schema";

export default function WorkoutSuggestions() {
  const { data: suggestions = [], isLoading } = useQuery<WorkoutSuggestion[]>({
    queryKey: ["/api/workout-suggestions"],
  });
  
  // Get icon based on workout type and intensity
  const getWorkoutIcon = (type: string, intensity: string) => {
    if (type.toLowerCase() === 'strength') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    } else if (intensity.toLowerCase() === 'high') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
        </svg>
      );
    }
  };
  
  // Get background color based on workout type
  const getBackgroundColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'strength':
        return 'bg-primary/5';
      case 'cardio':
        return 'bg-blue-50';
      case 'hiit':
        return 'bg-green-50';
      default:
        return 'bg-purple-50';
    }
  };
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold mb-2">Suggested Workouts</h3>
      <div className="bg-gray-50 rounded-xl p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {suggestions.slice(0, 2).map((workout) => (
              <div key={workout.id} className="bg-white rounded-lg p-3 shadow-sm cursor-pointer">
                <div className={`flex items-center justify-center h-24 ${getBackgroundColor(workout.type)} rounded-lg mb-2`}>
                  {getWorkoutIcon(workout.type, workout.intensity)}
                </div>
                <h4 className="font-medium text-sm">{workout.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {workout.durationMinutes} min • {workout.intensity} intensity
                </p>
              </div>
            ))}
          </div>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-center text-sm text-primary font-medium py-2"
        >
          View All Suggestions
        </Button>
      </div>
    </div>
  );
}
