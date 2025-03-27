import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { getFdaApi } from '@/services/fda-api';

export default function FdaApiSettings() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        // Test the API connection
        const fdaApi = getFdaApi();
        await fdaApi.searchFoodByName('apple', 1);
        setApiStatus('connected');
      } catch (error) {
        console.error('Error connecting to FDA API:', error);
        setApiStatus('error');
      }
    };
    
    checkApiConnection();
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>FDA Database Integration</CardTitle>
        <CardDescription>
          FDA Food Data Central API connection for barcode scanning and ingredient analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {apiStatus === 'checking' && (
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800">
            <p className="font-medium">Checking API connection...</p>
          </div>
        )}
        
        {apiStatus === 'connected' && (
          <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-800">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-800" />
              <span className="font-medium">FDA API Connected</span>
            </div>
            <div className="mt-2 text-sm">
              <p>The FDA API key has been configured server-side.</p>
              <p className="mt-1">You can now use barcode scanning and food search features without needing your own API key.</p>
            </div>
          </div>
        )}
        
        {apiStatus === 'error' && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800">
            <p className="font-medium">Error connecting to FDA API</p>
            <p className="mt-2 text-sm">
              There was an error connecting to the FDA API. Please contact the administrator to ensure the API key is properly configured.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}