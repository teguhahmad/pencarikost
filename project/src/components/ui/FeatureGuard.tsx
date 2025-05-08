import React from 'react';
import { useSubscriptionFeatures } from '../../hooks/useSubscriptionFeatures';

interface FeatureGuardProps {
  feature: 
    | 'support' 
    | 'analytics' 
    | 'multi_user' 
    | 'data_backup' 
    | 'tenant_data' 
    | 'auto_billing' 
    | 'financial_reports' 
    | 'billing_notifications';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureGuard: React.FC<FeatureGuardProps> = ({ feature, children, fallback = null }) => {
  const { hasFeature, getFeatureValue, isLoading } = useSubscriptionFeatures();

  if (isLoading) {
    return null;
  }

  // For boolean features, just check if they're enabled
  if (typeof hasFeature(feature) === 'boolean') {
    return hasFeature(feature) ? <>{children}</> : <>{fallback}</>;
  }

  // For tiered features (like support, financial_reports, data_backup),
  // the feature is available if it has any value other than false
  const featureValue = getFeatureValue(feature);
  return featureValue ? <>{children}</> : <>{fallback}</>;
};

export default FeatureGuard;