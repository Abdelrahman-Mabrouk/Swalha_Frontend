
import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit, Trash2, Filter, X, Users, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/apiService'
import toast from 'react-hot-toast'
import StudentDetailsModal from '../components/StudentDetailsModal'

const Students = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [error, setError] = useState(null)
  
  // Filter states
  const [filters, setFilters] = useState({
    status: [],
    classId: [],
    category: [],
    enrollmentDateRange: {
      start: '',
      end: ''
    }
  })
  const [showFilters, setShowFilters] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    classId: '',
    startedAt: '',
    category: '',
    guardianName: '',
    guardianPhone: '',
    nationalId: '',
    instructorName: '',
    status: 'NORMAL',
    exclusionStart: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [studentsResponse, classesResponse] = await Promise.all([
        apiService.getStudents(),
        apiService.getClasses()
      ])
      
      // Handle different possible response structures
      const studentsData = studentsResponse?.data || studentsResponse || []
      const classesData = classesResponse?.data || classesResponse || []
      
      setStudents(studentsData)
      setClasses(classesData)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error.message || t('common.error'))
      toast.error(t('common.error'))
      // Set empty arrays to prevent undefined errors
      setStudents([])
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStudents()
      // Handle different possible response structures
      const data = response.data || response || []
      
      setStudents(data)
    } catch (error) {
      toast.error(t('common.error'))
      console.error(error)
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fullName = formData.firstName.trim() + ' ' + formData.lastName.trim();

    const payload = {
      name: fullName,
      phone: formData.phone,
      classEntity: { id: parseInt(formData.classId) || formData.classId }, // Handle both string and number IDs
      startedAt: formData.startedAt,
      category: formData.category,
      status: formData.status,
      guardianName: formData.guardianName,
      guardianPhone: formData.guardianPhone,
      nationalId: formData.nationalId,
      instructorName: formData.instructorName,
      exclusionStart: formData.exclusionStart
    };

    try {
      if (editingStudent) {
        await apiService.updateStudent(editingStudent.id, payload);
        toast.success(t('common.success'));
      } else {
        await apiService.createStudent(payload);
        toast.success(t('common.success'));
      }
      
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(error.message || t('common.error'));
    }
  };

  const handleEdit = (student) => {
    const nameParts = (student.name || '').split(' ');
    setFormData({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      phone: student.phone || '',
      classId: student.classInfo?.id || student.classId || student.classEntity?.id || student.class?.id || '',
      startedAt: student.startedAt || '',
      category: student.category || '',
      status: student.status || 'NORMAL',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      nationalId: student.nationalId || '',
      instructorName: student.instructorName || '',
      exclusionStart: student.exclusionStart || ''
    });
    setEditingStudent(student);
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm(t('common.delete') + '?')) {
      try {
        await apiService.deleteStudent(studentId);
        toast.success(t('common.success'));
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error(error.message || t('common.error'));
      }
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    const newFormData = {
      firstName: '',
      lastName: '',
      phone: '',
      classId: '',
      startedAt: '',
      category: '',
      status: 'NORMAL',
      guardianName: '',
      guardianPhone: '',
      nationalId: '',
      instructorName: '',
      exclusionStart: '',
    };
    setFormData(newFormData)
  }

  // Enhanced filtering logic
  const filteredStudents = useMemo(() => {
    let filtered = students

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(student => {
        const fullName = (student.name || '').toLowerCase()
        const phone = (student.phone || '').toLowerCase()
        const nationalId = (student.nationalId || '').toLowerCase()
        const category = (student.category || '').toLowerCase()
        const instructor = (student.instructorName || '').toLowerCase()
        
        return fullName.includes(searchLower) ||
               phone.includes(searchLower) ||
               nationalId.includes(searchLower) ||
               category.includes(searchLower) ||
               instructor.includes(searchLower)
      })
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(student => 
        filters.status.includes(student.status)
      )
    }

    // Apply class filter
    if (filters.classId.length > 0) {
      filtered = filtered.filter(student => {
        // Handle different possible class field names
        let studentClassId = null
        
        // New DTO structure
        if (student.classInfo && student.classInfo.id) {
          studentClassId = student.classInfo.id
        }
        // Legacy fallback
        else if (student.classId) {
          studentClassId = student.classId
        } else if (student.classEntity && student.classEntity.id) {
          studentClassId = student.classEntity.id
        } else if (student.class && student.class.id) {
          studentClassId = student.class.id
        }
        
        if (!studentClassId) return false
        
        // Handle type mismatches
        const studentClassIdStr = String(studentClassId)
        return filters.classId.some(filterId => String(filterId) === studentClassIdStr)
      })
    }

    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(student => 
        filters.category.includes(student.category)
      )
    }

    // Apply enrollment date range filter
    if (filters.enrollmentDateRange.start || filters.enrollmentDateRange.end) {
      filtered = filtered.filter(student => {
        if (!student.startedAt) return false
        
        const startDate = filters.enrollmentDateRange.start
        const endDate = filters.enrollmentDateRange.end
        const studentDate = new Date(student.startedAt)
        
        if (startDate && new Date(startDate) > studentDate) return false
        if (endDate && new Date(endDate) < studentDate) return false
        
        return true
      })
    }

    return filtered
  }, [students, searchTerm, filters])

  // Helper function to get class name by ID
  const getClassNameById = (id) => {
    if (!id) return ''
    
    // Handle case where id might be an object with an id property
    let classId = id
    if (typeof id === 'object' && id !== null && id.id) {
      classId = id.id
    }
    
    if (!classes || classes.length === 0) {
      return t('students.noClasses')
    }
    
    const cls = classes.find(c => {
      // Handle both string and number ID types
      const classIdStr = String(classId)
      const cIdStr = String(c.id)
      return classIdStr === cIdStr
    })
    
    if (cls) {
      return cls.name
    } else {
      // If no class found, return the ID for debugging
      return `${t('students.classId')}: ${classId}`
    }
  }

  // Helper function to get class name from student data
  const getClassNameFromStudent = (student) => {
    // First try to get from classInfo (new DTO structure)
    if (student.classInfo && student.classInfo.name) {
      return student.classInfo.name
    }
    
    // Fallback to old structure
    if (student.classInfo && student.classInfo.id) {
      return getClassNameById(student.classInfo.id)
    }
    
    // Legacy fallback
    if (student.classId) {
      return getClassNameById(student.classId)
    }
    
    if (student.classEntity && student.classEntity.id) {
      return getClassNameById(student.classEntity.id)
    }
    
    if (student.class && student.class.id) {
      return getClassNameById(student.class.id)
    }
    
    return t('students.noClass')
  }

  // Helper function to format display value
  const formatDisplayValue = (value) => {
    if (!value || value === 'N/A' || value === '') return '—'
    return value
  }

  // Filter options - FIXED: Use consistent string values
  const statusOptions = [
    { value: 'NORMAL', label: t('students.normal') },
    { value: 'HALF_FEES', label: t('students.halfFees') },
    { value: 'FIXED_50', label: t('students.fixed50') },
    { value: 'EXEMPT', label: t('students.exempt') },
    { value: 'EXCLUDED', label: t('students.excluded') }  
  ];
  
  const categoryOptions = ['Men', 'Women','Children']

  const clearFilters = () => {
    setFilters({
      status: [],
      classId: [],
      category: [],
      enrollmentDateRange: {
        start: '',
        end: ''
      }
    })
  }

  const hasActiveFilters = () => {
    return filters.status.length > 0 || 
           filters.classId.length > 0 || 
           filters.category.length > 0 || 
           filters.enrollmentDateRange.start || 
           filters.enrollmentDateRange.end
  }

  // Calculate totals for summary cards
  const totalStudents = students.length
  const filteredCount = filteredStudents.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Simple test render to debug
  if (!students || students.length === 0) {
    return (
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div >
            <h1 className="text-3xl font-bold text-gray-900 ml-4 mt-4">{t('students.title')}</h1>
            <p className="text-gray ">{t('students.manageStudents')}</p>
          </div>
          <button
            onClick={() =>{
            console.log('Button clicked - opening modal'); // للتأكد
             setShowModal(true)}}

            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('students.addStudent')}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800">{t('students.errorLoadingData')}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
            >
              {t('students.retry')}
            </button>
          </div>
        )}
        
        <div className="bg-white shadow-sm rounded-lg p-6 text-center">
          <p className="text-gray-500">{t('students.noStudentsFound')}</p>
          <p className="text-sm text-gray-400 mt-2">{t('students.studentsCount')}: {students ? students.length : 'undefined'}</p>
          <p className="text-sm text-gray-400">{t('students.classesCount')}: {classes ? classes.length : 'undefined'}</p>
          <p className="text-sm text-gray-400">{t('students.loadingState')}: {loading ? 'true' : 'false'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('students.title')}</h1>
          <p className="text-gray-600">{t('students.manageStudents')}</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true)
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('students.addStudent')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800">{t('students.errorLoadingData')}</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
          >
            {t('students.retry')}
          </button>
        </div>
      )}

      {/* Summary Cards - NEW SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('students.summary.totalStudents')}</p>
              <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-sm font-medium text-gray-600">{t('students.summary.filteredCount')}</p>
              <p className="text-2xl font-bold text-green-600">{filteredCount}</p>
              {(hasActiveFilters() || searchTerm) && filteredCount !== totalStudents && (
                <p className="text-xs text-gray-500 mt-1">
                </p>
              )}
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
            placeholder={t('students.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
        
        {/* Search Results Counter */}


        {/* Filter Toggle and Active Filters */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('students.filters')}
            {hasActiveFilters() && (
              <span className={`${isRTL ? 'mr-2' : 'ml-2'} inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full`}>
                {filters.status.length + filters.classId.length + filters.category.length + 
                 (filters.enrollmentDateRange.start ? 1 : 0) + (filters.enrollmentDateRange.end ? 1 : 0)}
              </span>
            )}
          </button>
          
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('students.clearAll')}
            </button>
          )}
        </div>


        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter - FIXED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('students.status')}</label>
                <div className="space-y-2">
                  {statusOptions.map(status => (
                    <label key={status.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, status: [...prev.status, status.value] }))
                          } else {
                            setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status.value) }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('students.class')}</label>
                <div className="space-y-2">
                  {classes.map(cls => (
                    <label key={cls.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.classId.includes(cls.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, classId: [...prev.classId, cls.id] }))
                          } else {
                            setFilters(prev => ({ ...prev, classId: prev.classId.filter(id => id !== cls.id) }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>{cls.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('students.category')}</label>
                <div className="space-y-2">
                  {categoryOptions.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.category.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, category: [...prev.category, category] }))
                          } else {
                            setFilters(prev => ({ ...prev, category: prev.category.filter(c => c !== category) }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>{t(`students.categories.${category}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Enrollment Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('students.enrollmentDateRange')}</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.enrollmentDateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      enrollmentDateRange: { ...prev.enrollmentDateRange, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder={t('students.startDate')}
                  />
                  <input
                    type="date"
                    value={filters.enrollmentDateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      enrollmentDateRange: { ...prev.enrollmentDateRange, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder={t('students.endDate')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Students Table */}
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 ">
              <tr>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('students.student')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('students.contact')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('students.class')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('students.category')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('students.status')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('students.enrollmentDate')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-left' : 'text-right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('students.action')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                return (
                
                  <tr 
                    key={student.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleStudentClick(student)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {formatDisplayValue(student.name)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDisplayValue(student.nationalId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDisplayValue(student.phone)}</div>
                      <div className="text-sm text-gray-500">{formatDisplayValue(student.instructorName)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {formatDisplayValue(getClassNameFromStudent(student))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {t(`students.categories.${formatDisplayValue(student.category)}`)}

                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'NORMAL' ? 'bg-blue-100 text-blue-800' :
                        student.status === 'HALF_FEES' ? 'bg-yellow-100 text-yellow-800' :
                        student.status === 'FIXED_50' ? 'bg-orange-100 text-orange-800' :
                        student.status === 'EXEMPT' ? 'bg-green-100 text-green-800' :
                        student.status === 'EXCLUDED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`students.statuses.${formatDisplayValue(student.status)}`)}

                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDisplayValue(student.startedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className={`flex items-center justify-end ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(student)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(student.id)
                          }}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStudent ? t('students.editStudent') : t('students.addNewStudent')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={t('students.firstName')}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder={t('students.lastName')}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="border px-3 py-2 rounded"
                  />
                </div>

                <input
                  type="tel"
                  placeholder={t('students.phone')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="border px-3 py-2 rounded w-full"
                />

                <input
                  type="text"
                  placeholder={t('students.nationalId')}
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  required
                  className="border px-3 py-2 rounded w-full"
                />

                <input
                  type="text"
                  placeholder={t('students.instructorName')}
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                  required
                  className="border px-3 py-2 rounded w-full"
                />

                <select
                  value={formData.classId}
                  onChange={(e) => {
                    setFormData({ ...formData, classId: e.target.value })
                  }}
                  required
                  className="border px-3 py-2 rounded w-full"
                >
                  <option value="" disabled>
                    {t('students.selectClass')}
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={String(cls.id)}>
                      {cls.name}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="border px-3 py-2 rounded w-full"
                >
                  <option value="" disabled>
                    {t('students.selectCategory')}
                  </option>
                  <option value="Men">رجال</option>
                  <option value="Women">نساء</option>
                  <option value="Children">أطفال</option>
                </select>

                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="border px-3 py-2 rounded w-full"
                >
                  <option value="NORMAL">{t('students.normal')}</option>
                  <option value="HALF_FEES">{t('students.halfFees')}</option>
                  <option value="FIXED_50">{t('students.fixed50')}</option>
                  <option value="EXEMPT">{t('students.exempt')}</option>
                  <option value="EXCLUDED">{t('students.excluded')}</option>
                </select>

                {formData.category === 'Children' && (
                  <>
                    <label className="block text-sm font-medium text-gray-700">{t('students.guardianName')}</label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({...formData, guardianName: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required={formData.category === 'Children'}
                    />

                    <label className="block text-sm font-medium text-gray-700">{t('students.guardianPhone')}</label>
                    <input
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required={formData.category === 'Children'}
                    />
                  </>
                )}
                
                {formData.status === 'EXCLUDED' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('students.exclusionStartDate')}</label>
                      <input
                        type="date"
                        value={formData.exclusionStart || ''}
                        onChange={(e) => setFormData({...formData, exclusionStart: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                )}

                <input
                  type="date"
                  placeholder={t('students.startedDate')}
                  value={formData.startedAt}
                  onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })}
                  required
                  className="border px-3 py-2 rounded w-full"
                />

                <div className={`flex justify-end ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingStudent(null)
                      resetForm()
                    }}
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                  >
                    {t('students.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {editingStudent ? t('students.update') : t('students.add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={selectedStudent}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedStudent(null)
        }}
      />
    </div>
  )
}

export default Students