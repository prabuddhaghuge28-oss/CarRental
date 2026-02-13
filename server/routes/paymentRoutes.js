import express from "express";
import { initiatePayment, getPaymentStatus, retryPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const paymentRouter = express.Router();

// Payment routes
paymentRouter.post('/initiate', protect, initiatePayment);
paymentRouter.get('/status/:bookingId', protect, getPaymentStatus);
paymentRouter.post('/retry', protect, retryPayment);

export default paymentRouter;

