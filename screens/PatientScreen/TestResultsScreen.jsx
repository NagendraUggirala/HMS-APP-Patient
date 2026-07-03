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
  Dimensions,
  StatusBar
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import {
  getMyLabResults,
  getLabResultDetails,
  downloadLabResult,
} from '../../services/patientApi';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2563eb', // Indigo
  emerald: '#059669',
  amber: '#f59e0b',
  bg: '#f8fafc',
  white: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b'
};

function getStatusInfo(status) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETED') return { label: 'Completed', color: '#059669', bg: '#ecfdf5' };
  if (s === 'PENDING') return { label: 'Pending', color: '#d97706', bg: '#fffbeb' };
  if (s === 'CANCELLED') return { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' };
  if (s === 'IN_PROGRESS') return { label: 'In Progress', color: '#3b82f6', bg: '#eff6ff' };
  return { label: status || 'Unknown', color: '#64748b', bg: '#f1f5f9' };
}

function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.lab_results)) return payload.lab_results;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

const TestResultsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const loadResults = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getMyLabResults();
      const payload = await res.json().catch(() => ({}));
      if (res.ok) setTestResults(extractList(payload));
    } catch (err) {
      console.error("[LabResults] Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadResults(); }, [loadResults]);

  const handleViewDetails = async (test) => {
    const testId = test.id || test.test_id || test.result_id;
    if (!testId) { setSelectedTest(test); return; }
    setDetailLoading(true);
    try {
      const res = await getLabResultDetails(testId);
      const payload = await res.json().catch(() => ({}));
      if (res.ok) setSelectedTest(payload);
      else setSelectedTest(test);
    } catch (err) {
      setSelectedTest(test);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownload = async (test) => {
    const testId = test.id || test.test_id || test.result_id;
    setDownloadingId(testId);
    try {
      const res = await downloadLabResult(testId);
      if (res.ok) Alert.alert("Success", "Report download started.");
      else Alert.alert("Error", "Download failed.");
    } catch (e) {
      Alert.alert("Error", "Network error.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = testResults.filter(t => {
    if (filter === 'all') return true;
    const s = (t.status || '').toUpperCase();
    return s === filter.toUpperCase();
  }).sort((a, b) => {
    const dA = new Date(a.created_at || a.test_date || 0);
    const dB = new Date(b.created_at || b.test_date || 0);
    return sortOrder === 'newest' ? dB - dA : dA - dB;
  });

  const StatBox = ({ label, value, color, icon, border }) => (
    <View style={[styles.statBox, { borderLeftColor: border }]}>
      <View style={styles.statIconBox}>
        <FontAwesome5 name={icon} size={16} color={color} />
      </View>
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statVal}>{value}</Text>
      </View>
    </View>
  );

  const TestCard = ({ item }) => {
    const status = getStatusInfo(item.status);
    const isCompleted = item.status?.toUpperCase() === 'COMPLETED';
    const isUrgent = ['URGENT', 'STAT'].includes(item.urgency?.toUpperCase());

    return (
      <View style={styles.testCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.testName}>{item.test_name || 'Lab Test'}</Text>
            <Text style={styles.testId}>ID: {String(item.id || item.test_id).slice(0, 8)}...</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={14} color="#94a3b8" />
            <Text style={styles.infoText}>{item.created_at?.split('T')[0]}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={14} color="#94a3b8" />
            <Text style={styles.infoText}>{item.ordered_by || 'Dr. Assigned'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewDetails(item)}>
            <MaterialIcons name="visibility" size={18} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>View Results</Text>
          </TouchableOpacity>
          {isCompleted && (
            <TouchableOpacity 
              style={[styles.actionBtn, { marginLeft: 12 }]} 
              onPress={() => handleDownload(item)}
              disabled={downloadingId === item.id}
            >
              {downloadingId === item.id ? (
                <ActivityIndicator size="small" color={COLORS.emerald} />
              ) : (
                <>
                  <MaterialIcons name="file-download" size={18} color={COLORS.emerald} />
                  <Text style={[styles.actionBtnText, { color: COLORS.emerald }]}>Report</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        {isUrgent && <View style={styles.urgentRibbon}><Text style={styles.urgentText}>URGENT</Text></View>}
      </View>
    );
  };

  if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadResults(true)} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Lab Results</Text>
            <Text style={styles.subtitle}>Track your health parameters</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => loadResults(true)}>
            <MaterialIcons name="sync" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox label="Total Tests" value={testResults.length} color="#3b82f6" icon="vials" border="#2563eb" />
          <StatBox label="Completed" value={testResults.filter(t => t.status?.toUpperCase() === 'COMPLETED').length} color="#10b981" icon="check-circle" border="#059669" />
          <StatBox label="Pending" value={testResults.filter(t => t.status?.toUpperCase() === 'PENDING').length} color="#f59e0b" icon="hourglass-half" border="#d97706" />
          <StatBox label="In Progress" value={testResults.filter(t => t.status?.toUpperCase() === 'IN_PROGRESS').length} color="#3b82f6" icon="spinner" border="#60a5fa" />
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
            {['all', 'completed', 'pending', 'in_progress'].map(f => (
              <TouchableOpacity key={f} style={[styles.filterTab, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
                <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>{f.replace('_', ' ').toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {filtered.map((test, i) => <TestCard key={i} item={test} />)}
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <FontAwesome5 name="flask" size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal visible={!!selectedTest} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lab Report</Text>
              <TouchableOpacity onPress={() => setSelectedTest(null)}><MaterialIcons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            
            {selectedTest && (
              <ScrollView style={styles.modalBody}>
                {detailLoading ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
                  <>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailName}>{selectedTest.test_name || 'Lab Test'}</Text>
                      <View style={styles.detailGrid}>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Status</Text><Text style={styles.detailVal}>{selectedTest.status}</Text></View>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Date</Text><Text style={styles.detailVal}>{selectedTest.created_at?.split('T')[0]}</Text></View>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Ordered By</Text><Text style={styles.detailVal}>{selectedTest.ordered_by || 'N/A'}</Text></View>
                      </View>
                    </View>

                    <Text style={styles.sectionTitle}>Parameters</Text>
                    {(selectedTest.parameters || []).map((p, i) => {
                      const isHigh = ['HIGH', 'H'].includes(p.status?.toUpperCase());
                      const isLow = ['LOW', 'L'].includes(p.status?.toUpperCase());
                      return (
                        <View key={i} style={styles.paramCard}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.paramName}>{p.name || p.parameter_name}</Text>
                            <Text style={styles.paramRange}>Range: {p.normal_range || 'N/A'}</Text>
                          </View>
                          <View style={styles.paramResult}>
                            <Text style={[styles.paramVal, (isHigh || isLow) && { color: COLORS.rose }]}>{p.value} {p.unit}</Text>
                            {(isHigh || isLow) && <View style={styles.flag}><Text style={styles.flagText}>{p.status}</Text></View>}
                          </View>
                        </View>
                      );
                    })}

                    {selectedTest.notes && (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesLabel}>Doctor's Interpretation</Text>
                        <Text style={styles.notesText}>{selectedTest.notes}</Text>
                      </View>
                    )}

                    {selectedTest.status?.toUpperCase() === 'COMPLETED' && (
                      <TouchableOpacity style={styles.downloadFullBtn} onPress={() => handleDownload(selectedTest)}>
                        <MaterialIcons name="file-download" size={20} color="white" />
                        <Text style={styles.downloadFullText}>Download PDF Report</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 60 },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 12 },
  statBox: { width: (width - 52) / 2, backgroundColor: '#fff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', borderLeftWidth: 4 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '600' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  filterSection: { marginBottom: 20 },
  filterBar: { paddingLeft: 20 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  filterActive: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  filterLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.textLight },
  filterLabelActive: { color: COLORS.primary },
  listContainer: { paddingHorizontal: 20 },
  testCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9', position: 'relative', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  testName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  testId: { fontSize: 10, color: COLORS.textLight, fontFamily: 'monospace', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: COLORS.textLight },
  cardFooter: { flexDirection: 'row', pt: 15, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: '#f8fafc', borderRadius: 12 },
  actionBtnText: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  urgentRibbon: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.rose, paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 12 },
  urgentText: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  empty: { padding: 60, alignItems: 'center' },
  emptyText: { color: '#cbd5e1', fontStyle: 'italic', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  detailCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 24, marginBottom: 24 },
  detailName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  detailGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  detailVal: { fontSize: 13, fontWeight: 'bold', color: COLORS.text },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 15, textTransform: 'uppercase' },
  paramCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  paramName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  paramRange: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  paramResult: { alignItems: 'flex-end' },
  paramVal: { fontSize: 15, fontWeight: 'bold', color: COLORS.emerald },
  flag: { backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  flagText: { fontSize: 9, fontWeight: 'bold', color: COLORS.rose },
  notesBox: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 16, marginVertical: 20 },
  notesLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  notesText: { fontSize: 13, color: '#1e40af', lineHeight: 18 },
  downloadFullBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 2, marginTop: 10 },
  downloadFullText: { color: 'white', fontSize: 15, fontWeight: 'bold' }
});

export default TestResultsScreen;
