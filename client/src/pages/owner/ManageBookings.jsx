import React, { useEffect,useMemo,useState } from 'react'
import Title from '../../components/owner/Title'
import { useAppContext } from '../../context/AppContext'
import { toast } from 'react-hot-toast'
import Loader from '../../components/Loader'
function ManageBookings() {
  const {currency,axios} = useAppContext()
  const [bookings, setBookings]= useState([])
  const [isLoading,setIsLoading] = useState(false)
  const [searchQuery,setSearchQuery] = useState('')
  const [statusFilter,setStatusFilter] = useState('all')
  const [advanceFilter,setAdvanceFilter] = useState('all')
  const [depositFilter,setDepositFilter] = useState('all')
  const [customerFilter,setCustomerFilter] = useState('all')
  const [sortBy,setSortBy] = useState('newest')
  const [compactView,setCompactView] = useState(false)

  const fetchOwnerBookings=async ()=>{
    try{
      setIsLoading(true)
      const {data} = await axios.get('/api/bookings/owner')
      data.success ? setBookings(data.bookings) : toast.error(data.message)
    } catch(error){
      toast.error(error.message)
    } finally{
      setIsLoading(false)
    }
  }
  
  const changeBookingStatus=async (bookingId,status)=>{
    try{
      const {data} = await axios.post('/api/bookings/change-status', {bookingId, status})
      if(data.success){
        toast.success(data.message)
        fetchOwnerBookings()
      } else{
        toast.error(data.message)
      }
    } catch(error){
      toast.error(error.message)
    }
  }

  const updateDepositStatus=async (bookingId,depositStatus)=>{
    try{
      const {data} = await axios.post('/api/bookings/update-deposit-status', {bookingId, depositStatus})
      if(data.success){
        toast.success(data.message)
        fetchOwnerBookings()
      } else{
        toast.error(data.message)
      }
    } catch(error){
      toast.error(error.message)
    }
  }

  const updateAdvanceStatus=async (bookingId,advanceStatus)=>{
    try{
      const {data} = await axios.post('/api/bookings/update-advance-status', {bookingId, advanceStatus})
      if(data.success){
        toast.success(data.message)
        fetchOwnerBookings()
      } else{
        toast.error(data.message)
      }
    } catch(error){
      toast.error(error.message)
    }
  }

  const handleCancelByOwner=async (bookingId)=>{
    const reason = prompt('Please provide a reason for cancellation:');
    if(!reason) return;
    
    try{
      const {data} = await axios.post('/api/bookings/cancel-by-owner', {bookingId, reason})
      if(data.success){
        toast.success(data.message)
        fetchOwnerBookings()
      } else{
        toast.error(data.message)
      }
    } catch(error){
      toast.error(error.response?.data?.message || error.message)
    }
  }

  useEffect(()=>{
    fetchOwnerBookings()
  },[])



  const filteredAndSortedBookings = useMemo(()=>{
    let list = Array.isArray(bookings) ? [...bookings] : []

    // Filters
    if(statusFilter !== 'all'){
      list = list.filter(b => (b.status || 'pending') === statusFilter)
    }
    if(advanceFilter !== 'all'){
      list = list.filter(b => (b.advanceStatus || 'pending') === advanceFilter)
    }
    if(depositFilter !== 'all'){
      list = list.filter(b => (b.depositStatus || 'pending') === depositFilter)
    }
    if(customerFilter !== 'all'){
      list = list.filter(b => b.user?._id === customerFilter)
    }

    if(searchQuery.trim()){
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(b => {
        const carText = b.car ? `${b.car.brand || ''} ${b.car.model || ''}`.toLowerCase() : ''
        const userText = b.user ? `${b.user.name || ''}`.toLowerCase() : ''
        return carText.includes(q) || userText.includes(q)
      })
    }

    // Sorting
    switch(sortBy){
      case 'oldest':
        list.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
        break;
      case 'pickup_asc':
        list.sort((a,b) => new Date(a.pickupDate) - new Date(b.pickupDate))
        break;
      case 'pickup_desc':
        list.sort((a,b) => new Date(b.pickupDate) - new Date(a.pickupDate))
        break;
      default:
        list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return list
  },[bookings,statusFilter,advanceFilter,depositFilter,customerFilter,searchQuery,sortBy])
  return (
    
  <div className='px-4 pt-10 md:px-10 w-full'>

      <Title title="Manage Bookings" subTitle="Track all customer bookings, approve or cancel requests, and manage bookings statuses. Note: Users can cancel confirmed bookings up to 24 hours before pickup."/>

      {/* Summary Stats */}
      <div className='max-w-6xl w-full mt-6 grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='bg-white border border-borderColor rounded-lg p-4'>
          <div className='text-2xl font-bold text-primary'>{bookings.length}</div>
          <div className='text-sm text-gray-600'>Total Bookings</div>
        </div>
        <div className='bg-white border border-borderColor rounded-lg p-4'>
          <div className='text-2xl font-bold text-blue-600'>{Array.from(new Set(bookings.map(b => b.user?._id).filter(Boolean))).length}</div>
          <div className='text-sm text-gray-600'>Unique Customers</div>
        </div>
        <div className='bg-white border border-borderColor rounded-lg p-4'>
          <div className='text-2xl font-bold text-green-600'>{bookings.filter(b => b.status === 'confirmed').length}</div>
          <div className='text-sm text-gray-600'>Confirmed</div>
        </div>
        <div className='bg-white border border-borderColor rounded-lg p-4'>
          <div className='text-2xl font-bold text-yellow-600'>{bookings.filter(b => b.status === 'pending').length}</div>
          <div className='text-sm text-gray-600'>Pending</div>
        </div>
      </div>

      {/* Customer Summary */}
      <div className='max-w-6xl w-full mt-6'>
        <h3 className='text-lg font-semibold text-gray-800 mb-3'>Customer Overview</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from(new Set(bookings.map(b => b.user?._id).filter(Boolean))).map(userId => {
            const user = bookings.find(b => b.user?._id === userId)?.user
            const userBookings = bookings.filter(b => b.user?._id === userId)
            const totalSpent = userBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
            const confirmedBookings = userBookings.filter(b => b.status === 'confirmed').length
            
            return user ? (
              <div key={userId} className='bg-white border border-borderColor rounded-lg p-4 hover:shadow-md transition-shadow'>
                <div className='flex items-center gap-3 mb-3'>
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name} 
                      className='h-10 w-10 rounded-full object-cover'
                    />
                  ) : (
                    <div className='h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center'>
                      <span className='text-sm text-gray-500 font-medium'>
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className='font-medium text-gray-800'>{user.name}</div>
                    <div className='text-xs text-gray-500'>{user.email}</div>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-2 text-xs'>
                  <div className='text-gray-600'>Total Bookings: <span className='font-medium text-blue-600'>{userBookings.length}</span></div>
                  <div className='text-gray-600'>Confirmed: <span className='font-medium text-green-600'>{confirmedBookings}</span></div>
                  <div className='text-gray-600'>Total Spent: <span className='font-medium text-primary'>{currency}{totalSpent}</span></div>
                  <div className='text-gray-600'>Member since: <span className='font-medium'>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                </div>
                <button 
                  onClick={() => setCustomerFilter(userId)}
                  className='w-full mt-3 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm font-medium transition-colors'
                >
                  View All Bookings
                </button>
              </div>
            ) : null
          })}
        </div>
      </div>

      {/* Controls */}
      <div className='max-w-6xl w-full mt-6 flex flex-col md:flex-row gap-3 md:items-center'>
        <input
          value={searchQuery}
          onChange={e=> setSearchQuery(e.target.value)}
          placeholder='Search by car or customer...'
          className='w-full md:flex-1 px-3 py-2 border border-borderColor rounded-md outline-none text-sm'
        />
        <select value={statusFilter} onChange={e=> setStatusFilter(e.target.value)} className='px-3 py-2 border border-borderColor rounded-md text-sm outline-none'>
          <option value='all'>All Status</option>
          <option value='pending'>Pending</option>
          <option value='confirmed'>Confirmed</option>
          <option value='cancelled'>Cancelled</option>
        </select>
        <select value={advanceFilter} onChange={e=> setAdvanceFilter(e.target.value)} className='px-3 py-2 border border-borderColor rounded-md text-sm outline-none'>
          <option value='all'>All Advance</option>
          <option value='pending'>Pending</option>
          <option value='paid'>Paid</option>
          <option value='refunded'>Refunded</option>
        </select>
        <select value={depositFilter} onChange={e=> setDepositFilter(e.target.value)} className='px-3 py-2 border border-borderColor rounded-md text-sm outline-none'>
          <option value='all'>All Deposit</option>
          <option value='pending'>Pending</option>
          <option value='paid'>Paid</option>
          <option value='refunded'>Refunded</option>
        </select>
        <select value={customerFilter} onChange={e=> setCustomerFilter(e.target.value)} className='px-3 py-2 border border-borderColor rounded-md text-sm outline-none'>
          <option value='all'>All Customers</option>
          {Array.from(new Set(bookings.map(b => b.user?._id).filter(Boolean))).map(userId => {
            const user = bookings.find(b => b.user?._id === userId)?.user
            return user ? (
              <option key={userId} value={userId}>{user.name}</option>
            ) : null
          })}
        </select>
        <select value={sortBy} onChange={e=> setSortBy(e.target.value)} className='px-3 py-2 border border-borderColor rounded-md text-sm outline-none'>
          <option value='newest'>Newest</option>
          <option value='oldest'>Oldest</option>
          <option value='pickup_asc'>Pickup Date ↑</option>
          <option value='pickup_desc'>Pickup Date ↓</option>
        </select>
        <button 
          onClick={() => setCompactView(!compactView)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            compactView 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {compactView ? '📊 Full View' : '📱 Compact View'}
        </button>
        <button 
          onClick={() => {
            setSearchQuery('')
            setStatusFilter('all')
            setAdvanceFilter('all')
            setDepositFilter('all')
            setCustomerFilter('all')
            setSortBy('newest')
          }}
          className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors'
        >
          Clear Filters
        </button>
      </div>

      {/* Filter Status */}
      {(statusFilter !== 'all' || advanceFilter !== 'all' || depositFilter !== 'all' || customerFilter !== 'all' || searchQuery.trim()) && (
        <div className='max-w-6xl w-full mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='flex items-center gap-2 text-sm text-blue-800'>
            <span className='font-medium'>Active Filters:</span>
            {statusFilter !== 'all' && <span className='px-2 py-1 bg-blue-100 rounded text-xs'>Status: {statusFilter}</span>}
            {advanceFilter !== 'all' && <span className='px-2 py-1 bg-blue-100 rounded text-xs'>Advance: {advanceFilter}</span>}
            {depositFilter !== 'all' && <span className='px-2 py-1 bg-blue-100 rounded text-xs'>Deposit: {depositFilter}</span>}
            {customerFilter !== 'all' && <span className='px-2 py-1 bg-blue-100 rounded text-xs'>Customer: {bookings.find(b => b.user?._id === customerFilter)?.user?.name || 'Unknown'}</span>}
            {searchQuery.trim() && <span className='px-2 py-1 bg-blue-100 rounded text-xs'>Search: "{searchQuery}"</span>}
            <span className='text-blue-600'>Showing {filteredAndSortedBookings.length} of {bookings.length} bookings</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader />
      ) : filteredAndSortedBookings.length === 0 ? (
        <div className='max-w-6xl w-full mt-6 border border-dashed border-borderColor rounded-md p-8 text-center text-gray-500'>
          No bookings found.
        </div>
      ) : (
      <>
      {/* Desktop table */}
             <div className='w-full rounded-md overflow-x-auto border border-borderColor mt-6 hidden md:block' id="bookingsTable">
         <table className='min-w-full border-collapse text-left text-sm text-gray-600'>
          <thead className='text-gray-500'>
         <tr>
          <th className="p-3 font-medium min-w-[180px]">Car</th>
          {!compactView && <th className="p-3 font-medium min-w-[100px]">Date Range</th>}
          <th className="p-3 font-medium min-w-[180px]">Customer ({Array.from(new Set(bookings.map(b => b.user?._id).filter(Boolean))).length})</th>
          {!compactView && <th className="p-3 font-medium min-w-[120px]">Driver</th>}
          {!compactView && <th className="p-3 font-medium min-w-[90px]">Rental Price</th>}
          {!compactView && <th className="p-3 font-medium min-w-[90px]">Safety Deposit</th>}
          {!compactView && <th className="p-3 font-medium min-w-[60px]">Tax</th>}
          {!compactView && <th className="p-3 font-medium min-w-[100px]">Advance Payment</th>}
          <th className="p-3 font-medium min-w-[100px]">Total Amount</th>
          <th className="p-3 font-medium min-w-[100px]">Advance Status</th>
          <th className="p-3 font-medium min-w-[100px]">Deposit Status</th>
          <th className="p-3 font-medium min-w-[120px]">Booking Status</th>
          <th className="p-3 font-medium min-w-[80px]">Actions</th>
         </tr>
          </thead>
          <tbody>
            {filteredAndSortedBookings.map((booking)=>(
              <tr key={booking._id} className='border-t border-borderColor text-gray-500'>
                 <td className='p-3 flex items-center gap-3'>
                      <img src={booking.car?.image || '/placeholder-car.jpg'} alt="" className='h-12 w-12 aspect-square rounded-md object-cover'/>
                      <p className='font-medium max-md:hidden'>{booking.car ? `${booking.car.brand} ${booking.car.model}` : 'Car Deleted'}</p>
                 </td>
                                 {!compactView && (
                   <td className='p-3 max-md:hidden'>
                     {booking.pickupDate.split('T')[0]} to {booking.returnDate.split('T')[0]}
                   </td>
                 )}
                <td className='p-3'>
                  <div className='flex items-center gap-3 group relative'>
                    {booking.user?.image ? (
                      <img 
                        src={booking.user.image} 
                        alt={booking.user?.name || 'Customer'} 
                        className='h-8 w-8 rounded-full object-cover'
                      />
                    ) : (
                      <div className='h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center'>
                        <span className='text-xs text-gray-500 font-medium'>
                          {booking.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                      </div>
                    )}
                    <div className='flex flex-col'>
                      <span className='font-medium text-gray-700'>{booking.user?.name || 'Customer'}</span>
                      {booking.user?.email && (
                        <span className='text-xs text-gray-500'>{booking.user.email}</span>
                      )}
                      <span className='text-xs text-blue-600 font-medium'>
                        {bookings.filter(b => b.user?._id === booking.user?._id).length} booking{bookings.filter(b => b.user?._id === booking.user?._id).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {/* Quick Filter Button */}
                    <button 
                      onClick={() => setCustomerFilter(booking.user?._id || 'all')}
                      className='ml-2 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors'
                      title='View all bookings for this customer'
                    >
                      Filter
                    </button>
                    
                    {/* Customer Details Tooltip */}
                    <div className='absolute left-0 top-full mt-2 bg-white border border-borderColor rounded-lg shadow-lg p-3 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-48'>
                      <div className='flex items-center gap-3 mb-2'>
                        {booking.user?.image ? (
                          <img 
                            src={booking.user.image} 
                            alt={booking.user?.name || 'Customer'} 
                            className='h-12 w-12 rounded-full object-cover'
                          />
                        ) : (
                          <div className='h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center'>
                            <span className='text-sm text-gray-500 font-medium'>
                              {booking.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className='font-semibold text-gray-800'>{booking.user?.name || 'Customer'}</div>
                          <div className='text-sm text-gray-600'>{booking.user?.email || 'No email'}</div>
                        </div>
                      </div>
                      <div className='text-xs text-gray-500 space-y-1'>
                        <div>Customer ID: {booking.user?._id?.slice(-8) || 'N/A'}</div>
                        <div>Role: {booking.user?.role || 'user'}</div>
                        <div>Member since: {booking.user?.createdAt ? new Date(booking.user.createdAt).toLocaleDateString() : 'N/A'}</div>
                        <div className='border-t pt-1 mt-1'>
                          <div className='font-medium text-gray-700 mb-1'>Contact Info:</div>
                          <div>📧 {booking.user?.email || 'No email'}</div>
                          <div>📅 Total Bookings: {bookings.filter(b => b.user?._id === booking.user?._id).length}</div>
                          <div>💰 Total Spent: ${bookings.filter(b => b.user?._id === booking.user?._id).reduce((sum, b) => sum + (b.totalAmount || 0), 0)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                                 {!compactView && (
                   <td className='p-3 max-md:hidden'>
                     <div className='flex items-center gap-2'>
                       <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${booking.driverOption === 'with_driver' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                         {booking.driverOption === 'with_driver' ? '👨‍💼 With Driver' : '🚗 Without Driver'}
                       </span>
                       {booking.driverOption === 'with_driver' && (
                         <span className='text-xs text-blue-600 font-medium'>+{currency}50/day</span>
                       )}
                     </div>
                   </td>
                 )}
                 {!compactView && <td className='p-3'>{currency}{booking.price}</td>}
                 {!compactView && <td className='p-3'>{currency}{booking.safetyDeposit}</td>}
                 {!compactView && <td className='p-3'>{currency}{booking.tax || 10}</td>}
                 {!compactView && <td className='p-3'>{currency}{booking.advanceAmount || Math.round(booking.totalAmount * 0.1)}</td>}
                                 <td className='p-3 font-semibold text-primary'>
                   {currency}{booking.totalAmount}
                   {compactView && (
                     <div className='text-xs text-gray-500 mt-1'>
                       <div>📅 {booking.pickupDate.split('T')[0]} → {booking.returnDate.split('T')[0]}</div>
                       <div>🚗 {booking.driverOption === 'with_driver' ? 'With Driver' : 'Without Driver'}</div>
                       <div>💰 Rental: {currency}{booking.price} | Deposit: {currency}{booking.safetyDeposit}</div>
                     </div>
                   )}
                 </td>
                <td className='p-3'>
                  <select onChange={e=> updateAdvanceStatus(booking._id,e.target.value)} value={booking.advanceStatus || 'pending'} className='px-2 py-1.5 text-gray-500 border border-borderColor rounded-md outline-none text-xs'>
                    <option value='pending'>Pending</option>
                    <option value='paid'>Paid</option>
                    <option value='refunded'>Refunded</option>
                  </select>
                </td>
                <td className='p-3'>
                  <select onChange={e=> updateDepositStatus(booking._id,e.target.value)} value={booking.depositStatus || 'pending'} className='px-2 py-1.5 text-gray-500 border border-borderColor rounded-md outline-none text-xs'>
                    <option value='pending'>Pending</option>
                    <option value='paid'>Paid</option>
                    <option value='refunded'>Refunded</option>
                  </select>
                </td>
                                 <td className='p-3'>
                   {booking.status=== 'pending' ? (
                     <select onChange={e=> changeBookingStatus(booking._id,e.target.value)} value={booking.status} className='px-2 py-1.5 mt-1 text-gray-500 border border-borderColor rounded-md outline-none text-xs'>
                     <option value='pending'>Pending</option>
                     <option value='cancelled'>Cancelled</option>
                     <option value='confirmed'>Completed</option>
                     </select>
                   ): (
                     <div className='flex flex-col gap-1'>
                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status==='confirmed' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>{booking.status}</span>
                       {booking.status === 'confirmed' && (() => {
                         const pickupDate = new Date(booking.pickupDate);
                         const currentDate = new Date();
                         const hoursUntilPickup = (pickupDate - currentDate) / (1000 * 60 * 60);
                         return hoursUntilPickup >= 24 ? (
                           <span className='px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs'>
                             User can cancel
                           </span>
                         ) : null;
                       })()}
                     </div>
                   )}
                 </td>
                 <td className='p-3'>
                   {booking.status !== 'cancelled' && (
                     <button 
                       onClick={() => handleCancelByOwner(booking._id)}
                       className='px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors'
                     >
                       Cancel
                     </button>
                   )}
                 </td>
              </tr>
            ))}
          </tbody>
         </table>

      </div>

      {/* Mobile cards */}
      <div className='md:hidden max-w-6xl w-full mt-6 space-y-4'>
        {filteredAndSortedBookings.map(booking => (
          <div key={booking._id} className='border border-borderColor rounded-md p-4 text-gray-600'>
            <div className='flex items-center gap-3'>
              <img src={booking.car?.image || '/placeholder-car.jpg'} alt='' className='h-14 w-14 rounded-md object-cover'/>
              <div className='flex-1'>
                <p className='font-semibold'>{booking.car ? `${booking.car.brand} ${booking.car.model}` : 'Car Deleted'}</p>
                <div className='flex items-center gap-2 mt-1'>
                  {booking.user?.image ? (
                    <img 
                      src={booking.user.image} 
                      alt={booking.user?.name || 'Customer'} 
                      className='h-6 w-6 rounded-full object-cover'
                    />
                  ) : (
                    <div className='h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center'>
                      <span className='text-[10px] text-gray-500 font-medium'>
                        {booking.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                  )}
                  <div className='flex flex-col'>
                    <p className='text-xs font-medium text-gray-700'>{booking.user?.name || 'Customer'}</p>
                    {booking.user?.email && (
                      <p className='text-[10px] text-gray-500'>{booking.user.email}</p>
                    )}
                  </div>
                </div>
                <p className='text-xs mt-1 text-gray-500'>
                  {booking.pickupDate.split('T')[0]} → {booking.returnDate.split('T')[0]}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${booking.status==='confirmed' ? 'bg-green-100 text-green-600' : booking.status==='cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{booking.status}</span>
            </div>

            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <span className={`px-2 py-1 rounded text-[10px] ${booking.driverOption === 'with_driver' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                {booking.driverOption === 'with_driver' ? 'With Driver' : 'Without Driver'}
              </span>
              <span className='text-[11px] text-gray-500'>Total: <span className='text-primary font-semibold'>{currency}{booking.totalAmount}</span></span>
            </div>

            <div className='mt-3 grid grid-cols-2 gap-2'>
              <div className='text-xs'>Rental: {currency}{booking.price}</div>
              <div className='text-xs'>Deposit: {currency}{booking.safetyDeposit}</div>
              <div className='text-xs'>Tax: {currency}{booking.tax || 10}</div>
              <div className='text-xs'>Advance: {currency}{booking.advanceAmount || Math.round(booking.totalAmount * 0.1)}</div>
            </div>

            <div className='mt-3 grid grid-cols-2 gap-2 items-center'>
              <select onChange={e=> updateAdvanceStatus(booking._id,e.target.value)} value={booking.advanceStatus || 'pending'} className='px-2 py-1.5 text-gray-500 border border-borderColor rounded-md outline-none text-xs'>
                <option value='pending'>Advance: Pending</option>
                <option value='paid'>Advance: Paid</option>
                <option value='refunded'>Advance: Refunded</option>
              </select>
              <select onChange={e=> updateDepositStatus(booking._id,e.target.value)} value={booking.depositStatus || 'pending'} className='px-2 py-1.5 text-gray-500 border border-borderColor rounded-md outline-none text-xs'>
                <option value='pending'>Deposit: Pending</option>
                <option value='paid'>Deposit: Paid</option>
                <option value='refunded'>Deposit: Refunded</option>
              </select>
              {booking.status=== 'pending' ? (
                <select onChange={e=> changeBookingStatus(booking._id,e.target.value)} value={booking.status} className='px-2 py-1.5 text-gray-500 border border-borderColor rounded-md outline-none text-xs'>
                  <option value='pending'>Set: Pending</option>
                  <option value='cancelled'>Set: Cancelled</option>
                  <option value='confirmed'>Set: Completed</option>
                </select>
              ) : (
                <div className='text-[11px] text-gray-500'>
                  Status locked
                </div>
              )}
              {booking.status !== 'cancelled' && (
                <button onClick={() => handleCancelByOwner(booking._id)} className='px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors'>
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  )}

export default ManageBookings
