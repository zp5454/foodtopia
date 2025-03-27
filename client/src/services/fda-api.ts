import axios from 'axios';

/**
 * FDA Food Data Central API Service
 * This version uses server-side API calls to avoid exposing API keys to the client
 */
export class FdaApiService {
  /**
   * Search for food items by name
   */
  async searchFoodByName(query: string, pageSize = 20): Promise<any> {
    try {
      const response = await axios.get(`/api/fda/search`, {
        params: {
          q: query,
          pageSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching FDA database:', error);
      throw error;
    }
  }

  /**
   * Get detailed food information by FDC ID
   */
  async getFoodDetails(fdcId: string): Promise<any> {
    try {
      const response = await axios.get(`/api/fda/food/${fdcId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting food details from FDA database:', error);
      throw error;
    }
  }

  /**
   * Search food by UPC barcode
   */
  async searchByUpc(upc: string): Promise<any> {
    try {
      const response = await axios.get(`/api/fda/barcode/${upc}`);
      return response.data;
    } catch (error) {
      console.error('Error searching FDA database by UPC:', error);
      throw error;
    }
  }

  /**
   * Analyze ingredient quality based on nutrition information
   * Returns a quality score and notes about potentially harmful ingredients
   */
  analyzeIngredientQuality(ingredients: string, nutritionData: any): { score: number, notes: string } {
    // List of potentially harmful ingredients to check for
    const harmfulIngredients = [
      { name: 'high fructose corn syrup', reason: 'Associated with obesity and metabolic disorders' },
      { name: 'artificial colors', reason: 'May cause hyperactivity in children and allergic reactions' },
      { name: 'aspartame', reason: 'Controversial sweetener linked to various health concerns' },
      { name: 'MSG', reason: 'May cause headaches and other symptoms in sensitive individuals' },
      { name: 'sodium nitrite', reason: 'Linked to increased cancer risk when consumed regularly' },
      { name: 'partially hydrogenated', reason: 'Contains unhealthy trans fats linked to heart disease' },
      { name: 'BHA', reason: 'Potential endocrine disruptor and carcinogen' },
      { name: 'BHT', reason: 'Potential endocrine disruptor' },
      { name: 'propylparaben', reason: 'Potential endocrine disruptor' },
      { name: 'sodium benzoate', reason: 'May form benzene when combined with vitamin C' }
    ];

    // Check for harmful ingredients
    const foundHarmful: Array<{ name: string, reason: string }> = [];
    const ingredientsLower = ingredients.toLowerCase();
    
    harmfulIngredients.forEach(item => {
      if (ingredientsLower.includes(item.name.toLowerCase())) {
        foundHarmful.push(item);
      }
    });

    // Calculate base score - starts at 100 and reduces for harmful ingredients
    let score = 100 - (foundHarmful.length * 10);
    
    // Adjust for nutrition (high sodium, high sugar, etc.)
    if (nutritionData) {
      // Example adjustments based on nutritional data
      if (nutritionData.sugar > 20) score -= 10;
      if (nutritionData.saturatedFat > 5) score -= 10;
      if (nutritionData.sodium > 500) score -= 10;
    }
    
    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Generate notes about the food quality
    let notes = '';
    if (foundHarmful.length > 0) {
      notes = 'Contains potentially concerning ingredients: ' + 
        foundHarmful.map(item => `${item.name} (${item.reason})`).join('; ');
    } else {
      notes = 'No concerning ingredients identified.';
    }
    
    // Add nutrition notes
    if (nutritionData) {
      if (nutritionData.sugar > 20) {
        notes += ' High in sugar.';
      }
      if (nutritionData.saturatedFat > 5) {
        notes += ' High in saturated fat.';
      }
      if (nutritionData.sodium > 500) {
        notes += ' High in sodium.';
      }
    }
    
    return {
      score: Math.round(score),
      notes
    };
  }
}

// Single instance of the service
let fdaApiService: FdaApiService | null = null;

// Simple initialization - no need for API key as it's handled server-side
export const getFdaApi = (): FdaApiService => {
  if (!fdaApiService) {
    fdaApiService = new FdaApiService();
  }
  return fdaApiService;
};