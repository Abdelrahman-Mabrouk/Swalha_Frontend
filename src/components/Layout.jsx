import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import {
  Menu,
  X,
  Home,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout, user } = useAuth()
  const { isRTL } = useLanguage()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const hideSidebarPaths = ['']
  const shouldHideSidebar = hideSidebarPaths.some(path =>
    location.pathname === path || location.pathname.includes(path)
  )

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: Home, color: 'blue' },
    { name: t('navigation.students'), href: '/students', icon: Users, color: 'green' },
    { name: t('navigation.revenues'), href: '/revenues', icon: DollarSign, color: 'emerald' },
    { name: t('navigation.expenses'), href: '/expenses', icon: TrendingUp, color: 'red' },
    { name: t('navigation.reports'), href: '/reports', icon: BarChart3, color: 'purple' },
    { name: t('navigation.adminSettings'), href: '/admin-settings', icon: Settings, color: 'gray' },
    { name: t('navigation.enrollment'), href: '/enrollment', icon: Users, color: 'indigo' },
    { name: t('navigation.studentsList'), href: '/students-list', icon: Users, color: 'yellow' }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (href) => location.pathname === href

  const getColorClasses = (color, active) => {
const colors = {
  blue: active ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700',
  green: active ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-green-50 hover:text-green-700',
  emerald: active ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700',
  red: active ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-red-50 hover:text-red-700',
  purple: active ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700',
  gray: active ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700',
  indigo: active ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700',
  amber: active ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700',
  yellow: active ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md' : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
}

    return colors[color] || colors.blue
  }

  const SidebarContent = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'bg-white' : 'bg-white border-r border-gray-200'} `}>
      <div className={`flex h-16 items-center px-6 ${mobile ? 'justify-between' : 'justify-center'} relative`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md ${isRTL ? 'ml-3' : 'mr-3'}`}>
            <Home className="h-5 w-5 text-white" />
          </div> &nbsp;
          
          <h1 className={`text-xl font-bold ${mobile ? 'text-gray-900' : 'text-black '}`}>
            {t('system.swalhaSystem')}
          </h1>
          
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-3 mb-4">
          {t('system.mainmenu')}
        </div>
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={mobile ? () => setSidebarOpen(false) : undefined}
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${getColorClasses(item.color, active)}`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${active ? 'bg-white/20' : 'bg-gray-100'} ${isRTL ? 'ml-3' : 'mr-3'}`}>
                <item.icon className={`h-5 w-5 ${active ? 'text-white' : `text-${item.color}-600`}`} />
              </div>
              <span className="flex-1 text-right">{item.name}</span>
              {active && (
                <div className={`${isRTL ? 'mr-2' : 'ml-2'}`}>
                  {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''} p-3 rounded-xl bg-gray-50`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-gray-900 text-right">
              {user?.username || t('system.administrator')}
            </p>
            <p className="text-xs truncate text-gray-500 text-right">
              {user?.role || t('system.systemAdmin')}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className={`w-full mt-3 flex items-center justify-center space-x-2 ${isRTL ? 'space-x-reverse' : ''} px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700`}
        >
          <LogOut className="h-4 w-4" />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
     
          {/* Mobile sidebar (overlay) */}
          <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} flex w-72 flex-col shadow-2xl`}>
              <SidebarContent mobile={true} />
            </div>
          </div>

          {/* Desktop sidebar (slides in/out) */}
          <div
            className={`hidden lg:flex lg:fixed lg:inset-y-0 ${isRTL ? 'lg:right-0' : 'lg:left-0'} lg:w-72 lg:flex-col shadow-2xl transform transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')
            }`}
          >
            <SidebarContent />
       </div>
   
      {/* Main content */}
      <div className={ (sidebarOpen ? `${isRTL ? 'lg:pr-72' : 'lg:pl-72'}` : '')}>
        
          <div className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:px-6 lg:px-8 relative">
            {/* 3 lines button (right when Arabic) */}
            <button
              type="button"
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} p-2.5 text-gray-700 hover:text-gray-900 rounded-md`}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* spacer to keep content centered when button is absolute */}
            <div className="flex-1" />

            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              <LanguageSwitcher />
              <div className="relative">
                <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user?.username || t('system.administrator')}</p>
                    <p className="text-xs text-gray-500">{user?.role || t('system.systemAdmin')}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:block">{t('common.logout')}</span>
              </button>
            </div>
          </div>

        {/* Page content */}
        <main className={shouldHideSidebar ? 'min-h-screen' : 'py-6'}>
          <div className={shouldHideSidebar ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
