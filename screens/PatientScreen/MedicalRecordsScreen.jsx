import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import { apiFetch } from '../../services/apiClient';

const { width } = Dimensions.get('window');

const LoadingSpinner = () => (
  <View className="flex-1 justify-center items-center py-20">
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

const MedicalRecordsScreen = ({ route }) => {
  const patientRef = route?.params?.patientRef;
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadMedicalRecords = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch Patient Summary
      const summaryUrl = patientRef
        ? `/api/v1/patient-medical-history/patients/${patientRef}/summary`
        : '/api/v1/patient-medical-history/my/summary';
      const summaryRes = await apiFetch(summaryUrl);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data || summaryData);
      }
    } catch (err) {
      console.error("Failed to load patient summary", err);
    }

    // Fetch Medical Records
    try {
      const recordsUrl = patientRef
        ? `/api/v1/patient-medical-history/patients/${patientRef}/medical-records?page=1&limit=20`
        : '/api/v1/patient-medical-history/my/medical-records?page=1&limit=20';
      const recordsRes = await apiFetch(recordsUrl);
      if (recordsRes.ok) {
        const recordsJson = await recordsRes.json();
        const recordsList = recordsJson.data?.records || recordsJson.records || [];

        const mappedRecords = recordsList.map(r => ({
          id: r.id,
          patientRef: r.patient_ref || '',
          patientName: r.patient_name || '',
          appointmentRef: r.appointment_ref || null,
          type: r.type || (
            r.department_name && r.department_name.toLowerCase().includes('lab') ? 'Lab Test' :
              r.department_name && r.department_name.toLowerCase().includes('radiology') ? 'X-Ray' :
                'Consultation'
          ),
          date: r.visit_date ? r.visit_date.slice(0, 10) : (r.created_at ? r.created_at.slice(0, 10) : 'N/A'),
          doctor: r.doctor_name || 'N/A',
          department: r.department_name || 'General',
          diagnosis: r.diagnosis || 'No Diagnosis',
          symptoms: r.chief_complaint || 'No symptoms noted',
          treatment: r.treatment_plan || '',
          vitalSigns: r.vital_signs || null,
          attachments: Array.isArray(r.prescriptions) ? r.prescriptions.length : 0,
          prescriptions: Array.isArray(r.prescriptions) ? r.prescriptions : [],
          status: r.is_finalized ? 'Completed' : 'Draft',
          raw: r
        }));

        setRecords(mappedRecords);
      } else {
        throw new Error("Failed to fetch medical records");
      }
    } catch (err) {
      console.error("Error loading medical records:", err);
      setRecords([]);
    }

    // Fetch Timeline
    try {
      const timelineUrl = patientRef
        ? `/api/v1/patient-medical-history/patients/${patientRef}/timeline`
        : '/api/v1/patient-medical-history/my/timeline';
      const timelineRes = await apiFetch(timelineUrl);
      if (timelineRes.ok) {
        const timelineJson = await timelineRes.json();
        setTimeline(timelineJson.data?.timeline || timelineJson.timeline || []);
      }
    } catch (err) {
      console.error("Error loading timeline:", err);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }, [patientRef]);

  useEffect(() => {
    loadMedicalRecords();
  }, [loadMedicalRecords]);

  const handleViewDetails = async (record) => {
    setSelectedRecord({ ...record, fetchingDetails: true });

    try {
      const detailUrl = patientRef
        ? `/api/v1/patient-medical-history/patients/${patientRef}/medical-records/${record.id}`
        : `/api/v1/patient-medical-history/my/medical-records/${record.id}`;
      const res = await apiFetch(detailUrl);
      if (res.ok) {
        const detailJson = await res.json();
        const details = detailJson.data || detailJson;
        setSelectedRecord({ ...record, ...details, fetchingDetails: false });
      } else {
        setSelectedRecord({ ...record, fetchingDetails: false, error: 'Failed to load extended details' });
      }
    } catch (err) {
      console.error(err);
      setSelectedRecord({ ...record, fetchingDetails: false, error: 'Failed to load extended details' });
    }
  };

  const handleDownload = (recordId) => {
    const record = records.find(r => r.id === recordId) || selectedRecord;
    if (!record) return;

    const content = `MEDICAL RECORD\n--------------------\nRecord ID: ${record.id}\nDate: ${record.date}\nType: ${record.type}\nDiagnosis: ${record.diagnosis}\nDoctor: ${record.doctor}\nDepartment: ${record.department}\n\nSymptoms:\n${record.symptoms}\n\nTreatment & Notes:\n${record.treatment || record.treatment_plan || 'N/A'}\n--------------------\nHospital Management System`;

    Share.share({
      title: `Medical Record: ${record.diagnosis}`,
      message: content,
    });
  };

  const handleShare = async (recordId) => {
    let shareTitle = 'My Medical Records';
    let shareText = `I am securely sharing my medical history summary from the Hospital Management patient portal.`;

    if (recordId !== 'all') {
      const record = records.find(r => r.id === recordId) || selectedRecord;
      if (record) {
        shareTitle = `Medical Record: ${record.diagnosis}`;
        shareText = `Medical record from ${record.date} regarding ${record.diagnosis} under Dr. ${record.doctor}.`;
      }
    }

    try {
      await Share.share({
        title: shareTitle,
        message: shareText,
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const handleExportAll = () => {
    if (!summary || records.length === 0) {
      Alert.alert("Wait", "Data is still loading, please wait.");
      return;
    }

    const exportData = {
      generated_on: new Date().toISOString(),
      patient_profile: summary,
      medical_records: records,
      history_timeline: timeline
    };

    Share.share({
      title: `Full Medical History`,
      message: JSON.stringify(exportData, null, 2),
    });
  };

  const filteredRecords = filter === 'all'
    ? records
    : records.filter(record => record.type === filter);

  if (loading) return <ScreenContainer><LoadingSpinner /></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-2xl font-bold text-gray-800">Medical Records</Text>
              <Text className="text-gray-500 text-xs mt-1">Your complete medical history and health records</Text>
            </View>
          </View>
          <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
              onPress={handleExportAll}
              className="flex-1 bg-blue-50 py-3 rounded-xl flex-row items-center justify-center border border-blue-100"
            >
              <FontAwesome5 name="download" size={14} color="#2563eb" className="mr-2" />
              <Text className="text-blue-700 text-sm font-semibold ml-2">Export All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleShare('all')}
              className="flex-1 bg-emerald-50 py-3 rounded-xl flex-row items-center justify-center border border-emerald-100"
            >
              <FontAwesome5 name="share-alt" size={14} color="#059669" className="mr-2" />
              <Text className="text-emerald-700 text-sm font-semibold ml-2">Share All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient Profile Summary Card */}
        {summary && (
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <LinearGradient
              colors={['#f8fafc', '#ffffff']}
              className="p-6"
            >
              {/* Core Identity */}
              <View className="flex-row items-center gap-4 mb-6">
                <LinearGradient
                  colors={['#6366f1', '#3b82f6']}
                  className="w-16 h-16 rounded-full items-center justify-center"
                >
                  <Text className="text-white text-2xl font-bold">
                    {summary.patient_name?.charAt(0) || 'P'}
                  </Text>
                </LinearGradient>
                <View>
                  <Text className="text-xl font-bold text-gray-900">{summary.patient_name}</Text>
                  <Text className="text-indigo-600 font-semibold text-xs">{summary.patient_ref}</Text>
                </View>
              </View>

              {/* Stats Grid */}
              <View className="flex-row flex-wrap gap-2 mb-6">
                <View className="bg-slate-50 p-3 rounded-2xl border border-gray-100 w-[48%]">
                  <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">DOB</Text>
                  <Text className="font-bold text-gray-800 text-sm">{summary.date_of_birth || 'N/A'}</Text>
                </View>
                <View className="bg-slate-50 p-3 rounded-2xl border border-gray-100 w-[48%]">
                  <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Gender</Text>
                  <Text className="font-bold text-gray-800 text-sm">{summary.gender || 'N/A'}</Text>
                </View>
                <View className="bg-red-50 p-3 rounded-2xl border border-red-100 w-[48%]">
                  <Text className="text-[10px] text-red-600 font-bold uppercase tracking-wider mb-1">Blood Group</Text>
                  <Text className="font-bold text-red-600 text-lg">{summary.blood_group || 'N/A'}</Text>
                </View>
                <View className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 w-[48%]">
                  <Text className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Visits</Text>
                  <Text className="font-bold text-emerald-600 text-lg">{summary.total_visits || 0}</Text>
                </View>
              </View>

              {/* Clinical Details */}
              <View className="space-y-4">
                <View>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex-row">
                    <FontAwesome5 name="thermometer-half" size={10} color="#94a3b8" /> ACTIVE CONDITIONS
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {summary.active_conditions?.length > 0 ? summary.active_conditions.map((c, i) => (
                      <View key={i} className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                        <Text className="text-amber-700 text-[10px] font-bold">{c}</Text>
                      </View>
                    )) : <Text className="text-xs text-gray-400 italic">None recorded</Text>}
                  </View>
                </View>

                <View>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <FontAwesome5 name="heartbeat" size={10} color="#94a3b8" /> CHRONIC ISSUES
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {summary.chronic_conditions?.length > 0 ? summary.chronic_conditions.map((c, i) => (
                      <View key={i} className="px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg">
                        <Text className="text-rose-700 text-[10px] font-bold">{c}</Text>
                      </View>
                    )) : <Text className="text-xs text-gray-400 italic">None recorded</Text>}
                  </View>
                </View>

                <View>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <FontAwesome5 name="allergies" size={10} color="#94a3b8" /> ALLERGIES
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {summary.allergies?.length > 0 ? summary.allergies.map((a, i) => (
                      <View key={i} className="px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg">
                        <Text className="text-orange-700 text-[10px] font-bold">{a}</Text>
                      </View>
                    )) : <Text className="text-xs text-gray-400 italic">No Known Allergies</Text>}
                  </View>
                </View>

                <View>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <FontAwesome5 name="pills" size={10} color="#94a3b8" /> MEDICATIONS
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {summary.current_medications?.length > 0 ? summary.current_medications.map((m, i) => (
                      <View key={i} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                        <Text className="text-blue-700 text-[10px] font-bold">{m}</Text>
                      </View>
                    )) : <Text className="text-xs text-gray-400 italic">None prescribed</Text>}
                  </View>
                </View>
              </View>

              {/* Admin Info */}
              {(summary.emergency_contact?.name || summary.last_visit_date) && (
                <View className="mt-6 pt-5 border-t border-gray-100 flex-row flex-wrap gap-3">
                  {summary.emergency_contact?.name && (
                    <View className="flex-row items-center bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                      <FontAwesome5 name="phone-alt" size={10} color="#ef4444" />
                      <View className="ml-2">
                        <Text className="text-[8px] uppercase font-bold text-red-400">Emergency ({summary.emergency_contact.relation})</Text>
                        <Text className="text-[10px] font-bold text-gray-800">{summary.emergency_contact.name}</Text>
                      </View>
                    </View>
                  )}
                  {summary.last_visit_date && (
                    <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      <FontAwesome5 name="history" size={10} color="#94a3b8" />
                      <View className="ml-2">
                        <Text className="text-[8px] uppercase font-bold text-gray-500">Last Visit</Text>
                        <Text className="text-[10px] font-bold text-gray-800">{summary.last_visit_date}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Filter Tabs */}
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            <TouchableOpacity
              onPress={() => setFilter('all')}
              className={`px-6 py-2 rounded-full mr-2 ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-100'}`}
            >
              <Text className={`text-xs font-bold ${filter === 'all' ? 'text-white' : 'text-gray-600'}`}>All Records</Text>
            </TouchableOpacity>
            {/* You can add more category filters here based on record.type */}
          </ScrollView>
        </View>

        {/* Medical Records List */}
        <View className="space-y-4 mb-10">
          {filteredRecords.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <FontAwesome5 name="folder-open" size={40} color="#e2e8f0" />
              <Text className="text-gray-400 mt-4 font-medium italic">No medical records found</Text>
            </View>
          ) : (
            filteredRecords.map(record => (
              <View key={record.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <View className="flex-row justify-between items-start mb-3">
                  <View className={`px-2 py-1 rounded-lg ${record.type === 'Consultation' ? 'bg-blue-50' :
                      record.type === 'Lab Test' ? 'bg-emerald-50' :
                        record.type === 'X-Ray' ? 'bg-purple-50' :
                          'bg-amber-50'
                    }`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-wider ${record.type === 'Consultation' ? 'text-blue-600' :
                        record.type === 'Lab Test' ? 'text-emerald-600' :
                          record.type === 'X-Ray' ? 'text-purple-600' :
                            'text-amber-600'
                      }`}>{record.type}</Text>
                  </View>
                  <Text className="text-[10px] font-bold text-gray-400">{record.date}</Text>
                </View>

                <Text className="text-base font-bold text-gray-900 mb-3">{record.diagnosis}</Text>

                <View className="space-y-2 mb-4">
                  <View className="flex-row items-center">
                    <FontAwesome5 name="user-md" size={12} color="#94a3b8" style={{ width: 16 }} />
                    <Text className="text-xs text-gray-600 ml-2">{record.doctor}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <FontAwesome5 name="hospital" size={10} color="#94a3b8" style={{ width: 16 }} />
                    <Text className="text-xs text-gray-600 ml-2">{record.department}</Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center pt-3 border-t border-gray-50">
                  <TouchableOpacity
                    onPress={() => handleViewDetails(record)}
                    className="bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-blue-600 text-xs font-bold">View Details</Text>
                  </TouchableOpacity>
                  <View className="flex-row gap-4">
                    <TouchableOpacity onPress={() => handleDownload(record.id)}>
                      <FontAwesome5 name="download" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleShare(record.id)}>
                      <FontAwesome5 name="share-alt" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Health Timeline */}
        {timeline && timeline.length > 0 && (
          <View className="mb-10">
            <View className="mb-6">
              <Text className="text-xl font-bold text-gray-800">Health Timeline</Text>
              <Text className="text-gray-500 text-xs mt-1">Chronological history of health events</Text>
            </View>

            <View className="ml-2 border-l border-blue-200 pl-6 space-y-8">
              {timeline.map((item, index) => (
                <View key={index} className="relative">
                  {/* Timeline Dot */}
                  <View className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 border-white ${item.type === 'appointment' ? 'bg-blue-500' : 'bg-emerald-500'} shadow-sm`} />

                  <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-row items-center gap-2">
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${item.type === 'appointment' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                          <FontAwesome5 name={item.type === 'appointment' ? 'calendar-check' : 'notes-medical'} size={14} color={item.type === 'appointment' ? '#3b82f6' : '#10b981'} />
                        </View>
                        <Text className="font-bold text-gray-800 text-sm flex-1">{item.title}</Text>
                      </View>
                    </View>

                    <Text className="text-gray-600 text-xs mb-3">{item.description}</Text>

                    <View className="flex-row flex-wrap gap-2 mb-3">
                      <View className="bg-gray-50 px-2 py-1 rounded-md flex-row items-center">
                        <FontAwesome5 name="user-md" size={10} color="#94a3b8" />
                        <Text className="text-[10px] text-gray-600 ml-1.5 font-medium">{item.doctor_name}</Text>
                      </View>
                      <View className="bg-gray-50 px-2 py-1 rounded-md flex-row items-center">
                        <FontAwesome5 name="hospital" size={10} color="#94a3b8" />
                        <Text className="text-[10px] text-gray-600 ml-1.5 font-medium">{item.department_name}</Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase">{item.date}</Text>
                      <View className={`px-2 py-0.5 rounded-full ${item.status?.toUpperCase() === 'COMPLETED' ? 'bg-emerald-100' :
                          item.status?.toUpperCase() === 'CANCELLED' ? 'bg-red-100' :
                            item.status?.toUpperCase() === 'REQUESTED' ? 'bg-amber-100' :
                              'bg-indigo-100'
                        }`}>
                        <Text className={`text-[8px] font-bold uppercase ${item.status?.toUpperCase() === 'COMPLETED' ? 'text-emerald-700' :
                            item.status?.toUpperCase() === 'CANCELLED' ? 'text-red-700' :
                              item.status?.toUpperCase() === 'REQUESTED' ? 'text-amber-700' :
                                'text-indigo-700'
                          }`}>{item.status?.replace(/_/g, ' ') || 'N/A'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Record Details Modal */}
      <Modal visible={!!selectedRecord} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl h-[85%] overflow-hidden">
            <View className="p-6 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
              <Text className="text-lg font-bold text-gray-800">Record Details</Text>
              <TouchableOpacity onPress={() => setSelectedRecord(null)} className="p-2">
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedRecord && (
              <ScrollView className="p-6">
                <View className="space-y-6">
                  {/* Top Stats */}
                  <View className="flex-row flex-wrap gap-4">
                    <View className="w-[45%]">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Record ID</Text>
                      <Text className="text-xs font-bold text-gray-800" numberOfLines={1}>{selectedRecord.id}</Text>
                    </View>
                    <View className="w-[45%]">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Type</Text>
                      <View className={`self-start px-2 py-0.5 rounded-lg ${selectedRecord.type === 'Consultation' ? 'bg-blue-50' : 'bg-emerald-50'
                        }`}>
                        <Text className={`text-[10px] font-bold ${selectedRecord.type === 'Consultation' ? 'text-blue-600' : 'text-emerald-600'
                          }`}>{selectedRecord.type}</Text>
                      </View>
                    </View>
                    <View className="w-[45%]">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date</Text>
                      <Text className="text-xs font-bold text-gray-800">{selectedRecord.date}</Text>
                    </View>
                    <View className="w-[45%]">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</Text>
                      <Text className={`text-xs font-bold ${selectedRecord.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedRecord.status}</Text>
                    </View>
                  </View>

                  {/* Doctor Info */}
                  <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-row items-center">
                    <View className="w-10 h-10 bg-white rounded-full items-center justify-center border border-blue-100">
                      <FontAwesome5 name="user-md" size={16} color="#3b82f6" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-sm font-bold text-gray-900">{selectedRecord.doctor}</Text>
                      <Text className="text-xs text-gray-600">{selectedRecord.department}</Text>
                    </View>
                  </View>

                  {/* Main content */}
                  <View>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Diagnosis</Text>
                    <Text className="text-base font-bold text-gray-800">{selectedRecord.diagnosis}</Text>
                  </View>

                  <View>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Symptoms</Text>
                    <Text className="text-sm text-gray-700 leading-5">{selectedRecord.symptoms}</Text>
                  </View>

                  <View>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Treatment Plan</Text>
                    <Text className="text-sm text-gray-700 leading-5">{selectedRecord.treatment || selectedRecord.treatment_plan || 'N/A'}</Text>
                  </View>

                  {/* Details loading/content */}
                  {selectedRecord.fetchingDetails ? (
                    <View className="py-10 items-center">
                      <ActivityIndicator size="small" color="#3b82f6" />
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Fetching Clinical details...</Text>
                    </View>
                  ) : selectedRecord.error ? (
                    <View className="bg-red-50 p-3 rounded-xl border border-red-100">
                      <Text className="text-red-600 text-xs font-medium">{selectedRecord.error}</Text>
                    </View>
                  ) : (
                    <>
                      {selectedRecord.examination_findings && (
                        <View>
                          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Examination Findings</Text>
                          <View className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Text className="text-sm text-gray-700">{selectedRecord.examination_findings}</Text>
                          </View>
                        </View>
                      )}

                      {/* Vitals */}
                      {(selectedRecord.vitalSigns || selectedRecord.vital_signs) && (
                        <View>
                          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vital Signs</Text>
                          <View className="flex-row flex-wrap gap-2">
                            {Object.entries(selectedRecord.vitalSigns || selectedRecord.vital_signs).map(([key, value], i) => (
                              key !== 'additionalProp1' && (
                                <View key={i} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                                  <Text className="text-[8px] uppercase text-gray-400 font-bold mb-0.5">{key.replace(/_/g, ' ')}</Text>
                                  <Text className="text-xs font-bold text-gray-800">{String(value)}</Text>
                                </View>
                              )
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Lab Orders */}
                      {selectedRecord.lab_orders?.length > 0 && (
                        <View>
                          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Lab Orders</Text>
                          <View className="space-y-2">
                            {selectedRecord.lab_orders.map((lab, i) => (
                              lab.additionalProp1 === undefined && (
                                <View key={i} className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex-row justify-between items-center">
                                  <Text className="text-xs font-bold text-purple-900">{lab.test_name || 'Lab Test'}</Text>
                                  <FontAwesome5 name="flask" size={12} color="#a855f7" />
                                </View>
                              )
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Imaging Orders */}
                      {selectedRecord.imaging_orders?.length > 0 && (
                        <View>
                          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Imaging Orders</Text>
                          <View className="space-y-2">
                            {selectedRecord.imaging_orders.map((img, i) => (
                              img.additionalProp1 === undefined && (
                                <View key={i} className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex-row justify-between items-center">
                                  <Text className="text-xs font-bold text-orange-900">{img.imaging_type || 'Imaging Test'}</Text>
                                  <FontAwesome5 name="x-ray" size={12} color="#f97316" />
                                </View>
                              )
                            ))}
                          </View>
                        </View>
                      )}

                      {selectedRecord.follow_up_instructions && (
                        <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">
                          <Text className="text-blue-700 text-xs font-bold mb-1">Follow-up Instructions</Text>
                          <Text className="text-blue-900 text-xs leading-5">{selectedRecord.follow_up_instructions}</Text>
                        </View>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  <View className="flex-row gap-3 pt-6 pb-12">
                    <TouchableOpacity
                      onPress={() => handleDownload(selectedRecord.id)}
                      className="flex-1 bg-blue-600 h-12 rounded-2xl items-center justify-center shadow-sm"
                    >
                      <Text className="text-white font-bold">Download Record</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleShare(selectedRecord.id)}
                      className="w-14 h-12 bg-gray-100 rounded-2xl items-center justify-center border border-gray-200"
                    >
                      <FontAwesome5 name="share-alt" size={18} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

export default MedicalRecordsScreen;
