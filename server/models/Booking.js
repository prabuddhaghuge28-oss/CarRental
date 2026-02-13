import mongoose from "mongoose";
const {ObjectId} = mongoose.Schema.Types
const bookingSchema= new mongoose.Schema({
   car: {type:ObjectId,ref :"Car",required : true},
   user:{type:ObjectId,ref :"User",required:true},
   owner:{type:ObjectId,ref :"User",required:true},
   pickupDate:{type:Date, required:true},
   returnDate:{type:Date, required:true},
   status:{type:String, enum:["pending","confirmed","cancelled"],default:"pending"},
   price:{type:Number,required:true}, // Rental price only
   safetyDeposit:{type:Number,required:true,default:0}, // Dynamic deposit based on driver option
   tax:{type:Number,required:true,default:10}, // Fixed $10 tax
   totalAmount:{type:Number,required:true}, // price + safetyDeposit + tax
   advanceAmount:{type:Number,required:true,default:0}, // 10% of total amount
   advanceStatus:{type:String, enum:["pending","paid","refunded"],default:"pending"},
   depositStatus:{type:String, enum:["pending","paid","refunded"],default:"pending"},
   driverOption:{type:String, enum:["with_driver","without_driver"],required:true,default:"without_driver"},
   cancellationReason:{type:String,default:""}, // Reason for cancellation
   cancelledBy:{type:String, enum:["user","owner","system"]}, // Who cancelled the booking (optional)
   cancelledAt:{type:Date,default:null}, // When booking was cancelled
   // Payment Gateway Fields
   paymentId:{type:String,default:""}, // Payment gateway transaction ID
   paymentStatus:{type:String, enum:["pending","success","failed"],default:"pending"}, // Payment gateway status
   paymentMethod:{type:String,default:""}, // Payment method used
   paymentDate:{type:Date,default:null}, // When payment was made
   paymentGatewayResponse:{type:Object,default:{}} // Gateway response data
},{timestamps:true})

const Booking=mongoose.model('Booking',bookingSchema)

export default Booking