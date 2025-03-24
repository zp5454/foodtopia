import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { type User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const nutritionGoalsSchema = z.object({
  calorieGoal: z.coerce.number().min(500, "Must be at least 500").max(10000, "Must be at most 10000"),
  proteinGoal: z.coerce.number().min(10, "Must be at least 10g").max(500, "Must be at most 500g"),
  carbsGoal: z.coerce.number().min(10, "Must be at least 10g").max(1000, "Must be at most 1000g"),
  fatGoal: z.coerce.number().min(10, "Must be at least 10g").max(500, "Must be at most 500g"),
  sugarGoal: z.coerce.number().min(0, "Must be at least 0g").max(200, "Must be at most 200g"),
  workoutGoal: z.coerce.number().min(5, "Must be at least 5 minutes").max(300, "Must be at most 300 minutes"),
});

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  const { toast } = useToast();
  
  // Hard-coded demo user for now (id: 1)
  const userId = 1;
  
  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });
  
  // Set up form
  const form = useForm<z.infer<typeof nutritionGoalsSchema>>({
    resolver: zodResolver(nutritionGoalsSchema),
    defaultValues: {
      calorieGoal: user?.calorieGoal || 2000,
      proteinGoal: user?.proteinGoal || 120,
      carbsGoal: user?.carbsGoal || 250,
      fatGoal: user?.fatGoal || 65,
      sugarGoal: user?.sugarGoal || 50,
      workoutGoal: user?.workoutGoal || 45,
    },
  });
  
  // Update the form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        calorieGoal: user.calorieGoal,
        proteinGoal: user.proteinGoal,
        carbsGoal: user.carbsGoal,
        fatGoal: user.fatGoal,
        sugarGoal: user.sugarGoal,
        workoutGoal: user.workoutGoal,
      });
    }
  }, [user, form]);
  
  // Handle form submission
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof nutritionGoalsSchema>) => {
      return await apiRequest("PATCH", `/api/users/${userId}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Settings updated",
        description: "Your nutrition goals have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: z.infer<typeof nutritionGoalsSchema>) {
    updateMutation.mutate(values);
  }
  
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative pb-20">
      <Header />
      
      <main className="pt-16 pb-4">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold mb-4">Settings</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-sm text-gray-500">Toggle dark mode on or off</p>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode} 
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-sm text-gray-500">Enable or disable notifications</p>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={setNotifications} 
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Goals</CardTitle>
              <CardDescription>Customize your daily nutrition targets</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="calorieGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Calories (kcal)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="proteinGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Protein Goal (g)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="carbsGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Carbs Goal (g)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fatGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fat Goal (g)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sugarGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sugar Goal (g)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="workoutGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Workout Goal (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full flex items-center gap-2"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <BottomNavigation currentPath="/settings" />
    </div>
  );
}
