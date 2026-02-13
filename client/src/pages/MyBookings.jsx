import React, { use, useEffect, useState } from 'react'
import { assets} from '../assets/assets'
import Title from '../components/Title'
import PaymentModal from '../components/PaymentModal'
import CancellationPolicy from '../components/CancellationPolicy'
import { useAppContext } from '../context/AppContext'
import { toast } from 'react-hot-toast'
import {motion} from 'motion/react'
function MyBookings() {
  const {axios, user, currency} = useAppContext()
   const [bookings, setBookings]=useState([])
   const [showPaymentModal, setShowPaymentModal] = useState(false)
   const [currentBooking, setCurrentBooking] = useState(null)
   
       // Helper function to check if booking can be cancelled
    const canCancelBooking = (booking) => {
      if (booking.status === 'cancelled') return false;
      
      // Pending bookings can always be cancelled
      if (booking.status === 'pending') return true;
      
      // For confirmed bookings, check 24 hours restriction
      if (booking.status === 'confirmed') {
        const pickupDate = new Date(booking.pickupDate);
        const currentDate = new Date();
        const hoursUntilPickup = (pickupDate - currentDate) / (1000 * 60 * 60);
        return hoursUntilPickup >= 24;
      }
      
      return false;
    }
   
       const fetchMyBookings=async()=>{
    try {
     const {data} = await axios.get('/api/bookings/user')
     if(data.success){
       setBookings(data.bookings)
     } else{
       toast.error(data.message)
     }
    } catch (error) {
     toast.error(error.message)
    }
    }

    const handleCancelBooking = async (bookingId, status) => {
      const isConfirmed = status === 'confirmed';
      const confirmMessage = isConfirmed 
        ? 'Are you sure you want to cancel this confirmed booking? This action cannot be undone.'
        : 'Are you sure you want to cancel this booking?';
      
      if (!confirm(confirmMessage)) {
        return;
      }
      
      const reason = prompt('Please provide a reason for cancellation (optional):');
      
      try {
        const {data} = await axios.post('/api/bookings/cancel', {
          bookingId,
          reason: reason || 'Cancelled by user'
        })
        
        if(data.success){
          toast.success(data.message)
          fetchMyBookings() // Refresh bookings
        } else{
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message)
      }
    }
   useEffect(()=>{
    user && fetchMyBookings()
   },[user])

  return (
    <motion.div 
    initial={{opacity:0, y:30}}
    animate={{opacity:1, y:0}}
    transition={{duration:0.6}}
    className='px-6 md:px-16 lg:px-24 xl:px-32 2xl:px-48 mt-16 text-sm max-w-7xl'>
      <Title title='My Bookings'
      subTitle='View and manage your all car bookings' align="left"
      />

      <CancellationPolicy />

      <div>
       {bookings.map((booking,index)=>(
        <motion.div 
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        transition={{delay:index * 0.1, duration:0.4}}
        key={booking._id} className='grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border border-borderColor rounded-lg mt-5 first:mt-12'>
          {/* Car Image + Info*/}

          <div className='md:col-span-1'>
            <div className='rounded-md overflow mb-3'>
              <img src={booking.car?.image || '/placeholder-car.jpg'} alt="" className='w-full h-auto aspect-video object-cover'/>
            </div>
            <p className='text-lg font-medium mt-2'>{booking.car ? `${booking.car.brand} ${booking.car.model}` : 'Car Deleted'}</p>
            <p className='text-gray-500'>{booking.car ? `${booking.car.year}. ${booking.car.category}. ${booking.car.locaion}` : 'Car information unavailable'}</p>
          </div>
        {/* Booking Info */}
          <div className='md:col-span-2'>
            <div className='flex items-center gap-2'>
              <p className='px-3 py-1.5 bg-light rounded'>Bookings #{index+1}</p>
              <p className={`px-3 py-1 text-xs rounded-full ${booking.status==='confirmed' ? "bg-green-400/15 text-green-600":'bg-red-400/15 text-red-600'}`}>{booking.status}</p>
            </div>
            <div className='flex items-start gap-2 mt-3'>
              <img src={assets.calendar_icon_colored} alt="" className='w-4 h-4 mt-1'/>
              <div>
                <p className='text-gray-500'>Rental Period</p>
                <p>{booking.pickupDate.split('T')[0]} To{booking.returnDate.split('T')[0]} </p>
              </div>
            </div>
            <div className='flex items-start gap-2 mt-3'>
              <img src={assets.calendar_icon_colored} alt="" className='w-4 h-4 mt-1'/>
              <div>
                <p className='text-gray-500'>Pickup Location</p>
                <p>{booking.car?.location || 'Location unavailable'}</p>
              </div>
            </div>
            <div className='flex items-start gap-2 mt-3'>
              <img src={assets.car_icon} alt="" className='w-4 h-4 mt-1'/>
              <div>
                <p className='text-gray-500'>Driver Option</p>
                <div className='flex items-center gap-2 mt-1'>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${booking.driverOption === 'with_driver' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                    {booking.driverOption === 'with_driver' ? '👨‍💼 With Driver' : '🚗 Without Driver'}
                  </span>
                  {booking.driverOption === 'with_driver' && (
                    <span className='text-xs text-blue-600 font-medium'>+{currency}50/day</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/*Price */}
          <div className='md:col-span-1 flex flex-col justify-between gap-6'>
           <div>
            <p>Rental price</p>
            <h1 className='text-2xl font-semibold text-primary'>{currency}{booking.price}</h1>
            <div className='mt-2 space-y-1'>
              {booking.safetyDeposit > 0 && (
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-gray-600'>🛡️ Safety Deposit:</span>
                  <span className='font-medium text-orange-600'>{currency}{booking.safetyDeposit}</span>
                </div>
              )}
              <div className='flex justify-between items-center text-sm'>
                <span className='text-gray-600'>💰 Tax:</span>
                <span className='font-medium text-green-600'>{currency}{booking.tax || 10}</span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-gray-600'>💳 Advance Payment:</span>
                <span className='font-medium text-purple-600'>{currency}{booking.advanceAmount || Math.round(booking.totalAmount * 0.1)}</span>
              </div>
              <div className='flex justify-between items-center text-sm font-semibold'>
                <span>Total Amount:</span>
                <span className='text-primary'>{currency}{booking.totalAmount}</span>
              </div>
              <div className='mt-2 space-y-1'>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  booking.paymentStatus === 'success' ? 'bg-green-100 text-green-700' : 
                  booking.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  Payment: {booking.paymentStatus || 'pending'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  booking.advanceStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                  booking.advanceStatus === 'refunded' ? 'bg-blue-100 text-blue-700' : 
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  Advance: {booking.advanceStatus || 'pending'}
                </span>
                {booking.safetyDeposit > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.depositStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                    booking.depositStatus === 'refunded' ? 'bg-blue-100 text-blue-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    Deposit: {booking.depositStatus}
                  </span>
                )}
              </div>
            </div>
            <p>Booked on {booking.createdAt.split('T')[0]}</p>
            
            {/* Payment and Cancellation Buttons */}
            {(booking.status === 'pending' || booking.status === 'confirmed') && (
              <div className='mt-3 space-y-2'>
                {/* Payment Button - Only show for pending bookings */}
                {booking.status === 'pending' && booking.paymentStatus !== 'success' && (
                  <button 
                    onClick={() => {
                      setCurrentBooking({
                        id: booking._id,
                        advanceAmount: booking.advanceAmount
                      })
                      setShowPaymentModal(true)
                    }}
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors'
                  >
                    {booking.paymentStatus === 'failed' ? 'Retry Payment' : 'Pay Advance'}
                  </button>
                )}
                
                {/* Cancellation Button - Show for both pending and confirmed bookings */}
                {canCancelBooking(booking) ? (
                  <button 
                    onClick={() => handleCancelBooking(booking._id, booking.status)}
                    className={`w-full text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      booking.status === 'confirmed' 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {booking.status === 'confirmed' ? 'Cancel Confirmed Booking' : 'Cancel Booking'}
                  </button>
                ) : (
                  <button 
                    disabled
                    className='w-full bg-gray-400 text-white py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed'
                  >
                    {booking.status === 'confirmed' 
                      ? 'Cannot Cancel (Within 24h of pickup)' 
                      : 'Cannot Cancel'
                    }
                  </button>
                )}
                
                {/* Warning for confirmed bookings */}
                {booking.status === 'confirmed' && (() => {
                  const pickupDate = new Date(booking.pickupDate);
                  const currentDate = new Date();
                  const hoursUntilPickup = (pickupDate - currentDate) / (1000 * 60 * 60);
                  const daysUntilPickup = Math.floor(hoursUntilPickup / 24);
                  const remainingHours = Math.floor(hoursUntilPickup % 24);
                  
                  return (
                    <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg'>
                      <p className='text-yellow-700 text-xs'>
                        ⚠️ You can cancel confirmed bookings up to 24 hours before pickup time.
                      </p>
                      {hoursUntilPickup >= 24 && (
                        <p className='text-yellow-600 text-xs mt-1'>
                          Time remaining to cancel: {daysUntilPickup > 0 ? `${daysUntilPickup}d ` : ''}{remainingHours}h
                        </p>
                      )}
                    </div>
                  );
                })()}
                
                {/* Info for pending bookings */}
                {booking.status === 'pending' && (
                  <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg'>
                    <p className='text-blue-700 text-xs'>
                      ℹ️ You can cancel pending bookings at any time.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Cancellation Info */}
            {booking.status === 'cancelled' && (
              <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-red-700 text-sm font-medium'>Cancelled</p>
                <p className='text-red-600 text-xs mt-1'>
                  {booking.cancellationReason || 'No reason provided'}
                </p>
                <p className='text-red-500 text-xs mt-1'>
                  Cancelled on: {booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            )}
           </div>
          </div>
        </motion.div>
       ))}
      </div>
      
      {/* Payment Modal */}
      {currentBooking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={currentBooking.id}
          advanceAmount={currentBooking.advanceAmount}
          onPaymentSuccess={(paymentDetails) => {
            toast.success('Payment successful! Your booking is confirmed.');
            fetchMyBookings(); // Refresh bookings
          }}
        />
      )}
    </motion.div>
  )
}

export default MyBookings
