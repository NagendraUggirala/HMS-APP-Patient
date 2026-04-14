import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import {
  getPatientDepartments,
  getPatientDepartmentDoctors,
  getDoctorAvailableSlots,
  bookPatientAppointment,
  getPatientAppointmentByRef,
  getMyPatientAppointments,
  cancelPatientAppointment,
  patientAppointmentErrorMessage,
} from '../../services/patientApi';



function formatClockTime(timeStr) {
  if (!timeStr) return '—';
  const part = String(timeStr).slice(0, 5);
  const [hRaw, mRaw] = part.split(':');
  const h = parseInt(hRaw, 10);
  const m = mRaw ?? '00';
  if (Number.isNaN(h)) return String(timeStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function normalizeStatusLabel(status) {
  if (!status) return 'Unknown';
  const s = String(status).toUpperCase();
  if (s === 'REQUESTED') return 'Pending';
  if (s === 'CONFIRMED') return 'Confirmed';
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'CANCELLED') return 'Cancelled';
  return String(status).replace(/_/g, ' ');
}

function statsBucket(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'CONFIRMED') return 'Confirmed';
  if (s === 'REQUESTED') return 'Pending';
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'CANCELLED') return 'Cancelled';
  return null;
}

const LoadingSpinner = () => (
  <View className="flex-1 justify-center items-center py-10">
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

const MyAppointmentsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [formData, setFormData] = useState({
    departmentName: '',
    doctorName: '',
    date: '',
    time: '',
    chiefComplaint: '',
  });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPatientAppointments({
        page: pagination.page,
        limit: pagination.limit,
        statusFilter: statusFilter || undefined,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Only alert if it's not a background refresh
        if (appointments.length === 0) {
          Alert.alert('Authentication Error', patientAppointmentErrorMessage(payload));
        }
        setAppointments([]);
        return;
      }
      const list = payload.appointments ?? [];
      setAppointments(list);
      if (payload.pagination) {
        setPagination((prev) => ({
          ...prev,
          page: payload.pagination.page ?? prev.page,
          limit: payload.pagination.limit ?? prev.limit,
          total: payload.pagination.total ?? 0,
          pages: payload.pagination.pages ?? 1,
        }));
      }
    } catch {
      if (appointments.length === 0) {
        Alert.alert('Connection Error', 'Could not load appointments. Check your server connection.');
      }
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const loadDepartmentsForBooking = async () => {
    setLoadingDepartments(true);
    try {
      const res = await getPatientDepartments();
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Error', patientAppointmentErrorMessage(payload));
        setDepartments([]);
        return;
      }
      setDepartments(Array.isArray(payload) ? payload : []);
    } catch {
      Alert.alert('Error', 'Failed to load departments.');
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadDoctors = async (departmentName) => {
    if (!departmentName) {
      setDoctors([]);
      return;
    }
    setLoadingDoctors(true);
    try {
      const res = await getPatientDepartmentDoctors(departmentName);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Error', patientAppointmentErrorMessage(payload));
        setDoctors([]);
        return;
      }
      setDoctors(payload.doctors ?? []);
    } catch {
      Alert.alert('Error', 'Failed to load doctors.');
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadSlots = async (doctorName, date) => {
    if (!doctorName || !date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await getDoctorAvailableSlots(doctorName, date);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Error', patientAppointmentErrorMessage(payload));
        setSlots([]);
        return;
      }
      setSlots(payload.available_slots ?? []);
    } catch {
      Alert.alert('Error', 'Failed to load time slots.');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setFormData({
      departmentName: '',
      doctorName: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      chiefComplaint: '',
    });
    setDoctors([])
    setSlots([])
    setShowForm(true)
    loadDepartmentsForBooking()
  }

  const handleDepartmentChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      departmentName: name,
      doctorName: '',
      time: '',
    }))
    setSlots([])
    loadDoctors(name)
  }

  const handleDoctorChange = (name) => {
    setFormData((prev) => ({ ...prev, doctorName: name, time: '' }))
  }

  const handleBookingDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date, time: '' }))
  }

  useEffect(() => {
    if (!showForm) return
    if (!formData.doctorName || !formData.date) {
      setSlots([])
      return
    }
    loadSlots(formData.doctorName, formData.date)
  }, [showForm, formData.doctorName, formData.date])

  const handleSubmitBooking = async () => {
    if (!formData.departmentName || !formData.doctorName || !formData.date || !formData.time) {
      Alert.alert('Error', 'Please select department, doctor, date, and an available time slot.');
      return;
    }
    if (!formData.chiefComplaint.trim()) {
      Alert.alert('Error', 'Please describe your reason for visit (chief complaint).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await bookPatientAppointment({
        department_name: formData.departmentName,
        doctor_name: formData.doctorName,
        appointment_date: formData.date,
        appointment_time: formData.time,
        chief_complaint: formData.chiefComplaint.trim(),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Error', patientAppointmentErrorMessage(payload));
        return;
      }
      Alert.alert('Success', payload.message || 'Appointment booked successfully!');
      setShowForm(false);
      await loadAppointments();
    } catch {
      Alert.alert('Error', 'Booking failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCancelModal = (apt) => {
    setCancelTarget(apt);
    setCancelReason('');
  };

  const submitCancel = async () => {
    if (!cancelTarget?.appointment_ref) return;
    const reason = cancelReason.trim() || 'Requested by patient';
    setCancelling(true);
    try {
      const res = await cancelPatientAppointment(cancelTarget.appointment_ref, reason);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Error', patientAppointmentErrorMessage(payload));
        return;
      }
      Alert.alert('Success', payload.message || 'Appointment cancelled.');
      setCancelTarget(null);
      setSelectedAppointment(null);
      await loadAppointments();
    } catch {
      Alert.alert('Error', 'Could not cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  const handleViewDetails = async (row) => {
    setShowForm(false);
    setSelectedAppointment(null);
    setDetailLoading(true);
    try {
      const res = await getPatientAppointmentByRef(row.appointment_ref);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Error', patientAppointmentErrorMessage(payload));
        return;
      }
      setSelectedAppointment(payload);
    } catch {
      Alert.alert('Error', 'Could not load appointment details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const canCancel = (status) => {
    const s = String(status || '').toUpperCase();
    return s !== 'CANCELLED' && s !== 'COMPLETED';
  };

  const statConfirmed = appointments.filter((a) => statsBucket(a.status) === 'Confirmed').length;
  const statPending = appointments.filter((a) => statsBucket(a.status) === 'Pending').length;
  const statCompleted = appointments.filter((a) => statsBucket(a.status) === 'Completed').length;
  const statCancelled = appointments.filter((a) => statsBucket(a.status) === 'Cancelled').length;

  return (
    <ScreenContainer>
      {/* Header Section */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-1 mr-4">
          <Text className="text-2xl font-bold text-gray-800">My Appointments</Text>
          <Text className="text-gray-500 text-[11px] mt-1">Book and manage appointments at your registered hospital</Text>
        </View>
        <TouchableOpacity
          onPress={handleNewAppointment}
          className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center justify-center shadow-sm"
        >
          <FontAwesome5 name="plus" size={12} color="white" className="mr-2" />
        </TouchableOpacity>
      </View>

      {/* Stats Section with Web Styling */}
      <View className="flex-row flex-wrap justify-between mb-6">
        <StatCard label="Confirmed" value={statConfirmed} icon="calendar-check" type="blue" subtitle="On this page" />
        <StatCard label="Pending" value={statPending} icon="hourglass-half" type="amber" subtitle="Requested" />
        <StatCard label="Completed" value={statCompleted} icon="check-circle" type="emerald" subtitle="Past visits" />
        <StatCard label="Cancelled" value={statCancelled} icon="times-circle" type="rose" subtitle="Cancelled" />
      </View>

      {/* Main Container matching Web Table Frame */}
      <View className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-10">
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-semibold text-gray-800 text-base">All Appointments</Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={() => loadAppointments()} className="px-3 py-1.5 border border-gray-200 rounded-lg">
                <Text className="text-[10px] font-bold text-gray-600">Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>


        </View>

        {/* Enhanced Table Header - Exact same fonts/casing as Web */}
        <View className="flex-row bg-gray-50 px-4 py-3 border-b border-gray-100">
          <Text className="w-16 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Ref</Text>
          <Text className="flex-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Doctor</Text>
          <Text className="w-24 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Date & Time</Text>
          <Text className="w-16 text-[10px] font-semibold text-gray-600 uppercase tracking-wider text-center">Status</Text>
          <Text className="w-12 text-[10px] font-semibold text-gray-600 uppercase tracking-wider text-right">Action</Text>
        </View>

        <ScrollView horizontal={false}>
          {loading && appointments.length === 0 ? (
            <LoadingSpinner />
          ) : appointments.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <Text className="text-gray-500 text-sm italic">No appointments yet. Schedule one to get started.</Text>
            </View>
          ) : (
            <View>
              {appointments.map((appointment) => (
                <AppointmentRow
                  key={appointment.appointment_ref}
                  appointment={appointment}
                  onView={() => handleViewDetails(appointment)}
                  onCancel={() => openCancelModal(appointment)}
                  canCancel={canCancel(appointment.status)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Table Pagination matching Web */}
        {pagination.pages > 1 && (
          <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
            <Text className="text-[11px] text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                disabled={pagination.page <= 1}
                onPress={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                className={`px-3 py-1 border border-gray-200 rounded bg-white shadow-sm ${pagination.page <= 1 ? 'opacity-30' : ''}`}
              >
                <Text className="text-[10px] font-bold text-gray-600">Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={pagination.page >= pagination.pages}
                onPress={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className={`px-3 py-1 border border-gray-200 rounded bg-white shadow-sm ${pagination.page >= pagination.pages ? 'opacity-30' : ''}`}
              >
                <Text className="text-[10px] font-bold text-gray-600">Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Modals for Forms and Details */}
      {/* (Modal implementations stay robust with accurate logic from your snippet) */}

      {/* Booking Modal */}
      <Modal visible={showForm} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90%]">
            <View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">Schedule Appointment</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <FormLabel label="Department *" />
                <PickerSelect
                  value={formData.departmentName}
                  onValueChange={handleDepartmentChange}
                  options={departments.map(d => ({ label: d.name, value: d.name }))}
                  placeholder={loadingDepartments ? "Loading..." : "Select department"}
                />

                <FormLabel label="Doctor *" />
                <PickerSelect
                  value={formData.doctorName}
                  onValueChange={handleDoctorChange}
                  options={doctors.map(d => ({ label: d.name, value: d.name, sub: d.specialization }))}
                  placeholder={!formData.departmentName ? "Select department" : loadingDoctors ? "Loading..." : "Select doctor"}
                  disabled={!formData.departmentName || loadingDoctors}
                />

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <FormLabel label="Date *" />
                    <TextInput
                      value={formData.date}
                      onChangeText={handleBookingDateChange}
                      placeholder="YYYY-MM-DD"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
                    />
                  </View>
                  <View className="flex-1">
                    <FormLabel label="Fee (est.)" />
                    <Text className="text-sm font-bold text-gray-900 py-1">
                      {doctors.find((d) => d.name === formData.doctorName)?.consultation_fee != null
                        ? `₹${Number(doctors.find((d) => d.name === formData.doctorName).consultation_fee).toFixed(0)}`
                        : '—'}
                    </Text>
                  </View>
                </View>

                <FormLabel label="Available Times *" />
                {loadingSlots ? (
                  <ActivityIndicator size="small" color="#2563eb" className="self-start" />
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {slots.map((s) => (
                      <TouchableOpacity
                        key={s.time}
                        disabled={!s.is_available}
                        onPress={() => setFormData(p => ({ ...p, time: s.time }))}
                        className={`px-3 py-1.5 rounded-lg border ${formData.time === s.time ? 'bg-blue-600 border-blue-600' : s.is_available ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                          }`}
                      >
                        <Text className={`text-[10px] font-bold ${formData.time === s.time ? 'text-white' : s.is_available ? 'text-gray-700' : 'text-gray-300'}`}>{s.time}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <FormLabel label="Reason for visit *" />
                <TextInput
                  multiline
                  numberOfLines={3}
                  value={formData.chiefComplaint}
                  onChangeText={(text) => setFormData({ ...formData, chiefComplaint: text })}
                  placeholder="Describe symptoms..."
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 h-20"
                  textAlignVertical="top"
                />

                <View className="flex-row justify-end gap-3 pt-4 mb-4">
                  <TouchableOpacity onPress={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                    <Text className="text-gray-700 font-medium">Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmitBooking}
                    disabled={submitting || !formData.time}
                    className={`px-4 py-2 rounded-lg ${submitting || !formData.time ? 'bg-gray-300' : 'bg-blue-600'}`}
                  >
                    <Text className="text-white font-bold">{submitting ? 'Booking…' : 'Book Appointment'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={!!selectedAppointment} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90%]">
            <View className="p-5 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
              <Text className="text-base font-bold text-gray-800 tracking-tight">Appointment Details</Text>
              <TouchableOpacity onPress={() => setSelectedAppointment(null)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedAppointment && (
              <ScrollView className="p-6">
                <View className="space-y-4">
                  <View className="flex-row justify-between">
                    <DetailRow label="Reference" value={selectedAppointment.appointment_ref} mono />
                    <StatusBadge status={selectedAppointment.status} />
                  </View>
                  <View className="h-[1px] bg-gray-100 my-1" />
                  <DetailRow label="Doctor & Department" value={selectedAppointment.doctor_name} subValue={selectedAppointment.department_name} />
                  <DetailRow label="Patient" value={selectedAppointment.patient_name} subValue={selectedAppointment.patient_phone} />
                  <DetailRow label="Date & Time" value={`${selectedAppointment.appointment_date} at ${formatClockTime(selectedAppointment.appointment_time)}`} />
                  <DetailRow label="Reason" value={selectedAppointment.chief_complaint || '—'} />
                  {selectedAppointment.consultation_fee != null && (
                    <DetailRow label="Consultation Fee" value={`₹${Number(selectedAppointment.consultation_fee).toFixed(0)}`} />
                  )}
                  {selectedAppointment.notes && <DetailRow label="Clinic Notes" value={selectedAppointment.notes} />}

                  <View className="flex-row justify-end pt-6 pb-6">
                    {canCancel(selectedAppointment.status) && (
                      <TouchableOpacity onPress={() => openCancelModal(selectedAppointment)} className="bg-red-600 px-6 py-2.5 rounded-xl shadow-sm">
                        <Text className="text-white font-bold">Cancel appointment</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal visible={!!cancelTarget} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center p-6">
          <View className="bg-white rounded-2xl p-6 shadow-2xl">
            <Text className="text-base font-bold text-gray-800 mb-2">Cancel Appointment</Text>
            <Text className="text-xs text-gray-500 mb-4">Are you sure you want to cancel <Text className="font-mono text-gray-800 font-bold">{cancelTarget?.appointment_ref}</Text>?</Text>
            <TextInput
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancellation (optional)"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 mb-6 bg-gray-50"
              textAlignVertical="top"
            />
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity onPress={() => setCancelTarget(null)} className="px-4 py-2 border border-gray-200 rounded-lg">
                <Text className="text-gray-600 font-bold">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitCancel} disabled={cancelling} className="bg-red-600 px-4 py-2 rounded-lg">
                <Text className="text-white font-bold">{cancelling ? 'Processing...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Global Indicator for Detail Loading */}
      {detailLoading && (
        <View className="absolute inset-0 bg-black/5 flex items-center justify-center z-[200]">
          <View className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-gray-600 font-bold text-xs uppercase tracking-widest">Loading Details</Text>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
};

// Sub-components matching Web design tokens
const StatCard = ({ label, value, icon, type, subtitle }) => {
  const themes = {
    blue: { bg: ['#ffffff', '#eff6ff'], accent: 'bg-blue-200', text: 'text-blue-600', icon: ['#3b82f6', '#2563eb'] },
    amber: { bg: ['#ffffff', '#fffbeb'], accent: 'bg-amber-100', text: 'text-amber-600', icon: ['#f59e0b', '#d97706'] },
    emerald: { bg: ['#ffffff', '#ecfdf5'], accent: 'bg-emerald-100', text: 'text-emerald-700', icon: ['#10b981', '#059669'] },
    rose: { bg: ['#ffffff', '#fff1f2'], accent: 'bg-rose-100', text: 'text-rose-600', icon: ['#f43f5e', '#e11d48'] },
  };
  const theme = themes[type];
  return (
    <View className="w-[48%] mb-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative h-32">
      <LinearGradient colors={theme.bg} className="flex-1 p-4">
        <View className={`absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 ${theme.accent}`} style={{ transform: [{ translateX: 20 }, { translateY: -20 }] }} />
        <View className={`absolute bottom-0 left-0 w-12 h-12 rounded-full opacity-10 ${theme.accent}`} style={{ transform: [{ translateX: -20 }, { translateY: 20 }] }} />
        <View className="flex-row justify-between items-start">
          <View>
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${theme.text}`}>{label}</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">{value}</Text>
          </View>
          <LinearGradient colors={theme.icon} className="w-10 h-10 rounded-xl items-center justify-center">
            <FontAwesome5 name={icon} size={15} color="#fff" />
          </LinearGradient>
        </View>
        <View className="flex-1 justify-end">
          <View className="h-[1px] bg-gray-100 mb-2 opacity-50" />
          <Text className={`text-[10px] font-medium ${theme.text}`}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const AppointmentRow = ({ appointment, onView, onCancel, canCancel }) => {
  const label = normalizeStatusLabel(appointment.status);
  const raw = String(appointment.status || '').toUpperCase();
  return (
    <View className="flex-row items-center px-4 py-4 border-b border-gray-50 bg-white">
      <View className="w-16">
        <Text className="text-[10px] font-mono text-gray-800 font-bold">{appointment.appointment_ref}</Text>
      </View>
      <View className="flex-1 px-1">
        <Text className="text-sm font-bold text-gray-900 tracking-tight">{appointment.doctor_name}</Text>
        <Text className="text-[9px] text-gray-500 font-medium">{appointment.department_name}</Text>
      </View>
      <View className="w-24 pl-1">
        <Text className="text-[11px] font-bold text-gray-800">{appointment.appointment_date}</Text>
        <Text className="text-[9px] text-gray-500 font-medium">{formatClockTime(appointment.appointment_time)}</Text>
      </View>
      <View className="w-16 items-center">
        <StatusBadge status={appointment.status} />
      </View>
      <View className="w-12 flex-row justify-end gap-2">
        <TouchableOpacity onPress={onView} className="p-1">
          <FontAwesome5 name="eye" size={12} color="#3b82f6" />
        </TouchableOpacity>
        {canCancel && (
          <TouchableOpacity onPress={onCancel} className="p-1">
            <FontAwesome5 name="times" size={12} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const StatusBadge = ({ status }) => {
  const raw = String(status || '').toUpperCase();
  const label = normalizeStatusLabel(status);
  let c = "bg-yellow-100 text-yellow-800";
  if (raw === 'CONFIRMED') c = "bg-green-100 text-green-800";
  else if (raw === 'COMPLETED') c = "bg-blue-100 text-blue-800";
  else if (raw === 'CANCELLED') c = "bg-red-100 text-red-800";
  return (
    <View className={`px-2 py-0.5 rounded-full ${c.split(' ')[0]}`}>
      <Text className={`text-[9px] font-bold ${c.split(' ')[1]}`}>{label}</Text>
    </View>
  );
};

const DetailRow = ({ label, value, subValue, mono }) => (
  <View className="mb-1">
    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">{label}</Text>
    <Text className={`text-sm text-gray-900 font-bold ${mono ? 'font-mono text-xs' : ''}`}>{value}</Text>
    {subValue && <Text className="text-[10px] text-gray-500 italic mt-0.5">{subValue}</Text>}
  </View>
);

const FormLabel = ({ label }) => (
  <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-2">{label}</Text>
);

const PickerSelect = ({ value, onValueChange, options, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 h-10"
      >
        <Text className={`text-sm ${value ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
          {options.find(o => o.value === value)?.label || placeholder}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={20} color="#94a3b8" />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} className="flex-1 bg-black/40 justify-center p-6">
          <View className="bg-white rounded-xl shadow-2xl max-h-[70%]">
            <View className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <Text className="text-sm font-bold text-gray-800">{placeholder}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => { onValueChange(o.value); setOpen(false); }}
                  className={`p-4 border-b border-gray-50 ${value === o.value ? 'bg-blue-50' : ''}`}
                >
                  <Text className={`text-sm ${value === o.value ? 'font-bold text-blue-600' : 'text-gray-700'}`}>{o.label}</Text>
                  {o.sub && <Text className="text-[10px] text-gray-400 mt-1">{o.sub}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setOpen(false)} className="p-4 items-center bg-white rounded-b-xl border-t border-gray-100">
              <Text className="text-blue-600 font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default MyAppointmentsScreen;
