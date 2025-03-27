import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { ExternalLink, Check, AlertCircle } from 'lucide-react';
import { initFdaApi } from '@/services/fda-api';

// Form schema
const fdaApiSchema = z.object({
  apiKey: z.string().min(1, { message: 'API key is required' })
});

type FdaApiFormValues = z.infer<typeof fdaApiSchema>;

export default function FdaApiSettings() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiKeySet, setApiKeySet] = useState<boolean>(false);
  
  // Initialize form with saved API key if available or from server environment
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // First check localStorage
        const savedApiKey = localStorage.getItem('fda_api_key');
        if (savedApiKey) {
          form.setValue('apiKey', savedApiKey);
          setApiKeySet(true);
          // Initialize API with saved key
          try {
            initFdaApi(savedApiKey);
          } catch (err) {
            console.error('Error initializing FDA API with saved key:', err);
          }
          return;
        }
        
        // If not in localStorage, try to get from server environment
        const response = await fetch('/api/config/fda-api-key');
        const data = await response.json();
        
        if (data.apiKey) {
          form.setValue('apiKey', data.apiKey);
          setApiKeySet(true);
          localStorage.setItem('fda_api_key', data.apiKey);
          try {
            initFdaApi(data.apiKey);
          } catch (err) {
            console.error('Error initializing FDA API with server key:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching FDA API key:', error);
      }
    };
    
    fetchApiKey();
  }, []);
  
  const form = useForm<FdaApiFormValues>({
    resolver: zodResolver(fdaApiSchema),
    defaultValues: {
      apiKey: '',
    },
  });
  
  async function onSubmit(values: FdaApiFormValues) {
    setStatus('testing');
    setErrorMessage(null);
    
    try {
      // Initialize API service with new key
      const apiService = initFdaApi(values.apiKey);
      
      // Test the API with a simple query
      await apiService.searchFoodByName('apple', 1);
      
      // Save API key to local storage if successful
      localStorage.setItem('fda_api_key', values.apiKey);
      setApiKeySet(true);
      setStatus('success');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error testing FDA API key:', error);
      setStatus('error');
      setErrorMessage('Unable to connect to FDA API. Please check your API key and try again.');
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>FDA Database Integration</CardTitle>
        <CardDescription>
          Connect to the FDA Food Data Central API to enable barcode scanning and ingredient analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {apiKeySet && status !== 'error' && (
          <div className="mb-4 p-4 rounded-lg border border-green-200 bg-green-50 text-green-800">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-800" />
              <span className="font-medium">API Key Connected</span>
            </div>
            <div className="mt-1 text-sm ml-6">
              Your FDA API key is set and working properly.
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-800" />
              <span className="font-medium">Connection Error</span>
            </div>
            <div className="mt-1 text-sm ml-6">
              {errorMessage || 'There was an error connecting to the FDA API.'}
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>FDA API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your FDA API key" {...field} type="password" />
                  </FormControl>
                  <FormDescription>
                    Get your free API key from{' '}
                    <a 
                      href="https://fdc.nal.usda.gov/api-key-signup.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center hover:underline"
                    >
                      USDA Food Data Central
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="mt-4 w-full"
              disabled={status === 'testing'}
            >
              {status === 'testing' ? 'Testing Connection...' : 'Save API Key'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <p>Your API key is stored locally and never shared.</p>
      </CardFooter>
    </Card>
  );
}