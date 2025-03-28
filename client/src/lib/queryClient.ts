import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { isStaticEnvironment, createLocalStorageAPI } from "@/services/localStorage";

// Determine if we're in a static environment (GitHub Pages, etc.)
const isStatic = isStaticEnvironment();
let localStorageAPI = isStatic ? createLocalStorageAPI() : null;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // If in static environment, use localStorage API
  if (isStatic && localStorageAPI) {
    try {
      // Parse the endpoint from the URL
      const endpoint = url.split('/').pop() || '';
      const parts = url.split('/');
      const resourceType = parts[parts.length - 1] || parts[parts.length - 2];
      
      // Extract ID if present in URL
      let id: number | undefined = undefined;
      if (resourceType.includes('?') || /\d+$/.test(resourceType)) {
        const match = resourceType.match(/(\d+)$/);
        if (match) {
          id = parseInt(match[1], 10);
        }
      }
      
      // Handle different API endpoints
      let result;
      
      // Handle GET requests
      if (method === 'GET') {
        const userId = 1; // Default to demo user for static version
        
        if (url.includes('/meals')) {
          if (url.includes('date=')) {
            const dateParam = new URLSearchParams(url.split('?')[1]).get('date');
            const date = dateParam ? new Date(dateParam) : new Date();
            result = await localStorageAPI.getMealsByDate(userId, date);
          } else {
            result = await localStorageAPI.getMeals(userId);
          }
        } else if (url.includes('/workouts')) {
          if (url.includes('date=')) {
            const dateParam = new URLSearchParams(url.split('?')[1]).get('date');
            const date = dateParam ? new Date(dateParam) : new Date();
            result = await localStorageAPI.getWorkoutsByDate(userId, date);
          } else {
            result = await localStorageAPI.getWorkouts(userId);
          }
        } else if (url.includes('/daily-progress') && url.includes('date=')) {
          const dateParam = new URLSearchParams(url.split('?')[1]).get('date');
          const date = dateParam ? new Date(dateParam) : new Date();
          result = await localStorageAPI.getDailyProgress(userId, date);
        } else if (url.includes('/exercises')) {
          result = await localStorageAPI.getExercises();
        } else if (url.includes('/food-items')) {
          result = await localStorageAPI.getFoodItems();
        }
      } 
      // Handle POST requests
      else if (method === 'POST') {
        if (url.includes('/meals')) {
          result = await localStorageAPI.createMeal(data as any);
        } else if (url.includes('/workouts')) {
          result = await localStorageAPI.createWorkout(data as any);
        } else if (url.includes('/daily-progress')) {
          result = await localStorageAPI.createOrUpdateDailyProgress(data as any);
        } else if (url.includes('/food-items')) {
          result = await localStorageAPI.createFoodItem(data as any);
        } else if (url.includes('/exercises')) {
          result = await localStorageAPI.createExercise(data as any);
        }
      }
      // Handle DELETE requests
      else if (method === 'DELETE') {
        if (url.includes('/meals')) {
          result = await localStorageAPI.deleteMeal(id as number);
        } else if (url.includes('/workouts')) {
          result = await localStorageAPI.deleteWorkout(id as number);
        }
      }
      
      // Create a mock response
      const mockResponse = new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return mockResponse;
    } catch (error) {
      console.error('Error using localStorage API:', error);
      throw new Error(`Error using localStorage API: ${error}`);
    }
  }
  
  // If not in static environment or localStorage API failed, use regular fetch
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // If in static environment, use localStorage API
    if (isStatic && localStorageAPI) {
      try {
        const url = queryKey[0] as string;
        const endpoint = url.split('/').pop() || '';
        const userId = 1; // Default to demo user for static version
        
        // Handle different API endpoints
        let result;
        
        if (url.includes('/meals')) {
          if (url.includes('date=')) {
            const dateParam = new URLSearchParams(url.split('?')[1]).get('date');
            const date = dateParam ? new Date(dateParam) : new Date();
            result = await localStorageAPI.getMealsByDate(userId, date);
          } else {
            result = await localStorageAPI.getMeals(userId);
          }
        } else if (url.includes('/workouts')) {
          if (url.includes('date=')) {
            const dateParam = new URLSearchParams(url.split('?')[1]).get('date');
            const date = dateParam ? new Date(dateParam) : new Date();
            result = await localStorageAPI.getWorkoutsByDate(userId, date);
          } else {
            result = await localStorageAPI.getWorkouts(userId);
          }
        } else if (url.includes('/daily-progress') && url.includes('date=')) {
          const dateParam = new URLSearchParams(url.split('?')[1]).get('date');
          const date = dateParam ? new Date(dateParam) : new Date();
          result = await localStorageAPI.getDailyProgress(userId, date);
        } else if (url.includes('/exercises')) {
          result = await localStorageAPI.getExercises();
        } else if (url.includes('/food-items')) {
          result = await localStorageAPI.getFoodItems();
        } else {
          // Default empty response for other endpoints
          result = [];
        }
        
        return result;
      } catch (error) {
        console.error('Error using localStorage API in query:', error);
        return null;
      }
    }
    
    // If not in static environment or localStorage API failed, use regular fetch
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
