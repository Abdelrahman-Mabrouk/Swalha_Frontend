import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/apiService'

const SearchableStudentDropdown = ({ value, onChange, placeholder = "Select a student..." }) => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  
  const [isOpen, setIsOpen] = useState(false)
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students.slice(0, 10)) // Show first 10 students when no search
    } else {
      const filtered = students.filter(student => {
        const fullName = `${student.name || `${student.firstName || ''} ${student.lastName || ''}`}`.toLowerCase()
        const category = (student.category || '').toLowerCase()
        const searchLower = searchTerm.toLowerCase()
        
        return fullName.includes(searchLower) || category.includes(searchLower)
      })
      setFilteredStudents(filtered.slice(0, 10)) // Limit to 10 results
    }
  }, [searchTerm, students])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const data = await apiService.getStudents()
      setStudents(data)
      setFilteredStudents(data.slice(0, 10))
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (student) => {
    onChange(student)
    setIsOpen(false)
    setSearchTerm('')
  }

  const getStudentDisplayName = (student) => {
    if (student.name) return student.name
    return `${student.firstName || ''} ${student.lastName || ''}`.trim()
  }

  const selectedStudent = students.find(s => s.id === value?.id)

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'justify-between'}`}>
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            {selectedStudent ? (
              <>
                <User className={`h-4 w-4 text-gray-400 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="text-gray-900">
                  {getStudentDisplayName(selectedStudent)}
                </span>
                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-500`}>
                  ({selectedStudent.category})
                </span>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <input
                type="text"
                placeholder={t('search_students')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                autoFocus
              />
            </div>
          </div>

          {/* Students List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">{t('loading_students')}</p>
              </div>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelect(student)}
                >
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'justify-between'}`}>
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <User className={`h-4 w-4 text-gray-400 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <div>
                        <div className="font-medium text-gray-900">
                          {getStudentDisplayName(student)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.category} • {student.phone}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {t('id')}: {student.id}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? t('no_students_found') : t('no_students_available')}
              </div>
            )}
          </div>

          {/* Footer with count */}
          {filteredStudents.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              {t('showing_students_count', { count: filteredStudents.length, total: students.length })}
              {searchTerm && ` ${t('matching_search', { searchTerm: searchTerm })}`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableStudentDropdown
