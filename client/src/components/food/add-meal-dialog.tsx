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
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { type FoodItem } from "@shared/schema";

// Form schema
const mealItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  calories: z.number().min(0, "Calories must be positive"),
  protein: z.number().min(0, "Protein must be positive").optional()
});

const mealFormSchema = z.object({
  userId: z.number(),
  title: z.string().min(1, "Title is required"),
  date: z.date(),
  time: z.string().min(1, "Time is required"),
  items: z.array(mealItemSchema).min(1, "Add at least one food item"),
  ingredientQuality: z.number().min(1).max(4),
  qualityNotes: z.string().optional(),
});

type MealFormValues = z.infer<typeof mealFormSchema>;

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  date: Date;
}

export default function AddMealDialog({ open, onOpenChange, userId, date }: AddMealDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  // Fetch food items for dropdown
  const { data: foodItems = [] } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
    enabled: open,
  });
  
  // Filter food items based on search term
  const filteredFoodItems = foodItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Form setup
  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      userId,
      title: "Breakfast",
      date,
      time: format(new Date(), "h:mm a"),
      items: [],
      ingredientQuality: 4,
      qualityNotes: "",
    },
  });
  
  // Setup field array for food items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Add meal mutation
  const addMealMutation = useMutation({
    mutationFn: async (values: MealFormValues) => {
      // Calculate total calories and protein from items
      const totalCalories = values.items.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = values.items.reduce((sum, item) => sum + (item.protein || 0), 0);
      
      const mealData = {
        ...values,
        totalCalories,
        totalProtein,
      };
      
      return await apiRequest("POST", "/api/meals", mealData);
    },
    onSuccess: () => {
      toast({
        title: "Meal added",
        description: "Your meal has been successfully logged.",
      });
      
      // Clear form and close dialog
      form.reset({
        userId,
        title: "Breakfast",
        date,
        time: format(new Date(), "h:mm a"),
        items: [],
        ingredientQuality: 4,
        qualityNotes: "",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/meals?userId=${userId}&date=${date.toISOString()}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-progress?userId=${userId}&date=${date.toISOString()}`] });
      
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add meal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  function onSubmit(values: MealFormValues) {
    addMealMutation.mutate(values);
  }
  
  // Add a food item to the meal
  const handleAddFoodItem = (item: FoodItem) => {
    append({
      id: item.id,
      name: item.name,
      calories: item.calories,
      protein: item.protein
    });
    setSearchTerm("");
  };
  
  // Calculate total calories
  const totalCalories = fields.reduce((sum, item) => sum + (item.calories || 0), 0);
  const totalProtein = fields.reduce((sum, item) => sum + (item.protein || 0), 0);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Meal</DialogTitle>
          <DialogDescription>
            Log your meal details and nutritional information.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Breakfast">Breakfast</SelectItem>
                          <SelectItem value="Lunch">Lunch</SelectItem>
                          <SelectItem value="Dinner">Dinner</SelectItem>
                          <SelectItem value="Snack">Snack</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel>Food Items</FormLabel>
                <div className="text-sm">
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-1 font-medium">{totalCalories} cal</span>
                  <span className="ml-2 text-gray-500">Protein:</span>
                  <span className="ml-1 font-medium">{totalProtein}g</span>
                </div>
              </div>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                {fields.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No food items added yet. Search and add items below.
                  </div>
                ) : (
                  fields.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.calories} cal | {item.protein}g protein
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search food items..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {searchTerm && (
                <Card className="max-h-[200px] overflow-y-auto">
                  <CardContent className="p-2 space-y-1">
                    {filteredFoodItems.length > 0 ? (
                      filteredFoodItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => handleAddFoodItem(item)}
                        >
                          <div>
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              {item.calories} cal | {item.protein}g protein
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2 text-sm text-gray-500">
                        No matching food items found
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="ingredientQuality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredient Quality</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4">Excellent (4/4)</SelectItem>
                      <SelectItem value="3">Good (3/4)</SelectItem>
                      <SelectItem value="2">Fair (2/4)</SelectItem>
                      <SelectItem value="1">Poor (1/4)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="qualityNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.g., High in antioxidants, contains preservatives, etc."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                disabled={addMealMutation.isPending}
              >
                {addMealMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Meal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
