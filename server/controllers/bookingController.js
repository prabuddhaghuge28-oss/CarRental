import Booking from "../models/Booking.js";
import Car from "../models/Car.js"

//Function to Check Availability of car for a given Date
const checkAvailability=async (car,pickupDate,returnDate)=>{
    const start = new Date(pickupDate)
    const end = new Date(returnDate)
    const bookings= await Booking.find({
        car,
        status: { $ne: 'cancelled' },
        pickupDate: { $lte: end },
        returnDate: { $gte: start },
    })
    return bookings.length===0;
}

//API to check Availability of cars for the given Date and location

export const checkAvailabilityOfCar= async (req,res)=>{
    try {
       const {location,pickupDate,returnDate}=req.body;
       const pickup = new Date(pickupDate)
       const returning = new Date(returnDate)
        //fetch all available cars for the given location (case-insensitive)
         const cars= await Car.find({
           location: { $regex: `^${location}$`, $options: 'i' },
           isAvaliable: true
         })
     
         //check car availability for the given date range using promise 
         const availableCarsPromises= cars.map(async (car)=>{
            const isAvailble= await checkAvailability(car._id,pickup,returning)
            return {...car._doc, isAvailble:isAvailble}
         })

         let availableCars= await Promise.all(availableCarsPromises);
         availableCars=availableCars.filter(car=> car.isAvailble===true)
         res.json({success:true,availableCars})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message:error.message})
    }
}

//API to create Booking 

export const createBooking= async (req,res)=>{
    try {
        const {_id}=req.user;
        const {car,pickupDate,returnDate,driverOption}=req.body;
        const isAvailble=await checkAvailability(car,pickupDate,returnDate)
        if(!isAvailble){
            return res.json({success:false,message:"Car is not availble"});
        }
        const carData=await Car.findById(car);
        //Calculate price based on pickupdate and returndate
        const picked=new Date(pickupDate);
        const returned= new Date(returnDate);
        const noOfDays=Math.ceil((returned-picked)/ (1000*60*60*24))
        let price=carData.pricePerDay * noOfDays;
        
        // Add driver cost if driver is requested
        if(driverOption === "with_driver"){
            const driverCostPerDay = 50; // You can make this configurable
            price += driverCostPerDay * noOfDays;
        }

        // Safety deposit logic: Only apply if user chooses without driver
        let safetyDeposit = 0;
        if(driverOption === "without_driver"){
            safetyDeposit = 50; // $50 deposit only for self-drive
        }

        // Tax is fixed at $10
        const tax = 10;
        const totalAmount = price + safetyDeposit + tax;
        
        // Calculate advance amount (10% of total amount)
        const advanceAmount = Math.round(totalAmount * 0.1);

        const newBooking = await Booking.create({
            car,
            owner:carData.owner, 
            user:_id,
            pickupDate,
            returnDate,
            price, // Rental price only
            safetyDeposit, // Dynamic deposit based on driver option
            tax, // Fixed $10 tax
            totalAmount, // Total amount including deposit and tax
            advanceAmount, // 10% advance payment
            driverOption,
            paymentStatus: 'pending', // Payment pending initially
            advanceStatus: 'pending' // Advance payment pending
        })

        res.json({
            success: true,
            message: "Booking created successfully. Please complete the advance payment to confirm your booking.",
            bookingId: newBooking._id,
            advanceAmount: newBooking.advanceAmount,
            paymentRequired: true
        })
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message:error.message})
    }
}

//API to List User Bookings 
export const getUserBookings= async (req,res)=>{
    try{
        const {_id}=req.user;
        const bookings= await Booking.find({user:_id}).populate("car").sort({createdAt: -1})
         res.json({success:true,bookings})

    } catch(error){
    console.log(error.message);
    res.json({success:false, message:error.message})
    }
}

//API to get Owner Bookings
export const getOwnerBookings= async (req,res)=>{
    try{
      if(req.user.role !== 'owner'){
        return res.json({success:false,message:"Unauthorized"})
      }
      const bookings = await Booking.find({owner: req.user._id}).populate('car user').select("-user.password").sort({createdAt:-1})
      res.json({success:true,bookings})

    } catch(error){
    console.log(error.message);
    res.json({success:false, message:error.message})
    }
}


//API to change the Booking status 

export const changeBookingStatus= async (req,res)=>{
    try{
     const {_id} =req.user;
     const {bookingId,status} = req.body;
     const booking= await Booking.findById(bookingId)
     if(booking.owner.toString()!== _id.toString()){
        return res.json({ success: false, message: "Unauthorised"})
     }
     booking.status = status
     await booking.save();
     res.json({success:true,message:"Status Updated"})
    } catch(error){
    console.log(error.message);
    res.json({success:false, message:error.message})
    }
}

//API to update deposit status
export const updateDepositStatus= async (req,res)=>{
    try{
     const {_id} =req.user;
     const {bookingId,depositStatus} = req.body;
     const booking= await Booking.findById(bookingId)
     if(booking.owner.toString()!== _id.toString()){
        return res.json({ success: false, message: "Unauthorised"})
     }
     booking.depositStatus = depositStatus
     await booking.save();
     res.json({success:true,message:"Deposit status updated"})
    } catch(error){
    console.log(error.message);
    res.json({success:false, message:error.message})
    }
}

//API to update advance payment status
export const updateAdvanceStatus= async (req,res)=>{
    try{
     const {_id} =req.user;
     const {bookingId,advanceStatus} = req.body;
     const booking= await Booking.findById(bookingId)
     if(booking.owner.toString()!== _id.toString()){
        return res.json({ success: false, message: "Unauthorised"})
     }
     booking.advanceStatus = advanceStatus
     await booking.save();
     res.json({success:true,message:"Advance payment status updated"})
    } catch(error){
    console.log(error.message);
    res.json({success:false, message:error.message})
    }
}

//API to cancel booking (User can cancel their own booking)
export const cancelBooking= async (req,res)=>{
    try{
     const {_id} =req.user;
     const {bookingId,reason} = req.body;
     const booking= await Booking.findById(bookingId)
     
     if(!booking){
        return res.json({ success: false, message: "Booking not found"})
     }
     
     if(booking.user.toString()!== _id.toString()){
        return res.json({ success: false, message: "Unauthorised - You can only cancel your own bookings"})
     }
     
     if(booking.status === 'cancelled'){
        return res.json({ success: false, message: "Booking is already cancelled"})
     }
     
     // Allow users to cancel both pending and confirmed bookings
     // Check if booking is within cancellation window (e.g., 24 hours before pickup)
     const pickupDate = new Date(booking.pickupDate);
     const currentDate = new Date();
     const hoursUntilPickup = (pickupDate - currentDate) / (1000 * 60 * 60);
     
     if(booking.status === 'confirmed' && hoursUntilPickup < 24){
        return res.json({ 
            success: false, 
            message: "Cannot cancel confirmed booking within 24 hours of pickup time. Please contact support for assistance." 
        })
     }
     
     booking.status = 'cancelled'
     booking.cancellationReason = reason || 'Cancelled by user'
     booking.cancelledBy = 'user'
     booking.cancelledAt = new Date()
     
     await booking.save();
     res.json({success:true,message:"Booking cancelled successfully"})
    } catch(error){
    console.log(error.message);
    res.json({success:false, message:error.message})
    }
}

//API to cancel booking by owner
export const cancelBookingByOwner= async (req,res)=>{
    try{
     const {_id} =req.user;
     const {bookingId,reason} = req.body;
     const booking= await Booking.findById(bookingId)
     
     if(!booking){
        return res.json({ success: false, message: "Booking not found"})
     }
     
     if(booking.owner.toString()!== _id.toString()){
        return res.json({ success: false, message: "Unauthorised"})
     }
     
     if(booking.status === 'cancelled'){
        return res.json({ success: false, message: "Booking is already cancelled"})
     }
     
     booking.status = 'cancelled'
     booking.cancellationReason = reason || 'Cancelled by owner'
     booking.cancelledBy = 'owner'
     booking.cancelledAt = new Date()
     
     await booking.save();
     res.json({success:true,message:"Booking cancelled successfully"})
    } catch(error){
    console.log(error.message);
    res.json({success:false, message:error.message})
    }
}