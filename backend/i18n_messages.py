"""
Bilingual API messages (I-28).

Messages are written in Arabic at the call site (the platform's primary
language). When the client sends `Accept-Language: en...`, error details and
success messages are served in English from the tables below. Notifications
are stored in both languages instead (see create_notification in main.py).
"""
import re
from contextvars import ContextVar

current_lang: ContextVar[str] = ContextVar("current_lang", default="ar")


def lang_from_header(value: str) -> str:
    return "en" if (value or "").strip().lower().startswith("en") else "ar"


EN = {
    "جلسة غير صالحة أو منتهية، يرجى تسجيل الدخول مجدداً": "Invalid or expired session, please sign in again",
    "ليس لديك الصلاحية لتنفيذ هذا الإجراء": "You do not have permission to perform this action",
    "محاولات كثيرة جداً، يرجى المحاولة لاحقاً": "Too many attempts, please try again later",
    "البريد الإلكتروني أو كلمة المرور غير صحيحة": "Incorrect email or password",
    "هذا الحساب معطّل، يرجى التواصل مع إدارة المنصة": "This account is disabled, please contact the platform administrator",
    "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة لاحقاً": "Something went wrong while signing in, please try again later",
    "البريد الإلكتروني مسجل مسبقاً لمستخدم آخر": "This email is already registered",
    "غير مصرح بالتسجيل الذاتي برتبة مسؤول أو مشرف أكاديمي": "You cannot self-register as an admin or academic supervisor",
    "حدث خطأ أثناء إنشاء المستخدم، يرجى التأكد من البيانات": "Could not create the account, please check your details",
    "تعذر حفظ الملف حالياً، يرجى المحاولة لاحقاً": "Could not save the file right now, please try again later",
    "تعذر تجهيز رابط التنزيل حالياً، يرجى المحاولة لاحقاً": "Could not prepare the download link right now, please try again later",
    "رفع السيرة الذاتية متاح للطلاب فقط": "Only students can upload a CV",
    "صيغة الملف غير مدعومة، يرجى رفع ملف PDF صالح فقط.": "Unsupported file, please upload a valid PDF.",
    "ليس لديك الصلاحية للاطلاع على هذه السيرة الذاتية": "You do not have permission to view this CV",
    "لا توجد سيرة ذاتية مرفوعة": "No CV has been uploaded",
    "الرابط غير صالح أو منتهي الصلاحية": "The link is invalid or has expired",
    "كلمة المرور الحالية غير صحيحة": "Current password is incorrect",
    "يجب أن تتكون كلمة المرور الجديدة من 8 خانات على الأقل": "The new password must be at least 8 characters",
    "ليس لديك الصلاحية لتعديل هذا المشروع، فقط المالك أو المشرف يمكنه ذلك": "Only the project owner or its supervisor can edit this project",
    "المشرف المحدد غير موجود أو ليس مشرفاً أكاديمياً": "The selected supervisor does not exist or is not an academic supervisor",
    "ليس لديك الصلاحية لتعديل حالة هذا المشروع، فقط المشرف الأكاديمي أو الأدمن يمكنه ذلك": "Only the academic supervisor or an admin can change this project's status",
    "يرجى تحديد حالة المشروع الجديدة: approved, rejected, pending": "Please provide the new project status: approved, rejected, pending",
    "الحالة غير صالحة. الحالات المسموحة: approved, rejected, pending": "Invalid status. Allowed: approved, rejected, pending",
    "ليس لديك الصلاحية لحذف هذا المشروع، فقط المالك أو المشرف يمكنه ذلك": "Only the project owner or its supervisor can delete this project",
    "التقديم على المشاريع متاح للطلاب فقط": "Only students can apply to projects",
    "المشروع المطلوب غير موجود": "Project not found",
    "لا يمكن التقديم إلا على مشروع معتمد من المشرف الأكاديمي": "You can only apply to projects approved by the academic supervisor",
    "لا يمكنك التقديم على مشروع قمت بإنشائه": "You cannot apply to a project you created",
    "لقد قمت بالتقديم على هذا المشروع مسبقاً ولا يمكنك التقديم أكثر من مرة": "You have already applied to this project",
    "ليس لديك الصلاحية لعرض طلبات هذا المشروع": "You do not have permission to view this project's applications",
    "طلب الانضمام غير موجود": "Application not found",
    "ليس لديك الصلاحية لتغيير حالة هذا الطلب، فقط الشركة المالكة للمشروع أو المشرف الأكاديمي": "Only the project's company or its academic supervisor can change this application",
    "يرجى إرسال الحالة الجديدة للطلب": "Please provide the new application status",
    "مشاريع الشركات تتطلب ترشيح الشركة للطالب قبل الاعتماد الأكاديمي": "Company projects require the company's nomination before academic approval",
    "لا يمكن اعتماد الطلب أكاديمياً قبل اعتماد المشروع نفسه": "The project must be approved before applications can be academically approved",
    "ليس لديك الصلاحية للدخول أو المشاركة في شات هذا المشروع": "You do not have access to this project's chat",
    "لا يمكن إرسال رسالة فارغة": "You cannot send an empty message",
    "ليس لديك الصلاحية لعرض شات هذا المشروع": "You do not have access to this project's chat",
    "الإشعار غير موجود": "Notification not found",
    "رفع ملفات التقارير متاح للطلاب فقط": "Only students can upload report files",
    "صيغة الملف غير مدعومة. الصيغ المسموحة: PDF, DOCX, PPTX, ZIP, DOC": "Unsupported file. Allowed formats: PDF, DOCX, PPTX, ZIP, DOC",
    "التقرير المطلوب غير موجود": "Report not found",
    "ليس لديك الصلاحية للاطلاع على هذا التقرير": "You do not have permission to view this report",
    "لا يوجد ملف مرفوع لهذا التقرير": "No file was uploaded for this report",
    "المشروع المرتبط بهذا التقرير غير موجود": "The project for this report does not exist",
    "لا يمكنك رفع تقرير إلا لمشروع أنت عضو معتمد فيه": "You can only submit reports for a project you are an approved member of",
    "ملف التقرير غير صالح": "Invalid report file",
    "ليس لديك الصلاحية لمراجعة هذا التقرير، فقط مالك المشروع أو مشرفه أو الأدمن": "Only the project owner, its supervisor or an admin can review this report",
    "حالة التقرير غير صالحة. الحالات المسموحة: approved, needs_changes, pending, rejected": "Invalid report status. Allowed: approved, needs_changes, pending, rejected",
    "المستخدم غير موجود": "User not found",
    "لا يمكنك تعطيل أو حذف حسابك الخاص": "You cannot disable or delete your own account",
    "الدور غير صالح. الأدوار المسموحة: supervisor, admin": "Invalid role. Allowed: supervisor, admin",
    # success messages
    "حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً": "Internal server error, please try again later",
    "تم تسجيل الخروج بنجاح": "Signed out successfully",
    "تم رفع ملف السيرة الذاتية بنجاح": "CV uploaded successfully",
    "تم تحديث كلمة المرور بنجاح": "Password updated successfully",
    "تم تحديد جميع الإشعارات كمقروءة": "All notifications marked as read",
    "تم حفظ الإعدادات": "Settings saved",
}

PATTERNS = [
    (re.compile(r"^حجم الملف يتجاوز الحد المسموح \((\d+) ميغابايت\)$"), "The file exceeds the size limit ({0} MB)"),
    (re.compile(r"^المشروع برقم (\d+) غير موجود$"), "Project {0} not found"),
    (re.compile(r"^لا يمكن تقليل عدد المقاعد إلى أقل من عدد الأعضاء الحاليين \((\d+)\)$"), "Seats cannot be reduced below the current member count ({0})"),
    (re.compile(r"^المشروع مكتمل المقاعد بالفعل \((\d+)/(\d+)\) ولا يقبل طلبات جديدة$"), "The project is already full ({0}/{1}) and does not accept new applications"),
    (re.compile(r"^انتقال غير مسموح من الحالة '([^']*)' إلى '([^']*)'$"), "Status change from '{0}' to '{1}' is not allowed"),
    (re.compile(r"^لا يمكن قبول الطلب، المقاعد مكتملة للمشروع \((\d+)/(\d+)\)$"), "Cannot accept: the project is full ({0}/{1})"),
]


def to_english(text: str) -> str:
    if text in EN:
        return EN[text]
    for pattern, template in PATTERNS:
        m = pattern.match(text)
        if m:
            return template.format(*m.groups())
    return text


def tr(text: str) -> str:
    """The message in the current request's language."""
    return to_english(text) if current_lang.get() == "en" else text
