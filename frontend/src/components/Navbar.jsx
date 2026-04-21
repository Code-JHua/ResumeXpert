import React from 'react'
import { Link } from 'react-router-dom'
import { LayoutTemplate } from 'lucide-react'
import { ProfileInfoCard } from '../components/Cards.jsx';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector.jsx';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext.jsx';
import CareerNav from './CareerNav.jsx';

const Navbar = () => {
  const { t } = useTranslation();
  const { user } = useContext(UserContext);
  return (
    <div className='fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-violet-100/50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center'>
        <Link to='/' className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200'>
            <LayoutTemplate className='w-5 h-5 text-white'></LayoutTemplate>
          </div>

          <span className='text-xl sm:text-2xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent'> {t('navbar.appName')}</span>
        </Link>
        {user && <CareerNav />}
        <div className='flex items-center gap-3 self-end lg:self-auto'>
          <LanguageSelector />
          {user && <ProfileInfoCard />}
        </div>
      </div>
    </div>
  )
}

export default Navbar
