import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiFileText, FiDownload, FiBookOpen } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reports = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchSubjects();
      const querySubjId = searchParams.get('subjectId');
      if (querySubjId) setSubjectId(querySubjId);
    }
  }, [user, searchParams]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      let q;
      if (user.role === 'teacher') {
        q = query(collection(db, 'subjects'), where('teacher._id', '==', user._id));
      } else {
        q = query(collection(db, 'subjects'));
      }
      const res = await getDocs(q);
      const list = res.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setSubjects(list);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    if (!subjectId) {
      return toast.error('Please select a subject to export');
    }

    const selectedSubject = subjects.find(s => s._id === subjectId);
    const subjectCode = selectedSubject ? selectedSubject.code : 'Report';
    const subjectName = selectedSubject ? selectedSubject.name : 'All Classes';

    setDownloading(true);
    const toastId = toast.loading(`Generating ${type} report...`);

    try {
      // 1. Fetch attendance records for this subject from Firestore
      const q = query(
        collection(db, 'attendance'),
        where('subject._id', '==', subjectId)
      );
      const snap = await getDocs(q);
      const records = snap.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));

      // Sort by date descending
      records.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (records.length === 0) {
        toast.error('No attendance records found for this subject.', { id: toastId });
        setDownloading(false);
        return;
      }

      if (type === 'excel') {
        // 2. Generate Excel file client-side
        const rows = records.map((rec) => {
          const student = rec.student || {};
          const formattedDate = new Date(rec.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          return {
            'Student Name': student.name || 'N/A',
            'Register Number': student.registerNumber || 'N/A',
            'Department': student.department || 'N/A',
            'Year': student.year || 'N/A',
            'Date': formattedDate,
            'Time': rec.time || 'N/A',
            'Status': rec.status || 'N/A'
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        
        // Auto-fit column widths
        const maxLenArr = [];
        rows.forEach(row => {
          Object.keys(row).forEach((key, index) => {
            const cellValue = row[key] ? row[key].toString() : '';
            maxLenArr[index] = Math.max(maxLenArr[index] || 10, cellValue.length, key.length);
          });
        });
        worksheet['!cols'] = maxLenArr.map(w => ({ wch: w + 3 }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AttendanceLogs');
        XLSX.writeFile(workbook, `Attendance_${subjectCode}_${Date.now()}.xlsx`);

      } else if (type === 'pdf') {
        // 3. Generate PDF file client-side with jsPDF and AutoTable
        const docPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        // Header Navy Banner
        docPDF.setFillColor(30, 58, 138); // #1e3a8a
        docPDF.rect(10, 10, 190, 20, 'F');
        
        docPDF.setTextColor(255, 255, 255);
        docPDF.setFont('helvetica', 'bold');
        docPDF.setFontSize(15);
        docPDF.text('Smart Attendance Report', 105, 17, { align: 'center' });
        
        docPDF.setFont('helvetica', 'normal');
        docPDF.setFontSize(9);
        docPDF.text(`${subjectName} (${subjectCode})`, 105, 25, { align: 'center' });
        
        // Metadata text block
        docPDF.setTextColor(51, 65, 85);
        docPDF.setFontSize(9);
        docPDF.text(`Exported on: ${new Date().toLocaleString()}`, 10, 38);
        docPDF.text(`Total Records: ${records.length}`, 10, 43);
        
        const headers = [['Student Name', 'Reg No', 'Dept', 'Date', 'Time', 'Status']];
        const tableRows = records.map((rec) => {
          const student = rec.student || {};
          const formattedDate = new Date(rec.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          return [
            student.name || 'N/A',
            student.registerNumber || 'N/A',
            student.department || 'N/A',
            formattedDate,
            rec.time || 'N/A',
            rec.status || 'N/A'
          ];
        });

        docPDF.autoTable({
          startY: 48,
          head: headers,
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 8.5, font: 'helvetica' },
          didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 5) {
              const val = data.cell.raw;
              if (val === 'Present') {
                data.cell.styles.textColor = [22, 163, 74];
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });

        docPDF.save(`Attendance_${subjectCode}_${Date.now()}.pdf`);
      }

      toast.success(`${type.toUpperCase()} report downloaded successfully!`, { id: toastId });
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(`Failed to export ${type} report`, { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-md mx-auto space-y-6">
        <div className="glass-card p-6 animate-pulse space-y-4">
          <div className="h-6 bg-slate-350 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-10 bg-slate-350 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-10 bg-slate-350 dark:bg-slate-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <FiFileText className="text-primary-500" />
          <span>Attendance Reports</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Download formatted PDF and Excel logs for your classes</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 flex items-center space-x-1">
            <FiBookOpen />
            <span>Choose Subject</span>
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="glass-input w-full text-sm appearance-none"
            required
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          {/* Excel Export Card */}
          <button
            onClick={() => handleExport('excel')}
            disabled={downloading || !subjectId}
            className="p-6 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-350 flex flex-col items-center justify-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <FiDownload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <div className="text-center">
              <h4 className="font-bold text-sm">Download Excel Sheet</h4>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Spreadsheet (.xlsx) with formatting</p>
            </div>
          </button>

          {/* PDF Export Card */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={downloading || !subjectId}
            className="p-6 rounded-2xl bg-rose-500/10 dark:bg-rose-500/25 border border-rose-500/30 text-rose-800 dark:text-rose-350 flex flex-col items-center justify-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <FiDownload className="w-8 h-8 text-rose-600 dark:text-rose-450" />
            <div className="text-center">
              <h4 className="font-bold text-sm">Download PDF Document</h4>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Styled document ready for printing</p>
            </div>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-450">
        <p className="font-bold text-slate-700 dark:text-slate-350">Report Details:</p>
        <p>• **Excel reports** contain individual columns for student name, register number, department, year, date, time, and status. It is optimized for grading and imports.</p>
        <p>• **PDF reports** are formatted with zebra-striping and layout borders, fitting standard A4 sizes for physical archives.</p>
      </div>
    </div>
  );
};

export default Reports;
