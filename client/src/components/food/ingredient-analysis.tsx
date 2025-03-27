import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ThumbsUp, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { getFdaApi } from '@/services/fda-api';

interface IngredientAnalysisProps {
  ingredients: string;
  nutritionData?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    sodium: number;
    saturatedFat?: number;
    fiber?: number;
  };
  onQualityScoreChange?: (score: number, notes: string) => void;
}

export default function IngredientAnalysis({ 
  ingredients, 
  nutritionData,
  onQualityScoreChange
}: IngredientAnalysisProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Perform the analysis
  const { score, notes } = getFdaApi().analyzeIngredientQuality(ingredients, nutritionData);
  
  // Call the onChange handler if provided
  useEffect(() => {
    if (onQualityScoreChange) {
      onQualityScoreChange(score, notes);
    }
  }, [score, notes, onQualityScoreChange]);
  
  // Get the appropriate color based on score
  const getQualityColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Get the appropriate icon and text based on score
  const getQualityIndicator = () => {
    if (score >= 80) {
      return {
        icon: <ThumbsUp className="h-5 w-5 text-green-500" />,
        text: 'Good Quality',
        color: 'text-green-500'
      };
    }
    if (score >= 60) {
      return {
        icon: <Info className="h-5 w-5 text-yellow-500" />,
        text: 'Average Quality',
        color: 'text-yellow-500'
      };
    }
    return {
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      text: 'Poor Quality',
      color: 'text-red-500'
    };
  };
  
  const indicator = getQualityIndicator();
  
  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Ingredient Analysis</CardTitle>
          <div className="flex items-center gap-1.5">
            {indicator.icon}
            <span className={`text-sm font-medium ${indicator.color}`}>{indicator.text}</span>
          </div>
        </div>
        <CardDescription>
          Evaluating {ingredients.split(',').length} ingredients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Quality Score: {score}/100</span>
          </div>
          <Progress value={score} className={`h-2 ${getQualityColor()}`} />
        </div>
        
        {!expanded ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground line-clamp-2">{notes}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full text-xs"
              onClick={() => setExpanded(true)}
            >
              View Full Analysis
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Ingredient Notes:</h4>
            <ScrollArea className="h-32 rounded-md border p-2">
              <p className="text-sm">{notes}</p>
            </ScrollArea>
            
            <h4 className="font-medium text-sm mt-4 mb-2">Nutrition Analysis:</h4>
            <div className="grid grid-cols-2 gap-2">
              {nutritionData && (
                <>
                  {nutritionData.sugar > 20 && (
                    <Badge variant="outline" className="justify-start bg-red-50 text-red-800 border-red-200">
                      High Sugar: {nutritionData.sugar}g
                    </Badge>
                  )}
                  
                  {nutritionData.saturatedFat && nutritionData.saturatedFat > 5 && (
                    <Badge variant="outline" className="justify-start bg-red-50 text-red-800 border-red-200">
                      High Saturated Fat: {nutritionData.saturatedFat}g
                    </Badge>
                  )}
                  
                  {nutritionData.sodium > 500 && (
                    <Badge variant="outline" className="justify-start bg-red-50 text-red-800 border-red-200">
                      High Sodium: {nutritionData.sodium}mg
                    </Badge>
                  )}
                  
                  {nutritionData.fiber && nutritionData.fiber > 5 && (
                    <Badge variant="outline" className="justify-start bg-green-50 text-green-800 border-green-200">
                      Good Fiber: {nutritionData.fiber}g
                    </Badge>
                  )}
                  
                  {nutritionData.protein > 15 && (
                    <Badge variant="outline" className="justify-start bg-green-50 text-green-800 border-green-200">
                      High Protein: {nutritionData.protein}g
                    </Badge>
                  )}
                </>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full text-xs"
              onClick={() => setExpanded(false)}
            >
              Show Less
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}