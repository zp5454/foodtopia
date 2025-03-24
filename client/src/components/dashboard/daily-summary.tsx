import { RadialProgress } from "@/components/ui/radial-progress";
import { type DailyProgress } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DailySummaryProps {
  dailyProgress?: DailyProgress;
  isLoading: boolean;
  date: Date;
  formattedDate: string;
  onPrevDay: () => void;
  onNextDay: () => void;
}

export default function DailySummary({ 
  dailyProgress, 
  isLoading, 
  date, 
  formattedDate, 
  onPrevDay, 
  onNextDay 
}: DailySummaryProps) {
  // Default values for progress
  const caloriesConsumed = dailyProgress?.caloriesConsumed || 0;
  const calorieGoal = 2000;
  const caloriePercentage = Math.min(100, Math.round((caloriesConsumed / calorieGoal) * 100));
  
  const proteinConsumed = dailyProgress?.proteinConsumed || 0;
  const proteinGoal = 120;
  const proteinPercentage = Math.min(100, Math.round((proteinConsumed / proteinGoal) * 100));
  
  const workoutMinutes = dailyProgress?.workoutMinutes || 0;
  const workoutGoal = 45;
  const workoutPercentage = Math.min(100, Math.round((workoutMinutes / workoutGoal) * 100));
  
  const carbsConsumed = dailyProgress?.carbsConsumed || 0;
  const carbsGoal = 250;
  const carbsPercentage = Math.min(100, Math.round((carbsConsumed / carbsGoal) * 100));
  
  const fatConsumed = dailyProgress?.fatConsumed || 0;
  const fatGoal = 65;
  const fatPercentage = Math.min(100, Math.round((fatConsumed / fatGoal) * 100));
  
  const sugarConsumed = dailyProgress?.sugarConsumed || 0;
  const sugarGoal = 50;
  const sugarPercentage = Math.min(100, Math.round((sugarConsumed / sugarGoal) * 100));
  
  return (
    <section className="px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Today's Summary</h2>
        <button className="text-primary text-sm font-medium">View Details</button>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-500">
            <span className="text-gray-800">{formattedDate.split(',')[0]}, </span>
            {formattedDate.split(',')[1]}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-full bg-gray-200 hover:bg-gray-300"
              onClick={onPrevDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-full bg-gray-200 hover:bg-gray-300"
              onClick={onNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {isLoading ? (
            <>
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </>
          ) : (
            <>
              {/* Calories Summary */}
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Calories</p>
                    <p className="text-lg font-semibold">{caloriesConsumed.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">of {calorieGoal.toLocaleString()} goal</p>
                  </div>
                  <RadialProgress
                    value={caloriePercentage}
                    color="#4F46E5"
                  />
                </div>
              </div>
              
              {/* Protein Summary */}
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Protein</p>
                    <p className="text-lg font-semibold">{proteinConsumed}g</p>
                    <p className="text-xs text-gray-500 mt-1">of {proteinGoal}g goal</p>
                  </div>
                  <RadialProgress
                    value={proteinPercentage}
                    color="#10B981"
                  />
                </div>
              </div>
              
              {/* Workout Summary */}
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Workout</p>
                    <p className="text-lg font-semibold">{workoutMinutes}m</p>
                    <p className="text-xs text-gray-500 mt-1">of {workoutGoal}m goal</p>
                  </div>
                  <RadialProgress
                    value={workoutPercentage}
                    color="#F59E0B"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Nutrition Breakdown</h3>
            <span className="text-xs text-gray-500">Daily Goal</span>
          </div>
          
          {isLoading ? (
            <div className="space-y-2 mt-2">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : (
            <>
              {/* Carbs Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Carbs</span>
                  <span className="text-xs text-gray-500">{carbsConsumed}g / {carbsGoal}g</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${carbsPercentage}%` }}
                  />
                </div>
              </div>
              
              {/* Fat Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Fat</span>
                  <span className="text-xs text-gray-500">{fatConsumed}g / {fatGoal}g</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn("h-2 rounded-full", "bg-yellow-500")}
                    style={{ width: `${fatPercentage}%` }}
                  />
                </div>
              </div>
              
              {/* Sugar Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Sugar</span>
                  <span className="text-xs text-gray-500">{sugarConsumed}g / {sugarGoal}g</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn("h-2 rounded-full", "bg-red-500")}
                    style={{ width: `${sugarPercentage}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
