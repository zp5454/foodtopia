import { useState, useEffect, useRef, type RefObject } from 'react';
import { useZxing, type UseZxingOptions } from 'react-zxing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, XCircle, Check } from 'lucide-react';
import { getFdaApi } from '@/services/fda-api';

interface BarcodeScannerProps {
  onScanSuccess: (data: any) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { ref } = useZxing({
    onDecodeResult(result) {
      if (isScanning) {
        setIsScanning(false);
        setIsProcessing(true);
        const barcodeText = result.getText();
        console.log("Scanned barcode text:", barcodeText);
        handleBarcode(barcodeText);
      }
    },
    onError(error) {
      console.error('Scanner error:', error);
      setError('Error accessing camera. Please check permissions.');
    },
  }) as { ref: RefObject<HTMLVideoElement> };

  useEffect(() => {
    return () => {
      setIsScanning(false);
    };
  }, []);

  const handleBarcode = async (barcode: string) => {
    try {
      const fdaApi = getFdaApi();
      const result = await fdaApi.searchByUpc(barcode);
      
      if (result && result.foods && result.foods.length > 0) {
        const food = result.foods[0];
        
        // Format the data for our app
        const formattedFood = {
          name: food.description || 'Unknown Food',
          brandName: food.brandName || '',
          barcode: barcode,
          ingredients: food.ingredients || '',
          servingSize: food.servingSize || 0,
          servingSizeUnit: food.servingSizeUnit || 'g',
          nutrients: processNutrients(food.foodNutrients),
          fdcId: food.fdcId
        };
        
        onScanSuccess(formattedFood);
      } else {
        setError('Food not found in database. Try entering details manually.');
        setTimeout(() => {
          setIsScanning(true);
          setIsProcessing(false);
          setError(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error processing barcode:', err);
      setError('Error looking up food information. Please try again.');
      setTimeout(() => {
        setIsScanning(true);
        setIsProcessing(false);
        setError(null);
      }, 3000);
    }
  };

  // Extract nutrients from FDA API response
  const processNutrients = (foodNutrients: any[]) => {
    const nutrients = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sugar: 0,
      sodium: 0,
      fiber: 0,
      saturatedFat: 0
    };
    
    if (!foodNutrients || !Array.isArray(foodNutrients)) {
      return nutrients;
    }
    
    foodNutrients.forEach(nutrient => {
      // FDA API nutrient IDs
      switch (nutrient.nutrientId) {
        case 1008: // Energy (kcal)
          nutrients.calories = nutrient.value || 0;
          break;
        case 1003: // Protein
          nutrients.protein = nutrient.value || 0;
          break;
        case 1005: // Carbohydrates
          nutrients.carbs = nutrient.value || 0;
          break;
        case 1004: // Total fat
          nutrients.fat = nutrient.value || 0;
          break;
        case 2000: // Sugar
          nutrients.sugar = nutrient.value || 0;
          break;
        case 1093: // Sodium
          nutrients.sodium = nutrient.value || 0;
          break;
        case 1079: // Fiber
          nutrients.fiber = nutrient.value || 0;
          break;
        case 1258: // Saturated fat
          nutrients.saturatedFat = nutrient.value || 0;
          break;
      }
    });
    
    return nutrients;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Scan Barcode</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XCircle className="h-6 w-6" />
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              <p>{error}</p>
            </div>
          )}
          
          <div className="relative aspect-video bg-muted rounded-md overflow-hidden mb-4">
            {isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Looking up product...</p>
              </div>
            ) : (
              <>
                <video ref={ref as any} className="w-full h-full object-cover" />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-1/2 border-2 border-primary rounded-lg"></div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="text-center text-sm text-muted-foreground mb-4">
            Position the barcode within the box above
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="w-1/2" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              className="w-1/2"
              onClick={() => {
                setIsScanning(!isScanning);
                if (!isScanning) {
                  setError(null);
                }
              }}
            >
              {isScanning ? 'Pause' : 'Resume'} Scanning
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}