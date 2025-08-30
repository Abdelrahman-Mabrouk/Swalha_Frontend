import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Download, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/apiService'
import i18n from '../i18n'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,Legend  } from 'recharts'
import toast from 'react-hot-toast'

const Reports = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [revenues, setRevenues] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [monthlyFee, setMonthlyFee] = useState([])

  useEffect(() => {
    fetchData()
  }, [dateRange, selectedYear, selectedMonth])
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
  const textAlign = i18n.language === 'ar' ? 'right' : 'left'

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching report data...')
      
      const [revenuesData, expensesData,monthlyFeeData] = await Promise.all([
        apiService.getRevenues(),
        apiService.getExpenses(),
        apiService.getMonthlyFee(),

      ])
      
      console.log('Revenues data:', revenuesData)
      console.log('Expenses data:', expensesData)
      
      // Handle different possible response structures
      const revenuesArray = revenuesData?.data || revenuesData || []
      const expensesArray = expensesData?.data || expensesData || []
      
      console.log('Processed revenues:', revenuesArray)
      console.log('Processed expenses:', expensesArray)
      
      setRevenues(revenuesArray)
      setExpenses(expensesArray)
      setMonthlyFee(monthlyFeeData)

    } catch (error) {
      console.error('Error fetching report data:', error)
      setError(error.message || t('common.error'))
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    const currentDate = new Date()
    let startDate, endDate

    if (dateRange === 'month') {
      startDate = new Date(selectedYear, selectedMonth - 1, 1)
      endDate = new Date(selectedYear, selectedMonth, 0)
    } else if (dateRange === 'quarter') {
      const quarter = Math.ceil(selectedMonth / 3)
      startDate = new Date(selectedYear, (quarter - 1) * 3, 1)
      endDate = new Date(selectedYear, quarter * 3, 0)
    } else if (dateRange === 'year') {
      startDate = new Date(selectedYear, 0, 1)
      endDate = new Date(selectedYear, 11, 31)
    } else if (dateRange === 'all') {
      // Show all data - no date filtering
      startDate = null
      endDate = null
    }

    console.log('Filtering data for date range:', { startDate, endDate, dateRange, selectedYear, selectedMonth })

    const filteredRevenues = revenues.filter(revenue => {
      // If showing all data, don't filter by date
      if (dateRange === 'all') {
        return true
      }
      
      // Check what fields are available in revenue data
      console.log('Revenue object fields:', Object.keys(revenue))
      console.log('Revenue data:', revenue)
      
      // Try different possible date fields
      let revenueDate = null
      
      // First priority: if month field exists (ISO date format like "2025-08-14")
      if (revenue.month && revenue.month !== '') {
        // Try ISO date format like "2025-08-14"
        revenueDate = new Date(revenue.month)
      } 
      // Second priority: if date field exists and is not empty
      else if (revenue.date && revenue.date !== '') {
        revenueDate = new Date(revenue.date)
      } 
      // Third priority: if createdAt field exists
      else if (revenue.createdAt && revenue.createdAt !== '') {
        revenueDate = new Date(revenue.createdAt)
      }
      // Fourth priority: use current date as fallback for empty date fields
      else {
        console.warn('Revenue has no valid date field, using current date as fallback:', {
          id: revenue.id,
          name: revenue.name,
          date: revenue.date,
          month: revenue.month,
          createdAt: revenue.createdAt
        })
        // Use current date as fallback so the data still shows up in current period
        revenueDate = new Date()
      }
      
      if (!revenueDate || isNaN(revenueDate.getTime())) {
        console.warn('Could not parse revenue date, skipping:', {
          id: revenue.id,
          name: revenue.name,
          date: revenue.date,
          month: revenue.month,
          createdAt: revenue.createdAt
        })
        return false
      }
      
      const isValid = revenueDate >= startDate && revenueDate <= endDate
      
      // Log each revenue for debugging
      console.log('Revenue filtering:', {
        revenue: revenue.name || revenue.id,
        date: revenue.date,
        month: revenue.month,
        createdAt: revenue.createdAt,
        parsedDate: revenueDate,
        startDate,
        endDate,
        isValid
      })
      
      return isValid
    })

    const filteredExpenses = expenses.filter(expense => {
      // If showing all data, don't filter by date
      if (dateRange === 'all') {
        return true
      }
      
      // Try different date fields for expenses
      let expenseDate = null
      
      if (expense.createdAt && expense.createdAt !== '') {
        expenseDate = new Date(expense.createdAt)
      } else if (expense.date && expense.date !== '') {
        expenseDate = new Date(expense.date)
      } else {
        // Use current date as fallback
        console.warn('Expense has no valid date field, using current date as fallback:', expense)
        expenseDate = new Date()
      }
      
      if (!expenseDate || isNaN(expenseDate.getTime())) {
        console.warn('Could not parse expense date, skipping:', expense)
        return false
      }
      
      const isValid = expenseDate >= startDate && expenseDate <= endDate
      
      // Log each expense for debugging
      console.log('Expense filtering:', {
        expense: expense.name || expense.id,
        createdAt: expense.createdAt,
        date: expense.date,
        parsedDate: expenseDate,
        startDate,
        endDate,
        isValid
      })
      
      return isValid
    })

    console.log('Filtered results:', { 
      filteredRevenues: filteredRevenues.length, 
      filteredExpenses: filteredExpenses.length,
      totalRevenues: revenues.length,
      totalExpenses: expenses.length,
      selectedYear,
      selectedMonth,
      dateRange
    })

    return { filteredRevenues, filteredExpenses }
  }

  const { filteredRevenues, filteredExpenses } = getFilteredData()

  const totalRevenue = filteredRevenues.reduce((sum, rev) => sum + (parseFloat(rev.amount) || 0), 0)
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
  const netIncome = totalRevenue - totalExpenses

  // Get available months and years from revenue and expense data
  const getAvailablePeriods = () => {
    const availableYears = new Set()
    const availableMonths = new Set()
    
    // Check revenues
    revenues.forEach(revenue => {
      let date = null
      if (revenue.month && revenue.month !== '') {
        date = new Date(revenue.month)
      } else if (revenue.date && revenue.date !== '') {
        date = new Date(revenue.date)
      } else if (revenue.createdAt && revenue.createdAt !== '') {
        date = new Date(revenue.createdAt)
      } else {
        // Use current date for items without dates
        date = new Date()
      }
      
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        availableYears.add(year)
        availableMonths.add(month)
      }
    })
    
    // Check expenses
    expenses.forEach(expense => {
      let date = null
      if (expense.createdAt && expense.createdAt !== '') {
        date = new Date(expense.createdAt)
      } else if (expense.date && expense.date !== '') {
        date = new Date(expense.date)
      } else {
        // Use current date for items without dates
        date = new Date()
      }
      
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        availableYears.add(year)
        availableMonths.add(month)
      }
    })
    
    return {
      years: Array.from(availableYears).sort((a, b) => b - a), // Most recent first
      months: Array.from(availableMonths).sort((a, b) => a - b) // 1-12 order
    }
  }

  const { years: availableYears, months: availableMonths } = getAvailablePeriods()

const [students, setStudents] = useState([])

// Add this function to fetch students data
const fetchStudents = async () => {
  try {
    const studentsData = await apiService.getStudents()
    const studentsArray = studentsData?.data || studentsData || []
    setStudents(studentsArray)
  } catch (error) {
    console.error('Error fetching students:', error)
  }
}

// Update your useEffect to also fetch students
useEffect(() => {
  fetchData()
  fetchStudents()
}, [dateRange, selectedYear, selectedMonth])

// Helper function to get monthly fee (you'll need to implement this based on your fee structure)
  function getMonthlyFeeFor(month, year) {
    if (!monthlyFee || monthlyFee.length === 0) {
      return 0 // لا توجد رسوم شهرية متاحة بعد
    }
    // تصفية جميع الإعدادات <= الشهر والسنة المطلوبة
    const applicableSettings = monthlyFee.filter(fee => {
      return (
        fee.year < year ||
        (fee.year === year && fee.month <= month)
      )
    })

    if (applicableSettings.length === 0) {
      return 0 // لا توجد رسوم متاحة بعد
    }

    // الحصول على أحدث إعداد
    const latest = applicableSettings.reduce((prev, current) => {
      if (current.year > prev.year) return current
      if (current.year === prev.year && current.month > prev.month) return current
      return prev
    })

    return parseFloat(latest.settingValue)
  }

// Helper function to calculate expected amount for a student
const getExpectedAmountForStudent = (student, month, year) => {
  const baseFee = getMonthlyFeeFor(month, year)

  switch (student.status) {
    case 'HALF_FEES':
      return baseFee / 2
    case 'FIXED_50':
      return 50.00
    case 'EXEMPT':
      return 0.00
    default: // 'NORMAL'
      return baseFee
  }
}

  
  // Print/Export function
const handlePrintReport = () => {
  const printWindow = window.open('', '_blank')
 
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
  const textAlign = i18n.language === 'ar' ? 'right' : 'left'

  // Group transactions by category for detailed tables
  const revenueByDetailedCategory = {}
  const expenseByDetailedCategory = {}
  
  // Group revenue transactions by category
  filteredRevenues.forEach(revenue => {
    const category = revenue.category || 'Uncategorized'
    if (!revenueByDetailedCategory[category]) {
      revenueByDetailedCategory[category] = []
    }
    revenueByDetailedCategory[category].push(revenue)
  })
  
  // Group expense transactions by category
  filteredExpenses.forEach(expense => {
    const category = expense.category || 'Uncategorized'
    if (!expenseByDetailedCategory[category]) {
      expenseByDetailedCategory[category] = []
    }
    expenseByDetailedCategory[category].push(expense)
  })

  // Calculate student status summary
  const studentStatusSummary = {
    NORMAL: { count: 0, expectedAmount: 0 },
    HALF_FEES: { count: 0, expectedAmount: 0 },
    FIXED_50: { count: 0, expectedAmount: 0 },
    EXEMPT: { count: 0, expectedAmount: 0 },
    EXCLUDED: { count: 0, expectedAmount: 0 }
  }

  // Get current month and year for calculation
  const currentMonth = selectedMonth || new Date().getMonth() + 1
  const currentYear = selectedYear || new Date().getFullYear()

  students.forEach(student => {
    const status = student.status || 'NORMAL'
    const expectedAmount = getExpectedAmountForStudent(student, currentMonth, currentYear)
    
    if (studentStatusSummary[status]) {
      studentStatusSummary[status].count++
      studentStatusSummary[status].expectedAmount += expectedAmount
    }
  })

  // Calculate total expected revenue from students
  const totalExpectedRevenue = Object.values(studentStatusSummary)
    .reduce((sum, status) => sum + status.expectedAmount, 0)
  
  // Function to format transaction date
  const formatTransactionDate = (transaction) => {
    if (transaction.month && transaction.month !== '') return transaction.month
    if (transaction.date && transaction.date !== '') return transaction.date
    if (transaction.createdAt) return new Date(transaction.createdAt).toLocaleDateString()
    return 'N/A'
  }
  
  // Function to generate student status summary table
  const generateStudentStatusSummary = () => {
    return `
      <div class="status-summary-section">
        <h4 class="section-subtitle">${t('reports.studentStatusSummary')}</h4>
        <table class="status-summary-table">
          <thead>
            <tr>
              <th>${t('common.status')}</th>
              <th>${t('reports.studentCount')}</th>
              <th>${t('reports.expectedAmount')}</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(studentStatusSummary).map(([status, data]) => `
              <tr>
                <td>${t(`students.statuses.${status}`, status)}</td>
                <td class="text-center">${data.count}</td>
                <td class="expected-amount">$${data.expectedAmount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>${t('common.total')}</strong></td>
              <td class="text-center"><strong>${students.length}</strong></td>
              <td class="expected-amount"><strong>$${totalExpectedRevenue.toLocaleString()}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `
  }
  
  // Function to generate detailed category tables for revenues
  const generateRevenueCategoryTables = () => {
    return Object.entries(revenueByDetailedCategory).map(([category, transactions]) => `
      <div class="category-section">
        <h4 class="category-title revenue">${t(`revenues.category.${category}`, category)} - ${t('reports.revenue')}</h4>
        <table class="category-table">
          <thead>
            <tr>
              <th>${t('common.date')}</th>
              <th>${t('common.description')}</th>
              <th>${t('common.amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
              .sort((a, b) => {
                const dateA = new Date(a.month || a.date || a.createdAt || new Date())
                const dateB = new Date(b.month || b.date || b.createdAt || new Date())
                return dateB - dateA
              })
              .map(transaction => `
                <tr>
                  <td>${formatTransactionDate(transaction)}</td>
                  <td>${transaction.name || 'N/A'}</td>
                  <td class="revenue">$${Math.abs(parseFloat(transaction.amount) || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
          </tbody>
          <tfoot>
            <tr class="category-total">
              <td colspan="2"><strong>${t('common.total')}</strong></td>
              <td class="revenue"><strong>$${transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString()}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `).join('')
  }
  
  // Function to generate detailed category tables for expenses
  const generateExpenseCategoryTables = () => {
    return Object.entries(expenseByDetailedCategory).map(([category, transactions]) => `
      <div class="category-section">
        <h4 class="category-title expense">${t(`expenses.categories.${category.toLowerCase()}`, category)} - ${t('reports.expense')}</h4>
        <table class="category-table">
          <thead>
            <tr>
              <th>${t('common.date')}</th>
              <th>${t('common.description')}</th>
              <th>${t('common.amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
              .sort((a, b) => {
                const dateA = new Date(a.month || a.date || a.createdAt || new Date())
                const dateB = new Date(b.month || b.date || b.createdAt || new Date())
                return dateB - dateA
              })
              .map(transaction => `
                <tr>
                  <td>${formatTransactionDate(transaction)}</td>
                  <td>${transaction.name || 'N/A'}</td>
                  <td class="expense">$${Math.abs(parseFloat(transaction.amount) || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
          </tbody>
          <tfoot>
            <tr class="category-total">
              <td colspan="2"><strong>${t('common.total')}</strong></td>
              <td class="expense"><strong>$${transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0).toLocaleString()}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `).join('')
  }
  
  const reportContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${t('reports.financialReport')} - ${t('system.swalhaSystem')}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
            direction: ${dir};
            text-align: ${textAlign};
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .summary { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
          }
          .summary-card { 
            border: 1px solid #ddd; 
            padding: 15px; 
            text-align: center; 
            flex: 1; 
            margin: 0 10px; 
            border-radius: 8px;
          }
          .revenue { color: #10b981; }
          .expense { color: #ef4444; }
          .profit { color: #3b82f6; }
          .expected-amount { color: #8b5cf6; }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: ${textAlign}; 
          }
          th { 
            background-color: #f9fafb; 
            font-weight: bold;
          }
          
          .category-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          
          .category-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f8f9fa;
            border-left: 4px solid #ddd;
          }
          
          .category-title.revenue {
            border-left-color: #10b981;
          }
          
          .category-title.expense {
            border-left-color: #ef4444;
          }
          
          .category-table {
            margin-bottom: 20px;
          }
          
          .category-total {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          
          .section-header {
            font-size: 22px;
            font-weight: bold;
            margin: 40px 0 20px 0;
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
          }

          .section-subtitle {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 15px 0;
            color: #444;
          }

          .status-summary-section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }

          .status-summary-table {
            margin-top: 15px;
          }

          .text-center {
            text-align: center;
          }

          .total-row {
            background-color: #e5e7eb;
            font-weight: bold;
          }
          
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          
          @media print { 
            .no-print { display: none; }
            .category-section { page-break-inside: avoid; }
            .status-summary-section { page-break-inside: avoid; }
            body { margin: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('system.swalhaSystem')}</h1>
          <h2>${t('reports.financialReport')}</h2>
          <p>
            ${t('reports.dateRange')}: ${dateRange === 'all' ? t('reports.allData') : `${selectedYear}${dateRange === 'month' ? ` - ${selectedMonth}` : ''}`}          
          </p>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h3>${t('reports.totalRevenue')}</h3>
            <p class="revenue">$${totalRevenue.toLocaleString()}</p>
          </div>
          <div class="summary-card">
            <h3>${t('reports.totalExpenses')}</h3>
            <p class="expense">$${totalExpenses.toLocaleString()}</p>
          </div>
          <div class="summary-card">
            <h3>${t('reports.netProfit')}</h3>
            <p class="profit">$${netIncome.toLocaleString()}</p>
          </div>
          <div class="summary-card">
            <h3>${t('reports.expectedRevenue')}</h3>
            <p class="expected-amount">$${totalExpectedRevenue.toLocaleString()}</p>
          </div>
        </div>

        ${generateStudentStatusSummary()}
        
        <h3 class="section-header">${t('reports.revenueReport')} ${t('reports.breakdown')}</h3>
        <table>
          <thead>
            <tr>
              <th>${t('common.category')}</th>
              <th>${t('common.amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(revenueByCategory).map(([category, amount]) => 
              `<tr><td>${t(`revenues.category.${category.toLowerCase()}`, category)}</td><td class="revenue">$${amount.toLocaleString()}</td></tr>`
            ).join('')}
          </tbody>
        </table>
        
        <h3 class="section-header">${t('reports.expenseReport')} ${t('reports.breakdown')}</h3>
        <table>
          <thead>
            <tr>
              <th>${t('common.category')}</th>
              <th>${t('common.amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(expenseByCategory).map(([category, amount]) => 
              `<tr><td>${t(`expenses.categories.${category}`, category)}</td><td class="expense">$${amount.toLocaleString()}</td></tr>`
            ).join('')}
          </tbody>
        </table>
        
        <h3 class="section-header">${t('reports.revenue')} - ${t('common.details')} ${t('common.byCategory')}</h3>
        ${generateRevenueCategoryTables()}
        
        <h3 class="section-header">${t('reports.expense')} - ${t('common.details')} ${t('common.byCategory')}</h3>
        ${generateExpenseCategoryTables()}
        
        <h3 class="section-header">${t('reports.recentTransactions')}</h3>
        <table>
          <thead>
            <tr>
              <th>${t('common.date')}</th>
              <th>${t('common.description')}</th>
              <th>${t('common.category')}</th>
              <th>${t('common.type')}</th>
              <th>${t('common.amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${[...filteredRevenues, ...filteredExpenses]
              .sort((a, b) => {
                let dateA, dateB
                
                if (a.month && a.month !== '') {
                  dateA = new Date(a.month)
                } else if (a.date && a.date !== '') {
                  dateA = new Date(a.date)
                } else if (a.createdAt && a.createdAt !== '') {
                  dateA = new Date(a.createdAt)
                } else {
                  dateA = new Date()
                }
                
                if (b.month && b.month !== '') {
                  dateB = new Date(b.month)
                } else if (b.date && b.date !== '') {
                  dateB = new Date(b.date)
                } else if (b.createdAt && b.createdAt !== '') {
                  dateB = new Date(b.createdAt)
                } else {
                  dateB = new Date()
                }
                
                return dateB - dateA
              })
              .slice(0, 20)
              .map((transaction, index) => `
                <tr>
                  <td>${formatTransactionDate(transaction)}</td>
                  <td>${transaction.name || 'N/A'}</td>
                  <td>${
                    transaction.hasOwnProperty('month')
                      ? t(`revenues.category.${transaction.category.toLowerCase()}`, transaction.category || 'Uncategorized')
                      : t(`expenses.categories.${transaction.category.toLowerCase()}`, transaction.category || 'Uncategorized')
                  }</td>
                  <td>${transaction.hasOwnProperty('month') ? t('reports.revenue') : t('reports.expense')}</td>
                  <td class="${transaction.hasOwnProperty('month') ? 'revenue' : 'expense'}">$${Math.abs(parseFloat(transaction.amount) || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>${t('system.swalhaSystem')} - ${t('reports.financialReport')}</p>
          <p>${t('common.generated')}: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="no-print">
          <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 20px 0;">
            ${t('reports.print')}
          </button>
        </div>
      </body>
    </html>
  `
  
  printWindow.document.write(reportContent)
  printWindow.document.close()
  
  // Auto-print after content loads
  printWindow.onload = () => {
    printWindow.print()
  }
}



  const revenueByCategory = filteredRevenues.reduce((acc, revenue) => {
    const category = revenue.category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + (parseFloat(revenue.amount) || 0)
    return acc
  }, {})

  const expenseByCategory = filteredExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + (parseFloat(expense.amount) || 0)
    return acc
  }, {})

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthRevenues = revenues.filter(r => {
      let date = null
      if (r.month && r.month !== '') {
        date = new Date(r.month)
      } else if (r.date && r.date !== '') {
        date = new Date(r.date)
      } else if (r.createdAt && r.createdAt !== '') {
        date = new Date(r.createdAt)
      } else {
        date = new Date()
      }
      
      if (isNaN(date.getTime())) return false
      
      return date.getMonth() === i && date.getFullYear() === selectedYear
    })
    
    const monthExpenses = expenses.filter(e => {
      let date = null
      if (e.createdAt && e.createdAt !== '') {
        date = new Date(e.createdAt)
      } else if (e.date && e.date !== '') {
        date = new Date(e.date)
      } else {
        date = new Date()
      }
      
      if (isNaN(date.getTime())) return false
      
      return date.getMonth() === i && date.getFullYear() === selectedYear
    })
    
    return {
      month: new Date(selectedYear, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthRevenues.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
      expenses: monthExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    }
  })

const revenueChartData = Object.entries(revenueByCategory).map(([category, amount]) => ({
  name: t(`revenues.category.${category}`, category),
  value: amount
}))

const expenseChartData = Object.entries(expenseByCategory).map(([category, amount]) => ({
  name: t(`expenses.categories.${category}`, category),
  value: amount
}))


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800">{t('reports.errorLoadingData')}</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  // Check if we have any data
  const hasData = revenues.length > 0 || expenses.length > 0
  const hasFilteredData = filteredRevenues.length > 0 || filteredExpenses.length > 0

  if (!hasData) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
            <p className="text-gray-600">{t('reports.manageReports')}</p>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6 text-center">
          <p className="text-gray-500">{t('reports.noDataAvailable')}</p>
          <p className="text-sm text-gray-400 mt-2">
            {t('reports.revenuesCount')}: {revenues.length} | {t('reports.expensesCount')}: {expenses.length}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-600">{t('reports.manageReports')}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('reports.allData')}</option>
              <option value="month">{t('reports.monthly')}</option>
              <option value="quarter">{t('reports.quarterly')}</option>
              <option value="year">{t('reports.yearly')}</option>
            </select>
          </div>
          

          
          {dateRange !== 'all' && (
            <>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {[2026, 2025, 2024, 2023, 2022].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              {dateRange === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                  {[
                    { value: 1, name: 'January' },
                    { value: 2, name: 'February' },
                    { value: 3, name: 'March' },
                    { value: 4, name: 'April' },
                    { value: 5, name: 'May' },
                    { value: 6, name: 'June' },
                    { value: 7, name: 'July' },
                    { value: 8, name: 'August' },
                    { value: 9, name: 'September' },
                    { value: 10, name: 'October' },
                    { value: 11, name: 'November' },
                    { value: 12, name: 'December' }
                  ].map(month => (
                    <option key={month.value} value={month.value}>
                      {month.name}
                  </option>
                ))}
              </select>
              )}
            </>
          )}
          
          <button 
            onClick={handlePrintReport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('reports.export')} {t('reports.generateReport')}
          </button>
        </div>
      </div>

      {/* Data Summary */}
      {!hasFilteredData && dateRange !== 'all' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            {t('reports.noDataAvailable')} {t('reports.dateRange')}: {dateRange} - {selectedYear}
            {dateRange === 'month' && ` - ${selectedMonth}`}
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            Try selecting "All Data" to see all available records. Many revenue records have empty date fields.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('reports.totalRevenue')}</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('reports.totalExpenses')}</p>
              <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${netIncome >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <DollarSign className={`h-6 w-6 ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('reports.netProfit')}</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                ${netIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {hasFilteredData && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('reports.monthlyTrends')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('reports.revenueReport')} {t('reports.byCategory')}</h3>
            {revenueChartData.length > 0 ? (
<ResponsiveContainer width="100%" height={450}>
  <PieChart>
    <Pie
      data={revenueChartData}
      cx="50%"
      cy="45%"
      labelLine={false}
      label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
      outerRadius={110}
      fill="#8884d8"
      dataKey="value"
    >
      {revenueChartData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Legend 
      verticalAlign="bottom" 
      height={80}
      layout="horizontal"
      align="center"
      wrapperStyle={{
        paddingTop: '20px',
        fontSize: '14px',
        textAlign: 'center'
      }}
      iconType="circle"
    />
    <Tooltip 
      formatter={(value, name) => [
        `${value.toLocaleString()}`, 
        name
      ]}
    />
  </PieChart>
</ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                {t('reports.noDataAvailable')}
              </div>
            )}
        </div>
      </div>
      )}

      {/* Detailed Tables */}
      {hasFilteredData && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('reports.revenueReport')} {t('reports.breakdown')}</h3>
            {Object.keys(revenueByCategory).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(revenueByCategory).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{category}</span>
                <span className="text-sm font-semibold text-green-600">${amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('reports.noDataAvailable')}</p>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('reports.expenseReport')} {t('reports.breakdown')}</h3>
            {Object.keys(expenseByCategory).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(expenseByCategory).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{category}</span>
                <span className="text-sm font-semibold text-red-600">${amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('reports.noDataAvailable')}</p>
            )}
        </div>
      </div>
      )}

      {/* Recent Transactions */}
      {hasFilteredData && (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('reports.recentTransactions')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.type')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.amount')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...filteredRevenues, ...filteredExpenses]
                  .sort((a, b) => {
                    // Sort by date, handling different field names and fallbacks
                    let dateA, dateB
                    
                    // Handle first item date
                    if (a.month && a.month !== '') {
                      dateA = new Date(a.month)
                    } else if (a.date && a.date !== '') {
                      dateA = new Date(a.date)
                    } else if (a.createdAt && a.createdAt !== '') {
                      dateA = new Date(a.createdAt)
                    } else {
                      dateA = new Date() // Fallback to current date
                    }
                    
                    // Handle second item date
                    if (b.month && b.month !== '') {
                      dateB = new Date(b.month)
                    } else if (b.date && b.date !== '') {
                      dateB = new Date(b.date)
                    } else if (b.createdAt && b.createdAt !== '') {
                      dateB = new Date(b.createdAt)
                    } else {
                      dateB = new Date() // Fallback to current date
                    }
                    
                    return dateB - dateA
                  })
                .slice(0, 10)
                .map((transaction, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.month && transaction.month !== '' 
                          ? transaction.month 
                          : transaction.date && transaction.date !== ''
                            ? transaction.date
                            : transaction.createdAt 
                              ? new Date(transaction.createdAt).toLocaleDateString()
                              : 'Current'
                        }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {transaction.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.hasOwnProperty('month') || (transaction.month !== undefined)
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                          {transaction.hasOwnProperty('month') || (transaction.month !== undefined) ? t('reports.revenue') : t('reports.expense')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        <span className={transaction.hasOwnProperty('month') || (transaction.month !== undefined) ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs(parseFloat(transaction.amount) || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

    </div>
  )
}

export default Reports