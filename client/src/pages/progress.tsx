import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type DailyProgress, type User } from "@shared/schema";
import { subDays, format, startOfWeek, addDays } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function Progress() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Hard-coded demo user for now (id: 1)
  const userId = 1;
  
  // Fetch user data for goals
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });
  
  // Get daily progress for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i));
  
  // Create a map to store daily progress data by date
  const [progressData, setProgressData] = useState<Map<string, DailyProgress>>(new Map());
  
  // Fetch daily progress for the selected date
  const { data: currentDayProgress } = useQuery<DailyProgress>({
    queryKey: [`/api/daily-progress?userId=${userId}&date=${new Date().toISOString().split('T')[0]}`],
  });
  
  // Use a single effect to update the progress data 
  useEffect(() => {
    if (currentDayProgress) {
      setProgressData(prev => {
        const newMap = new Map(prev);
        const dateKey = format(new Date(), "yyyy-MM-dd");
        newMap.set(dateKey, currentDayProgress);
        return newMap;
      });
    }
  }, [currentDayProgress]);
  
  // Prepare data for charts
  const caloriesChartData = last7Days.map(date => {
    const dateKey = format(date, "yyyy-MM-dd");
    const progress = progressData.get(dateKey);
    return {
      date: format(date, "MM/dd"),
      consumed: progress?.caloriesConsumed || 0,
      burned: progress?.caloriesBurned || 0,
      goal: user?.calorieGoal || 2000
    };
  }).reverse();
  
  const nutrientsChartData = last7Days.map(date => {
    const dateKey = format(date, "yyyy-MM-dd");
    const progress = progressData.get(dateKey);
    return {
      date: format(date, "MM/dd"),
      protein: progress?.proteinConsumed || 0,
      carbs: progress?.carbsConsumed || 0,
      fat: progress?.fatConsumed || 0
    };
  }).reverse();
  
  const workoutChartData = last7Days.map(date => {
    const dateKey = format(date, "yyyy-MM-dd");
    const progress = progressData.get(dateKey);
    return {
      date: format(date, "MM/dd"),
      minutes: progress?.workoutMinutes || 0,
      goal: user?.workoutGoal || 45
    };
  }).reverse();
  
  // Create weekly summary
  const startOfCurrentWeek = startOfWeek(new Date());
  const daysInWeek = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
  
  const weeklyData = daysInWeek.map(date => {
    const dateKey = format(date, "yyyy-MM-dd");
    const progress = progressData.get(dateKey);
    return {
      date: format(date, "EEE"),
      consumed: progress?.caloriesConsumed || 0,
      burned: progress?.caloriesBurned || 0,
      workoutMinutes: progress?.workoutMinutes || 0
    };
  });
  
  const weeklyStats = {
    totalCaloriesConsumed: weeklyData.reduce((acc, day) => acc + day.consumed, 0),
    totalCaloriesBurned: weeklyData.reduce((acc, day) => acc + day.burned, 0),
    totalWorkoutMinutes: weeklyData.reduce((acc, day) => acc + day.workoutMinutes, 0),
    avgProtein: weeklyData.reduce((acc, day) => {
      const dateKey = format(new Date(day.date), "yyyy-MM-dd");
      const progress = progressData.get(dateKey);
      return acc + (progress?.proteinConsumed || 0);
    }, 0) / 7
  };
  
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative pb-20">
      <Header />
      
      <main className="pt-16 pb-4">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold mb-4">Progress Tracking</h1>
          
          <Tabs defaultValue="daily">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Calories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={caloriesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="consumed" stroke="#4F46E5" name="Calories Consumed" />
                        <Line type="monotone" dataKey="burned" stroke="#10B981" name="Calories Burned" />
                        <Line type="monotone" dataKey="goal" stroke="#F59E0B" name="Calorie Goal" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Nutrients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nutrientsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="protein" fill="#4F46E5" name="Protein (g)" />
                        <Bar dataKey="carbs" fill="#F59E0B" name="Carbs (g)" />
                        <Bar dataKey="fat" fill="#EF4444" name="Fat (g)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Workout Minutes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workoutChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="minutes" fill="#4F46E5" name="Workout Minutes" />
                        <Line type="monotone" dataKey="goal" stroke="#F59E0B" name="Daily Goal" strokeDasharray="5 5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="weekly">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-gray-500 text-sm">Weekly Calories</div>
                    <div className="text-2xl font-bold mt-1">{weeklyStats.totalCaloriesConsumed.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">consumed</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-gray-500 text-sm">Calories Burned</div>
                    <div className="text-2xl font-bold mt-1">{weeklyStats.totalCaloriesBurned.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">from workouts</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-gray-500 text-sm">Workout Time</div>
                    <div className="text-2xl font-bold mt-1">{weeklyStats.totalWorkoutMinutes} mins</div>
                    <div className="text-xs text-gray-500 mt-1">this week</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-gray-500 text-sm">Avg. Protein</div>
                    <div className="text-2xl font-bold mt-1">{weeklyStats.avgProtein.toFixed(1)}g</div>
                    <div className="text-xs text-gray-500 mt-1">per day</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Weekly Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="consumed" fill="#4F46E5" name="Calories Consumed" />
                        <Bar dataKey="burned" fill="#10B981" name="Calories Burned" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Weekly Workout Minutes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="workoutMinutes" fill="#4F46E5" name="Workout Minutes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <BottomNavigation currentPath="/progress" />
    </div>
  );
}
