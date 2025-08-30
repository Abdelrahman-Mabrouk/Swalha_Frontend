import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit, Trash2, TrendingDown, DollarSign, Filter, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { apiService } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const currentUser = JSON.parse(localStorage.getItem("user"));

const Expenses = () => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  
  const [expenses, setExpenses] = useState([])
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  
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
    },
    signature: []
  })
  const [showFilters, setShowFilters] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    date: '',
    notes: '',
    signature: currentUser?.username || 'عبدالعزيز'
  })

  useEffect(() => {
    fetchExpenses()    
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const data = await apiService.getExpenses()
      setExpenses(data)
    } catch (error) {
      toast.error(t('expenses.messages.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        category: formData.category,
        createdAt: formData.date,
        notes: formData.notes,
        signature: user?.username || user?.name || "Unknown"
      }
      if (editingExpense) {
        await apiService.updateExpense(editingExpense.id, payload)
        toast.success(t('expenses.messages.updateSuccess'))
      } else {
        await apiService.createExpense(payload)
        toast.success(t('expenses.messages.createSuccess'))
      }
      setShowModal(false)
      setEditingExpense(null)
      resetForm()
      fetchExpenses()
    } catch (error) {
      toast.error(error.message || t('expenses.messages.operationFailed'))
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      name: expense.name || '',
      amount: expense.amount || '',
      category: expense.category || '',
      date: expense.createdAt || '',
      notes: expense.notes || '',
      signature: expense.signature || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('expenses.messages.deleteConfirm'))) {
      try {
        await apiService.deleteExpense(id)
        toast.success(t('expenses.messages.deleteSuccess'))
        fetchExpenses()
      } catch (error) {
        toast.error(t('expenses.messages.deleteError'))
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      date: '',
      notes: '',
      signature: currentUser?.username || 'عبدالعزيز'
    })
  }

  // Enhanced filtering logic with useMemo
  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(expense => {
        const name = (expense.name || '').toLowerCase()
        const category = (expense.category || '').toLowerCase()
        const notes = (expense.notes || '').toLowerCase()
        const signature = (expense.signature || '').toLowerCase()
        
        return name.includes(searchLower) ||
               category.includes(searchLower) ||
               notes.includes(searchLower) ||
               signature.includes(searchLower)
      })
    }

    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(expense => 
        filters.category.includes(expense.category)
      )
    }

    // Apply amount range filter
    if (filters.amountRange.min || filters.amountRange.max) {
      filtered = filtered.filter(expense => {
        const amount = expense.amount || 0
        const minAmount = filters.amountRange.min ? parseFloat(filters.amountRange.min) : 0
        const maxAmount = filters.amountRange.max ? parseFloat(filters.amountRange.max) : Infinity
        
        return amount >= minAmount && amount <= maxAmount
      })
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(expense => {
        if (!expense.createdAt) return false
        
        const startDate = filters.dateRange.start
        const endDate = filters.dateRange.end
        const expenseDate = new Date(expense.createdAt)
        
        if (startDate && new Date(startDate) > expenseDate) return false
        if (endDate && new Date(endDate) < expenseDate) return false
        
        return true
      })
    }

    // Apply signature filter
    if (filters.signature.length > 0) {
      filtered = filtered.filter(expense => 
        filters.signature.includes(expense.signature)
      )
    }

    return filtered
  }, [expenses, searchTerm, filters])

  // Filter options
  const categoryOptions = [
    { value: 'SALARIES', label: t('expenses.categories.salaries') },
    { value: 'LOANS', label: t('expenses.categories.loans') },
    { value: 'PACKAGES', label: t('expenses.categories.packages') },
    { value: 'MAINTENANCE', label: t('expenses.categories.maintenance') },
    { value: 'OTHER', label: t('expenses.categories.other') }
  ]

  // Get unique signatures from expenses
  const uniqueSignatures = [...new Set(expenses.map(expense => expense.signature).filter(Boolean))]

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
      },
      signature: []
    })
  }

  const hasActiveFilters = () => {
    return filters.category.length > 0 || 
           filters.amountRange.min || 
           filters.amountRange.max || 
           filters.dateRange.start || 
           filters.dateRange.end ||
           filters.signature.length > 0
  }

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const totalFilteredCount = filteredExpenses.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-6 ml-4">{t('expenses.title')}</h1>
          <p className="text-gray-600 ml-4">{t('expenses.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={`mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {t('expenses.addExpense')}
                    <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />

        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('expenses.summary.totalExpenses')}</p>
              <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('expenses.summary.filteredCount')}</p>
              <p className="text-2xl font-bold text-blue-600">{totalFilteredCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('expenses.summary.averageExpense')}</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalFilteredCount > 0 ? (totalExpenses / totalFilteredCount).toLocaleString() : '0'}
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
            placeholder={t('expenses.search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
          />
        </div>
        
        {/* Search Results Counter */}
        {searchTerm && (
          <div className="text-sm text-gray-600">
            {t('expenses.search.found', { 
              count: filteredExpenses.length,
              total: expenses.length !== filteredExpenses.length ? expenses.length : null
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
            {t('expenses.filters.title')}
            {hasActiveFilters() && (
              <span className={`${isRTL ? 'mr-2' : 'ml-2'} inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full`}>
                {filters.category.length + 
                 (filters.amountRange.min ? 1 : 0) + 
                 (filters.amountRange.max ? 1 : 0) + 
                 (filters.dateRange.start ? 1 : 0) + 
                 (filters.dateRange.end ? 1 : 0) +
                 filters.signature.length}
              </span>
            )}
          </button>
          
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <X className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('expenses.filters.clearAll')}
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.filters.category')}</label>
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
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amount Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.filters.amountRange')}</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder={t('expenses.filters.minAmount')}
                    value={filters.amountRange.min}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, min: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder={t('expenses.filters.maxAmount')}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.filters.dateRange')}</label>
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

              {/* Signature Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.filters.createdBy')}</label>
                <div className="space-y-2">
                  {uniqueSignatures.map(signature => (
                    <label key={signature} className={`flex items-center ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <input
                        type="checkbox"
                        checked={filters.signature.includes(signature)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, signature: [...prev.signature, signature] }))
                          } else {
                            setFilters(prev => ({ ...prev, signature: prev.signature.filter(s => s !== signature) }))
                          }
                        }}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>{signature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('expenses.table.description')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('expenses.table.category')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('expenses.table.amount')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('expenses.table.date')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('expenses.table.createdBy')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-left' : 'text-right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('expenses.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-red-600" />
                      </div>
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <div className="text-sm font-medium text-gray-900">{expense.name}</div>
                        <div className="text-sm text-gray-500">{expense.notes}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      expense.category === 'SALARIES' ? 'bg-blue-100 text-blue-800' :
                      expense.category === 'LOANS' ? 'bg-yellow-100 text-yellow-800' :
                      expense.category === 'PACKAGES' ? 'bg-green-100 text-green-800' :
                      expense.category === 'MAINTENANCE' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {t(`expenses.categories.${expense.category.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    ${expense.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      {expense.signature}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'} text-sm font-medium`}>
                    <div className={`flex items-center ${isRTL ? 'justify-start' : 'justify-end'} space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title={t('expenses.actions.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title={t('expenses.actions.delete')}
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
      {filteredExpenses.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <DollarSign className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('expenses.empty.title')}</h3>
          <p className="text-gray-500 mb-4">
            {hasActiveFilters() || searchTerm ? t('expenses.empty.filtered') : t('expenses.empty.noExpenses')}
          </p>
          {!searchTerm && !hasActiveFilters() && (
            <button
              onClick={() => setShowModal(true)}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('expenses.empty.addFirst')}
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingExpense ? t('expenses.modal.editTitle') : t('expenses.modal.addTitle')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('expenses.form.description')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('expenses.form.amount')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('expenses.form.category')}</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                    >
                      <option value="">{t('expenses.form.selectCategory')}</option>
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <input
                  type="hidden"
                  value={formData.signature}
                  onChange={(e) => setFormData({...formData, signature: e.target.value})}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('expenses.form.date')}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('expenses.form.notes')}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} space-x-3 ${isRTL ? 'space-x-reverse' : ''} pt-4`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingExpense(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('expenses.form.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    {editingExpense ? t('expenses.form.update') : t('expenses.form.create')}
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

export default Expenses