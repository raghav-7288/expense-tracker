import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes before data is considered stale
      gcTime: 1000 * 60 * 15,     // 15 minutes before unused cache is garbage-collected
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

