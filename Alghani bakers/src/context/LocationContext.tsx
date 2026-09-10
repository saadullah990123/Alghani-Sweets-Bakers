'use client';

import React, { createContext, useContext, useEffect } from 'react';

// ── Fixed bakery address — cannot be changed by anyone ──────────────
const FIXED_ADDRESS = 'Mator Road, near Kahuta Bus Stand, Kahuta';
const FIXED_LANDMARK = 'Near Mator Chowk & Safa Plaza';

interface LocationContextType {
  currentAddress: string;
  currentLandmark: string;
  savedAddresses: { id: string; label: string; address: string; landmark?: string }[];
  isLocationModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  setAddress: (address: string, landmark?: string) => void;
  addSavedAddress: (label: string, address: string, landmark?: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  // Clear any previously stored location so old values never leak back
  useEffect(() => {
    try {
      localStorage.removeItem('alghani_location');
    } catch (_) {}
  }, []);

  // Every function is a no-op — the address is immutable
  const noop = () => {};

  return (
    <LocationContext.Provider
      value={{
        currentAddress: FIXED_ADDRESS,
        currentLandmark: FIXED_LANDMARK,
        savedAddresses: [
          {
            id: 'addr-main',
            label: 'Al-Ghani Bakers (Main)',
            address: FIXED_ADDRESS,
            landmark: FIXED_LANDMARK,
          },
        ],
        isLocationModalOpen: false,
        openLocationModal: noop,
        closeLocationModal: noop,
        setAddress: noop,
        addSavedAddress: noop,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

