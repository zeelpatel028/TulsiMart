import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SearchInput, EmptyState } from '../../components/common/UiHelpers';
import { 
  ShieldCheck, 
  Plus, 
  UserCheck, 
  UserX, 
  Edit, 
  Phone, 
  Mail, 
  IndianRupee, 
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  History,
  Users,
  Wallet,
  Check,
  X,
  Trash2,
  FileText,
  MessageSquare,
  Tag
} from 'lucide-react';
import { authApi, expensesApi, gullaApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';

export const StaffList = () => {
  const { showToast } = useNotification();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Gulla Live Summary State
  const [gullaSummary, setGullaSummary] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Add/Edit Staff Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Cashier',
    salary: '',
  });

  // Attendance & Advance Local Persistence
  const [attendance, setAttendance] = useState(() => {
    try {
      const saved = localStorage.getItem('tulsi_staff_attendance');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Salary Payment Modal State
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryStaff, setSalaryStaff] = useState(null);
  const [submittingSalary, setSubmittingSalary] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    base_salary: 0,
    present_days: 30,
    total_days: 30,
    advance_deduction: 0,
    bonus: 0,
    payment_method: 'CASH',
    salary_month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    notes: 'Monthly Staff Salary Payout',
  });

  // Advance Modal State
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceStaff, setAdvanceStaff] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');

  // Leave / Raja Date Modal State (રજા મોડલ સ્ટેટ)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStaff, setLeaveStaff] = useState(null);
  const [leaveDateInput, setLeaveDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [leaveType, setLeaveType] = useState('FULL');
  const [leaveNote, setLeaveNote] = useState('');

  // Staff Note / Remark Modal State (સ્પેશિયલ સ્ટાફ નોટ / રિમાર્કસ)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteStaff, setNoteStaff] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');

  // Delete Staff Modal State (સ્ટાફ ડીલીટ મોડલ સ્ટેટ)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(false);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyStaff, setHistoryStaff] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);

  // Gulla-style Denomination Currency Note Tally State (નોટ ગણતરી / નોટ કેલ્ક્યુલેટર)
  const [denominationCounts, setDenominationCounts] = useState({
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '1': 0
  });

  const DENOM_LIST = [500, 200, 100, 50, 20, 10, 5, 1];

  const calculateTotalFromNotes = (counts) => {
    let total = 0;
    DENOM_LIST.forEach(d => {
      const cnt = Number(counts[d] || counts[String(d)] || 0);
      total += d * cnt;
    });
    return total;
  };

  const handleNoteCountChange = (denom, val) => {
    const cnt = Math.max(0, parseInt(val || '0', 10));
    setDenominationCounts(prev => ({
      ...prev,
      [String(denom)]: cnt
    }));
  };

  const handleAutoFillGreedyNotes = (targetAmount) => {
    let amt = Math.max(0, Math.round(Number(targetAmount || 0)));
    const newCounts = { '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0 };
    
    for (const d of DENOM_LIST) {
      if (amt >= d) {
        newCounts[String(d)] = Math.floor(amt / d);
        amt = amt % d;
      }
    }
    setDenominationCounts(newCounts);
  };

  const getNotesSummaryString = (counts) => {
    const parts = [];
    for (const d of DENOM_LIST) {
      const cnt = Number(counts[d] || counts[String(d)] || 0);
      if (cnt > 0) {
        if (d === 1) parts.push(`Coins: ₹${cnt}`);
        else parts.push(`₹${d}×${cnt}`);
      }
    }
    return parts.length > 0 ? `[Gulla Notes: ${parts.join(', ')}]` : '';
  };

  useEffect(() => {
    loadStaff();
    loadGullaSummary();
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem('tulsi_staff_attendance', JSON.stringify(attendance));
    } catch (e) {
      console.error(e);
    }
  }, [attendance]);

  const loadGullaSummary = async () => {
    try {
      const res = await gullaApi.getGullaSummary();
      setGullaSummary(res.data || res);
    } catch (err) {
      console.warn('Gulla summary load note:', err);
    }
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await authApi.getStaff({ search });
      setStaffList(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get staff attendance record
  const getStaffAttendance = (staffId) => {
    const record = attendance[staffId] || {};
    return {
      presentDays: record.presentDays ?? 26,
      halfDays: record.halfDays ?? 0,
      absentDays: record.absentDays ?? 4,
      advanceTaken: record.advanceTaken ?? 0,
      todayMarked: record.todayMarked ?? false,
      leaveDates: record.leaveDates || [],
      staffNotes: record.staffNotes || [],
      payoutHistory: record.payoutHistory || []
    };
  };

  // Mark Attendance (હાજરી પૂરવી)
  const handleMarkAttendance = (staff, status) => {
    const current = getStaffAttendance(staff.id);
    let updated = { ...current };

    if (status === 'PRESENT') {
      updated.presentDays += 1;
      updated.todayMarked = 'PRESENT';
      showToast(`Marked ${staff.first_name || staff.username} as Present (હાજર) today!`, 'success');
    } else if (status === 'HALF_DAY') {
      updated.halfDays += 1;
      updated.todayMarked = 'HALF_DAY';
      showToast(`Marked ${staff.first_name || staff.username} as Half Day (અડધો દિવસ) today!`, 'info');
    } else if (status === 'ABSENT') {
      updated.absentDays += 1;
      updated.todayMarked = 'ABSENT';
      showToast(`Marked ${staff.first_name || staff.username} as Absent (ગેરહાજર) today!`, 'warning');
    }

    setAttendance(prev => ({
      ...prev,
      [staff.id]: updated
    }));
  };

  // Staff Note Handlers (સ્ટાફ રિમાર્કસ / નોટ હેન્ડલર)
  const handleOpenNoteModal = (staff) => {
    setNoteStaff(staff);
    setNoteText('');
    setNoteCategory('General');
    setIsNoteModalOpen(true);
  };

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!noteStaff || !noteText.trim()) {
      showToast('Please enter note content', 'warning');
      return;
    }

    const att = getStaffAttendance(noteStaff.id);
    const newNote = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      category: noteCategory,
      text: noteText.trim()
    };

    const updatedNotes = [newNote, ...(att.staffNotes || [])];

    setAttendance(prev => ({
      ...prev,
      [noteStaff.id]: {
        ...att,
        staffNotes: updatedNotes
      }
    }));

    showToast(`Note logged for ${noteStaff.first_name || noteStaff.username}!`, 'success');
    setIsNoteModalOpen(false);
  };

  const handleRemoveNote = (staffId, noteId) => {
    const att = getStaffAttendance(staffId);
    const updatedNotes = (att.staffNotes || []).filter(n => n.id !== noteId);

    setAttendance(prev => ({
      ...prev,
      [staffId]: {
        ...att,
        staffNotes: updatedNotes
      }
    }));
    showToast('Staff note deleted!', 'info');
  };

  // Log Raja / Leave Date (રજાની તારીખ નોંધવી)
  const handleOpenLeaveModal = (staff) => {
    setLeaveStaff(staff);
    setLeaveDateInput(new Date().toISOString().split('T')[0]);
    setLeaveType('FULL');
    setLeaveNote('');
    setIsLeaveModalOpen(true);
  };

  const handleAddLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveStaff || !leaveDateInput) return;
    const att = getStaffAttendance(leaveStaff.id);
    const existing = att.leaveDates || [];

    if (existing.some(l => l.date === leaveDateInput)) {
      showToast('This leave date (રજાની તારીખ) is already logged!', 'warning');
      return;
    }

    const newLeave = {
      id: Date.now(),
      date: leaveDateInput,
      type: leaveType,
      note: leaveNote || (leaveType === 'FULL' ? 'Full Day Leave (આખો દિવસ રજા)' : 'Half Day Leave (અડધો દિવસ રજા)')
    };

    const updatedLeaves = [newLeave, ...existing];
    const deduction = leaveType === 'FULL' ? 1 : 0.5;
    const newPresentDays = Math.max(0, att.presentDays - deduction);

    setAttendance(prev => ({
      ...prev,
      [leaveStaff.id]: {
        ...att,
        presentDays: newPresentDays,
        absentDays: leaveType === 'FULL' ? att.absentDays + 1 : att.absentDays,
        halfDays: leaveType === 'HALF' ? att.halfDays + 1 : att.halfDays,
        leaveDates: updatedLeaves
      }
    }));

    showToast(`Raja Date (${leaveDateInput}) logged for ${leaveStaff.first_name || leaveStaff.username}!`, 'success');
    setIsLeaveModalOpen(false);
  };

  const handleRemoveLeave = (staffId, leaveId) => {
    const att = getStaffAttendance(staffId);
    const target = (att.leaveDates || []).find(l => l.id === leaveId);
    if (!target) return;

    const updatedLeaves = (att.leaveDates || []).filter(l => l.id !== leaveId);
    const restoration = target.type === 'FULL' ? 1 : 0.5;

    setAttendance(prev => ({
      ...prev,
      [staffId]: {
        ...att,
        presentDays: att.presentDays + restoration,
        leaveDates: updatedLeaves
      }
    }));

    showToast('Leave date removed and work day restored!', 'info');
  };

  // Open Create Staff Modal
  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      phone: '',
      role: 'Cashier',
      salary: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Staff Modal
  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    setFormData({
      name: s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.username,
      phone: s.phone || '',
      role: s.role || 'Cashier',
      salary: s.salary || '',
    });
    setIsModalOpen(true);
  };

  // Submit Staff Create / Edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Name and phone number are required', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
      const usernameGenerated = phoneDigits.length >= 4 
        ? `staff_${phoneDigits.slice(-6)}` 
        : `user_${Date.now().toString().slice(-6)}`;

      const payload = {
        username: editingStaff ? editingStaff.username : usernameGenerated,
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone.trim(),
        role: formData.role || 'Cashier',
        salary: parseFloat(formData.salary || 0)
      };

      if (editingStaff) {
        await authApi.updateStaff(editingStaff.id, payload);
        showToast('Staff member updated successfully!', 'success');
      } else {
        await authApi.createStaff(payload);
        showToast('New staff member registered!', 'success');
      }

      setIsModalOpen(false);
      loadStaff();
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = 'Failed to save staff member';
      if (errorData && typeof errorData === 'object') {
        const messages = Object.entries(errorData).map(([key, val]) => {
          const valStr = Array.isArray(val) ? val.join(', ') : String(val);
          return `${key}: ${valStr}`;
        });
        errorMsg = messages.join(' | ');
      }
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Staff Account Status
  const handleToggleStatus = async (s) => {
    try {
      await authApi.toggleStaffStatus(s.id);
      showToast(`Status updated for ${s.username}`, 'info');
      loadStaff();
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  // Delete Staff Handlers (સ્ટાફ ડીલીટ કરો)
  const handleOpenDelete = (staff) => {
    setDeleteConfirmStaff(staff);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStaffSubmit = async () => {
    if (!deleteConfirmStaff) return;
    try {
      setDeletingStaff(true);
      await authApi.deleteStaff(deleteConfirmStaff.id);
      showToast(`Staff member "${deleteConfirmStaff.first_name || deleteConfirmStaff.username}" deleted successfully!`, 'success');
      setIsDeleteModalOpen(false);
      setDeleteConfirmStaff(null);
      loadStaff();
    } catch (err) {
      showToast('Failed to delete staff member', 'error');
    } finally {
      setDeletingStaff(false);
    }
  };

  // Helper to compute salary days and leaves between start and end date
  const computeSalaryDaysFromDates = (startStr, endStr, staffId) => {
    if (!startStr || !endStr) return { totalDays: 30, workDays: 30, leavesInRange: [] };
    const d1 = new Date(startStr);
    const d2 = new Date(endStr);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) {
      return { totalDays: 1, workDays: 1, leavesInRange: [] };
    }

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const att = getStaffAttendance(staffId);
    const allLeaves = att.leaveDates || [];
    
    const leavesInRange = allLeaves.filter(l => {
      const lDate = new Date(l.date);
      return lDate >= d1 && lDate <= d2;
    });

    const fullLeaves = leavesInRange.filter(l => l.type === 'FULL').length;
    const halfLeaves = leavesInRange.filter(l => l.type === 'HALF').length;
    const leaveDeduction = fullLeaves + (halfLeaves * 0.5);

    const workDays = Math.max(0, totalDays - leaveDeduction);
    return { totalDays, workDays, leavesInRange };
  };

  const handleSalaryDateChange = (field, value) => {
    const startStr = field === 'start_date' ? value : salaryForm.start_date;
    const endStr = field === 'end_date' ? value : salaryForm.end_date;

    if (startStr && endStr && endStr < startStr) {
      showToast('⚠️ અંત તારીખ એ શરૂઆત તારીખ પછીની અથવા સમાન જ હોવી જોઈએ! (To Date cannot be before From Date)', 'warning');
      return;
    }

    let updatedForm = { ...salaryForm, [field]: value };
    if (salaryStaff && startStr && endStr) {
      const { totalDays, workDays } = computeSalaryDaysFromDates(startStr, endStr, salaryStaff.id);
      updatedForm.total_days = totalDays;
      updatedForm.present_days = workDays;
      updatedForm.salary_month = `${startStr} to ${endStr}`;
    }
    setSalaryForm(updatedForm);
  };

  // Open Salary Payout Modal (પગાર ચૂકવો)
  const handleOpenSalaryModal = (staff) => {
    loadGullaSummary();
    const att = getStaffAttendance(staff.id);
    const payoutHistory = att.payoutHistory || [];

    const todayObj = new Date();
    const todayStr = todayObj.toISOString().split('T')[0];

    let startStr = '';

    // If staff has past payouts in history, auto-set From Date to day after last payment!
    if (payoutHistory.length > 0 && payoutHistory[0].to_date) {
      try {
        const lastToDate = new Date(payoutHistory[0].to_date);
        lastToDate.setDate(lastToDate.getDate() + 1);
        startStr = lastToDate.toISOString().split('T')[0];
      } catch {
        startStr = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).toISOString().split('T')[0];
      }
    } else if (payoutHistory.length > 0 && payoutHistory[0].date) {
      try {
        const lastDate = new Date(payoutHistory[0].date);
        lastDate.setDate(lastDate.getDate() + 1);
        startStr = lastDate.toISOString().split('T')[0];
      } catch {
        startStr = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).toISOString().split('T')[0];
      }
    } else {
      // Default to 1st day of current month if no previous payout recorded
      startStr = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).toISOString().split('T')[0];
    }

    // Default To Date to Today's Date
    const endStr = todayStr;

    const { totalDays, workDays } = computeSalaryDaysFromDates(startStr, endStr, staff.id);

    // Auto-fill initial greedy note count estimation
    const perDayEst = Number(staff.salary || 0) / 30;
    const grossEst = Math.round(perDayEst * workDays);
    const netEst = Math.max(0, grossEst - (att.advanceTaken || 0));
    handleAutoFillGreedyNotes(netEst);

    setSalaryStaff(staff);
    setSalaryForm({
      base_salary: Number(staff.salary || 0),
      start_date: startStr,
      end_date: endStr,
      present_days: workDays,
      total_days: totalDays,
      advance_deduction: att.advanceTaken || 0,
      bonus: 0,
      payment_method: 'CASH',
      salary_month: `${startStr} to ${endStr}`,
      notes: `Salary payout for ${staff.first_name || staff.username} (${startStr} to ${endStr})`,
    });
    setIsSalaryModalOpen(true);
  };

  // Calculate Salary Values
  const calculateNetSalary = () => {
    const base = Number(salaryForm.base_salary || 0);
    const totalDays = Math.max(1, Number(salaryForm.total_days || 30));
    const workDays = Math.max(0, Number(salaryForm.present_days || 0));
    const perDay = base / 30; // standard daily rate (or base / totalDays)
    const gross = Math.round(perDay * workDays) + Number(salaryForm.bonus || 0);
    const net = Math.max(0, gross - Number(salaryForm.advance_deduction || 0));
    return { gross, net, perDay: Math.round(perDay) };
  };

  // Submit Salary Payment (પગાર ચૂકવો submit)
  const handlePaySalarySubmit = async (e) => {
    e.preventDefault();
    if (!salaryStaff) return;

    if (salaryForm.start_date && salaryForm.end_date && salaryForm.end_date < salaryForm.start_date) {
      showToast('⚠️ અંત તારીખ એ શરૂઆત તારીખ પછીની અથવા સમાન જ હોવી જોઈએ! (To Date cannot be before From Date)', 'error');
      return;
    }

    const { net } = calculateNetSalary();

    if (net <= 0) {
      showToast('Net payable salary must be greater than zero', 'warning');
      return;
    }

    try {
      setSubmittingSalary(true);
      const staffName = salaryStaff.first_name ? `${salaryStaff.first_name} ${salaryStaff.last_name || ''}`.trim() : salaryStaff.username;
      const att = getStaffAttendance(salaryStaff.id);
      const leaveList = att.leaveDates || [];
      const leaveDatesStr = leaveList.length > 0
        ? `Raja Dates: ${leaveList.map(l => `${l.date} (${l.type})`).join(', ')}`
        : 'No Raja Dates';
      
      const notesSummary = getNotesSummaryString(denominationCounts);

      // 1. Record Expense in Backend
      try {
        await expensesApi.createExpense({
          title: `Staff Salary: ${staffName} (${salaryForm.salary_month})`,
          amount: net,
          date: new Date().toISOString().split('T')[0],
          payment_method: salaryForm.payment_method,
          paid_to: staffName,
          notes: `${salaryForm.notes} | Attended: ${salaryForm.present_days}/${salaryForm.total_days} Days | ${leaveDatesStr} | ${notesSummary} | Adv. Deducted: ₹${salaryForm.advance_deduction} | Bonus: ₹${salaryForm.bonus || 0}`,
        });
      } catch (err) {
        console.warn('Expense API recording note:', err);
      }

      // 2. If Cash payment, record in Gulla Cash Register Outflow with Denomination Counts
      if (salaryForm.payment_method === 'CASH') {
        try {
          await gullaApi.createGullaEntry({
            entry_type: 'EXPENSE',
            amount: net,
            title: `Staff Salary: ${staffName}`,
            notes: `Staff Salary Payout: ${staffName} (${salaryForm.salary_month}) - ${leaveDatesStr} ${notesSummary}`,
            denomination_counts: denominationCounts
          });
        } catch (err) {
          console.warn('Gulla entry note:', err);
        }
      }

      // 3. Update Attendance, Payout History & Auto-append Staff Note
      const historyItem = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        from_date: salaryForm.start_date,
        to_date: salaryForm.end_date,
        month: `${salaryForm.start_date} to ${salaryForm.end_date}`,
        amount: net,
        payment_method: salaryForm.payment_method,
        present_days: salaryForm.present_days,
        advance_deducted: salaryForm.advance_deduction,
        bonus: salaryForm.bonus || 0,
        leave_dates: leaveList.map(l => l.date),
        notes: `${salaryForm.notes} (${leaveDatesStr})`,
      };

      const newSalaryNote = {
        id: Date.now() + 1,
        date: new Date().toISOString().split('T')[0],
        category: 'Salary Payout',
        text: `Paid ₹${net.toLocaleString('en-IN')} (${salaryForm.salary_month}) via ${salaryForm.payment_method}. ${salaryForm.notes}`
      };

      setAttendance(prev => ({
        ...prev,
        [salaryStaff.id]: {
          ...att,
          advanceTaken: 0, // Reset advance after deduction
          payoutHistory: [historyItem, ...(att.payoutHistory || [])],
          staffNotes: [newSalaryNote, ...(att.staffNotes || [])]
        }
      }));

      // Reload live Gulla summary
      loadGullaSummary();

      showToast(`₹${net.toLocaleString('en-IN')} salary paid to ${staffName} via ${salaryForm.payment_method}!`, 'success');
      setIsSalaryModalOpen(false);
    } catch (err) {
      showToast('Failed to process salary payment', 'error');
    } finally {
      setSubmittingSalary(false);
    }
  };

  // Give Advance (ઉપાડ આપો)
  const handleOpenAdvanceModal = (staff) => {
    setAdvanceStaff(staff);
    setAdvanceAmount('');
    setAdvanceNote('');
    setIsAdvanceModalOpen(true);
  };

  const handleGiveAdvanceSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(advanceAmount);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid advance amount', 'warning');
      return;
    }

    try {
      const att = getStaffAttendance(advanceStaff.id);
      const staffName = advanceStaff.first_name || advanceStaff.username;

      // Log cash outflow if cash advance
      try {
        await gullaApi.createGullaEntry({
          entry_type: 'EXPENSE',
          amount: amount,
          notes: `Staff Advance (ઉપાડ) paid to ${staffName}: ${advanceNote || 'Advance cash'}`,
        });
      } catch (err) {
        console.warn(err);
      }

      setAttendance(prev => ({
        ...prev,
        [advanceStaff.id]: {
          ...att,
          advanceTaken: (att.advanceTaken || 0) + amount
        }
      }));

      showToast(`₹${amount.toLocaleString('en-IN')} advance (ઉપાડ) given to ${staffName}!`, 'success');
      setIsAdvanceModalOpen(false);
    } catch (err) {
      showToast('Failed to record advance', 'error');
    }
  };

  // View Salary History Modal
  const handleOpenHistoryModal = (staff) => {
    setHistoryStaff(staff);
    const att = getStaffAttendance(staff.id);
    setSalaryHistory(att.payoutHistory || []);
    setIsHistoryModalOpen(true);
  };

  // Computed KPI Metrics
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter(s => s.is_staff_active).length;
  const totalMonthlyPayroll = staffList.reduce((acc, s) => acc + Number(s.salary || 0), 0);
  const todayPresentCount = staffList.filter(s => {
    const att = getStaffAttendance(s.id);
    return att.todayMarked === 'PRESENT' || att.todayMarked === 'HALF_DAY';
  }).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#6A89A7]" /> Store Staff & Salary Management
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage staff members, attendance (હાજરી / રોજ ગણતરી), cash advances (ઉપાડ), and salary payouts.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate} className="self-start sm:self-auto">
          Add New Staff
        </Button>
      </div>

      {/* KPI Stats Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</p>
            <h3 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 mt-0.5">{totalStaffCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Staff</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{activeStaffCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Payroll Budget</p>
            <h3 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 mt-0.5">
              ₹{totalMonthlyPayroll.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Attendance (હાજરી)</p>
            <h3 className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              {todayPresentCount} / {totalStaffCount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Staff Members List & Management Cards */}
      {staffList.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Staff Members Found"
          description="There are currently no staff accounts registered in the system."
          variant="card"
          actionLabel="Add New Staff"
          onAction={handleOpenCreate}
          actionIcon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((s) => {
            const att = getStaffAttendance(s.id);
            const monthlySalary = Number(s.salary || 0);

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Card Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#6A89A7] to-[#384959] text-white flex items-center justify-center font-black text-base shrink-0 shadow-md">
                        {s.first_name ? s.first_name[0] : (s.username?.[0] || 'U')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-[#384959] dark:text-slate-100 leading-tight truncate">
                          {s.first_name ? `${s.first_name} ${s.last_name || ''}` : s.username}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-mono">@{s.username}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            s.role === 'ADMIN' || s.role === 'Admin' || s.role === 'STORE_OWNER' || s.role === 'Store Owner'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : s.role === 'STORE_MANAGER' || s.role === 'Store Manager' || s.role === 'STORE_MANAGEMENT' || s.role === 'Store Management'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-[#384959] dark:text-slate-300'
                          }`}>
                            {s.role === 'ADMIN' || s.role === 'Admin' || s.role === 'STORE_OWNER' || s.role === 'Store Owner' 
                              ? '👑 Store Owner' 
                              : s.role === 'STORE_MANAGEMENT' || s.role === 'Store Management'
                              ? '🏢 Store Management'
                              : s.role === 'STORE_MANAGER' || s.role === 'Store Manager'
                              ? '🏪 Store Manager'
                              : s.role === 'CASHIER' || s.role === 'Cashier'
                              ? '💵 Cashier'
                              : s.role === 'DELIVERY' || s.role === 'Delivery Staff'
                              ? '🚚 Delivery'
                              : (s.role || 'Staff')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(s)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 cursor-pointer ${
                        s.is_staff_active 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {s.is_staff_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  {/* Contact Info & Base Salary */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Phone className="w-3.5 h-3.5 shrink-0" /> Mobile:
                      </span>
                      <span className="font-mono font-bold text-[#384959] dark:text-slate-200">{s.phone || 'No phone'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <IndianRupee className="w-3.5 h-3.5 shrink-0" /> Monthly Base Salary:
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        ₹{monthlySalary.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  </div>

                  {/* Attendance & Work Days Box (હાજરી / રોજ ગણતરી) */}
                  <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#384959] dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#6A89A7]" /> Month Work Days (રોજ):
                      </span>
                      <span className="text-xs font-black text-[#384959] dark:text-slate-100">
                        {att.presentDays + (att.halfDays * 0.5)} / 30 Days
                      </span>
                    </div>

                    {/* Attendance Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleMarkAttendance(s, 'PRESENT')}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          att.todayMarked === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        <Check className="w-3 h-3" /> + Present
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(s, 'HALF_DAY')}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          att.todayMarked === 'HALF_DAY'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-50'
                        }`}
                      >
                        <Clock className="w-3 h-3" /> ½ Day
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(s, 'ABSENT')}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          att.todayMarked === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-50'
                        }`}
                      >
                        <X className="w-3 h-3" /> Absent
                      </button>
                    </div>

                    {/* Advance Taken Banner (ઉપાડ) */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-500" /> Advance Taken (ઉપાડ):
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          ₹{(att.advanceTaken || 0).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => handleOpenAdvanceModal(s)}
                          className="text-[10px] text-[#6A89A7] hover:underline font-bold cursor-pointer"
                        >
                          + Give Advance
                        </button>
                      </div>
                    </div>

                    {/* Raja / Leave Dates Section (રજા તારીખો) */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-500 font-bold flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-rose-500" /> Raja Dates (રજાઓ):
                        </span>
                        <button
                          onClick={() => handleOpenLeaveModal(s)}
                          className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                        >
                          + Log Raja Date (રજા)
                        </button>
                      </div>

                      {(att.leaveDates || []).length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic">No leaves logged this month</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(att.leaveDates || []).map((l) => (
                            <span
                              key={l.id}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                            >
                              {l.date} ({l.type === 'FULL' ? 'Full' : 'Half'})
                              <button
                                onClick={() => handleRemoveLeave(s.id, l.id)}
                                className="hover:text-rose-900 dark:hover:text-white cursor-pointer ml-0.5"
                                title="Remove Leave Date"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Staff Notes & Remarks Section (સ્ટાફ નોટ્સ & રિમાર્કસ) */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-500 font-bold flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#6A89A7]" /> Notes (રિમાર્કસ):
                        </span>
                        <button
                          onClick={() => handleOpenNoteModal(s)}
                          className="text-[10px] text-[#6A89A7] dark:text-[#88BDF2] font-bold hover:underline cursor-pointer"
                        >
                          + Add Note (નોંધ)
                        </button>
                      </div>

                      {(att.staffNotes || []).length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic">No notes added</span>
                      ) : (
                        <div className="space-y-1 mt-1 max-h-24 overflow-y-auto pr-1">
                          {(att.staffNotes || []).slice(0, 3).map((n) => (
                            <div
                              key={n.id}
                              className="p-1.5 bg-slate-100/70 dark:bg-slate-800/80 rounded-lg text-[10px] flex items-start justify-between gap-1.5"
                            >
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-[#384959] dark:text-slate-200">{n.category}:</span>
                                  <span className="text-slate-400 text-[9px]">{n.date}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 leading-tight">{n.text}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveNote(s.id, n.id)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer shrink-0"
                                title="Delete Note"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="xs"
                      icon={IndianRupee}
                      onClick={() => handleOpenSalaryModal(s)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Pay Salary (પગાર આપો)
                    </Button>
                    <button
                      onClick={() => handleOpenHistoryModal(s)}
                      className="p-2 text-slate-500 hover:text-[#384959] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="View Salary History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-2 text-slate-500 hover:text-[#384959] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Edit Staff Member"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(s)}
                      className="p-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer"
                      title="Delete Staff Member (સ્ટાફ ડીલીટ કરો)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        subtitle="Enter staff member details: Name, Mobile Number, Role, and Monthly Salary"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleFormSubmit} loading={submitting}>
              {editingStaff ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Staff Full Name * (સ્ટાફનું નામ)
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Mobile / Phone Number * (મોબાઈલ નંબર)
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98XXX XXXXX"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Assigned Role * (રોલ / હોદ્દો)
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100 focus:border-[#88BDF2] outline-hidden"
            >
              <option value="Store Management">🏢 Store Management (સ્ટોર મેનેજમેન્ટ)</option>
              <option value="Store Manager">🏪 Store Manager (સ્ટોર મેનેજર)</option>
              <option value="Cashier">💵 Cashier / Billing Staff (કાઉન્ટર કેશિયર)</option>
              <option value="Delivery Staff">🚚 Delivery / Helper (ડીલીવરી સ્ટાફ)</option>
              <option value="Store Owner">👑 Store Owner / Admin (સ્ટોર ઓનર / માલિક)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Monthly Salary (₹) (માસિક પગાર)
            </label>
            <input
              type="number"
              min="0"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              placeholder="e.g. 25000"
              className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100"
            />
          </div>
        </form>
      </Modal>

      {/* 2. Pay Staff Salary Modal (પગાર ચૂકવણી કલ્ક્યુલેટર) */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title={`Pay Salary: ${salaryStaff?.first_name ? `${salaryStaff.first_name} ${salaryStaff.last_name || ''}` : salaryStaff?.username || ''}`}
        subtitle="Calculate pro-rata salary based on attendance work days & deduct advances"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setIsSalaryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handlePaySalarySubmit}
              loading={submittingSalary}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Payout (પગાર આપો)
            </Button>
          </div>
        }
      >
        {salaryStaff && (() => {
          const { gross, net, perDay } = calculateNetSalary();
          return (
            <form onSubmit={handlePaySalarySubmit} className="space-y-4 text-xs">
              {/* Live Gulla Cash Register Drawer Connection Banner */}
              <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                    💵
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                      Gulla Register Cash (ગલ્લો બેલેન્સ)
                    </span>
                    <h4 className="text-sm font-black text-[#384959] dark:text-slate-100 mt-0.5">
                      ₹{Number(gullaSummary?.cash_in_hand ?? gullaSummary?.net_cash_in_gulla ?? gullaSummary?.total_cash_inflow ?? 0).toLocaleString('en-IN')} Available
                    </h4>
                  </div>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  ● Gulla Active
                </span>
              </div>

              {/* Gross & Net Salary Summary Banner */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Net Salary Payable (ચૂકવવાનો ચોખ્ખો પગાર)
                  </span>
                  <h2 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                    ₹{net.toLocaleString('en-IN')}
                  </h2>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    ₹{perDay}/day × {salaryForm.present_days} days = ₹{gross.toLocaleString('en-IN')} Gross
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  ₹
                </div>
              </div>

              {/* Salary Period Date Range Picker (તારીખ થી તારીખ કસ્ટમ પસંદગી) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#6A89A7]" /> Pay Period Date Range (તારીખ થી તારીખ પસંદ કરો)
                  </label>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#6A89A7]/20 text-[#384959] dark:text-slate-300">
                    {salaryForm.total_days} Days Period
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">From Date (શરૂઆત તારીખ)</span>
                    <input
                      type="date"
                      value={salaryForm.start_date || ''}
                      max={salaryForm.end_date || ''}
                      onChange={(e) => handleSalaryDateChange('start_date', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">To Date (અંત તારીખ)</span>
                    <input
                      type="date"
                      value={salaryForm.end_date || ''}
                      min={salaryForm.start_date || ''}
                      onChange={(e) => handleSalaryDateChange('end_date', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Monthly Base Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={salaryForm.base_salary}
                    onChange={(e) => setSalaryForm({ ...salaryForm, base_salary: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Total Days in Month
                  </label>
                  <input
                    type="number"
                    value={salaryForm.total_days}
                    onChange={(e) => setSalaryForm({ ...salaryForm, total_days: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Work Days Attended (રોજ)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={salaryForm.present_days}
                    onChange={(e) => setSalaryForm({ ...salaryForm, present_days: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Advance Deduction (ઉપાડ બાદબાકી)
                  </label>
                  <input
                    type="number"
                    value={salaryForm.advance_deduction}
                    onChange={(e) => setSalaryForm({ ...salaryForm, advance_deduction: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Raja / Leave Dates Breakdown Section */}
              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-rose-500" /> Logged Raja Dates (રજાઓની યાદી):
                  </span>
                  <span className="font-bold text-rose-700 dark:text-rose-400">
                    {(getStaffAttendance(salaryStaff.id).leaveDates || []).length} Days Logged
                  </span>
                </div>
                {(getStaffAttendance(salaryStaff.id).leaveDates || []).length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No leaves logged this month</p>
                ) : (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {(getStaffAttendance(salaryStaff.id).leaveDates || []).map((l) => (
                      <span
                        key={l.id}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      >
                        🗓️ {l.date} ({l.type === 'FULL' ? 'Full' : 'Half'})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Bonus / Incentive (₹) (બોનસ)
                  </label>
                  <input
                    type="number"
                    value={salaryForm.bonus}
                    onChange={(e) => setSalaryForm({ ...salaryForm, bonus: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={salaryForm.payment_method}
                    onChange={(e) => setSalaryForm({ ...salaryForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                  >
                    <option value="CASH">💵 Cash (Gulla Register Outflow)</option>
                    <option value="UPI">📱 UPI / QR Code</option>
                    <option value="BANK_TRANSFER">🏦 Bank Transfer / NEFT</option>
                  </select>
                </div>
              </div>

              {/* Gulla Denomination Currency Note Tally (નોટ ગણતરી / નોટ કેલ્ક્યુલેટર) */}
              {salaryForm.payment_method === 'CASH' && (() => {
                const noteTotal = calculateTotalFromNotes(denominationCounts);
                const diff = noteTotal - net;
                return (
                  <div className="p-3.5 bg-[#384959]/5 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-blue-600" /> Gulla Cash Denominations (નોટ ગણતરી)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAutoFillGreedyNotes(net)}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        ⚡ Auto-Fill Notes (અંદાજિત નોટો)
                      </button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {DENOM_LIST.map((d) => (
                        <div key={d} className="text-center">
                          <span className="block text-[9px] font-extrabold text-slate-500 mb-0.5">
                            {d === 1 ? 'Coin' : `₹${d}`}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={denominationCounts[String(d)] || ''}
                            onChange={(e) => handleNoteCountChange(d, e.target.value)}
                            placeholder="0"
                            className="w-full px-1.5 py-1 text-center font-black text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[#384959] dark:text-slate-100"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-500">Handed Cash Total:</span>
                        <span className={`font-black ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                          ₹{noteTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        {diff === 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">🟢 Exact Match</span>}
                        {diff > 0 && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">🔵 Change Return: ₹{diff.toLocaleString('en-IN')}</span>}
                        {diff < 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">🟠 Short: ₹{Math.abs(diff).toLocaleString('en-IN')}</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Salary Month
                  </label>
                  <input
                    type="text"
                    value={salaryForm.salary_month}
                    onChange={(e) => setSalaryForm({ ...salaryForm, salary_month: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Payment Remarks / Notes
                  </label>
                  <input
                    type="text"
                    value={salaryForm.notes}
                    onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                    placeholder="e.g. August 2026 Salary paid at counter"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* 3. Give Advance Modal (ઉપાડ આપો મોડલ) */}
      <Modal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        title={`Give Advance (ઉપાડ): ${advanceStaff?.first_name || advanceStaff?.username || ''}`}
        subtitle="Log cash advance/loan to be deducted from monthly salary payout"
        maxWidth="max-w-sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAdvanceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleGiveAdvanceSubmit}>
              Give Advance
            </Button>
          </div>
        }
      >
        <form onSubmit={handleGiveAdvanceSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Advance Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full px-3.5 py-2.5 text-base font-black text-amber-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Reason / Note (કારણ)
            </label>
            <input
              type="text"
              value={advanceNote}
              onChange={(e) => setAdvanceNote(e.target.value)}
              placeholder="e.g. Personal emergency advance"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>

      {/* 4. Salary Payout History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Salary Payout History: ${historyStaff?.first_name || historyStaff?.username || ''}`}
        subtitle="Past salary payout transactions & advance settlements ledger"
        maxWidth="max-w-lg"
      >
        <div className="space-y-3">
          {salaryHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No past salary payouts recorded for this staff member yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {salaryHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#384959] dark:text-slate-100">{item.month}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {item.payment_method}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Date: {item.date} | Days: {item.present_days} | Adv. Deducted: ₹{item.advance_deducted || 0}
                    </p>
                    {item.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{item.notes}</p>}
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      ₹{Number(item.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* 5. Log Raja / Leave Date Modal (રજાની તારીખ નોંધવી મોડલ) */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title={`Log Raja Date (રજા): ${leaveStaff?.first_name || leaveStaff?.username || ''}`}
        subtitle="Log staff leave/off date to auto-adjust attendance work days"
        maxWidth="max-w-sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddLeaveSubmit} className="bg-rose-600 hover:bg-rose-700 text-white">
              Save Raja Date (રજા નોંધો)
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddLeaveSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Select Leave Date (રજાની તારીખ) *
            </label>
            <input
              type="date"
              required
              value={leaveDateInput}
              onChange={(e) => setLeaveDateInput(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Leave Type (રજાનો પ્રકાર)
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
            >
              <option value="FULL">🔴 Full Day Leave (-1 Work Day)</option>
              <option value="HALF">🟠 Half Day Leave (-0.5 Work Day)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Leave Reason / Note (કારણ)
            </label>
            <input
              type="text"
              value={leaveNote}
              onChange={(e) => setLeaveNote(e.target.value)}
              placeholder="e.g. Personal work / Sick leave"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>

      {/* 6. Add Staff Note / Remark Modal (સ્પેશિયલ સ્ટાફ નોટ / રિમાર્કસ ઉમેરો) */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={`Add Staff Note: ${noteStaff?.first_name || noteStaff?.username || ''}`}
        subtitle="Add special remarks, performance notes, or custom staff instructions"
        maxWidth="max-w-sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddNoteSubmit}>
              Save Note (નોંધ સાચવો)
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddNoteSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Note Category (પ્રકાર)
            </label>
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
            >
              <option value="General">📝 General Remark (સામાન્ય નોટ)</option>
              <option value="Performance">⭐ Performance / Work Note (કામગીરી)</option>
              <option value="Advance Note">💵 Advance / Payment Note (ઉપાડ નોટ)</option>
              <option value="Leave Request">🗓️ Leave / Raja Note (રજા નોટ)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Note / Remarks Content (નોંધ વિગત) *
            </label>
            <textarea
              required
              rows="3"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Counter cash balanced properly. Good performance."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100 font-medium"
            />
          </div>
        </form>
      </Modal>

      {/* 7. Delete Staff Confirmation Modal (સ્ટાફ ડીલીટ કરો કન્ફર્મેશન મોડલ) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Staff Member (સ્ટાફ ડીલીટ કરો)"
        subtitle="Confirm staff member removal from store records"
        maxWidth="max-w-sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeleteStaffSubmit}
              loading={deletingStaff}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Yes, Delete Staff (ડીલીટ કરો)
            </Button>
          </div>
        }
      >
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Confirm Delete Staff Member?</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to permanently delete staff member <strong className="text-rose-700 dark:text-rose-300">{deleteConfirmStaff?.first_name || deleteConfirmStaff?.username}</strong> ({deleteConfirmStaff?.role})?
          </p>
          <p className="text-[10px] text-slate-400 italic">
            This action will remove the staff member from active store records.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default StaffList;
