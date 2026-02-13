import Booking from "../models/Booking.js";
import Car from "../models/Car.js";

// Validation functions
const validateCardNumber = (cardNumber) => {
  if (!cardNumber) return 'Card number is required';
  
  // Remove spaces and check if it's a valid card number
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return 'Card number must be 13-19 digits';
  }
  
  // For dummy payment system, accept common test card patterns
  // Accept any card number that starts with common card prefixes
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
  if (!expiryDate) return 'Expiry date is required';
  
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
  if (!cvv) return 'CVV is required';
  
  if (!/^\d{3,4}$/.test(cvv)) {
    return 'CVV must be 3-4 digits';
  }
  return null;
};

const validateCardholderName = (name) => {
  if (!name) return 'Cardholder name is required';
  
  if (name.trim().length < 2) {
    return 'Cardholder name must be at least 2 characters';
  }
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return 'Cardholder name can only contain letters and spaces';
  }
  return null;
};

// UPI and Net Banking validations removed as only card payments are allowed

const validatePaymentDetails = (paymentMethod, cardDetails) => {
  const errors = [];
  
  if (paymentMethod.includes('card')) {
    if (!cardDetails) {
      errors.push('Card details are required for card payments');
      return errors;
    }
    
    const cardNumberError = validateCardNumber(cardDetails.cardNumber);
    if (cardNumberError) errors.push(cardNumberError);
    
    const expiryError = validateExpiryDate(cardDetails.expiryDate);
    if (expiryError) errors.push(expiryError);
    
    const cvvError = validateCVV(cardDetails.cvv);
    if (cvvError) errors.push(cvvError);
    
    const nameError = validateCardholderName(cardDetails.cardholderName);
    if (nameError) errors.push(nameError);
    
  } else {
    errors.push('Invalid payment method');
  }
  
  return errors;
};

// Dummy Payment Gateway - Simulates payment processing
const processPayment = async (amount, paymentMethod, paymentDetails) => {
  // Validate payment details before processing
  const validationErrors = validatePaymentDetails(
    paymentMethod,
    paymentDetails.cardDetails
  );
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      transactionId: null,
      amount: amount,
      status: 'failed',
      message: `Payment validation failed: ${validationErrors.join(', ')}`,
      timestamp: new Date(),
      paymentMethod: paymentMethod,
      validationErrors: validationErrors
    };
  }
  
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate 90% success rate
  const isSuccess = Math.random() > 0.1;
  
  if (isSuccess) {
    return {
      success: true,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      status: 'success',
      message: 'Payment processed successfully',
      timestamp: new Date(),
      paymentMethod: paymentMethod
    };
  } else {
    return {
      success: false,
      transactionId: null,
      amount: amount,
      status: 'failed',
      message: 'Payment failed - insufficient funds or card declined',
      timestamp: new Date(),
      paymentMethod: paymentMethod
    };
  }
};

// API to initiate payment for advance amount
export const initiatePayment = async (req, res) => {
  try {
    const { _id } = req.user;
    const { bookingId, paymentMethod, cardDetails } = req.body;
    
    // Validate required fields
    if (!bookingId || !paymentMethod) {
      return res.json({ 
        success: false, 
        message: "Missing required fields: bookingId and paymentMethod are required" 
      });
    }
    
    // Find the booking
    const booking = await Booking.findById(bookingId).populate('car');
    
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }
    
    if (booking.user.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized - You can only pay for your own bookings" });
    }
    
    if (booking.paymentStatus === 'success') {
      return res.json({ success: false, message: "Payment already completed" });
    }
    
    if (booking.status === 'cancelled') {
      return res.json({ success: false, message: "Cannot pay for cancelled booking" });
    }
    
    // Validate payment details before processing
    const validationErrors = validatePaymentDetails(paymentMethod, cardDetails);
    if (validationErrors.length > 0) {
      return res.json({ 
        success: false, 
        message: `Payment validation failed: ${validationErrors.join(', ')}`,
        validationErrors: validationErrors
      });
    }
    
    // Process payment through dummy gateway
    const paymentResult = await processPayment(booking.advanceAmount, paymentMethod, {
      cardDetails
    });
    
    if (paymentResult.success) {
      // Update booking with payment details
      booking.paymentId = paymentResult.transactionId;
      booking.paymentStatus = 'success';
      booking.paymentMethod = paymentMethod;
      booking.paymentDate = new Date();
      booking.advanceStatus = 'paid';
      booking.paymentGatewayResponse = paymentResult;
      
      await booking.save();
      
      res.json({
        success: true,
        message: "Payment successful! Your booking is now confirmed.",
        paymentDetails: {
          transactionId: paymentResult.transactionId,
          amount: paymentResult.amount,
          status: paymentResult.status,
          paymentMethod: paymentMethod,
          timestamp: paymentResult.timestamp
        }
      });
    } else {
      // Update booking with failed payment details
      booking.paymentStatus = 'failed';
      booking.paymentMethod = paymentMethod;
      booking.paymentDate = new Date();
      booking.paymentGatewayResponse = paymentResult;
      
      await booking.save();
      
      res.json({
        success: false,
        message: paymentResult.message,
        paymentDetails: {
          status: paymentResult.status,
          message: paymentResult.message,
          paymentMethod: paymentMethod,
          timestamp: paymentResult.timestamp
        },
        validationErrors: paymentResult.validationErrors
      });
    }
    
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { _id } = req.user;
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }
    
    if (booking.user.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }
    
    res.json({
      success: true,
      paymentStatus: booking.paymentStatus,
      advanceStatus: booking.advanceStatus,
      paymentDetails: {
        paymentId: booking.paymentId,
        paymentMethod: booking.paymentMethod,
        paymentDate: booking.paymentDate,
        amount: booking.advanceAmount
      }
    });
    
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to retry failed payment
export const retryPayment = async (req, res) => {
  try {
    const { _id } = req.user;
    const { bookingId, paymentMethod, cardDetails } = req.body;
    
    if (!bookingId || !paymentMethod) {
      return res.json({ 
        success: false, 
        message: "Missing required fields: bookingId and paymentMethod are required" 
      });
    }
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }
    
    if (booking.user.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }
    
    if (booking.paymentStatus === 'success') {
      return res.json({ success: false, message: "Payment already completed" });
    }
    
    // Validate payment details before processing
    const validationErrors = validatePaymentDetails(paymentMethod, cardDetails);
    if (validationErrors.length > 0) {
      return res.json({ 
        success: false, 
        message: `Payment validation failed: ${validationErrors.join(', ')}`,
        validationErrors: validationErrors
      });
    }
    
    // Process payment again
    const paymentResult = await processPayment(booking.advanceAmount, paymentMethod, {
      cardDetails
    });
    
    if (paymentResult.success) {
      booking.paymentId = paymentResult.transactionId;
      booking.paymentStatus = 'success';
      booking.paymentMethod = paymentMethod;
      booking.paymentDate = new Date();
      booking.advanceStatus = 'paid';
      booking.paymentGatewayResponse = paymentResult;
      
      await booking.save();
      
      res.json({
        success: true,
        message: "Payment successful! Your booking is now confirmed.",
        paymentDetails: {
          transactionId: paymentResult.transactionId,
          amount: paymentResult.amount,
          status: paymentResult.status,
          paymentMethod: paymentMethod,
          timestamp: paymentResult.timestamp
        }
      });
    } else {
      booking.paymentStatus = 'failed';
      booking.paymentMethod = paymentMethod;
      booking.paymentDate = new Date();
      booking.paymentGatewayResponse = paymentResult;
      
      await booking.save();
      
      res.json({
        success: false,
        message: paymentResult.message,
        paymentDetails: {
          status: paymentResult.status,
          message: paymentResult.message,
          paymentMethod: paymentMethod,
          timestamp: paymentResult.timestamp
        },
        validationErrors: paymentResult.validationErrors
      });
    }
    
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
