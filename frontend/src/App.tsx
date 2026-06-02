import React from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for managing TanStack Query state
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
