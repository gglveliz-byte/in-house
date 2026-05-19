import { TrackingScreen } from '@/screens/TrackingScreen';
import { Suspense } from 'react';

export default function AzulTracking() { 
  return (
    <Suspense fallback={<div>Cargando rastreo...</div>}>
      <TrackingScreen />
    </Suspense>
  );
}
