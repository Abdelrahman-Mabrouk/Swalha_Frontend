import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp, Filter, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/apiService'
import toast from 'react-hot-toast'
import SearchableStudentDropdown from '../components/SearchableStudentDropdown'

const Revenues = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  
  // Basic states
  const [revenues, setRevenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [monthlyFee, setMonthlyFee] = useState(70.00)

  // Payment specific states
  const [paymentDay, setPaymentDay] = useState('')
  const [paymentMonth, setPaymentMonth] = useState('')
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear())

  // Filter states
  const [filters, setFilters] = useState({
    category: [],
    amountRange: {
      min: '',
      max: ''
    },
    dateRange: {
      start: '',
      end: ''
    }
  })
  const [showFilters, setShowFilters] = useState(false)

  // Form data state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    notes: ''
  })

  // Category options with translations
  const categoryOptions = [
    { value: 'Tuition_Fees', label: t('revenues.category.tuitionFees') },
    { value: 'DONATION', label: t('revenues.category.donation') },
    { value: 'BOOKS', label: t('revenues.category.books') },
    { value: 'DOCUMENTS', label: t('revenues.category.documents') },
    { value: 'VODAFONE_CASH', label: t('revenues.category.vodafoneCash') },
    { value: 'OTHER', label: t('revenues.category.other') }
  ]

  // Function to get translated category name
  const getCategoryTranslation = (categoryValue) => {
    const category = categoryOptions.find(opt => opt.value === categoryValue)
    return category ? category.label : categoryValue
  }

  useEffect(() => {
    fetchRevenues()
    fetchMonthlyFee()
    checkForPrefillData()
  }, [])

  // Enhanced filtering logic with useMemo (matching expenses component)
  const filteredRevenues = useMemo(() => {
    let filtered = revenues

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(revenue => {
        const name = (revenue.name || '').toLowerCase()
        const category = (revenue.category || '').toLowerCase()
        const notes = (revenue.notes || '').toLowerCase()
        
        return name.includes(searchLower) ||
               category.includes(searchLower) ||
               notes.includes(searchLower)
      })
    }

    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(revenue => 
        filters.category.includes(revenue.category)
      )
    }

    // Apply amount range filter
    if (filters.amountRange.min || filters.amountRange.max) {
      filtered = filtered.filter(revenue => {
        const amount = revenue.amount || 0
        const minAmount = filters.amountRange.min ? parseFloat(filters.amountRange.min) : 0
        const maxAmount = filters.amountRange.max ? parseFloat(filters.amountRange.max) : Infinity
        
        return amount >= minAmount && amount <= maxAmount
      })
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(revenue => {
        if (!revenue.month) return false
        
        const startDate = filters.dateRange.start
        const endDate = filters.dateRange.end
        const revenueDate = new Date(revenue.month)
        
        if (startDate && new Date(startDate) > revenueDate) return false
        if (endDate && new Date(endDate) < revenueDate) return false
        
        return true
      })
    }

    return filtered
  }, [revenues, searchTerm, filters])

  // Helper functions
  const clearFilters = () => {
    setFilters({
      category: [],
      amountRange: {
        min: '',
        max: ''
      },
      dateRange: {
        start: '',
        end: ''
      }
    })
  }

  const hasActiveFilters = () => {
    return filters.category.length > 0 || 
           filters.amountRange.min || 
           filters.amountRange.max || 
           filters.dateRange.start || 
           filters.dateRange.end
  }

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month - 1] || month
  }

  // API calls and data handling
  const fetchRevenues = async () => {
    try {
      setLoading(true)
      const data = await apiService.getRevenues()
      setRevenues(data)
    } catch (error) {
      toast.error(t('revenues.messages.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyFee = async () => {
    try {
      const fee = await apiService.getMonthlyFee()
      setMonthlyFee(fee)
    } catch (error) {
      console.error('Failed to fetch monthly fee:', error)
    }
  }

  const checkForPrefillData = () => {
    try {
      const prefillData = sessionStorage.getItem('revenuePrefillData')
      if (prefillData) {
        const data = JSON.parse(prefillData)
        setFormData(prev => ({
          ...prev,
          description: `Tuition Fee - ${data.studentName}`,
          amount: data.amount.toFixed(2),
          category: data.category,
          date: new Date().toISOString().split('T')[0],
          notes: `Payment for ${data.month}/${data.year}`
        }))
        
        setSelectedStudent({
          id: data.studentId,
          name: data.studentName
        })
        setPaymentMonth(data.month.toString())
        setPaymentYear(data.year)
        setPaymentDay(data.day)
        
        setShowModal(true)
        sessionStorage.removeItem('revenuePrefillData')
        toast.success(`Form pre-filled for ${data.studentName} - ${getMonthName(data.month)} ${data.year}`)
      }
    } catch (error) {
      console.error('Error processing prefill data:', error)
    }
  }

  // Form handling
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validCategories = ['Tuition_Fees', 'DONATION', 'BOOKS', 'DOCUMENTS', 'VODAFONE_CASH', 'OTHER']
    if (!validCategories.includes(formData.category)) {
      toast.error('Please select a valid category')
      return
    }
    
    try {
      if (formData.category === 'Tuition_Fees' && selectedStudent) {
        await handleTuitionPayment()
      } else {
        const revenueData = {
          name: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          month: formData.date,
          notes: formData.notes
        }
        
        if (editingRevenue) {
          await apiService.updateRevenue(editingRevenue.id, revenueData)
          toast.success(t('revenues.messages.updateSuccess'))
        } else {
          await apiService.createRevenue(revenueData)
          toast.success(t('revenues.messages.createSuccess'))
        }
      }
      
      setShowModal(false)
      setEditingRevenue(null)
      resetForm()
      fetchRevenues()
    } catch (error) {
      console.error('Revenue operation error:', error)
      toast.error(error.response?.data?.message || error.message || t('revenues.messages.operationFailed'))
    }
  }

  const handleTuitionPayment = async () => {
    if (!selectedStudent || !paymentMonth || !paymentYear || !formData.amount) {
      toast.error('Please fill in all required fields for tuition payment')
      return
    }

    try {
      const paymentData = {
        studentId: selectedStudent.id,
        month: parseInt(paymentMonth),
        year: parseInt(paymentYear),
        day: paymentDay || new Date().getDate(),
        amountPaid: parseFloat(formData.amount)
      }

      await apiService.addPayment(paymentData)
      
      const revenueData = {
        name: `Tuition Fee - ${selectedStudent.name}`,
        amount: parseFloat(formData.amount),
        category: 'Tuition_Fees',
        month: formData.date,
        notes: `Payment for ${paymentMonth}/${paymentYear}`
      }
      
      await apiService.createRevenue(revenueData)
      toast.success('Tuition payment processed successfully')
    } catch (error) {
      console.error('Error processing tuition payment:', error)
      throw error
    }
  }

  const handleEdit = (revenue) => {
    setEditingRevenue(revenue)
    setFormData({
      description: revenue.name || '',
      amount: revenue.amount || '',
      category: revenue.category || '',
      date: revenue.month || '',
      notes: revenue.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('revenues.messages.deleteConfirm'))) {
      try {
        await apiService.deleteRevenue(id)
        toast.success(t('revenues.messages.deleteSuccess'))
        fetchRevenues()
      } catch (error) {
        toast.error(t('revenues.messages.deleteError'))
      }
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: '',
      date: '',
      notes: ''
    })
    setSelectedStudent(null)
    setPaymentMonth('')
    setPaymentYear(new Date().getFullYear())
  }

  const handleCategoryChange = (category) => {
    setFormData({...formData, category})
    if (category === 'Tuition_Fees') {
      const fee = typeof monthlyFee === 'number' ? monthlyFee : 70.00;
      setFormData(prev => ({...prev, amount: fee.toFixed(2)}))
    }
  }

  // Calculate totals like expenses component
  const totalRevenues = filteredRevenues.reduce((sum, rev) => sum + (rev.amount || 0), 0)
  const totalFilteredCount = filteredRevenues.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 ml-4">{t('revenues.title')}</h1>
          <p className="text-gray-600 ml-4">{t('revenues.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={`mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {t('revenues.addRevenue')}
                    <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />

        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('summary.totalRevenues')}</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenues.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('summary.filteredCount')}</p>
              <p className="text-2xl font-bold text-blue-600 ">&nbsp;&nbsp;{totalFilteredCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('summary.averageRevenue')}</p>
              <p className="text-2xl font-bold text-purple-600">
                ${totalFilteredCount > 0 ? (totalRevenues / totalFilteredCount).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5`} />
          <input
            type="text"
            placeholder={t('revenues.search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          />
        </div>
        
        {/* Search Results Counter */}
        {searchTerm && (
          <div className="text-sm text-gray-600">
            {t('revenues.search.found', { 
              count: filteredRevenues.length,
              total: revenues.length !== filteredRevenues.length ? revenues.length : null
            })}
          </div>
        )}

        {/* Filter Toggle and Active Filters */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Filter className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('revenues.filters.title')}
            {hasActiveFilters() && (
              <span className={`${isRTL ? 'mr-2' : 'ml-2'} inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full`}>
                {filters.category.length + 
                 (filters.amountRange.min ? 1 : 0) + 
                 (filters.amountRange.max ? 1 : 0) + 
                 (filters.dateRange.start ? 1 : 0) + 
                 (filters.dateRange.end ? 1 : 0)}
              </span>
            )}
          </button>
          
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <X className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('revenues.filters.clearAll')}
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('revenues.filters.category')}</label>
                <div className="space-y-2">
                  {categoryOptions.map(category => (
                    <label key={category.value} className={`flex items-center ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <input
                        type="checkbox"
                        checked={filters.category.includes(category.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, category: [...prev.category, category.value] }))
                          } else {
                            setFilters(prev => ({ ...prev, category: prev.category.filter(c => c !== category.value) }))
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amount Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('revenues.filters.amountRange')}</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder={t('revenues.filters.minAmount')}
                    value={filters.amountRange.min}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, min: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder={t('revenues.filters.maxAmount')}
                    value={filters.amountRange.max}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, max: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('revenues.filters.dateRange')}</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenues Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('revenues.table.description')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('revenues.table.category')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('revenues.table.amount')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('revenues.table.date')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-left' : 'text-right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('revenues.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRevenues.map((revenue) => (
                <tr key={revenue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <div className="text-sm font-medium text-gray-900">{revenue.name}</div>
                        <div className="text-sm text-gray-500">{revenue.notes}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      revenue.category === 'Tuition_Fees' ? 'bg-blue-100 text-blue-800' :
                      revenue.category === 'DONATION' ? 'bg-yellow-100 text-yellow-800' :
                      revenue.category === 'BOOKS' ? 'bg-green-100 text-green-800' :
                      revenue.category === 'DOCUMENTS' ? 'bg-purple-100 text-purple-800' :
                      revenue.category === 'VODAFONE_CASH' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getCategoryTranslation(revenue.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ${revenue.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {revenue.month}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'} text-sm font-medium`}>
                    <div className={`flex items-center ${isRTL ? 'justify-start' : 'justify-end'} space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                      <button
                        onClick={() => handleEdit(revenue)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title={t('revenues.actions.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(revenue.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title={t('revenues.actions.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredRevenues.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <DollarSign className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('revenues.empty.title')}</h3>
          <p className="text-gray-500 mb-4">
            {hasActiveFilters() || searchTerm ? t('revenues.empty.filtered') : t('revenues.empty.noRevenues')}
          </p>
          {!searchTerm && !hasActiveFilters() && (
            <button
              onClick={() => setShowModal(true)}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('revenues.empty.addFirst')}
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="mt-3">
              <h3 className={`text-lg font-medium text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {editingRevenue ? t('revenues.editRevenue') : t('revenues.addNewRevenue')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields */}
                <div>
                  <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('common.description')}
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('common.amount')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('common.category')}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      required
                    >
                      <option value="">{t('revenues.selectCategory')}</option>
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.category === 'Tuition_Fees' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className={`font-medium text-blue-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('revenues.tuitionPaymentDetails')}
                    </h4>
                    
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('common.student')}
                      </label>
                      <SearchableStudentDropdown
                        value={selectedStudent}
                        onChange={setSelectedStudent}
                        placeholder={t('revenues.selectStudent')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t('revenues.paymentMonth')}
                        </label>
                        <select
                          value={paymentMonth}
                          onChange={(e) => setPaymentMonth(e.target.value)}
                          className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          required={formData.category === 'Tuition_Fees'}
                        >
                          <option value="">{t('revenues.selectMonth')}</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {getMonthName(i + 1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t('revenues.paymentYear')}
                        </label>
                        <input
                          type="number"
                          value={paymentYear}
                          onChange={(e) => setPaymentYear(e.target.value)}
                          className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          required={formData.category === 'Tuition_Fees'}
                          min="2020"
                          max="2030"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('common.date')}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('common.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className={`flex ${isRTL ? 'flex-row-reverse justify-start space-x-reverse space-x-3' : 'justify-end space-x-3'} pt-4`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingRevenue(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    {editingRevenue ? t('common.update') : t('common.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Revenues