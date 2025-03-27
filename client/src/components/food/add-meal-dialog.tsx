import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, Loader2, Barcode, Camera } from "lucide-react";
import { format } from "date-fns";
import { type FoodItem } from "@shared/schema";
import BarcodeScanner from "@/components/food/barcode-scanner";
import { getFdaApi } from "@/services/fda-api";

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
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTab, setScannerTab] = useState<string>("search");
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  const { toast } = useToast();
  
  // State for FDA API search results and loading state
  const [fdaSearchResults, setFdaSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Using only FDA search results
  const filteredFoodItems = fdaSearchResults;
  
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
      
      // Ensure date is in the correct format (YYYY-MM-DD)
      const formattedDate = new Date(values.date).toISOString().split('T')[0];
      
      const mealData = {
        ...values,
        date: formattedDate,
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
      queryClient.invalidateQueries({ queryKey: [`/api/meals?userId=${userId}&date=${date.toISOString().split('T')[0]}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-progress?userId=${userId}&date=${date.toISOString().split('T')[0]}`] });
      
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
  
  // Handle FDA API food search
  const handleFdaSearch = async (query: string) => {
    if (query.trim().length < 3) {
      setFdaSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Use FDA API to search for food
      const fdaApi = getFdaApi();
      if (!fdaApi) {
        // FDA API not configured - just use local results
        setIsSearching(false);
        return;
      }
      
      // Search FDA database
      const result = await fdaApi.searchFoodByName(query);
      
      if (result && result.foods) {
        // Transform FDA results to FoodItem format
        const fdaItems: FoodItem[] = result.foods.map((food: any) => {
          // Extract nutrition data if available
          const nutritionData = food.foodNutrients?.reduce((acc: any, item: any) => {
            if (item.nutrientName === "Energy" && item.unitName === "KCAL") {
              acc.calories = Math.round(item.value);
            } else if (item.nutrientName === "Protein") {
              acc.protein = Math.round(item.value);
            } else if (item.nutrientName === "Total lipid (fat)") {
              acc.fat = Math.round(item.value);
            } else if (item.nutrientName === "Carbohydrate, by difference") {
              acc.carbs = Math.round(item.value);
            } else if (item.nutrientName === "Sugars, total including NLEA") {
              acc.sugar = Math.round(item.value);
            }
            return acc;
          }, { calories: 0, protein: 0, fat: 0, carbs: 0, sugar: 0 });
          
          return {
            id: food.fdcId || Date.now() + Math.random(),
            name: food.description || food.brandName || "Food Item",
            calories: nutritionData.calories || 0,
            protein: nutritionData.protein || 0,
            carbs: nutritionData.carbs || 0,
            fat: nutritionData.fat || 0,
            sugar: nutritionData.sugar || 0,
            ingredientQuality: 4
          };
        });
        
        setFdaSearchResults(fdaItems);
      } else {
        setFdaSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching FDA database:", error);
      setFdaSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle barcode scan results
  const handleBarcodeScan = async (barcodeData: any) => {
    try {
      setIsProcessingBarcode(true);
      
      console.log("Original barcode data received:", barcodeData);
      
      // If barcodeData is already a food object from the scanner
      if (barcodeData && barcodeData.nutrients) {
        console.log("Using pre-processed food data from scanner");
        
        // Process nutrients from the barcode scanner
        const nutrients = barcodeData.nutrients;
        const ingredientData = barcodeData.ingredients || '';
        
        // Get FDA API service for ingredient analysis
        const fdaApi = getFdaApi();
        
        // Get ingredient quality analysis if ingredients are available
        let ingredientQuality = 4; // Default to excellent
        let qualityNotes = "";
        
        if (ingredientData) {
          const analysis = fdaApi.analyzeIngredientQuality(ingredientData, nutrients);
          ingredientQuality = analysis.score;
          qualityNotes = analysis.notes;
        }
        
        // Create new food item
        const newFoodItem = {
          id: Date.now(), // Temporary ID for this session
          name: barcodeData.name || "Scanned Food Item",
          calories: nutrients.calories || 0,
          protein: nutrients.protein || 0,
          carbs: nutrients.carbs || 0,
          fat: nutrients.fat || 0,
          sugar: nutrients.sugar || 0,
          ingredientQuality: ingredientQuality,
          qualityNotes: qualityNotes
        };
        
        console.log("Created food item from scanner data:", newFoodItem);
        
        // Add food item to the meal
        append({
          id: newFoodItem.id,
          name: newFoodItem.name,
          calories: newFoodItem.calories,
          protein: newFoodItem.protein
        });
        
        // Update ingredient quality if it's lower than current
        const currentQuality = form.getValues("ingredientQuality");
        if (ingredientQuality < currentQuality) {
          form.setValue("ingredientQuality", ingredientQuality);
          form.setValue("qualityNotes", qualityNotes);
        }
        
        // Close scanner
        setShowScanner(false);
        
        toast({
          title: "Food Item Added",
          description: `Added ${newFoodItem.name} to your meal.`,
        });
      } else {
        // If we just received a barcode string, do the FDA API lookup
        console.log("Doing FDA API lookup for barcode");
        
        // Get FDA API service
        const fdaApi = getFdaApi();
        
        // Make sure we're passing a string to the API
        const barcode = typeof barcodeData === 'string' ? barcodeData : barcodeData?.barcode || '';
        
        // Search for food by UPC barcode
        const result = await fdaApi.searchByUpc(barcode);
        console.log("FDA API Result in meal dialog:", result);
        
        if (result && result.foods && result.foods.length > 0) {
          const foodData = result.foods[0];
          console.log("Selected food item in meal dialog:", foodData);
          
          // Extract nutrition data if available
          const nutritionData = foodData.foodNutrients?.reduce((acc: any, item: any) => {
            if (item.nutrientName === "Energy" && item.unitName === "KCAL") {
              acc.calories = Math.round(item.value);
            } else if (item.nutrientName === "Protein") {
              acc.protein = Math.round(item.value);
            } else if (item.nutrientName === "Total lipid (fat)") {
              acc.fat = Math.round(item.value);
            } else if (item.nutrientName === "Carbohydrate, by difference") {
              acc.carbs = Math.round(item.value);
            } else if (item.nutrientName === "Sugars, total including NLEA") {
              acc.sugar = Math.round(item.value);
            }
            return acc;
          }, { calories: 0, protein: 0, fat: 0, carbs: 0, sugar: 0 });
          
          // Get ingredient quality analysis if ingredients are available
          let ingredientQuality = 4; // Default to excellent
          let qualityNotes = "";
          
          if (foodData.ingredients) {
            const analysis = fdaApi.analyzeIngredientQuality(foodData.ingredients, nutritionData);
            ingredientQuality = analysis.score;
            qualityNotes = analysis.notes;
          }
          
          // Create new food item
          const newFoodItem = {
            id: Date.now(), // Temporary ID for this session
            name: foodData.description || foodData.brandName || "Scanned Food Item",
            calories: nutritionData.calories || 0,
            protein: nutritionData.protein || 0,
            carbs: nutritionData.carbs || 0,
            fat: nutritionData.fat || 0,
            sugar: nutritionData.sugar || 0,
            ingredientQuality: ingredientQuality,
            qualityNotes: qualityNotes
          };
          
          console.log("Created food item from FDA API:", newFoodItem);
        
          // Add food item to the meal
          append({
            id: newFoodItem.id,
            name: newFoodItem.name,
            calories: newFoodItem.calories,
            protein: newFoodItem.protein
          });
          
          // Update ingredient quality if it's lower than current
          const currentQuality = form.getValues("ingredientQuality");
          if (ingredientQuality < currentQuality) {
            form.setValue("ingredientQuality", ingredientQuality);
            form.setValue("qualityNotes", qualityNotes);
          }
          
          // Close scanner
          setShowScanner(false);
          
          toast({
            title: "Food Item Added",
            description: `Added ${newFoodItem.name} to your meal.`,
          });
        } else {
          toast({
            title: "Product Not Found",
            description: "No information found for this barcode. Try a different product or add manually.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error processing barcode:", error);
      toast({
        title: "Scan Failed",
        description: "Could not process the barcode. Please try again or add food manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBarcode(false);
    }
  };
  
  // Toggle barcode scanner
  const toggleScanner = () => {
    setShowScanner(!showScanner);
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
            
            <Tabs defaultValue="search" className="w-full" value={scannerTab} onValueChange={setScannerTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search" onClick={() => setShowScanner(false)}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="barcode" onClick={() => setShowScanner(true)}>
                  <Barcode className="mr-2 h-4 w-4" />
                  Scan Barcode
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search food items..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleFdaSearch(e.target.value);
                    }}
                  />
                </div>
                
                {searchTerm && (
                  <Card className="max-h-[200px] overflow-y-auto">
                    <CardContent className="p-2 space-y-1">
                      {isSearching ? (
                        <div className="flex justify-center items-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                          <span className="text-sm">Searching FDA database...</span>
                        </div>
                      ) : filteredFoodItems.length > 0 ? (
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
              </TabsContent>
              
              <TabsContent value="barcode" className="space-y-4">
                {showScanner ? (
                  <div className="relative">
                    <BarcodeScanner 
                      onScanSuccess={handleBarcodeScan} 
                      onClose={() => setShowScanner(false)} 
                    />
                    {isProcessingBarcode && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-md">
                        <div className="bg-background p-4 rounded-lg flex flex-col items-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                          <p className="text-sm font-medium">Processing barcode data...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed rounded-md bg-muted/30 flex flex-col items-center">
                    <Camera className="h-8 w-8 mb-2 text-muted-foreground" />
                    <h3 className="text-base font-medium mb-1">Scan Food Package Barcode</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Use your camera to scan a barcode and automatically add food data
                    </p>
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={toggleScanner}
                    >
                      <Camera className="mr-2 h-4 w-4" /> Start Scanner
                    </Button>
                  </div>
                )}
                <div className="text-xs text-muted-foreground text-center">
                  Barcode scanning uses the FDA database to retrieve nutritional information.
                </div>
              </TabsContent>
            </Tabs>
            
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