import React, { useState, useEffect } from 'react'
import { Settings, DollarSign, Save, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { apiService } from '../services/apiService'
import toast from 'react-hot-toast'

const AdminSettings = () => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  
  const [monthlyFee, setMonthlyFee] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    fetchMonthlyFee()
  }, [])

  const fetchMonthlyFee = async () => {
    try {
      setLoading(true)
      const fee = await apiService.getMonthlyFee()
      setMonthlyFee(fee || [])
      console.log('Monthly Fee:', fee)

    } catch (error) {
      console.error('Failed to fetch monthly fee:', error)
      toast.error(t('adminSettings.messages.loadError'))
    } finally {
      setLoading(false)
    }
  }

// Update the handleSave function
const handleSave = async () => {
  // Validate monthly fee
  const feeAmount = parseFloat(monthlyFee)
  if (!monthlyFee || isNaN(feeAmount) || feeAmount <= 0) {
    toast.error(t('adminSettings.messages.validationError'))
    return
  }
    if (!effectiveDate) {
    alert("من فضلك اختر التاريخ"); // أو تقدر تستخدم Toast
    return;
  }

  try {
    setSaving(true)
    const payload = {
      settingValue: feeAmount.toFixed(2), // Convert to string with 2 decimal places
      description: `Monthly fee amount set to ${feeAmount.toFixed(2)} EGP effective from ${effectiveDate}`,
      month : parseInt(effectiveDate.split('-')[1], 10), // Extract month from effectiveDate
      year : parseInt(effectiveDate.split('-')[0], 10), // Extract year,
    };
    
    
    console.log('Sending payload:', payload) // Debug log
    await apiService.updateMonthlyFee(payload)
  
    toast.success(t('adminSettings.messages.updateSuccess'))
  } catch (error) {
    console.error('Failed to update monthly fee:', error)
    toast.error(error.response?.data?.message || t('adminSettings.messages.updateError'))
  } finally {
    setSaving(false)
  }
}

  const handleReset = () => {
    fetchMonthlyFee()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('adminSettings.title')}</h1>
          <p className="text-gray-600">{t('adminSettings.subtitle')}</p>
        </div>
      </div>

{/* Monthly Fee Setting */}
<div className="space-y-4">
  <div className="max-w-md">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {t('adminSettings.monthlyFee.title')}
    </label>
    
    <div className="space-y-3">
      
      <input
        type="number"
        step="0.01"
        min="0"
        value={monthlyFee.length > 0 ? monthlyFee[monthlyFee.length - 1].settingValue : ''}
        onChange={(e) => {
          const value = e.target.value
          // Only allow positive numbers with up to 2 decimal places
          if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
            setMonthlyFee(value)
          }
        }}
        
        onBlur={(e) => {
          // Format the number on blur
          const value = parseFloat(e.target.value)
          if (!isNaN(value) && value > 0) {
            setMonthlyFee(value.toFixed(2))
          }
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={t('adminSettings.monthlyFee.placeholder')}
        required
      />
      
      <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('adminSettings.monthlyFee.effectiveFrom')}
          </label>
          <input
            type="month"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-2 pt-6`}>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {saving ? (
              <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
            ) : (
              <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            )}
            {saving ? t('adminSettings.monthlyFee.saving') : t('adminSettings.monthlyFee.save')}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title={t('adminSettings.monthlyFee.reset')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <p className="mt-2 text-sm text-gray-500">
      {t('adminSettings.monthlyFee.currentSetting', { date: effectiveDate })}
    </p>
   </div>
  </div>

      {/* Additional Settings Placeholder */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-lg bg-gray-100">
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
            <h3 className="text-lg font-medium text-gray-900">{t('adminSettings.additionalSettings.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('adminSettings.additionalSettings.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings