import React, { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, User, BookOpen, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/apiService'
import toast from 'react-hot-toast'
import { useTranslation } from "react-i18next"
import { useLanguage } from '../contexts/LanguageContext'

const StudentDetailsModal = ({ student, isOpen, onClose }) => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [payments, setPayments] = useState([])
  const [paymentSummary, setPaymentSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [monthlyFee, setMonthlyFee] = useState([])
  const [totalThisMonth, setTotalThisMonth] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const navigate = useNavigate()
  
  useEffect(() => {
    if (isOpen && student) {
      fetchStudentPaymentData()
    }
  }, [isOpen, student, selectedYear])

  const fetchStudentPaymentData = async () => {
    try {
      setLoading(true)

      const [paymentsData, summaryData, monthlyFeeData, totalThisMonthData] = await Promise.all([
        apiService.getStudentPayments(student.id),
        apiService.getStudentPaymentSummary(student.id),
        apiService.getMonthlyFee(),
        apiService.getStudentTotalPaymentsInThisMonth(student.id)
      ])

      setPayments(paymentsData.data || [])
      setPaymentSummary(summaryData.data)
      setMonthlyFee(monthlyFeeData)
      setTotalThisMonth(Array.isArray(totalThisMonthData) ? totalThisMonthData : [])
    } catch (error) {
      console.error('Error fetching payment data:', error)
      toast.error(t("students.errors.failedToLoadPaymentData"))
    } finally {
      setLoading(false)
    }
  }

  // Generate years for dropdown (current year and previous/next years)
   // Generate years for dropdown (2025 to 2060)
  const generateYearOptions = () => {
    const years = []
    
    // Fixed range from 2025 to 2060
    const startYear = 2025
    const endYear = 2060
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year)
    }
        return years.sort((a, b) => b - a) // Sort descending (newest first)
  }


  const getStatusColor = (status) => {
    switch (status) {
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800'
      case 'HALF_FEES':
        return 'bg-yellow-100 text-yellow-800'
      case 'FIXED_50':
        return 'bg-orange-100 text-orange-800'
      case 'EXEMPT':
        return 'bg-green-100 text-green-800'
      case 'EXCLUDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMonthName = (month) => {
    const months = [
      t("months.january"), t("months.february"), t("months.march"), t("months.april"), 
      t("months.may"), t("months.june"), t("months.july"), t("months.august"), 
      t("months.september"), t("months.october"), t("months.november"), t("months.december")
    ]
    return months[month - 1] || month
  }

  const getPaymentStatusColor = (status) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }
  
  const getIsExempt = (status) => {
    return status === 'EXEMPT' ? true : false
  }
  
  const isExempt = getIsExempt(student?.status)

  // function to get monthly fee by month/year
  function getMonthlyFeeFor(month, year) {
    if (!monthlyFee || monthlyFee.length === 0) {
      return 0
    }
    
    const applicableSettings = monthlyFee.filter(fee => {
      return (
        fee.year < year ||
        (fee.year === year && fee.month <= month)
      )
    })

    if (applicableSettings.length === 0) {
      return 0
    }

    const latest = applicableSettings.reduce((prev, current) => {
      if (current.year > prev.year) return current
      if (current.year === prev.year && current.month > prev.month) return current
      return prev
    })

    return parseFloat(latest.settingValue)
  }

  // function to calculate expected fee for student
  const getExpectedAmountForStudent = (student, month, year) => {
    const baseFee = getMonthlyFeeFor(month, year)

    switch (student.status) {
      case 'HALF_FEES':
        return baseFee / 2
      case 'FIXED_50':
        return 50.00
      case 'EXEMPT':
        return 0.00
      default:
        return baseFee
    }
  }

  const handlePayButtonClick = (month, year) => {
    onClose()
    
    const prefillData = {
      studentId: student.id,
      studentName: student.name || `${student.firstName} ${student.lastName}`,
      category: 'Tuition_Fees',
      month: month,
      year: year,
      amount: getExpectedAmountForStudent(student, month, year),
      isFromStudentModal: true
    }
    
    sessionStorage.setItem('revenuePrefillData', JSON.stringify(prefillData))
    navigate('/revenues')
    toast.success(t("students.messages.navigatingToPayment", { month: getMonthName(month), year }))
  }

  if (!isOpen || !student) return null

  const getmonthEnrollment = (student) => {
    var date = new Date(student.startedAt).getMonth() + 1
    return date;
  }

  const startMonth = getmonthEnrollment(student)
  
  const getExcludedMonth = (student) => {
    if (student.status === 'EXCLUDED' && student.exclusionStart) {
      return new Date(student.exclusionStart).getMonth() + 1
    }
    return null
  }
  
  const excludedMonth = getExcludedMonth(student)
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  // Determine end month based on selected year and student status
  let endMonth
  if (selectedYear < currentYear) {
    // For past years, show all 12 months
    endMonth = excludedMonth && new Date(student.exclusionStart).getFullYear() === selectedYear ? excludedMonth : 12
  } else if (selectedYear === currentYear) {
    // For current year, show up to current month or exclusion month
    endMonth = excludedMonth ? excludedMonth : currentMonth
  } else {
    // For future years, show all 12 months
    endMonth = 12
  }

  // Adjust start month for different years
  let adjustedStartMonth = 1
  if (selectedYear === new Date(student.startedAt).getFullYear()) {
    adjustedStartMonth = startMonth
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("students.details.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Student Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              {t("students.details.personalInfo")}
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">
                  {t("students.details.fullName")}:
                </span>
                <span className="ml-2 text-gray-900">
                  {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("students.details.phone")}:</span>
                <span className="ml-2 text-gray-900">{student.phone || t("common.notAvailable")}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("students.nationalId")}:</span>
                <span className="ml-2 text-gray-900">{student.nationalId || t("common.notAvailable")}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("students.category")}:</span>
                <span className="ml-2 text-gray-900">{student.category || t("common.notAvailable")}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("students.status")}:</span>
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                  {t(`students.statuses.${student.status?.toLowerCase()}`) || t("students.statuses.normal")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              {t("students.details.academicInfo")}
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">{t("students.className")}:</span>
                <span className="ml-2 text-gray-900">{student.classInfo?.name || student.classEntity?.name || t("common.notAvailable")}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("students.instructorName")}:</span>
                <span className="ml-2 text-gray-900">{student.instructorName || t("common.notAvailable")}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("students.enrollmentDate")}:</span>
                <span className="ml-2 text-gray-900">{student.startedAt || student.enrollmentDate || t("common.notAvailable")}</span>
              </div>

              {student.status === 'EXCLUDED' && (
                <div>
                  <span className="font-medium text-gray-700">{t("students.exclusionStartDate")}:</span>
                  <span className="ml-2 text-gray-900">{student.exclusionStart || t("common.notAvailable")}</span>
                </div>
              )}
              {student.category === 'Children' && (
                <>
                  <div>
                    <span className="font-medium text-gray-700">{t("students.guardianName")}:</span>
                    <span className="ml-2 text-gray-900">{student.guardianName || t("common.notAvailable")}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t("students.guardianPhone")}:</span>
                    <span className="ml-2 text-gray-900">{student.guardianPhone || t("common.notAvailable")}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        {paymentSummary && (
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              {t("students.details.paymentSummary")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${paymentSummary.outstandingBalance?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-600">{t("students.paymentSummary.outstandingBalance")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {paymentSummary.unpaidMonthsCount || 0}
                </div>
                <div className="text-sm text-gray-600">{t("students.paymentSummary.unpaidMonths")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {payments.length}
                </div>
                <div className="text-sm text-gray-600">{t("students.paymentSummary.totalPayments")}</div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Payment Status with Year Filter */}
        <div className="bg-white border rounded-lg mb-6">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {t("students.monthlyPaymentStatus")}
              </h3>
              
              {/* Year Selector */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {generateYearOptions().map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.month")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.expectedAmount")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.amountPaid")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.remaining")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: endMonth - adjustedStartMonth + 1 }, (_, index) => {
                  const month = index + adjustedStartMonth
                  const expectedAmount = getExpectedAmountForStudent(student, month, selectedYear)
                  const monthPayment = totalThisMonth.find(p => p.month === month && p.year === selectedYear)
                  const amountPaid = monthPayment ? monthPayment.amountPaid : 0
                  const remaining = expectedAmount - amountPaid
                  const isPaid = monthPayment && monthPayment.paymentStatus
                  const isOverdue = !isPaid && new Date(selectedYear, month - 1, 1) < new Date() && selectedYear <= currentYear

                  return (
                    <tr key={month} className={`hover:bg-gray-50 ${
                      isPaid ? 'bg-green-50' :
                      isOverdue && !isExempt ? 'bg-red-50' : ''                    
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getMonthName(month)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ${expectedAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {monthPayment ? (
                          <span className="text-green-600">${amountPaid.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">$0.00</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {monthPayment ? (
                          <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                            ${remaining.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-red-600">${expectedAmount.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {monthPayment ? (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            isPaid || isExempt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isPaid || isExempt ? t("students.paymentStatus.paid") : t("students.paymentStatus.unpaid")}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-2 text-xs font-semibold rounded-full ${
                            isExempt ? 'bg-green-100 text-green-800' : 
                            isOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isExempt ? t("students.paymentStatus.paid") : 
                             isOverdue ? t("students.paymentStatus.overdue") : t("students.paymentStatus.pending")}
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!isPaid && !isExempt && expectedAmount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePayButtonClick(month, selectedYear)
                            }}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                          >
                            {t("students.actions.pay")}
                          </button>
                        )}
                        {isPaid && (
                          <span className="text-xs text-gray-500">{t("students.paymentStatus.completed")}</span>
                        )}
                        {(expectedAmount === 0 || isExempt) && (
                          <span className="text-xs text-gray-500">{t("students.paymentStatus.exempt")}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white border rounded-lg">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {t("students.details.paymentHistory")}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t("students.loadingPaymentHistory")}</p>
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t("students.paymentDate")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("students.amountPaid")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments
                    .filter(payment => payment.year === selectedYear)
                    .map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.day} {getMonthName(payment.month)} {payment.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">
                        ${payment.amountPaid?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              {t("students.noPaymentHistory")}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentDetailsModal