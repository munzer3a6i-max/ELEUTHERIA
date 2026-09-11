export const translations = {
  // Sidebar / navigation
  nav_dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  nav_recruitments: { en: 'Recruitments', ar: 'طلبات الاستقدام' },
  nav_applicants: { en: 'Applicants', ar: 'المتقدمون' },
  nav_employers: { en: 'Employer Profile', ar: 'ملف صاحب العمل' },
  nav_agencies: { en: 'Recruitment Agency', ar: 'مكتب الاستقدام' },
  nav_staff: { en: 'Staff', ar: 'الموظفون' },
  nav_addons: { en: 'Addons', ar: 'الإعدادات الفرعية' },
  nav_invoices: { en: 'Invoices', ar: 'الفواتير' },
  nav_reports: { en: 'Reports', ar: 'التقارير' },
  nav_notifications: { en: 'Notifications', ar: 'الإشعارات' },
  nav_settings: { en: 'Settings', ar: 'الإعدادات' },
  nav_logout: { en: 'Log Out', ar: 'تسجيل الخروج' },

  // Common actions
  action_add: { en: 'Add', ar: 'إضافة' },
  action_edit: { en: 'Edit', ar: 'تعديل' },
  action_delete: { en: 'Delete', ar: 'حذف' },
  action_view: { en: 'View', ar: 'عرض' },
  action_save: { en: 'Save Changes', ar: 'حفظ التغييرات' },
  action_cancel: { en: 'Cancel', ar: 'إلغاء' },
  action_search: { en: 'Search', ar: 'بحث' },
  action_create: { en: 'Create New', ar: 'إنشاء جديد' },
  action_export: { en: 'Export', ar: 'تصدير' },

  // Common labels
  label_status: { en: 'Status', ar: 'الحالة' },
  label_name: { en: 'Name', ar: 'الاسم' },
  label_date: { en: 'Date', ar: 'التاريخ' },
  label_amount: { en: 'Amount', ar: 'المبلغ' },
  label_action: { en: 'Action', ar: 'الإجراء' },
  label_phone: { en: 'Phone', ar: 'الهاتف' },
  label_email: { en: 'Email', ar: 'البريد الإلكتروني' },
  label_english_name: { en: 'English Name', ar: 'الاسم بالإنجليزية' },
  label_arabic_name: { en: 'Arabic Name', ar: 'الاسم بالعربية' },
  label_all: { en: 'All', ar: 'الكل' },
  label_active: { en: 'Active', ar: 'نشط' },
  label_inactive: { en: 'Inactive', ar: 'غير نشط' },

  // Page titles
  page_dashboard_subtitle: { en: 'Overview of your placement pipeline', ar: 'نظرة عامة على مسار الاستقدام' },
  page_applicants_subtitle: { en: 'Candidates available for placement', ar: 'المرشحون المتاحون للتوظيف' },
  page_employers_subtitle: { en: 'Saudi employers / clients', ar: 'أصحاب العمل / العملاء السعوديون' },
  page_agencies_subtitle: { en: 'Overseas partner recruitment offices', ar: 'مكاتب الاستقدام الشريكة بالخارج' },
  page_requests_subtitle: { en: 'Every applicant-employer placement in progress', ar: 'كل عملية استقدام قيد التنفيذ' },
  page_invoices_subtitle: { en: 'Service invoices billed to employers', ar: 'فواتير الخدمة الصادرة لأصحاب العمل' },
  page_staff_subtitle: { en: 'Internal team accounts', ar: 'حسابات الفريق الداخلي' },
  page_reports_subtitle: { en: 'Pipeline and financial performance overview', ar: 'نظرة عامة على الأداء المالي والتشغيلي' },

  // Recruitment types
  type_domestic: { en: 'Domestic', ar: 'عمالة منزلية' },
  type_profession: { en: 'Profession', ar: 'مهنية' },

  // Language / theme toggles
  toggle_language: { en: 'العربية', ar: 'English' },
  toggle_theme_to_light: { en: 'Light mode', ar: 'الوضع الفاتح' },
  toggle_theme_to_dark: { en: 'Dark mode', ar: 'الوضع الداكن' },
} as const

export type TranslationKey = keyof typeof translations
