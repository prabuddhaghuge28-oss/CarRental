import express from "express";
import { changeBookingStatus, checkAvailabilityOfCar, createBooking, getOwnerBookings, getUserBookings, updateDepositStatus, updateAdvanceStatus, cancelBooking, cancelBookingByOwner } from "../controllers/bookingController.js";
import {protect} from "../middleware/auth.js"
const bookingRouter = express.Router();

bookingRouter.post('/check-availability',checkAvailabilityOfCar)
bookingRouter.post('/create',protect,createBooking)
bookingRouter.get('/user',protect,getUserBookings)
bookingRouter.get('/owner',protect,getOwnerBookings)
bookingRouter.post('/change-status',protect,changeBookingStatus)
bookingRouter.post('/update-deposit-status',protect,updateDepositStatus)
bookingRouter.post('/update-advance-status',protect,updateAdvanceStatus)
bookingRouter.post('/cancel',protect,cancelBooking)
bookingRouter.post('/cancel-by-owner',protect,cancelBookingByOwner)

export default bookingRouter