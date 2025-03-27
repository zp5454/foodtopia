import axios from 'axios';

const FDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

interface FdaApiConfig {
  apiKey: string;
}

/**
 * FDA Food Data Central API Service
 */
export class FdaApiService {
  private apiKey: string;

  constructor(config: FdaApiConfig) {
    this.apiKey = config.apiKey;
  }

  /**
   * Search for food items by name
   */
  async searchFoodByName(query: string, pageSize = 10): Promise<any> {
    try {
      const response = await axios.get(`${FDA_API_BASE_URL}/foods/search`, {
        params: {
          query,
          pageSize,
          api_key: this.apiKey
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
      const response = await axios.get(`${FDA_API_BASE_URL}/food/${fdcId}`, {
        params: {
          api_key: this.apiKey
        }
      });
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
      // FDA API uses 'gtinUpc' as a search parameter for UPC/barcode
      const response = await axios.get(`${FDA_API_BASE_URL}/foods/search`, {
        params: {
          query: upc,
          dataType: 'Branded',
          pageSize: 1,
          api_key: this.apiKey
        }
      });
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

// Initialize with FDA API key
// The key will be obtained from environment variables or user input
let fdaApiService: FdaApiService | null = null;

export const initFdaApi = (apiKey: string): FdaApiService => {
  fdaApiService = new FdaApiService({ apiKey });
  return fdaApiService;
};

export const getFdaApi = async (): Promise<FdaApiService> => {
  if (!fdaApiService) {
    try {
      // Try to get API key from localStorage first
      const localStorageKey = typeof window !== 'undefined' ? localStorage.getItem('fda_api_key') : null;
      
      if (localStorageKey) {
        fdaApiService = new FdaApiService({ apiKey: localStorageKey });
        return fdaApiService;
      }
      
      // If not in localStorage, try to get from server environment
      const response = await fetch('/api/config/fda-api-key');
      const data = await response.json();
      
      if (data.apiKey) {
        fdaApiService = new FdaApiService({ apiKey: data.apiKey });
        // Save to localStorage for future use
        if (typeof window !== 'undefined') {
          localStorage.setItem('fda_api_key', data.apiKey);
        }
        return fdaApiService;
      }
      
      throw new Error('FDA API service not initialized. Call initFdaApi first or set up API key in settings.');
    } catch (error) {
      console.error('Error initializing FDA API service:', error);
      throw new Error('FDA API service not initialized. Call initFdaApi first or set up API key in settings.');
    }
  }
  
  return fdaApiService;
};