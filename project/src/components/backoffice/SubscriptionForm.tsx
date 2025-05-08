import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../../types/subscription';
import Button from '../ui/Button';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SubscriptionFormProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  userId,
  onClose,
  onSuccess
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: userId,
          plan_id: selectedPlan,
          status: 'active'
        }]);

      if (subscriptionError) throw subscriptionError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError('Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Add Subscription</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(plan.price)}
                    </p>
                    <p className="text-sm text-gray-500">/month</p>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <p className="text-sm">
                    <span className="font-medium">Properties:</span> Up to {plan.max_properties}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Rooms per Property:</span> Up to {plan.max_rooms_per_property}
                  </p>
                  <div className="text-sm">
                    <span className="font-medium">Features:</span>
                    <ul className="mt-1 space-y-1">
                      {Object.entries(plan.features).map(([key, value]) => (
                        <li key={key} className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          {typeof value === 'string' && value !== 'true' && `: ${value}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedPlan}
            >
              {isSubmitting ? 'Adding Subscription...' : 'Add Subscription'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionForm;