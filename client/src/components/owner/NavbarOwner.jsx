import React from 'react'
import { assets} from '../../assets/assets'
import { Link } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
function NavbarOwner() {
    const {user}= useAppContext()
  return (
    <div className='flex items-center justify-between px-6 md:px-10 py-4 text-gray-500 border-b border-borderColor relative transition-all overflow-hidden'>
      <Link to='/'>
         <img src={assets.logo} alt="" className='h-7 flex-shrink-0'/>
      </Link>
      <p className='text-sm sm:text-base truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] ml-4'>
        Welcome, {user?.name || "Owner"}
      </p>
    </div>
  )
}

export default NavbarOwner
