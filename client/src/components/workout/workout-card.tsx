import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { type Workout } from "@shared/schema";
import { Button } from "@/components/ui/button";
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

interface WorkoutCardProps {
  workout: Workout;
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Map workout type to icon
  const getWorkoutIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cardio':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        );
      case 'strength':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'flexibility':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };
  
  // Delete workout mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      return await apiRequest("DELETE", `/api/workouts/${workout.id}`, undefined);
    },
    onSuccess: () => {
      // Get the date from the workout to use in the query key
      const date = new Date(workout.date);
      // Invalidate both the workouts list and the daily progress
      queryClient.invalidateQueries({ queryKey: [`/api/workouts?userId=${workout.userId}&date=${date.toISOString().split('T')[0]}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-progress?userId=${workout.userId}&date=${date.toISOString().split('T')[0]}`] });
      
      toast({
        title: "Workout deleted",
        description: `${workout.title} has been removed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete workout",
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
  
  // Format duration to display properly
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration);
    const seconds = Math.round((duration % 1) * 60);
    
    if (seconds === 0) {
      return `${minutes} min`;
    } else {
      return `${minutes} min ${seconds} sec`;
    }
  };
  
  // Extract workout details
  const details = workout.details as any;
  
  return (
    <Card className="mb-3 overflow-hidden border border-gray-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {getWorkoutIcon(workout.type)}
            </div>
            <div>
              <h3 className="font-medium">{workout.title}</h3>
              <p className="text-xs text-gray-500">{workout.startTime} - {workout.endTime}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{workout.caloriesBurned} cal burned</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {formatDuration(workout.durationMinutes)}
                </span>
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
                {isDeleting ? "Deleting..." : "Delete Workout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          {details && (
            <>
              {details.distance && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Distance</span>
                  <span className="text-sm font-medium">{details.distance} miles</span>
                </div>
              )}
              
              {details.pace && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Pace</span>
                  <span className="text-sm font-medium">{details.pace}</span>
                </div>
              )}
              
              {details.heartRate && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Heart Rate (avg)</span>
                  <span className="text-sm font-medium">{details.heartRate} bpm</span>
                </div>
              )}
              
              {details.sets && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Sets</span>
                  <span className="text-sm font-medium">{details.sets}</span>
                </div>
              )}
              
              {details.reps && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Reps</span>
                  <span className="text-sm font-medium">{details.reps}</span>
                </div>
              )}
              
              {details.weight && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Weight</span>
                  <span className="text-sm font-medium">{details.weight} lbs</span>
                </div>
              )}
              
              {details.rowingMeters && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Distance</span>
                  <span className="text-sm font-medium">{details.rowingMeters} meters</span>
                </div>
              )}
              
              {details.rowingSplit && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Split</span>
                  <span className="text-sm font-medium">{details.rowingSplit} /500m</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
