import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { getMyDischargeSummaries } from '../../services/patientApi';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#059669', // Emerald for medical discharge
  indigo: '#2563eb',
  bg: '#f8fafc',
  white: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b'
};

const DischargeSummaryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaries, setSummaries] = useState([]);

  const loadSummaries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getMyDischargeSummaries();
      const payload = await res.json().catch(() => ({}));
      const list = Array.isArray(payload) ? payload : (payload.data || payload.summaries || []);
      setSummaries(list);
    } catch (err) {
      console.error('[Discharge] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadSummaries(); }, [loadSummaries]);

  const SummaryCard = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <FontAwesome5 name="hospital-user" size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.refText}>#{item.summary_ref || 'DS-7721'}</Text>
          <Text style={styles.dateText}>{item.admission_date} — {item.discharge_date}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>FINALIZED</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Admission Reason</Text>
          <Text style={styles.infoValue}>{item.reason || 'Surgical Procedure'}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Primary Consultant</Text>
          <View style={styles.doctorRow}>
            <MaterialIcons name="person" size={14} color={COLORS.textLight} />
            <Text style={styles.infoValue}>Dr. {item.doctor_name || 'Chief Resident'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialIcons name="visibility" size={18} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>View Digital Copy</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialIcons name="file-download" size={18} color={COLORS.indigo} />
          <Text style={[styles.actionBtnText, { color: COLORS.indigo }]}>PDF Report</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Discharge Summaries</Text>
        <Text style={styles.subtitle}>Your hospitalization & care records</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSummaries(true)} />}
        showsVerticalScrollIndicator={false}
      >
        {summaries.map((item, idx) => <SummaryCard key={idx} item={item} />)}
        
        {summaries.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="document-text-outline" size={48} color="#e2e8f0" /></View>
            <Text style={styles.emptyText}>No discharge records found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, backgroundColor: COLORS.white },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  list: { padding: 24, paddingBottom: 60 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 0, marginBottom: 24, elevation: 2, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#f0fdf4' },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 1 },
  refText: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  dateText: { fontSize: 11, color: COLORS.textLight, marginTop: 4, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.primary },
  statusText: { fontSize: 9, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  cardBody: { padding: 20, gap: 18 },
  infoCol: { gap: 6 },
  infoLabel: { fontSize: 10, color: COLORS.textLight, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fafafa' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  actionBtnText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
  divider: { width: 1, height: '100%', backgroundColor: '#f1f5f9' },
  empty: { padding: 60, alignItems: 'center', marginTop: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 1 },
  emptyText: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 15 }
});

export default DischargeSummaryScreen;
