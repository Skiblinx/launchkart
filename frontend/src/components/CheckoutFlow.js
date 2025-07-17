import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';
import { useUser } from '../context/UserContext';
import { CreditCard, Shield, CheckCircle, AlertCircle, Clock, MapPin, Mail, Phone } from 'lucide-react';

const CheckoutFlow = ({ serviceRequest, calculatedPrice, onSuccess, onCancel }) => {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [userLocation, setUserLocation] = useState('IN'); // Default to India

  // Detect user location for payment method selection
  useEffect(() => {
    detectUserLocation();
  }, []);

  const detectUserLocation = async () => {
    try {
      // You can implement geolocation or use user profile data
      const location = user?.location || 'IN';
      setUserLocation(location);
      
      // Auto-select payment method based on location
      if (location === 'IN') {
        setPaymentMethod('razorpay');
      } else if (location === 'AE') {
        setPaymentMethod('stripe');
      } else {
        setPaymentMethod('stripe'); // Default to Stripe for international
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    }
  };

  const createPaymentOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('post', '/payments/create-order', {
        service_request_id: serviceRequest.id,
        payment_method: paymentMethod
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      setPaymentOrder(response.data);
      setStep(2);
    } catch (error) {
      console.error('Failed to create payment order:', error);
      setError('Failed to create payment order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      if (paymentMethod === 'razorpay') {
        await processRazorpayPayment();
      } else if (paymentMethod === 'stripe') {
        await processStripePayment();
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      setError('Payment processing failed. Please try again.');
      setLoading(false);
    }
  };

  const processRazorpayPayment = async () => {
    if (!window.Razorpay) {
      setError('Razorpay SDK not loaded. Please refresh the page.');
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: paymentOrder.amount * 100,
      currency: paymentOrder.currency,
      order_id: paymentOrder.gateway_order_id,
      name: 'LaunchKart',
      description: `Payment for ${serviceRequest.title}`,
      image: '/logo.png',
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone
      },
      handler: async (response) => {
        try {
          await verifyPayment(response.razorpay_payment_id, response.razorpay_signature);
        } catch (error) {
          setError('Payment verification failed. Please contact support.');
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        }
      },
      theme: {
        color: '#2563eb'
      }
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  };

  const processStripePayment = async () => {
    if (!window.Stripe) {
      setError('Stripe SDK not loaded. Please refresh the page.');
      setLoading(false);
      return;
    }

    const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
    
    const { error } = await stripe.confirmPayment({
      elements: paymentOrder.gateway_order_id,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      await verifyPayment(paymentOrder.gateway_order_id);
    }
  };

  const verifyPayment = async (paymentId, signature = null) => {
    try {
      const response = await apiRequest('post', '/payments/verify-payment', {
        payment_record_id: paymentOrder.payment_record_id,
        gateway_payment_id: paymentId,
        gateway_signature: signature
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      setStep(3);
      setLoading(false);
      
      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess(response.data);
      }, 2000);
    } catch (error) {
      throw error;
    }
  };

  const PaymentMethodSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        <div className="space-y-3">
          {userLocation === 'IN' && (
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'razorpay'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('razorpay')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src="/razorpay-logo.png" alt="Razorpay" className="w-8 h-8" />
                  <div>
                    <h4 className="font-medium">Razorpay</h4>
                    <p className="text-sm text-gray-600">UPI, Cards, Net Banking, Wallets</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">For Indian customers</p>
                  <p className="text-xs text-green-600">₹ INR</p>
                </div>
              </div>
            </div>
          )}

          <div
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              paymentMethod === 'stripe'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setPaymentMethod('stripe')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src="/stripe-logo.png" alt="Stripe" className="w-8 h-8" />
                <div>
                  <h4 className="font-medium">Stripe</h4>
                  <p className="text-sm text-gray-600">Credit/Debit Cards, Apple Pay</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">International payments</p>
                <p className="text-xs text-green-600">$ USD</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Payment Security</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-2 text-green-600" />
            <span>256-bit SSL encryption</span>
          </div>
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-2 text-green-600" />
            <span>PCI DSS compliant</span>
          </div>
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-2 text-green-600" />
            <span>No card details stored</span>
          </div>
        </div>
      </div>

      <button
        onClick={createPaymentOrder}
        disabled={!paymentMethod || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {loading ? 'Processing...' : 'Proceed to Payment'}
      </button>
    </div>
  );

  const PaymentProcessing = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Complete Payment</h3>
        <p className="text-gray-600">
          You will be redirected to {paymentMethod === 'razorpay' ? 'Razorpay' : 'Stripe'} to complete your payment
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Payment Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Service</span>
            <span>{serviceRequest.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount</span>
            <span className="font-medium">
              {paymentOrder.currency} {paymentOrder.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Payment Method</span>
            <span className="capitalize">{paymentMethod}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium mb-2 text-blue-800">Important Note</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Do not close this window during payment</li>
          <li>• You will receive a confirmation email after successful payment</li>
          <li>• Our team will start working on your project immediately</li>
        </ul>
      </div>

      <button
        onClick={processPayment}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
      >
        {loading ? 'Processing Payment...' : 'Pay Now'}
      </button>
    </div>
  );

  const PaymentSuccess = () => (
    <div className="space-y-6 text-center">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">
          Your payment has been processed successfully. You will receive a confirmation email shortly.
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="font-medium mb-3 text-green-800">What happens next?</h4>
        <div className="space-y-2 text-sm text-green-700">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>Project assigned to our expert team</span>
          </div>
          <div className="flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            <span>You'll receive regular progress updates</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span>Expected delivery: {serviceRequest.timeline || 'As discussed'}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium mb-2 text-blue-800">Need Help?</h4>
        <p className="text-sm text-blue-700 mb-3">
          Our customer support team is available 24/7 to assist you.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <a href="mailto:support@launchkart.com" className="flex items-center text-blue-600 hover:text-blue-800">
            <Mail className="w-4 h-4 mr-1" />
            support@launchkart.com
          </a>
          <a href="tel:+911234567890" className="flex items-center text-blue-600 hover:text-blue-800">
            <Phone className="w-4 h-4 mr-1" />
            +91 12345 67890
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {step === 1 ? 'Payment Method' : step === 2 ? 'Complete Payment' : 'Payment Successful'}
            </h2>
            {step !== 3 && (
              <button
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Progress indicator */}
          <div className="flex mt-4 space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`flex-1 h-2 rounded-full ${
                  stepNum <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && <PaymentMethodSelection />}
          {step === 2 && <PaymentProcessing />}
          {step === 3 && <PaymentSuccess />}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutFlow;