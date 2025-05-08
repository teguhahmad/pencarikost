import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SubscriptionPlan } from '../types/subscription';

export interface SubscriptionFeatures {
  tenant_data: boolean;
  auto_billing: boolean;
  billing_notifications: boolean;
  financial_reports: 'basic' | 'advanced' | 'predictive' | false;
  data_backup: false | 'weekly' | 'daily' | 'realtime';
  multi_user: boolean;
  analytics: boolean | 'predictive';
  support: 'basic' | 'priority' | '24/7';
}

export const useSubscriptionFeatures = () => {
  const [features, setFeatures] = useState<SubscriptionFeatures | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        loadSubscriptionFeatures();
      } else if (event === 'SIGNED_OUT') {
        setFeatures(null);
      }
    });

    // Check for existing session on mount
    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkInitialSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      loadSubscriptionFeatures();
    } else {
      setIsLoading(false);
      setFeatures(null);
    }
  };

  const loadSubscriptionFeatures = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFeatures(null);
        return;
      }

      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            features
          )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      if (subscriptionError) throw subscriptionError;

      // If no active subscription, return basic features
      if (!subscription) {
        setFeatures({
          tenant_data: true,
          auto_billing: false,
          billing_notifications: false,
          financial_reports: false,
          data_backup: false,
          multi_user: false,
          analytics: false,
          support: 'basic'
        });
        return;
      }

      setFeatures(subscription.subscription_plans.features as SubscriptionFeatures);
    } catch (err) {
      console.error('Error loading subscription features:', err);
      setError('Failed to load subscription features');
      // Set default basic features on error
      setFeatures({
          tenant_data: true,
          auto_billing: false,
          billing_notifications: false,
          financial_reports: false,
          data_backup: false,
          multi_user: false,
          analytics: false,
          support: 'basic'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasFeature = (feature: keyof SubscriptionFeatures): boolean => {
    if (!features) return false;
    const value = features[feature];
    return value !== false && value !== null;
  };

  const getFeatureValue = <K extends keyof SubscriptionFeatures>(feature: K): SubscriptionFeatures[K] => {
    return features ? features[feature] : false as SubscriptionFeatures[K];
  };

  return {
    features,
    isLoading,
    error,
    hasFeature,
    getFeatureValue
  };
};