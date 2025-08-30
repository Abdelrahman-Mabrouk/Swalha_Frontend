import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/apiService'

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' for ascending, 'desc' for descending
  const [formData, setFormData] = useState({
    studentName: '',
    address: '',
    age: '',
    qualification: '',
    national_id: '',
    enrollment_date: '',
    phoneNumber: '',
    mobileNumber: '',
    job: '',
    employer: '',
    previousMemorizationAmount: '',
    level: '',
    examinerName: '',
    day_of_attendance: '',
    specific_time: '',
    expenses: '',
    receiver: '',
    submissionDate: '',
        category: ''

  });

  const { t } = useTranslation();
  const { language } = useLanguage();

  // Function to sort students by date
  const sortStudentsByDate = (studentsArray, order = 'asc') => {
    return studentsArray.sort((a, b) => {
      // Get submission dates, use empty string if not available
      const dateA = a.submissionDate || '';
      const dateB = b.submissionDate || '';
      
      // Handle empty dates - put them at the end
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      // Convert to Date objects for comparison
      const parsedDateA = new Date(dateA);
      const parsedDateB = new Date(dateB);
      
      // Check for invalid dates
      const validDateA = !isNaN(parsedDateA.getTime());
      const validDateB = !isNaN(parsedDateB.getTime());
      
      if (!validDateA && !validDateB) return 0;
      if (!validDateA) return 1;
      if (!validDateB) return -1;
      
      // Sort based on order
      if (order === 'asc') {
        return parsedDateA - parsedDateB;
      } else {
        return parsedDateB - parsedDateA;
      }
    });
  };

  const loadWaitingList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getWaitingList();
      const studentsArray = Array.isArray(data) ? data : [];
      
      // Sort the students by submission date
      const sortedStudents = sortStudentsByDate(studentsArray, sortOrder);
      setStudents(sortedStudents);
      
    } catch (error) {
      console.error('Error loading waiting list:', error);
      setError(error.message);
      setStudents([]);
      alert('خطأ في تحميل قائمة الانتظار: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle sort order
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    // Re-sort current students array
    const sortedStudents = sortStudentsByDate([...students], newOrder);
    setStudents(sortedStudents);
  };

  const handleEdit = (student) => {
    setFormData({
      studentName: student.studentName || '',
      address: student.address || '',
      age: student.age?.toString() || '',
      qualification: student.qualification || '',
      national_id: student.national_id || '',
      enrollment_date: student.enrollment_date || '',
      phoneNumber: student.phoneNumber || '',
      mobileNumber: student.mobileNumber || '',
      job: student.job || '',
      employer: student.employer || '',
      previousMemorizationAmount: student.previousMemorizationAmount || '',
      level: student.level || '',
      examinerName: student.examinerName || '',
      day_of_attendance: student.day_of_attendance || '',
      specific_time: student.specific_time || '',
      expenses: student.expenses || '',
      receiver: student.receiver || '',
      submissionDate: student.submissionDate || '',
      category: student.category || ''
    });
    setEditingStudent(student);
  };

  const handleDelete = async (student) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    
    try {
      await apiService.deleteStudentfromWating({ studentName: student.studentName });
      alert('تم حذف الطالب بنجاح');
      await loadWaitingList();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('خطأ في حذف الطالب: ' + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async () => {
    if (!formData.studentName.trim()) {
      alert('يرجى إدخال اسم الطالب');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await apiService.editStudent(formData);
      alert('تم تعديل بيانات الطالب بنجاح');
      setEditingStudent(null);
      setFormData({
        studentName: '',
        address: '',
        age: '',
        qualification: '',
        national_id: '',
        enrollment_date: '',
        phoneNumber: '',
        mobileNumber: '',
        job: '',
        employer: '',
        previousMemorizationAmount: '',
        level: '',
        examinerName: '',
        day_of_attendance: '',
        specific_time: '',
        expenses: '',
        receiver: '',
        submissionDate: '',
        category: ''
      });
      await loadWaitingList();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      alert('حدث خطأ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingStudent(null);
    setFormData({
      studentName: '',
      address: '',
      age: '',
      qualification: '',
      national_id: '',
      enrollment_date: '',
      phoneNumber: '',
      mobileNumber: '',
      job: '',
      employer: '',
      previousMemorizationAmount: '',
      level: '',
      examinerName: '',
      day_of_attendance: '',
      specific_time: '',
      expenses: '',
      receiver: '',
      submissionDate: '',
        category: ''
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    loadWaitingList();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">
        قائمة انتظار الطلاب
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Edit Form - Only shows when editing */}
        {editingStudent && (
          <div className="lg:col-span-1 bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              تعديل بيانات الطالب
            </h2>
            
            <div className="space-y-4">
              {/* Personal Information */}
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4 text-blue-700">البيانات الشخصية</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم الطالب *
                    </label>
                    <input
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      العمر
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الهوية
                    </label>
                    <input
                      type="text"
                      name="national_id"
                      value={formData.national_id}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المؤهل العلمي
                    </label>
                    <select
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">اختر المؤهل العلمي</option>
                      <option value="أمي">أمي</option>
                      <option value="يقرأ ويكتب">يقرأ ويكتب</option>
                      <option value="ابتدائية">ابتدائية</option>
                      <option value="متوسطة">متوسطة</option>
                      <option value="ثانوية">ثانوية</option>
                      <option value="دبلوم">دبلوم</option>
                      <option value="بكالوريوس">بكالوريوس</option>
                      <option value="ماجستير">ماجستير</option>
                      <option value="دكتوراه">دكتوراه</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      العنوان
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4 text-blue-700">بيانات الاتصال</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الجوال
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4 text-blue-700">البيانات الأكاديمية</h3>
                <div className="space-y-4">
                     <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الفئة
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">اختر الفئة</option>
                      <option value="أطفال">أطفال</option>
                      <option value="رجال">رجال</option>
                      <option value="نساء">نساء</option>
               
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المستوى
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">اختر المستوى</option>
                      <option value="تمهيدي">تمهيدي</option>
                      <option value="فرقة أولي">فرقة أولي</option>
                      <option value="نور بيان">نور بيان</option>
                      <option value="إجازة">إجازة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      مقدار الحفظ السابق
                    </label>
                    <select
                      name="previousMemorizationAmount"
                      value={formData.previousMemorizationAmount}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">اختر مقدار الحفظ</option>
                      <option value="لا يحفظ">لا يحفظ</option>
                      <option value="أقل من جزء">أقل من جزء</option>
                      <option value="جزء واحد">جزء واحد (1)</option>
                      <option value="جزءان">جزءان (2)</option>
                      <option value="ثلاثة أجزاء">ثلاثة أجزاء (3)</option>
                      <option value="أربعة أجزاء">أربعة أجزاء (4)</option>
                      <option value="خمسة أجزاء">خمسة أجزاء (5)</option>
                      <option value="ستة أجزاء">ستة أجزاء (6)</option>
                      <option value="سبعة أجزاء">سبعة أجزاء (7)</option>
                      <option value="ثمانية أجزاء">ثمانية أجزاء (8)</option>
                      <option value="تسعة أجزاء">تسعة أجزاء (9)</option>
                      <option value="عشرة أجزاء">عشرة أجزاء (10)</option>
                      <option value="11-15 جزء">11-15 جزء</option>
                      <option value="16-20 جزء">16-20 جزء</option>
                      <option value="21-25 جزء">21-25 جزء</option>
                      <option value="26-29 جزء">26-29 جزء</option>
                      <option value="القرآن كاملاً">القرآن كاملاً (30 جزء)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ التقديم
                    </label>
                    <input
                      type="date"
                      name="submissionDate"
                      value={formData.submissionDate}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? 'جاري المعالجة...' : 'تحديث البيانات'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 font-medium transition-colors"
                >
                  إلغاء التعديل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students List Section */}
        <div className={`bg-white shadow-lg rounded-lg p-6 ${editingStudent ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-gray-800">قائمة الانتظار</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                إجمالي: {students.length} طالب
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleSortOrder}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                title={sortOrder === 'asc' ? 'ترتيب تنازلي' : 'ترتيب تصاعدي'}
              >
                <span>ترتيب حسب التاريخ</span>
                <span className="text-xs">
                  {sortOrder === 'asc' ? '↑ تصاعدي' : '↓ تنازلي'}
                </span>
              </button>
              <button
                onClick={loadWaitingList}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'جاري التحديث...' : 'تحديث القائمة'}
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {error ? 'حدث خطأ في تحميل البيانات' : 'لا توجد طلاب في قائمة الانتظار'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {students.map((student, index) => (
                  <div 
                    key={student.id || index} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group"
                    title={`الترتيب: ${index + 1} من ${students.length} - يسبقه ${index} طالب`}
                  >
                    {/* Position indicator - shows on hover */}
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      #{index + 1}
                    </div>
                    
                    {/* Tooltip content - shows detailed position info on hover */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      الترتيب: {index + 1} من {students.length} • يسبقه {index} طالب
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg text-blue-800 truncate">
                          {student.studentName}
                        </h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 transition-colors"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {student.submissionDate && (
                        <p className="text-blue-600 font-medium">
                          تاريخ التقديم: {formatDate(student.submissionDate)}
                        </p>
                      )}
                      {student.age && <p>العمر: {student.age}</p>}
                      {student.phoneNumber && <p>الهاتف: {student.phoneNumber}</p>}
                      {student.mobileNumber && <p>الجوال: {student.mobileNumber}</p>}
                      {student.category && <p>الفئة: {student.category}</p>}
                      {student.level && <p>المستوي: {student.level}</p>}
                                            {student.previousMemorizationAmount && <p>الحفظ السابق: {student.previousMemorizationAmount}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsList;