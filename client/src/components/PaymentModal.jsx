import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';

const PaymentModal = ({ isOpen, onClose, bookingId, advanceAmount, onPaymentSuccess }) => {
  const { axios, currency } = useAppContext();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  // Validation functions
  const validateCardNumber = (cardNumber) => {
    // Remove spaces and check if it's a valid card number
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      return 'Card number must be 13-19 digits';
    }
    
    // For dummy payment system, accept common test card patterns
    // Accept any 16-digit number that starts with common card prefixes
    const validPrefixes = ['4', '5', '3', '6']; // Visa, Mastercard, Amex, Discover
    if (!validPrefixes.includes(cleanNumber.charAt(0))) {
      return 'Card number must start with a valid prefix (4, 5, 3, or 6)';
    }
    
    // Simple validation for dummy system - just check if it's a reasonable length
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return 'Card number must be 13-19 digits';
    }
    
    return null; // Accept the card number for dummy payment
  };

  const validateExpiryDate = (expiryDate) => {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return 'Expiry date must be in MM/YY format';
    }
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(month) < 1 || parseInt(month) > 12) {
      return 'Invalid month';
    }
    
    if (parseInt(year) < currentYear || 
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return 'Card has expired';
    }
    
    return null;
  };

  const validateCVV = (cvv) => {
    if (!/^\d{3,4}$/.test(cvv)) {
      return 'CVV must be 3-4 digits';
    }
    return null;
  };

  const validateCardholderName = (name) => {
    if (name.trim().length < 2) {
      return 'Cardholder name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Cardholder name can only contain letters and spaces';
    }
    return null;
  };

  // UPI and Net Banking removed

  const validateForm = () => {
    const newErrors = {};
    
    if (paymentMethod.includes('card')) {
      // Validate card details
      const cardNumberError = validateCardNumber(cardDetails.cardNumber);
      if (cardNumberError) newErrors.cardNumber = cardNumberError;
      
      const expiryError = validateExpiryDate(cardDetails.expiryDate);
      if (expiryError) newErrors.expiryDate = expiryError;
      
      const cvvError = validateCVV(cardDetails.cvv);
      if (cvvError) newErrors.cvv = cvvError;
      
      const nameError = validateCardholderName(cardDetails.cardholderName);
      if (nameError) newErrors.cardholderName = nameError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    // Add spaces every 4 digits
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardDetails({...cardDetails, cardNumber: value});
    // Clear error when user starts typing
    if (errors.cardNumber) {
      setErrors({...errors, cardNumber: null});
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setCardDetails({...cardDetails, expiryDate: value});
    if (errors.expiryDate) {
      setErrors({...errors, expiryDate: null});
    }
  };

  const handleCVVChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setCardDetails({...cardDetails, cvv: value});
    if (errors.cvv) {
      setErrors({...errors, cvv: null});
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setCardDetails({...cardDetails, cardholderName: value});
    if (errors.cardholderName) {
      setErrors({...errors, cardholderName: null});
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    // Validate form before proceeding
    if (!validateForm()) {
      toast.error('Please fix the errors before proceeding');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data } = await axios.post('/api/payments/initiate', {
        bookingId,
        paymentMethod,
        cardDetails: paymentMethod.includes('card') ? cardDetails : undefined
      });

      if (data.success) {
        toast.success(data.message);
        onPaymentSuccess(data.paymentDetails);
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryPayment = async () => {
    setIsProcessing(true);
    
    try {
      const { data } = await axios.post('/api/payments/retry', {
        bookingId,
        paymentMethod
      });

      if (data.success) {
        toast.success(data.message);
        onPaymentSuccess(data.paymentDetails);
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment retry failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Advance Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Advance Amount:</span>
                <span className="text-xl font-semibold text-blue-600">{currency}{advanceAmount}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This is 10% of your total booking amount. Payment is required to confirm your booking.
              </p>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="credit_card">💳 Credit Card</option>
                <option value="debit_card">💳 Debit Card</option>
              </select>
            </div>

            {paymentMethod.includes('card') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.cardNumber}
                    onChange={handleCardNumberChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cardNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    maxLength="19"
                  />
                  {errors.cardNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiryDate}
                      onChange={handleExpiryChange}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.expiryDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                      maxLength="5"
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={handleCVVChange}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.cvv ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                      maxLength="4"
                    />
                    {errors.cvv && (
                      <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardDetails.cardholderName}
                    onChange={handleNameChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cardholderName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.cardholderName && (
                    <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>
                  )}
                </div>
              </>
            )}

            

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay ${currency}${advanceAmount}`
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>🔒 Your payment is secured with SSL encryption</p>
          </div>
        </motion.div>
      </motion.div>
  );
};

export default PaymentModal;
