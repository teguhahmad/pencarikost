import React, { createContext, useContext, useState, useEffect } from 'react';
import { Property } from '../types';
import { propertyService } from '../services/supabase';
import { supabase } from '../lib/supabase';

interface PropertyContextType {
  properties: Property[];
  selectedProperty: Property | null;
  setSelectedProperty: (property: Property | null) => void;
  isLoading: boolean;
  error: string | null;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType>({
  properties: [],
  selectedProperty: null,
  setSelectedProperty: () => {},
  isLoading: true,
  error: null,
  refreshProperties: async () => {}
});

export const useProperty = () => useContext(PropertyContext);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setProperties([]);
        setSelectedProperty(null);
        return;
      }

      const data = await propertyService.getAll();
      setProperties(data);

      // If there's no selected property but we have properties, select the first one
      if (!selectedProperty && data.length > 0) {
        setSelectedProperty(data[0]);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProperties([]);
        setSelectedProperty(null);
      } else if (event === 'SIGNED_IN') {
        loadProperties();
      }
    });

    // Subscribe to realtime changes
    const propertiesSubscription = supabase
      .channel('properties_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        () => {
          loadProperties();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      propertiesSubscription.unsubscribe();
    };
  }, []);

  return (
    <PropertyContext.Provider 
      value={{ 
        properties, 
        selectedProperty, 
        setSelectedProperty,
        isLoading,
        error,
        refreshProperties: loadProperties
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};