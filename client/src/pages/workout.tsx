import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import WorkoutCard from "@/components/workout/workout-card";
import WorkoutSuggestions from "@/components/workout/workout-suggestions";
import AddWorkoutDialog from "@/components/workout/add-workout-dialog";
import { type Workout, type Exercise } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Workout() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Hard-coded demo user for now (id: 1)
  const userId = 1;
  
  // Fetch workouts
  const { data: workouts = [], isLoading: isLoadingWorkouts } = useQuery<Workout[]>({
    queryKey: [
      `/api/workouts?userId=${userId}&date=${selectedDate.toISOString().split('T')[0]}`
    ],
  });
  
  // Fetch all exercises
  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });
  
  // Filter exercises based on search term
  const filteredExercises = exercises.filter(exercise => 
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <Tabs defaultValue="workouts">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="workouts">Workouts</TabsTrigger>
              <TabsTrigger value="exercises">Exercise Library</TabsTrigger>
            </TabsList>
            
            <TabsContent value="workouts">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Your Workouts</h2>
                <Button 
                  onClick={() => setIsAddWorkoutOpen(true)}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Workout
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
              
              {isLoadingWorkouts ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                </div>
              ) : workouts.length > 0 ? (
                workouts.map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">No workouts logged for this day</p>
                  <button 
                    className="mt-3 text-primary font-medium"
                    onClick={() => setIsAddWorkoutOpen(true)}
                  >
                    Add a workout
                  </button>
                </div>
              )}
              
              <WorkoutSuggestions />
            </TabsContent>
            
            <TabsContent value="exercises">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exercises..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {isLoadingExercises ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ) : filteredExercises.length > 0 ? (
                <div className="space-y-3">
                  {filteredExercises.map((exercise) => (
                    <Card key={exercise.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{exercise.name}</h3>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{exercise.type}</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{exercise.intensity} intensity</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{exercise.durationMinutes} min</span>
                            </div>
                            {exercise.instructions && (
                              <p className="text-xs text-gray-500 mt-2">{exercise.instructions}</p>
                            )}
                          </div>
                          <Button size="sm" onClick={() => setIsAddWorkoutOpen(true)}>Add</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    {searchTerm 
                      ? `No exercises found matching "${searchTerm}"` 
                      : "Start typing to search for exercises"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <BottomNavigation currentPath="/workout" />
      
      <AddWorkoutDialog 
        open={isAddWorkoutOpen} 
        onOpenChange={setIsAddWorkoutOpen} 
        userId={userId}
        date={selectedDate}
      />
    </div>
  );
}
