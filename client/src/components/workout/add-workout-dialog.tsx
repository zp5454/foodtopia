import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { type Exercise } from "@shared/schema";

// Form schema
const workoutDetailsSchema = z.object({
  distance: z.coerce.number().min(0).optional(),
  pace: z.string().optional(),
  heartRate: z.coerce.number().min(0).max(250).optional(),
  sets: z.coerce.number().min(0).optional(),
  reps: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  rowingMeters: z.coerce.number().min(0).optional(),
  rowingSplit: z.string().optional(),
});

const workoutFormSchema = z.object({
  userId: z.number(),
  title: z.string().min(1, "Title is required"),
  date: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  caloriesBurned: z.coerce.number().min(0, "Calories must be positive"),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  type: z.string().min(1, "Type is required"),
  details: workoutDetailsSchema,
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

interface AddWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  date: Date;
}

export default function AddWorkoutDialog({ open, onOpenChange, userId, date }: AddWorkoutDialogProps) {
  const { toast } = useToast();
  
  // Fetch exercise templates
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
    enabled: open,
  });
  
  // Form setup
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      userId,
      title: "",
      date,
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(new Date().getTime() + 30 * 60000), "HH:mm"),
      caloriesBurned: 0,
      durationMinutes: 30,
      type: "cardio",
      details: {
        distance: undefined,
        pace: undefined,
        heartRate: undefined,
        sets: undefined,
        reps: undefined,
        weight: undefined,
        rowingMeters: undefined,
        rowingSplit: undefined,
      },
    },
  });
  
  // Watch the workout type to show relevant detail fields
  const workoutType = form.watch("type");
  
  // Add workout mutation
  const addWorkoutMutation = useMutation({
    mutationFn: async (values: WorkoutFormValues) => {
      // Ensure date is in the correct format (YYYY-MM-DD)
      const formattedDate = new Date(values.date).toISOString().split('T')[0];
      
      return await apiRequest("POST", "/api/workouts", {
        ...values,
        date: formattedDate,
      });
    },
    onSuccess: () => {
      toast({
        title: "Workout added",
        description: "Your workout has been successfully logged.",
      });
      
      // Clear form and close dialog
      form.reset({
        userId,
        title: "",
        date,
        startTime: format(new Date(), "HH:mm"),
        endTime: format(new Date(new Date().getTime() + 30 * 60000), "HH:mm"),
        caloriesBurned: 0,
        durationMinutes: 30,
        type: "cardio",
        details: {
          distance: undefined,
          pace: undefined,
          heartRate: undefined,
          sets: undefined,
          reps: undefined,
          weight: undefined,
          rowingMeters: undefined,
          rowingSplit: undefined,
        },
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/workouts?userId=${userId}&date=${date.toISOString().split('T')[0]}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-progress?userId=${userId}&date=${date.toISOString().split('T')[0]}`] });
      
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  function onSubmit(values: WorkoutFormValues) {
    addWorkoutMutation.mutate(values);
  }
  
  // Handle selecting a template
  const handleSelectExercise = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === parseInt(exerciseId));
    if (exercise) {
      form.setValue("title", exercise.name);
      form.setValue("type", exercise.type);
      form.setValue("durationMinutes", exercise.durationMinutes);
      form.setValue("caloriesBurned", exercise.caloriesPerMinute * exercise.durationMinutes);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Workout</DialogTitle>
          <DialogDescription>
            Log your workout details and track your progress.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Morning Run, Upper Body Workout" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {exercises.length > 0 && (
              <div>
                <FormLabel>Or Select Template</FormLabel>
                <Select onValueChange={handleSelectExercise}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an exercise template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Exercise Templates</SelectLabel>
                      {exercises.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id.toString()}>
                          {exercise.name} ({exercise.durationMinutes} min, {exercise.intensity})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="cardio">Cardio</SelectItem>
                          <SelectItem value="strength">Strength</SelectItem>
                          <SelectItem value="flexibility">Flexibility</SelectItem>
                          <SelectItem value="hiit">HIIT</SelectItem>
                          <SelectItem value="rowing">Rowing</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="caloriesBurned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories Burned</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Conditional workout details based on type */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Workout Details</h3>
              
              {(workoutType === 'cardio' || workoutType === 'hiit') && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="details.distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance (miles)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details.pace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pace (min/mile)</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., 10:30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details.heartRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avg Heart Rate (bpm)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {workoutType === 'strength' && (
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="details.sets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sets</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details.reps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reps</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details.weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {workoutType === 'flexibility' && (
                <div>
                  <FormField
                    control={form.control}
                    name="details.heartRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avg Heart Rate (bpm)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {workoutType === 'rowing' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="details.rowingMeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance (meters)</FormLabel>
                        <FormControl>
                          <Input type="number" step="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details.rowingSplit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Split (min:sec)</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., 2:05" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details.heartRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avg Heart Rate (bpm)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={addWorkoutMutation.isPending}
              >
                {addWorkoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Workout"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
