import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/FirebaseAuthContext';

interface LocationState {
  location: {
    coords: {
      lat: number;
      lon: number;
      accuracy: number;
    } | null;
  } | null;
  error: string | null;
  isLoading: boolean;
}

export function useLocation() {
  const { profile } = useAuth();
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: true
  });

  useEffect(() => {
    let watchId: number;

    const startLocationWatch = () => {
      if (!profile?.preferences?.allowLocationData) {
        setState(prev => ({
          ...prev,
          error: 'Location access is disabled in preferences',
          isLoading: false
        }));
        return;
      }

      if ('geolocation' in navigator) {
        // High accuracy options
        const options = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        };

        // Watch position instead of just getting it once
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setState({
              location: {
                coords: {
                  lat: position.coords.latitude,
                  lon: position.coords.longitude,
                  accuracy: position.coords.accuracy
                }
              },
              error: null,
              isLoading: false
            });
          },
          (error) => {
            let errorMessage = 'Unable to get your location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out';
                break;
            }
            setState({
              location: null,
              error: errorMessage,
              isLoading: false
            });
          },
          options
        );
      } else {
        setState({
          location: null,
          error: 'Geolocation is not supported by your browser',
          isLoading: false
        });
      }
    };

    startLocationWatch();

    // Cleanup function
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [profile?.preferences?.allowLocationData]);

  return state;
} 