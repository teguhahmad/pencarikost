import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSubscriptionLimits = () => {
  const [maxProperties, setMaxProperties] = useState<number>(0);
  const [maxRoomsPerProperty, setMaxRoomsPerProperty] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionLimits();
  }, []);

  const loadSubscriptionLimits = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's active subscription with plan details
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            max_properties,
            max_rooms_per_property
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscriptionError) throw subscriptionError;

      if (subscription) {
        setMaxProperties(subscription.subscription_plans.max_properties);
        setMaxRoomsPerProperty(subscription.subscription_plans.max_rooms_per_property);
      } else {
        // Default limits for users without subscription
        setMaxProperties(1);
        setMaxRoomsPerProperty(1);
      }
    } catch (err) {
      console.error('Error loading subscription limits:', err);
      setError('Failed to load subscription limits');
      // Set default limits on error
      setMaxProperties(1);
      setMaxRoomsPerProperty(1);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPropertyLimit = async (currentCount: number): Promise<boolean> => {
    return currentCount < maxProperties;
  };

  const checkRoomLimit = async (propertyId: string, currentCount: number): Promise<boolean> => {
    return currentCount < maxRoomsPerProperty;
  };

  return {
    maxProperties,
    maxRoomsPerProperty,
    isLoading,
    error,
    checkPropertyLimit,
    checkRoomLimit
  };
};