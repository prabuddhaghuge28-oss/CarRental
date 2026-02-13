import React from 'react'

const CancellationPolicy = () => {
  return (
    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
      <div className='flex items-start gap-3'>
        <div className='text-blue-600 text-lg'>ℹ️</div>
        <div>
          <h3 className='text-blue-800 font-medium text-sm mb-1'>Cancellation Policy</h3>
          <ul className='text-blue-700 text-xs space-y-1'>
            <li>• <strong>Pending bookings:</strong> Can be cancelled at any time</li>
            <li>• <strong>Confirmed bookings:</strong> Can be cancelled up to 24 hours before pickup time</li>
            <li>• Cancellations within 24 hours of pickup require support assistance</li>
            <li>• Refunds will be processed according to your payment method</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CancellationPolicy
