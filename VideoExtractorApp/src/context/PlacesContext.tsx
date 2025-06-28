import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export interface Place {
  id: string;
  metadata: {
    place_name: string;
    genre: string;
    category_detail: string;
    address: string;
    takeaways_count: number;
    timestamp: string;
    source_url?: string;
  };
  document: string;
}

interface PlacesContextType {
  allPlaces: Place[];
  refreshPlaces: () => void;
}

export const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export const PlacesProvider = ({ children }: { children: ReactNode }) => {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);

  const fetchAllPlaces = async () => {
    try {
      const response = await axios.get('http://192.168.1.14:8080/places', {
        params: { page: 1, per_page: 1000 },
      });
      if (response.data.success) {
        setAllPlaces(response.data.places);
      }
    } catch (e) {
      setAllPlaces([]);
    }
  };

  useEffect(() => {
    fetchAllPlaces();
  }, []);

  return (
    <PlacesContext.Provider value={{ allPlaces, refreshPlaces: fetchAllPlaces }}>
      {children}
    </PlacesContext.Provider>
  );
}; 