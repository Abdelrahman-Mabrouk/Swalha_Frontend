import React, { useState, useEffect } from 'react'
import { Users, GraduationCap, DollarSign, TrendingUp, Calendar, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/apiService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const Dashboard = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalRevenue: 0,
    totalExpenses: 0,
  })
  const [recentData, setRecentData] = useState({
    students: [],
    revenues: [],
    expenses: []
  })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [students, revenues, expenses, classes] = await Promise.all([
          apiService.getStudents(),
          apiService.getRevenues(),
          apiService.getExpenses(),
          apiService.getClasses()
        ])

        const totalRevenue = revenues.reduce((sum, rev) => sum + (parseFloat(rev.amount) || 0), 0)
        const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)

        setStats({
          totalStudents: students.length,
          totalClasses: classes.length,
          totalRevenue,
          totalExpenses,
        })

        setRecentData({
          students: students.slice(0, 5),
          revenues: revenues.slice(0, 5),
          expenses: expenses.slice(0, 5)
        })

        // Generate real chart data from actual revenue and expense data
        const monthlyData = generateMonthlyChartData(revenues, expenses)
        setChartData(monthlyData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Function to generate monthly chart data from real revenue and expense data
  const generateMonthlyChartData = (revenues, expenses) => {
    const currentYear = new Date().getFullYear()
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    return months.map((month, index) => {
      const monthIndex = index // 0-11
      
      // Filter revenues for this month and year
      const monthRevenues = revenues.filter(revenue => {
        let revenueDate = null
        
        // Try different date fields in order of priority
        if (revenue.month && revenue.month !== '') {
          revenueDate = new Date(revenue.month)
        } else if (revenue.date && revenue.date !== '') {
          revenueDate = new Date(revenue.date)
        } else if (revenue.createdAt && revenue.createdAt !== '') {
          revenueDate = new Date(revenue.createdAt)
        }
        
        if (!revenueDate || isNaN(revenueDate.getTime())) return false
        
        return revenueDate.getMonth() === monthIndex && revenueDate.getFullYear() === currentYear
      })
      
      // Filter expenses for this month and year
      const monthExpenses = expenses.filter(expense => {
        let expenseDate = null
        
        // Try different date fields in order of priority
        if (expense.createdAt && expense.createdAt !== '') {
          expenseDate = new Date(expense.createdAt)
        } else if (expense.date && expense.date !== '') {
          expenseDate = new Date(expense.date)
        }
        
        if (!expenseDate || isNaN(expenseDate.getTime())) return false
        
        return expenseDate.getMonth() === monthIndex && expenseDate.getFullYear() === currentYear
      })
      
      // Calculate totals for this month
      const monthlyRevenue = monthRevenues.reduce((sum, rev) => sum + (parseFloat(rev.amount) || 0), 0)
      const monthlyExpenses = monthExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
      
      return {
        month,
        revenue: Math.round(monthlyRevenue * 100) / 100, // Round to 2 decimal places
        expenses: Math.round(monthlyExpenses * 100) / 100,
        revenueCount: monthRevenues.length,
        expenseCount: monthExpenses.length
      }
    })
  }

  // Calculate percentage changes for stats (comparing current month to previous month)
  const calculatePercentageChanges = () => {
    if (chartData.length < 2) return { revenueChange: 0, expenseChange: 0 }
    
    const currentMonth = chartData[chartData.length - 1]
    const previousMonth = chartData[chartData.length - 2]
    
    const revenueChange = previousMonth.revenue > 0 
      ? Math.round(((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100)
      : 0
    
    const expenseChange = previousMonth.expenses > 0 
      ? Math.round(((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100)
      : 0
    
    return { revenueChange, expenseChange }
  }

  const { revenueChange, expenseChange } = calculatePercentageChanges()

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {change > 0 ? '+' : ''}{change}% {t('dashboard.fromLastMonth')}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
<div>
  <h1 className="text-3xl font-bold text-gray-900 ml-4 mt-4">{t('dashboard.title')}</h1>
  <p className="text-gray-600 ml-4">{t('dashboard.welcomeMessage')}</p>
</div>



      {/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-6">
  <StatCard
    title={` ${t('dashboard.totalRevenue')}   `}
    value={`$${stats.totalRevenue.toLocaleString()}`}
    icon={DollarSign}
    color="bg-emerald-500"
    change={revenueChange}
  />
  <StatCard
    title={t('dashboard.totalExpenses')}
    value={`$${stats.totalExpenses.toLocaleString()}`}
    icon={TrendingUp}
    color="bg-red-500"
    change={expenseChange}
  />
  <StatCard
    title={t('dashboard.netProfit')}
    value={`$${(stats.totalRevenue - stats.totalExpenses).toLocaleString()}`}
    icon={DollarSign}
    color={(stats.totalRevenue - stats.totalExpenses) >= 0 ? "bg-blue-500" : "bg-orange-500"}
  />
</div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.financialOverview')}</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `$${value.toLocaleString()}`, 
                    name === 'revenue' ? 'Revenue' : 'Expenses'
                  ]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              {t('dashboard.noDataAvailable')}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.monthlyRevenue')}</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              {t('dashboard.noDataAvailable')}
            </div>
          )}
        </div>
      </div>

      {/* Financial Insights */}
<div className="grid grid-cols-2 gap-6 w-full">


        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.monthlySummary')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('dashboard.currentMonth')}</span>
              <span className="text-sm font-semibold text-gray-900">
                {chartData.length > 0 ? chartData[new Date().getMonth()].month : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('dashboard.monthlyRevenue')}</span>
              <span className="text-sm font-semibold text-green-600">
                {chartData.length > 0 ? `$${chartData[new Date().getMonth()].revenue.toLocaleString()}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('dashboard.monthlyExpenses')}</span>
              <span className="text-sm font-semibold text-red-600">
                {chartData.length > 0 ? `$${chartData[new Date().getMonth()].expenses.toLocaleString()}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.dataOverview')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('dashboard.totalTransactions')}</span>
              <span className="text-sm font-semibold text-gray-900">
                {recentData.revenues.length + recentData.expenses.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('dashboard.revenueRecords')}</span>
              <span className="text-sm font-semibold text-green-600">
                {recentData.revenues.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('dashboard.expenseRecords')}</span>
              <span className="text-sm font-semibold text-red-600">
                {recentData.expenses.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
<div className="grid grid-cols-2 gap-6 w-full">


        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentRevenues')}</h3>
          <div className="space-y-3">
            {recentData.revenues.length > 0 ? (
              recentData.revenues.map((revenue, index) => (
                <div key={index} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{revenue.name || revenue.description || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{revenue.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-green-600">${parseFloat(revenue.amount || 0).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">{t('dashboard.noRevenuesAvailable')}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentExpenses')}</h3>
          <div className="space-y-3">
            {recentData.expenses.length > 0 ? (
              recentData.expenses.map((expense, index) => (
                <div key={index} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.name || expense.description || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{expense.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-red-600">${parseFloat(expense.amount || 0).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">{t('dashboard.noExpensesAvailable')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 