import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import {
  getActivePrescriptions,
  getPrescriptionHistory,
  getPrescriptionDetails,
  requestPrescriptionRefill
} from '../../services/patientApi';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2563eb', // Indigo
  emerald: '#059669',
  indigo: '#4f46e5',
  rose: '#e11d48',
  bg: '#f8fafc',
  white: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b'
};

function getStatusInfo(status) {
  const s = (status || '').toUpperCase();
  if (s === 'SIGNED' || s === 'ACTIVE') return { label: 'Active', color: '#059669', bg: '#ecfdf5' };
  if (s === 'DISPENSED') return { label: 'Dispensed', color: '#2563eb', bg: '#eff6ff' };
  if (s === 'CANCELLED') return { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' };
  return { label: status || 'Unknown', color: '#64748b', bg: '#f1f5f9' };
}

function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.prescriptions)) return payload.prescriptions;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

const PrescriptionsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedRx, setSelectedRx] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isNewRxModalOpen, setIsNewRxModalOpen] = useState(false);
  const [refillLoading, setRefillLoading] = useState(null);

  const loadPrescriptions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let all = [];
      if (filter === 'all') {
        const [activeRes, historyRes] = await Promise.all([
          getActivePrescriptions(),
          getPrescriptionHistory()
        ]);
        
        const activeList = extractList(await activeRes.json().catch(() => ({})));
        const historyList = extractList(await historyRes.json().catch(() => ({})));
        
        const map = new Map();
        activeList.forEach(p => map.set(p.prescription_id, p));
        historyList.forEach(p => map.set(p.prescription_id, p));
        all = Array.from(map.values());
      } else if (filter === 'active') {
        const res = await getActivePrescriptions();
        all = extractList(await res.json().catch(() => ({})));
      } else {
        const res = await getPrescriptionHistory();
        const list = extractList(await res.json().catch(() => ({})));
        if (filter === 'dispensed') all = list.filter(p => p.status?.toUpperCase() === 'DISPENSED');
        else if (filter === 'cancelled') all = list.filter(p => p.status?.toUpperCase() === 'CANCELLED');
      }
      setPrescriptions(all);
    } catch (err) {
      console.error('[Prescriptions] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { loadPrescriptions(); }, [loadPrescriptions]);

  const handleViewDetails = async (prescription) => {
    const uuid = prescription.prescription_id;
    if (!uuid) {
      setSelectedRx({ ...prescription, medicines: [], lab_orders: [] });
      return;
    }
    setDetailLoading(true);
    try {
      const res = await getPrescriptionDetails(uuid);
      const payload = await res.json().catch(() => ({}));
      if (res.ok) setSelectedRx(payload);
      else setSelectedRx({ ...prescription, medicines: [], lab_orders: [] });
    } catch (err) {
      setSelectedRx({ ...prescription, medicines: [], lab_orders: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRefillRequest = (prescriptionId) => {
    Alert.alert(
      'Request Refill',
      'Submit a refill request for this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: async () => {
            setRefillLoading(prescriptionId);
            try {
              const res = await requestPrescriptionRefill(prescriptionId);
              const payload = await res.json().catch(() => ({}));
              if (res.ok) Alert.alert('Success', payload?.message || 'Refill request submitted!');
              else Alert.alert('Failed', payload?.detail || 'Could not process request.');
            } catch (err) {
              Alert.alert('Error', 'Connection error.');
            } finally {
              setRefillLoading(null);
            }
          }
        }
      ]
    );
  };

  const StatBox = ({ label, value, color, bg, subtitle }) => (
    <View style={[styles.statCard, { borderColor: bg }]}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={[styles.statDivider, { backgroundColor: bg }]} />
      <Text style={[styles.statSub, { color }]}>{subtitle}</Text>
    </View>
  );

  const RxCard = ({ item }) => {
    const status = getStatusInfo(item.status);
    const isActive = ['SIGNED', 'ACTIVE'].includes(item.status?.toUpperCase());
    
    return (
      <View style={styles.rxCard}>
        <View style={styles.rxCardHeader}>
          <View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.rxNo}>Rx #{item.prescription_no || item.prescription_id?.slice(0, 8)}</Text>
          </View>
          <Text style={styles.rxDate}>{item.created_at?.split('T')[0] || 'Today'}</Text>
        </View>

        {item.diagnosis && (
          <View style={styles.diagnosisRow}>
            <MaterialIcons name="medical-services" size={14} color="#94a3b8" />
            <Text style={styles.diagnosisText} numberOfLines={2}>{item.diagnosis}</Text>
          </View>
        )}

        <View style={styles.rxCardActions}>
          <TouchableOpacity style={styles.viewDetailBtn} onPress={() => handleViewDetails(item)}>
            <MaterialIcons name="visibility" size={16} color={COLORS.primary} />
            <Text style={styles.viewDetailText}>Details</Text>
          </TouchableOpacity>
          
          {isActive && (
            <TouchableOpacity 
              style={styles.refillBtn} 
              onPress={() => handleRefillRequest(item.prescription_id)}
              disabled={refillLoading === item.prescription_id}
            >
              {refillLoading === item.prescription_id ? (
                <ActivityIndicator size="small" color={COLORS.emerald} />
              ) : (
                <>
                  <MaterialIcons name="autorenew" size={16} color={COLORS.emerald} />
                  <Text style={styles.refillText}>Refill</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Prescriptions</Text>
          <Text style={styles.subtitle}>Medication history & refills</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setIsNewRxModalOpen(true)}>
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPrescriptions(true)} />}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox label="TOTAL" value={prescriptions.length} color={COLORS.primary} bg="#eff6ff" subtitle="All records" />
          <StatBox label="ACTIVE" value={prescriptions.filter(p => ['SIGNED','ACTIVE'].includes(p.status?.toUpperCase())).length} color={COLORS.emerald} bg="#ecfdf5" subtitle="Valid now" />
          <StatBox label="DISPENSED" value={prescriptions.filter(p => p.status?.toUpperCase() === 'DISPENSED').length} color={COLORS.indigo} bg="#eef2ff" subtitle="Completed" />
          <StatBox label="CANCELLED" value={prescriptions.filter(p => p.status?.toUpperCase() === 'CANCELLED').length} color={COLORS.rose} bg="#fff1f2" subtitle="Expired" />
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingRight: 40 }}>
          {['all', 'active', 'dispensed', 'cancelled'].map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterTab, filter === f && styles.filterTabActive]} 
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        <View style={styles.listContainer}>
          {prescriptions.map((rx, idx) => <RxCard key={idx} item={rx} />)}
          {prescriptions.length === 0 && (
            <View style={styles.empty}>
              <FontAwesome5 name="prescription" size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>No prescriptions found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal visible={!!selectedRx} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Prescription Details</Text>
              <TouchableOpacity onPress={() => setSelectedRx(null)}><MaterialIcons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            {selectedRx && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailCard}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Rx Number</Text>
                      <Text style={styles.detailValue}>{selectedRx.prescription_no || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Issued Date</Text>
                      <Text style={styles.detailValue}>{selectedRx.created_at?.split('T')[0]}</Text>
                    </View>
                  </View>
                  {selectedRx.diagnosis && (
                    <View style={{ marginTop: 15 }}>
                      <Text style={styles.detailLabel}>Diagnosis</Text>
                      <Text style={styles.detailValue}>{selectedRx.diagnosis}</Text>
                    </View>
                  )}
                </View>

                {/* Medications List */}
                <Text style={styles.sectionTitle}>Medications ({selectedRx.medicines?.length || 0})</Text>
                {(selectedRx.medicines || []).map((med, i) => (
                  <View key={i} style={styles.medItem}>
                    <View style={styles.medHeader}>
                      <Text style={styles.medName}>{med.medicine_name}</Text>
                      <View style={styles.freqTag}><Text style={styles.freqText}>{med.frequency}</Text></View>
                    </View>
                    <Text style={styles.medDetails}>{med.dose} • {med.duration_days} Days</Text>
                    {med.instructions && <Text style={styles.medIns}>{med.instructions}</Text>}
                  </View>
                ))}

                {/* Lab Orders */}
                {selectedRx.lab_orders?.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Lab Orders</Text>
                    {selectedRx.lab_orders.map((lab, i) => (
                      <View key={i} style={styles.labItem}>
                        <FontAwesome5 name="flask" size={14} color="#8b5cf6" />
                        <Text style={styles.labName}>{lab.test_name}</Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* New Rx Modal */}
      <Modal visible={isNewRxModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.newRxCard}>
            <Text style={styles.newRxTitle}>New Prescription</Text>
            <Text style={styles.newRxSub}>How would you like to proceed?</Text>
            
            <TouchableOpacity style={styles.newRxOption} onPress={() => { setIsNewRxModalOpen(false); navigation.navigate('Appointments'); }}>
              <View style={[styles.newRxIcon, { backgroundColor: '#eff6ff' }]}><MaterialIcons name="event" size={24} color={COLORS.primary} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.optionTitle}>Book Appointment</Text>
                <Text style={styles.optionSub}>Consult a doctor for a new Rx</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newRxOption} onPress={() => { setIsNewRxModalOpen(false); Alert.alert('Request Sent', 'A doctor will review your refill request.'); }}>
              <View style={[styles.newRxIcon, { backgroundColor: '#ecfdf5' }]}><MaterialIcons name="history-edu" size={24} color={COLORS.emerald} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.optionTitle}>Request Online</Text>
                <Text style={styles.optionSub}>Renew a previous prescription</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setIsNewRxModalOpen(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 50, backgroundColor: COLORS.white, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textLight },
  newBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  newBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  scrollContent: { paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 12 },
  statCard: { width: (width - 52) / 2, backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWidth: 1 },
  statLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  statDivider: { height: 1, width: '100%', marginVertical: 12 },
  statSub: { fontSize: 11, fontWeight: '500' },
  filterBar: { paddingLeft: 20, marginBottom: 20 },
  filterTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  filterTabActive: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  filterLabel: { fontSize: 13, fontWeight: 'bold', color: COLORS.textLight },
  filterLabelActive: { color: COLORS.primary },
  listContainer: { paddingHorizontal: 20 },
  rxCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  rxCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  rxNo: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
  rxDate: { fontSize: 11, color: COLORS.textLight },
  diagnosisRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  diagnosisText: { fontSize: 13, color: '#475569', flex: 1 },
  rxCardActions: { flexDirection: 'row', gap: 12, pt: 15, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  viewDetailBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  viewDetailText: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  refillBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  refillText: { fontSize: 13, fontWeight: 'bold', color: COLORS.emerald },
  empty: { padding: 40, alignItems: 'center', marginTop: 30 },
  emptyText: { color: '#94a3b8', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  detailCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, marginBottom: 24 },
  detailLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 15, textTransform: 'uppercase' },
  medItem: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.primary, elevation: 1, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  medName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  freqTag: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  freqText: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary },
  medDetails: { fontSize: 13, color: COLORS.textLight },
  medIns: { fontSize: 12, color: COLORS.textLight, marginTop: 8, fontStyle: 'italic' },
  labItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f5f3ff', padding: 12, borderRadius: 12, marginBottom: 10 },
  labName: { fontSize: 13, fontWeight: 'bold', color: '#6d28d9' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  newRxCard: { width: width - 48, backgroundColor: '#fff', borderRadius: 28, padding: 24 },
  newRxTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  newRxSub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  newRxOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 12 },
  newRxIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  optionSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  closeModalBtn: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  closeModalText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight },
  row: { flexDirection: 'row' }
});

export default PrescriptionsScreen;
