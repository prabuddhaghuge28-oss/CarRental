import React, { useEffect, useState } from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {assets, dummyCarData} from '../assets/assets'
import Loader from '../components/Loader'
import PaymentModal from '../components/PaymentModal'
import { useAppContext } from '../context/AppContext'
import {toast} from 'react-hot-toast'
import {motion} from 'motion/react'
function CarDetails() {
  const {id}=useParams()
  const {cars, axios, pickupDate,setPickupDate, returnDate, setReturnDate, driverOption, setDriverOption, fetchCars} = useAppContext()
  const navigate=useNavigate()
  const [car,setCar]=useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentBooking, setCurrentBooking] = useState(null)
  const currency = import.meta.env.VITE_CURRENCY || '$'

  const handleSubmit= async (e)=>{
    e.preventDefault();
    
    // Validation
    if (!pickupDate || !returnDate) {
      toast.error('Please select pickup and return dates');
      return;
    }
    
    if (new Date(pickupDate) >= new Date(returnDate)) {
      toast.error('Return date must be after pickup date');
      return;
    }
    
    if (!driverOption) {
      toast.error('Please select a driver option');
      return;
    }
    
    try{
     const {data} = await axios.post('/api/bookings/create',{
      car: id,
      pickupDate,
      returnDate,
      driverOption
     })

     if(data.success){
      // refresh cars so availability updates immediately in listings
      fetchCars()
      if(data.paymentRequired){
        setCurrentBooking({
          id: data.bookingId,
          advanceAmount: data.advanceAmount
        })
        setShowPaymentModal(true)
        toast.success(data.message)
      } else {
        toast.success(data.message)
        fetchCars()
        navigate('/my-bookings')
      }
     } else{
      toast.error(data.message)
     }
    } catch(error){
    toast.error(error.response?.data?.message || error.message)
    }
  }

  useEffect(()=>{
    setCar(cars.find(car => car._id===id))
  },[cars,id])

  // Compute date boundaries for inputs
  const todayISO = new Date().toISOString().split('T')[0]
  const minReturnDateISO = pickupDate 
    ? new Date(new Date(pickupDate).getTime() + 24*60*60*1000).toISOString().split('T')[0]
    : todayISO

  // If pickup changes and invalidates return, clear return date
  useEffect(()=>{
    if(pickupDate && returnDate && new Date(returnDate) <= new Date(pickupDate)){
      setReturnDate('')
    }
  },[pickupDate])

  return car ? (
    <div className='px-6 md:px-16 lg:px-24 xl:px-32 mt-16'>
      <button onClick={()=> navigate(-1)} className='flex items-center gap-2 mb-6 text-gray-500 cursor-pointer'>
        <img src={assets.arrow_icon} alt="" className='rotate-180 opcaity-65'/>
        Back to all cars
      </button>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12'>
       {/* Left : Car Image & Details*/ }
       <motion.div 
       initial={{opacity:0, y:30}}
       animate={{opacity:1, y:0}}
       transition={{duration:0.6}}
       className='lg:col-span-2'>
        <motion.img 
        initial={{scale:0.98, opacity:0}}
        animate={{scale:1,opacity:1}}  
        transition={{duration:0.5}}
        src={car.image} alt="" className='w-full h-auto md:max:h-100 object-cover rounded-xl mb-6 shadow-md'/>
        <motion.div 
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{delay:0.2,duration:0.5}}
        className='space-y-6'>
        <h1 className='text-3xl font-bold'>{car.brand} {car.model}</h1>
        <p>{car.category} . {car.year}</p>
        </motion.div>
        <hr className='border-borderColor my-6'/>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        {
          [
            {icon: assets.users_icon, text: `${car.seating_capacity} Seats`},
            {icon: assets.fuel_icon, text: car.fuel_type},
            {icon: assets.car_icon, text: car.transmission},
            {icon: assets.location_icon, text: car.location},
          ].map(({icon,text})=>(
            <motion.div 
            initial={{opacity:0, y:10}}
            animate={{opacity:1, y:0}}
            transition={{duration:0.4}}
            key={text} className='flex flex-col items-center bg-light p-4 rounded-b-lg'>
              <img src={icon} alt="" className='h-5 mb-2'/>
              {text}
              </motion.div>
          ))}
        </div>
        {/* Description */}
        <div>
         <h1 className='text-xl font-medium mb-3'>Description</h1>
         <p className='text-gray-500'>{car.description}</p>
        </div>
        {/* Features*/}
        <div>
          <h1 className='text-xl font-medium mb-3'>Features</h1>
          <ul className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
           {
            ["360 Camera","Bluetooth","GPS","Heated Seats","Rear View","Mirror"].map((item)=>(
              <li key={item} className='flex items-center text-gray-500'>
                <img src={assets.check_icon} className="h-4 mr-2"
                alt="" />
                 {item}
              </li>
            ))
           }
          </ul>
        </div>
       </motion.div>
       {/* Right: Booking form */}
       <motion.form 
       initial={{opacity:0, y:30}}
       animate={{opacity:1, y:0}}
        transition={{delay:0.3,duration:0.6}}
       onSubmit={handleSubmit} className='shadow-lg h-max sticky top-18 rounded-xl p-6 space-y-6 text-gray-500'>
         <p className='flex items-center justify-between text-2xl text-gray-800 font-semibold'>{currency}{car.pricePerDay} <span className='text-base font-gray-400 font-normal'>/day</span></p>
         <hr className='border-borderColor my-6' />
         <div className='flex flex-col gap-2'>
          <label htmlFor="pickup-date">Pickup Date</label>
          <input value={pickupDate} onChange={(e)=>setPickupDate(e.target.value)} type="date" className='border border-borderColor px-3 py-2 rounded-lg' required id='pickup-date' min={todayISO}/>
         </div>
         <div className='flex flex-col gap-2'>
          <label htmlFor="return-date">Return Date</label>
          <input  value={returnDate} onChange={(e)=>setReturnDate(e.target.value)} type="date" className='border border-borderColor px-3 py-2 rounded-lg' required id='return-date' min={minReturnDateISO}/>
         </div>
         <div className='flex flex-col gap-2'>
          <label htmlFor="driver-option" className='font-medium text-gray-700'>Driver Option</label>
          <div className='relative'>
            <select 
              value={driverOption} 
              onChange={(e)=>setDriverOption(e.target.value)} 
              className='border border-borderColor px-3 py-3 rounded-lg w-full appearance-none bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent' 
              required 
              id='driver-option'
            >
              <option value="without_driver">🚗 Without Driver - Self Drive</option>
              <option value="with_driver">👨‍💼 With Driver - Chauffeur Service (+{currency}50/day)</option>
            </select>
            <div className='absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none'>
              <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </div>
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            {driverOption === 'with_driver' 
              ? 'Professional driver will be provided for your entire journey' 
              : 'You will drive the car yourself - valid driving license required'
            }
          </p>
         </div>
         {pickupDate && returnDate && (
           <div className='bg-light p-4 rounded-lg'>
             <h3 className='font-medium mb-3 text-gray-800'>Price Breakdown</h3>
             <div className='space-y-2 text-sm'>
               <div className='flex justify-between items-center'>
                 <span className='text-gray-600'>Car Rental ({Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))} days)</span>
                 <span className='font-medium'>{currency}{car.pricePerDay * Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))}</span>
               </div>
               {driverOption === 'with_driver' && (
                 <div className='flex justify-between items-center'>
                   <span className='text-gray-600'>👨‍💼 Driver Service ({Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))} days)</span>
                   <span className='font-medium text-blue-600'>{currency}{50 * Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))}</span>
                 </div>
               )}
               {driverOption === 'without_driver' && (
                 <div className='flex justify-between items-center'>
                   <span className='text-gray-600'>🛡️ Safety Deposit</span>
                   <span className='font-medium text-orange-600'>{currency}50</span>
                 </div>
               )}
               <div className='flex justify-between items-center'>
                 <span className='text-gray-600'>💰 Tax</span>
                 <span className='font-medium text-green-600'>{currency}10</span>
               </div>
               <hr className='border-borderColor my-3' />
               <div className='flex justify-between items-center text-base font-semibold text-gray-800'>
                 <span>Total Amount</span>
                 <span className='text-primary'>{currency}{
                   car.pricePerDay * Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) +
                   (driverOption === 'with_driver' ? 50 * Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) : 0) +
                   (driverOption === 'without_driver' ? 50 : 0) + 10
                 }</span>
               </div>
               <div className='flex justify-between items-center text-sm'>
                 <span className='text-gray-600'>💳 Advance Payment (10%)</span>
                 <span className='font-medium text-purple-600'>{currency}{Math.round((
                   car.pricePerDay * Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) +
                   (driverOption === 'with_driver' ? 50 * Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) : 0) +
                   (driverOption === 'without_driver' ? 50 : 0) + 10
                 ) * 0.1)}</span>
               </div>
               <div className='text-xs text-gray-500 mt-2 p-2 bg-white rounded border'>
                 <p className='font-medium mb-1'>What's included:</p>
                 <ul className='space-y-1'>
                   <li>• Car rental for {Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))} days</li>
                   <li>• Basic insurance coverage</li>
                   <li>• 24/7 roadside assistance</li>
                   {driverOption === 'with_driver' && (
                     <li>• Professional licensed driver</li>
                   )}
                   {driverOption === 'without_driver' && (
                     <li>• Safety deposit (refundable after car return)</li>
                   )}
                   <li>• Government tax included</li>
                 </ul>
               </div>
             </div>
           </div>
         )}
         <button className='w-full bg-primary hover:bg-primary-dull transition-all py-3 font-medium text-white rounded-xl'>
           {driverOption === 'with_driver' ? 'Book now (With Driver)' : 'Book now (Self Drive)'}
         </button>
         <p className='text-center text-sm'>Advance payment required to confirm booking</p>
       </motion.form>
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
            fetchCars();
            navigate('/my-bookings');
          }}
        />
      )}
    </div>
  ): <Loader/>
}

export default CarDetails
