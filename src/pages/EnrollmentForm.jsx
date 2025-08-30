import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/apiService'

const WaitingListForm = () => {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { t } = useTranslation();
  const { language } = useLanguage();
  
  const handleSubmit = async () => {
    if (!formData.studentName.trim()) {
      alert('يرجى إدخال اسم الطالب');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await apiService.addToWaitingList(formData);
      alert('تم إضافة الطالب إلى قائمة الانتظار بنجاح');
      
      // Reset form
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
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      alert('حدث خطأ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
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
    setError(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">
        نموذج إضافة طالب جديد لقائمة الانتظار
      </h1>
      
      {/* Form Section */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          إضافة طالب جديد
        </h2>
        
        <div className="space-y-4">
          {/* Personal Information */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 text-blue-700">البيانات الشخصية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="md:col-span-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Work Information */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 text-blue-700">بيانات العمل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المهنة
                </label>
                <input
                  type="text"
                  name="job"
                  value={formData.job}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  جهة العمل
                </label>
                <input
                  type="text"
                  name="employer"
                  value={formData.employer}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 text-blue-700">البيانات الأكاديمية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  اسم الممتحن
                </label>
                <input
                  type="text"
                  name="examinerName"
                  value={formData.examinerName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المصاريف
                </label>
                <input
                  type="text"
                  name="expenses"
                  value={formData.expenses}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dates and Times */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 text-blue-700">التواريخ والأوقات</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Receiver Information */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 text-blue-700">بيانات المستلم</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المستلم
              </label>
              <input
                type="text"
                name="receiver"
                value={formData.receiver}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? 'جاري المعالجة...' : 'إضافة إلى قائمة الانتظار'}
              </button>

            </div>
          </div>
        </div>

    
      </div>
    </div>
  );
};

export default WaitingListForm;