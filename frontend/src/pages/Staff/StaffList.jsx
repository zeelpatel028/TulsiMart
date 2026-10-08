import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tag,
  ArrowLeft,
  Eye,
  LayoutGrid,
  List
} from 'lucide-react';
import { authApi, expensesApi, gullaApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';
import { useNotification } from '../../context/NotificationContext';

export const StaffList = () => {
  const navigate = useNavigate();
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

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStaff, setLeaveStaff] = useState(null);
  const [leaveTab, setLeaveTab] = useState('add'); // 'add' or 'view'
  const [leaveForm, setLeaveForm] = useState({
    title: '',
    reason: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    num_days: 1,
  });

  // View All Raja Dates Modal State
  const [isRajaViewModalOpen, setIsRajaViewModalOpen] = useState(false);
  const [rajaViewStaff, setRajaViewStaff] = useState(null);

  const handleOpenRajaViewModal = (staff) => {
    setRajaViewStaff(staff);
    setIsRajaViewModalOpen(true);
  };

  // Staff Note / Remark Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteStaff, setNoteStaff] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');

  // Delete Staff Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(false);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyStaff, setHistoryStaff] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);

  // View Staff All Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailStaff, setDetailStaff] = useState(null);

  const handleOpenDetailModal = (staff) => {
    setDetailStaff(staff);
    setIsDetailModalOpen(true);
  };

  // Gulla-style Denomination Currency Note Tally State
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

  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Image 2 style) or 'table'

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
      const list = extractList(res);
      setStaffList(list);

      setAttendance((prev) => {
        const merged = { ...prev };
        list.forEach((s) => {
          if (s.attendance_data && typeof s.attendance_data === 'object' && Object.keys(s.attendance_data).length > 0) {
            merged[s.id] = {
              ...(merged[s.id] || {}),
              ...s.attendance_data,
            };
          }
        });
        return merged;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateAndPersistStaffAttendance = async (staffId, updatedRecord) => {
    setAttendance((prev) => ({
      ...prev,
      [staffId]: updatedRecord,
    }));

    try {
      await authApi.updateStaffAttendance(staffId, updatedRecord);
    } catch (err) {
      console.warn('Backend attendance sync warning:', err);
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

  // Mark Attendance
  const handleMarkAttendance = (staff, status) => {
    const current = getStaffAttendance(staff.id);
    let updated = { ...current };

    if (status === 'PRESENT') {
      updated.presentDays += 1;
      updated.todayMarked = 'PRESENT';
      showToast(`Marked ${staff.first_name || staff.username} as Present today!`, 'success');
    } else if (status === 'HALF_DAY') {
      updated.halfDays += 1;
      updated.todayMarked = 'HALF_DAY';
      showToast(`Marked ${staff.first_name || staff.username} as Half Day today!`, 'info');
    } else if (status === 'ABSENT') {
      updated.absentDays += 1;
      updated.todayMarked = 'ABSENT';
      showToast(`Marked ${staff.first_name || staff.username} as Absent today!`, 'warning');
    }

    updateAndPersistStaffAttendance(staff.id, updated);
  };

  // Staff Note Handlers
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
    const updatedRecord = {
      ...att,
      staffNotes: updatedNotes
    };

    updateAndPersistStaffAttendance(noteStaff.id, updatedRecord);

    showToast(`Note logged for ${noteStaff.first_name || noteStaff.username}!`, 'success');
    setIsNoteModalOpen(false);
  };

  const handleRemoveNote = (staffId, noteId) => {
    const att = getStaffAttendance(staffId);
    const updatedNotes = (att.staffNotes || []).filter(n => n.id !== noteId);
    const updatedRecord = {
      ...att,
      staffNotes: updatedNotes
    };

    updateAndPersistStaffAttendance(staffId, updatedRecord);
    showToast('Staff note deleted!', 'info');
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
      name: s.name || (s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.username || ''),
      phone: s.phone || '',
      email: s.email || '',
      role: s.role || 'CASHIER',
      salary: s.salary || '',
    });
    setIsModalOpen(true);
  };

  // Submit Staff Create / Edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Staff member name and phone number are required', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: (formData.email || '').trim(),
        role: formData.role || 'CASHIER',
        salary: parseFloat(formData.salary || 0)
      };

      if (editingStaff) {
        await authApi.updateStaff(editingStaff.id, payload);
        showToast(`Staff member "${formData.name}" updated successfully!`, 'success');
      } else {
        await authApi.createStaff(payload);
        showToast(`New staff member "${formData.name}" added!`, 'success');
      }

      setIsModalOpen(false);
      loadStaff();
    } catch (err) {
      console.error(err);
      showToast('Failed to save staff member', 'error');
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

  // Delete Staff Handlers
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
      showToast('⚠️ To Date cannot be before From Date', 'warning');
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

  // Open Salary Payout Modal
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

  // Submit Salary Payment
  const handlePaySalarySubmit = async (e) => {
    e.preventDefault();
    if (!salaryStaff) return;

    if (salaryForm.start_date && salaryForm.end_date && salaryForm.end_date < salaryForm.start_date) {
      showToast('⚠️ To Date cannot be before From Date', 'error');
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

      const updatedSalaryRecord = {
        ...att,
        advanceTaken: 0, // Reset advance after deduction
        payoutHistory: [historyItem, ...(att.payoutHistory || [])],
        staffNotes: [newSalaryNote, ...(att.staffNotes || [])]
      };

      updateAndPersistStaffAttendance(salaryStaff.id, updatedSalaryRecord);

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

  // Give Advance
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
          notes: `Staff Advance paid to ${staffName}: ${advanceNote || 'Advance cash'}`,
        });
      } catch (err) {
        console.warn(err);
      }

      const updatedAdvanceRecord = {
        ...att,
        advanceTaken: (att.advanceTaken || 0) + amount
      };

      updateAndPersistStaffAttendance(advanceStaff.id, updatedAdvanceRecord);

      showToast(`₹${amount.toLocaleString('en-IN')} advance given to ${staffName}!`, 'success');
      setIsAdvanceModalOpen(false);
    } catch (err) {
      showToast('Failed to record advance', 'error');
    }
  };

  // Leave Modal Handlers
  const handleOpenLeaveModal = (staff, initialTab = 'add') => {
    const todayStr = new Date().toISOString().split('T')[0];
    setLeaveStaff(staff);
    setLeaveTab(initialTab);
    setLeaveForm({
      title: '',
      reason: '',
      start_date: todayStr,
      end_date: todayStr,
      num_days: 1,
    });
    setIsLeaveModalOpen(true);
  };

  const handleLeaveDateChange = (field, value) => {
    const startStr = field === 'start_date' ? value : leaveForm.start_date;
    const endStr = field === 'end_date' ? value : leaveForm.end_date;
    
    let days = 1;
    if (startStr && endStr && endStr >= startStr) {
      const d1 = new Date(startStr);
      const d2 = new Date(endStr);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    setLeaveForm(prev => ({
      ...prev,
      [field]: value,
      num_days: days
    }));
  };

  const handleAddLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveStaff) return;
    if (!leaveForm.title.trim()) {
      showToast('Please enter a leave title', 'warning');
      return;
    }
    if (leaveForm.start_date && leaveForm.end_date && leaveForm.end_date < leaveForm.start_date) {
      showToast('End Date cannot be before Start Date', 'error');
      return;
    }

    try {
      const att = getStaffAttendance(leaveStaff.id);
      const staffName = leaveStaff.first_name ? `${leaveStaff.first_name} ${leaveStaff.last_name || ''}`.trim() : leaveStaff.username;

      const newLeave = {
        id: Date.now(),
        title: leaveForm.title.trim(),
        reason: leaveForm.reason.trim(),
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        num_days: Number(leaveForm.num_days || 1),
        date: leaveForm.start_date,
        type: 'FULL',
        createdAt: new Date().toISOString()
      };

      const updatedRecord = {
        ...att,
        leaveDates: [newLeave, ...(att.leaveDates || [])]
      };

      updateAndPersistStaffAttendance(leaveStaff.id, updatedRecord);
      showToast(`Leave recorded for ${staffName} (${leaveForm.num_days} days)!`, 'success');
      setLeaveTab('view');
    } catch (err) {
      showToast('Failed to record leave', 'error');
    }
  };

  const handleRemoveLeaveItem = (staffId, leaveId) => {
    try {
      const att = getStaffAttendance(staffId);
      const updatedList = (att.leaveDates || []).filter(l => l.id !== leaveId);
      const updatedRecord = {
        ...att,
        leaveDates: updatedList
      };
      updateAndPersistStaffAttendance(staffId, updatedRecord);
      showToast('Leave record removed', 'info');
    } catch (err) {
      showToast('Failed to remove leave', 'error');
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
  const totalMonthlyPayroll = staffList.reduce((acc, s) => acc + Number(s.salary || 0), 0);
  const todayPresentCount = staffList.filter(s => {
    const att = getStaffAttendance(s.id);
    return att.todayMarked === 'PRESENT' || att.todayMarked === 'HALF_DAY';
  }).length;

  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredStaffList = staffList.filter((s) => {
    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'MANAGER') return s.role === 'STORE_MANAGER' || s.role === 'Store Manager' || s.role === 'STORE_MANAGEMENT' || s.role === 'Store Management';
    if (roleFilter === 'CASHIER') return s.role === 'CASHIER' || s.role === 'Cashier';
    if (roleFilter === 'DELIVERY') return s.role === 'DELIVERY' || s.role === 'Delivery Staff';
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 📱 Mobile & Tablet Top App Header - Pastel Mint Theme */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] sm:min-h-[82px] flex items-center -mx-3 -mt-3 sm:-mx-5 sm:-mt-5 mb-3">
        {/* SVG Decorative Bottom-Left Wave */}
        <svg className="absolute bottom-0 left-0 w-36 sm:w-52 h-auto pointer-events-none text-[#C4EFE9]/70 dark:text-teal-950/40" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40C50 60 120 70 200 45V80H0V40Z" fill="currentColor" />
        </svg>

        {/* SVG Decorative Bottom-Right Mound Curve */}
        <svg className="absolute bottom-0 right-0 w-28 sm:w-40 h-auto pointer-events-none text-[#B5ECE5]/80 dark:text-teal-900/40" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 90C40 40 100 20 160 30V90H20Z" fill="currentColor" />
        </svg>

        {/* Decorative Floating Mint Dots */}
        <div className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-[#83D9CC] opacity-60 pointer-events-none" />
        <div className="absolute bottom-4 right-20 w-2 h-2 rounded-full bg-[#83D9CC] opacity-50 pointer-events-none" />

        {/* Header Content */}
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-md shadow-teal-900/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-teal-100/80 dark:border-slate-700"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2.6]" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight truncate">
                Staff & <span className="text-[#00695C] dark:text-[#4DB6AC]">Management</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Manage employees, attendance & payroll
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Tulsi Mart POS Top Header Banner - Full Width Edge-to-Edge Background (Desktop Only) */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-3.5 sm:p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Banner Grid Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          {/* Left: ShieldCheck Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Staff & <span className="text-[#00796b] dark:text-[#80cbc4]">Management</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Payroll & Attendance Ready
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Manage store employees, track daily attendance, issue cash advances, and calculate monthly salary payouts.
              </p>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0">
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] text-white font-extrabold shadow-sm shadow-teal-900/20 rounded-xl cursor-pointer"
            >
              Add New Staff Member
            </Button>
          </div>
        </div>
      </div>



      {/* Filter, Search & Layout Controls Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-3 sm:p-3.5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="w-full md:w-72 lg:w-80 shrink-0">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search staff name or phone..."
          />
        </div>

        {/* Right Side Controls: Role Filters + Layout Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto">
          {/* Segmented Role Filter Tabs */}
          <div className="bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'All Staff' },
              { id: 'MANAGER', label: 'Managers' },
              { id: 'CASHIER', label: 'Cashiers' },
              { id: 'DELIVERY', label: 'Delivery' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-[#00695C] dark:text-[#4DB6AC] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-[#00695C] dark:text-[#4DB6AC] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staff Members List & Data Display */}
      {filteredStaffList.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Staff Members Found"
          description="There are currently no staff members matching your search criteria."
          variant="card"
          actionLabel="Add New Staff Member"
          onAction={handleOpenCreate}
          actionIcon={Plus}
        />
      ) : viewMode === 'table' ? (
        /* RICH STAFF DATA TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-sm font-black text-[#263238] dark:text-slate-100 uppercase tracking-wider">
                Store Staff Table ({filteredStaffList.length} Active Staff Members)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Managed in `core_staff` database table</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[760px] border-collapse">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-black border-b border-teal-100 dark:border-slate-700/80 text-[11px] whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Staff ID & Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Role</th>
                  <th className="px-4 py-3 whitespace-nowrap">Email & Contact</th>
                  <th className="px-4 py-3 whitespace-nowrap">Base Salary</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                {filteredStaffList.map((s) => {
                  const att = getStaffAttendance(s.id);
                  const staffName = s.name || (s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.username);
                  return (
                    <tr key={s.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00796b] to-[#004d40] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                            {staffName ? staffName[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100">{staffName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Staff ID: #{s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                          s.role === 'STORE_MANAGER' || s.role === 'Store Manager'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/50'
                            : s.role === 'CASHIER' || s.role === 'Cashier'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50'
                            : s.role === 'DELIVERY' || s.role === 'Delivery'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300/50'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/50'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {s.role || 'CASHIER'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 space-y-0.5 whitespace-nowrap">
                        {s.email && (
                          <div className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {s.email}
                          </div>
                        )}
                        {s.phone && (
                          <div className="text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {s.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#00796b] dark:text-[#80cbc4] font-mono whitespace-nowrap">
                        ₹{Number(s.salary || 0).toLocaleString('en-IN')}/mo
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all ${
                            s.is_active !== false
                              ? 'bg-teal-100 text-[#00695c] dark:bg-teal-950 dark:text-teal-300 hover:bg-teal-200'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                          }`}
                        >
                          {s.is_active !== false ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {s.is_active !== false ? 'Active Staff' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleMarkAttendance(s, 'PRESENT')}
                          title="Mark Present"
                          className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#00796b] dark:bg-slate-800 dark:text-[#80cbc4] hover:bg-teal-100 font-extrabold text-[11px] cursor-pointer"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleOpenLeaveModal(s, 'add')}
                          title="Leave Management (Add / View Leaves)"
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 font-extrabold text-[11px] cursor-pointer"
                        >
                          Leave
                        </button>
                        <button
                          onClick={() => handleOpenSalaryModal(s)}
                          title="Pay Salary"
                          className="px-2.5 py-1 rounded-lg bg-[#00796b] text-white hover:bg-[#004d40] font-extrabold text-[11px] cursor-pointer shadow-2xs"
                        >
                          Pay Salary
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Staff Details"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#00796b] hover:bg-teal-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(s)}
                          title="Delete Account"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredStaffList.map((s) => {
            const staffName = s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.username;

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-teal-100/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-teal-400/50 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Accent Gradient Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00695C] via-[#009688] to-[#4DB6AC] rounded-t-3xl" />

                <div>
                  {/* Avatar + Staff Name + Role & Status Badge */}
                  <div className="flex items-start justify-between gap-3 mt-1">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#00695C] to-[#009688] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md border border-white/20 group-hover:scale-105 transition-transform">
                        {staffName ? staffName[0].toUpperCase() : 'S'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight truncate">
                          {staffName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg ${
                            s.role === 'STORE_MANAGER' || s.role === 'Store Manager' || s.role === 'STORE_MANAGEMENT' || s.role === 'Store Management'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : s.role === 'CASHIER' || s.role === 'Cashier'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          }`}>
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                            {s.role === 'STORE_MANAGEMENT' || s.role === 'Store Management'
                              ? 'Store Management'
                              : s.role === 'STORE_MANAGER' || s.role === 'Store Manager'
                              ? 'Store Manager'
                              : s.role === 'CASHIER' || s.role === 'Cashier'
                              ? 'Cashier'
                              : s.role === 'DELIVERY' || s.role === 'Delivery Staff'
                              ? 'Delivery'
                              : (s.role || 'Staff')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(s)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 ${
                        s.is_staff_active 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                      title="Toggle Staff Active Status"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.is_staff_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                      {s.is_staff_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  {/* Phone / Contact Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/40 px-3.5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-2 text-slate-500 font-bold">
                      <Phone className="w-4 h-4 text-[#00695C] shrink-0" /> Mobile Number:
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                      {s.phone || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer - 6 Clear Action Buttons */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {/* Top Row: Pay Salary, Add Leave, View Details */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleOpenSalaryModal(s)}
                      className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-gradient-to-r from-[#00695C] to-[#009688] hover:from-[#004D40] hover:to-[#00796B] text-white font-extrabold text-[11px] shadow-xs active:scale-95 transition-all cursor-pointer"
                      title="Pay Salary"
                    >
                      <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                      Pay Salary
                    </button>

                    <button
                      onClick={() => handleOpenLeaveModal(s)}
                      className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-extrabold text-[11px] border border-rose-200/80 dark:border-rose-900/60 active:scale-95 transition-all cursor-pointer"
                      title="Add Leave / Log Raja Date"
                    >
                      <CalendarDays className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      Add Leave
                    </button>

                    <button
                      onClick={() => handleOpenDetailModal(s)}
                      className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 text-[#00695C] dark:text-[#4DB6AC] hover:bg-teal-100 dark:hover:bg-teal-900/60 font-extrabold text-[11px] border border-teal-200/80 dark:border-teal-900/60 active:scale-95 transition-all cursor-pointer"
                      title="View Staff All Details"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0 text-[#00695C] dark:text-[#4DB6AC]" />
                      Details
                    </button>
                  </div>

                  {/* Bottom Row: Salary History, Update, Delete */}
                  <div className="flex items-center justify-between gap-1.5 pt-0.5">
                    <button
                      onClick={() => handleOpenHistoryModal(s)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-300 font-bold text-[11px] transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                      title="View Salary History"
                    >
                      <History className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                      History
                    </button>

                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-300 font-bold text-[11px] transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                      title="Update / Edit Staff Details"
                    >
                      <Edit className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                      Update
                    </button>

                    <button
                      onClick={() => handleOpenDelete(s)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-300 font-bold text-[11px] transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                      title="Delete Staff Member"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      Delete
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
            <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
              Staff Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
              Mobile / Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98XXX XXXXX"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
              Assigned Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#263238] dark:text-slate-100 focus:border-[#00695C] outline-hidden"
            >
              <option value="Store Management">🏢 Store Management</option>
              <option value="Store Manager">🏪 Store Manager</option>
              <option value="Cashier">💵 Cashier / Billing Staff</option>
              <option value="Delivery Staff">🚚 Delivery / Helper</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
              Monthly Salary (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              placeholder="e.g. 25000"
              className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#00695C] text-[#263238] dark:text-slate-100"
            />
          </div>
        </form>
      </Modal>

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
              className="bg-[#00695C] hover:bg-[#004D40] text-white font-bold"
            >
              Confirm Payout
            </Button>
          </div>
        }
      >
        {salaryStaff && (() => {
          const { gross, net, perDay } = calculateNetSalary();
          return (
            <form onSubmit={handlePaySalarySubmit} className="space-y-4 text-xs">
              {/* Live Gulla Cash Register Drawer Connection Banner */}
              <div className="p-3.5 bg-[#E0F2F1] dark:bg-slate-800/80 rounded-2xl border border-[#B2DFDB] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00695C] text-white flex items-center justify-center font-black text-base shadow-xs">
                    💵
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00695C] dark:text-[#4DB6AC]">
                      Gulla Register Cash
                    </span>
                    <h4 className="text-sm font-black text-[#263238] dark:text-slate-100 mt-0.5">
                      ₹{Number(gullaSummary?.cash_in_hand ?? gullaSummary?.net_cash_in_gulla ?? gullaSummary?.total_cash_inflow ?? 0).toLocaleString('en-IN')} Available
                    </h4>
                  </div>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[#4DB6AC] text-[#00695C]">
                  ● Gulla Active
                </span>
              </div>

              {/* Gross & Net Salary Summary Banner */}
              <div className="p-4 bg-[#E0F2F1] dark:bg-slate-800/80 rounded-2xl border border-[#B2DFDB] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#00695C] dark:text-[#4DB6AC] uppercase tracking-wider">
                    Net Salary Payable
                  </span>
                  <h2 className="text-2xl font-black text-[#00695C] dark:text-[#4DB6AC] mt-0.5">
                    ₹{net.toLocaleString('en-IN')}
                  </h2>
                  <p className="text-[10px] text-[#009688] dark:text-[#4DB6AC]">
                    ₹{perDay}/day × {salaryForm.present_days} days = ₹{gross.toLocaleString('en-IN')} Gross
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#00695C] text-white flex items-center justify-center font-black text-xl shadow-md">
                  ₹
                </div>
              </div>

              {/* Salary Period Date Range Picker */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#00695C]" /> Pay Period Date Range
                  </label>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#E0F2F1] text-[#00695C] dark:bg-[#00695C]/40 dark:text-[#4DB6AC]">
                    {salaryForm.total_days} Days Period
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">From Date</span>
                    <input
                      type="date"
                      value={salaryForm.start_date || ''}
                      max={salaryForm.end_date || ''}
                      onChange={(e) => handleSalaryDateChange('start_date', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[#263238] dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">To Date</span>
                    <input
                      type="date"
                      value={salaryForm.end_date || ''}
                      min={salaryForm.start_date || ''}
                      onChange={(e) => handleSalaryDateChange('end_date', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[#263238] dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
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
                  <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
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
                  <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Work Days Attended
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={salaryForm.present_days}
                    onChange={(e) => setSalaryForm({ ...salaryForm, present_days: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold text-[#00695C] dark:text-[#4DB6AC] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Advance Deduction
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
                    <CalendarDays className="w-3.5 h-3.5 text-rose-500" /> Logged Raja Dates:
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
                    Bonus / Incentive (₹)
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

              {/* Gulla Denomination Currency Note Tally */}
              {salaryForm.payment_method === 'CASH' && (() => {
                const noteTotal = calculateTotalFromNotes(denominationCounts);
                const diff = noteTotal - net;
                return (
                  <div className="p-3.5 bg-[#384959]/5 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-blue-600" /> Gulla Cash Denominations
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAutoFillGreedyNotes(net)}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        ⚡ Auto-Fill Notes
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

      {/* 3. Give Advance Modal */}
      <Modal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        title={`Give Advance: ${advanceStaff?.first_name || advanceStaff?.username || ''}`}
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
              Reason / Note
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



      {/* 6. Add Staff Note / Remark Modal */}
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
              Save Note
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddNoteSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Note Category
            </label>
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
            >
              <option value="General">📝 General Remark</option>
              <option value="Performance">⭐ Performance / Work Note</option>
              <option value="Advance Note">💵 Advance / Payment Note</option>
              <option value="Leave Request">🗓️ Leave / Raja Note</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Note / Remarks Content *
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

      {/* 7. Delete Staff Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Staff Member"
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
              Yes, Delete Staff
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

      {/* 8. Leave Management Modal (Option 1: Add Leave & Option 2: View All Leaves) */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title={`Leave Management: ${leaveStaff ? (leaveStaff.first_name ? `${leaveStaff.first_name} ${leaveStaff.last_name || ''}`.trim() : leaveStaff.username) : ''}`}
        subtitle="Record employee leaves or view total leave history"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setIsLeaveModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {leaveStaff && (() => {
          const att = getStaffAttendance(leaveStaff.id);
          const allLeaves = att.leaveDates || [];
          const staffName = leaveStaff.first_name ? `${leaveStaff.first_name} ${leaveStaff.last_name || ''}`.trim() : leaveStaff.username;

          return (
            <div className="space-y-4 font-sans text-xs">
              {/* Option Selector Tabs */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLeaveTab('add')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-extrabold transition-all cursor-pointer ${
                    leaveTab === 'add'
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Option 1: Add Leave</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeaveTab('view')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-extrabold transition-all cursor-pointer ${
                    leaveTab === 'view'
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Option 2: View All Leaves ({allLeaves.length})</span>
                </button>
              </div>

              {/* Tab 1 Content: Add Leave */}
              {leaveTab === 'add' ? (
                <form onSubmit={handleAddLeaveSubmit} className="space-y-3.5">
                  <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Enter details to record a new leave for <strong>{staffName}</strong>.</span>
                  </div>

                  {/* 1. Title */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sick Leave, Family Function, Personal Work"
                      value={leaveForm.title}
                      onChange={(e) => setLeaveForm({ ...leaveForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                    />
                  </div>

                  {/* 2. Reason */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Reason
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Specify detailed leave reason..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none"
                    />
                  </div>

                  {/* Start Date, End Date, Num Days Leave Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Start Date */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveForm.start_date}
                        onChange={(e) => handleLeaveDateChange('start_date', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveForm.end_date}
                        onChange={(e) => handleLeaveDateChange('end_date', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>

                    {/* Num Days Leave */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Num Day Leave *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={leaveForm.num_days}
                        onChange={(e) => setLeaveForm({ ...leaveForm, num_days: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-slate-800 text-rose-900 dark:text-rose-200 font-mono font-black text-xs text-center focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm shadow-rose-900/20 rounded-xl cursor-pointer"
                    >
                      Save & Add Leave
                    </Button>
                  </div>
                </form>
              ) : (
                /* Tab 2 Content: View All Leaves */
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Leave Summary</p>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {allLeaves.reduce((acc, l) => acc + Number(l.num_days || 1), 0)} Total Days Off ({allLeaves.length} Records)
                      </h4>
                    </div>
                    <Button
                      size="xs"
                      onClick={() => setLeaveTab('add')}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg cursor-pointer"
                    >
                      + Add Leave
                    </Button>
                  </div>

                  {allLeaves.length === 0 ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                      <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-slate-300 font-bold">No leave records logged yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Click "Option 1: Add Leave" above to record employee leaves.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {allLeaves.map((l, idx) => (
                        <div
                          key={l.id || idx}
                          className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs hover:border-rose-300 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                                {l.title || 'Leave'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 font-extrabold text-[10px]">
                                {l.num_days || 1} {Number(l.num_days || 1) === 1 ? 'Day' : 'Days'} Leave
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                              <span>📅 {l.start_date || l.date}</span>
                              {l.end_date && l.end_date !== (l.start_date || l.date) && (
                                <span>➔ {l.end_date}</span>
                              )}
                            </div>

                            {(l.reason || l.note) && (
                              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 italic">
                                "{l.reason || l.note}"
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveLeaveItem(leaveStaff.id, l.id)}
                            className="px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-600 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer shrink-0"
                            title="Remove leave entry"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* 9. View Staff All Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Staff Details: ${detailStaff ? (detailStaff.first_name ? `${detailStaff.first_name} ${detailStaff.last_name || ''}`.trim() : detailStaff.username) : ''}`}
        subtitle="Complete employee profile, salary breakdown, advances, Raja dates & notes"
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {detailStaff && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={IndianRupee}
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenSalaryModal(detailStaff);
                    }}
                    className="bg-[#00695C] hover:bg-[#004D40] text-white font-bold"
                  >
                    Pay Salary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={History}
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenHistoryModal(detailStaff);
                    }}
                  >
                    Salary History
                  </Button>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {detailStaff && (() => {
          const att = getStaffAttendance(detailStaff.id);
          const monthlySalary = Number(detailStaff.salary || 0);
          const perDay = Math.round(monthlySalary / 30);
          const staffName = detailStaff.first_name ? `${detailStaff.first_name} ${detailStaff.last_name || ''}`.trim() : detailStaff.username;

          return (
            <div className="space-y-4 font-sans text-xs">
              {/* Profile Card Header */}
              <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 rounded-2xl border border-teal-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00695C] to-[#009688] text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md border border-white/20">
                    {staffName ? staffName[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-heading">
                      {staffName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">@{detailStaff.username}</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#00695C] text-white text-[10px] font-extrabold">
                        {detailStaff.role || 'Staff'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                    detailStaff.is_staff_active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${detailStaff.is_staff_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {detailStaff.is_staff_active ? 'Active Employee' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Grid Metrics & Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Phone Contact</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block">
                    {detailStaff.phone || 'No phone'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
                    {detailStaff.email || 'No email registered'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Monthly Base Salary</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    ₹{monthlySalary.toLocaleString('en-IN')}/mo <span className="text-[10px] font-normal text-slate-400">(~₹{perDay}/day)</span>
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Advance Taken</span>
                    <span className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                      ₹{(att.advanceTaken || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenAdvanceModal(detailStaff);
                    }}
                    className="text-[10px] px-2 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 font-extrabold cursor-pointer"
                  >
                    + Advance
                  </button>
                </div>
              </div>

            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default StaffList;
