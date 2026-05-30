import { Suspense } from 'react';
import { SearchScreen } from '@/screens/SearchScreen';

export default function AzulSearch() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SearchScreen />
    </Suspense>
  );
}
