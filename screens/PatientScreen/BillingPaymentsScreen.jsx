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
  TextInput,
  StatusBar
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { 
  getMyBills, 
  getMyBillingSummary, 
  getMyBillDetails, 
  initiateBillPayment,
  getMyPaymentHistory 
} from '../../services/patientApi';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2563eb', // Indigo
  emerald: '#059669',
  rose: '#e11d48',
  amber: '#f59e0b',
  bg: '#f8fafc',
  white: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b'
};

const BillingPaymentsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('invoices'); // invoices, history
  const [bills, setBills] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [billsRes, summaryRes, historyRes] = await Promise.allSettled([
        getMyBills({ status: filterStatus || undefined, page: 1, limit: 10 }),
        getMyBillingSummary(),
        getMyPaymentHistory()
      ]);

      if (billsRes.status === 'fulfilled') {
        const billsData = await billsRes.value.json().catch(() => ({}));
        setBills(billsData.data || billsData.invoices || billsData.results || []);
      }

      if (summaryRes.status === 'fulfilled') {
        const summaryData = await summaryRes.value.json().catch(() => ({}));
        setSummary(summaryData.data || summaryData || null);
      }

      if (historyRes.status === 'fulfilled') {
        const historyData = await historyRes.value.json().catch(() => ({}));
        setHistory(historyData.data || historyData.payments || historyData.results || []);
      }
    } catch (err) {
      console.error('[Billing] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleViewBill = async (bill) => {
    const invoiceId = bill.invoice_id || bill.bill_id || bill.id;
    setIsDetailLoading(true);
    setSelectedBill(bill); // Show initial info immediately
    try {
      const res = await getMyBillDetails(invoiceId);
      const data = await res.json();
      setSelectedBill(data.data || data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) return;
    setIsProcessingPayment(true);
    try {
      const invoiceId = selectedBill.invoice_id || selectedBill.bill_id || selectedBill.id;
      const res = await initiateBillPayment(invoiceId, { 
        payment_method: paymentMethod,
        amount: selectedBill.balance_due || selectedBill.total_amount 
      });
      if (res.ok) {
        Alert.alert("Success", "Payment successfully initiated!");
        setShowPaymentModal(false);
        setSelectedBill(null);
        loadData(true);
      } else {
        Alert.alert("Error", "Could not initiate payment.");
      }
    } catch (error) {
      Alert.alert("Error", "Connection error.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStatusStyle = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID') return { color: '#059669', bg: '#ecfdf5' };
    if (s === 'PENDING' || s === 'DRAFT') return { color: '#d97706', bg: '#fffbeb' };
    if (s === 'OVERDUE') return { color: '#e11d48', bg: '#fef2f2' };
    if (s === 'PARTIALLY_PAID') return { color: '#2563eb', bg: '#eff6ff' };
    return { color: '#64748b', bg: '#f1f5f9' };
  };

  const BillCard = ({ item }) => {
    const status = getStatusStyle(item.status);
    const balance = item.balance_due ?? item.total_amount ?? 0;
    
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleViewBill(item)}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.billRef}>#{String(item.invoice_number || item.bill_number || item.id).slice(0, 10)}</Text>
            <Text style={styles.billDate}>{item.created_at?.split('T')[0] || 'Medical Services'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.description} numberOfLines={1}>{item.description || 'Consultation & Services'}</Text>
            <Text style={styles.billType}>{item.bill_type || 'GENERAL'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.totalAmount}>₹{item.total_amount || item.amount}</Text>
            {balance > 0 && <Text style={styles.balanceDue}>₹{balance} due</Text>}
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleViewBill(item)}>
            <MaterialIcons name="visibility" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          {balance > 0 && (
            <TouchableOpacity style={styles.payBtnSmall} onPress={() => { setSelectedBill(item); setShowPaymentModal(true); }}>
              <MaterialIcons name="payment" size={16} color="white" />
              <Text style={styles.payBtnTextSmall}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Financial Center</Text>
          <Text style={styles.subtitle}>Manage medical expenses & bills</Text>
        </View>

        {/* Analytics Summary */}
        <View style={styles.analyticsRow}>
          <View style={[styles.analyticsBox, { backgroundColor: '#fff', borderLeftColor: COLORS.rose, borderLeftWidth: 4 }]}>
            <View style={styles.analyticsIconBox}><MaterialIcons name="report-problem" size={16} color={COLORS.rose} /></View>
            <Text style={styles.analyticsLabel}>OUTSTANDING</Text>
            <Text style={[styles.analyticsVal, { color: COLORS.rose }]}>₹{(summary?.total_outstanding || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.analyticsBox, { backgroundColor: '#fff', borderLeftColor: COLORS.emerald, borderLeftWidth: 4 }]}>
            <View style={styles.analyticsIconBox}><MaterialIcons name="verified" size={16} color={COLORS.emerald} /></View>
            <Text style={styles.analyticsLabel}>SETTLED</Text>
            <Text style={[styles.analyticsVal, { color: COLORS.emerald }]}>₹{(summary?.total_paid || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {summary?.insurance_provider && (
          <View style={styles.insuranceCard}>
            <View style={styles.insuranceInfo}>
              <Text style={styles.analyticsLabel}>INSURANCE COVERAGE</Text>
              <Text style={styles.insuranceName}>{summary.insurance_provider}</Text>
            </View>
            <View style={styles.insuranceBadge}><Text style={styles.insuranceBadgeText}>ACTIVE</Text></View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'invoices' && styles.tabActive]} onPress={() => setActiveTab('invoices')}>
            <Text style={[styles.tabLabel, activeTab === 'invoices' && styles.tabLabelActive]}>Active Invoices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
            <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>Payment History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {activeTab === 'invoices' ? (
            <>
              {bills.map((bill, i) => <BillCard key={i} item={bill} />)}
              {bills.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>No active invoices found</Text></View>}
            </>
          ) : (
            <>
              {history.map((pay, i) => (
                <View key={i} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{pay.paid_at?.split('T')[0] || pay.date}</Text>
                    <Text style={styles.historyAmount}>₹{pay.amount}</Text>
                  </View>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyMethod}>{pay.payment_method || 'Payment'}</Text>
                    <Text style={styles.historyStatus}>{pay.status || 'SUCCESS'}</Text>
                  </View>
                </View>
              ))}
              {history.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>No payment history found</Text></View>}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bill Detail Modal */}
      <Modal visible={!!selectedBill && !showPaymentModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentFull}>
            <View style={styles.modalHeaderDark}>
              <View>
                <Text style={styles.modalTitleWhite}>Invoice Details</Text>
                <Text style={styles.modalSubWhite}>#{selectedBill?.invoice_number || selectedBill?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedBill(null)}><MaterialIcons name="close" size={24} color="white" /></TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {isDetailLoading ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} /> : (
                <View style={{ padding: 24 }}>
                  <View style={styles.detailRow}>
                    <View><Text style={styles.analyticsLabel}>Issue Date</Text><Text style={styles.detailValText}>{selectedBill?.created_at?.split('T')[0]}</Text></View>
                    <View><Text style={styles.analyticsLabel}>Due Date</Text><Text style={styles.detailValText}>{selectedBill?.due_date || 'N/A'}</Text></View>
                  </View>

                  <Text style={[styles.analyticsLabel, { marginTop: 24, marginBottom: 12 }]}>Line Items</Text>
                  <View style={styles.lineItemsBox}>
                    {(selectedBill?.items || [{ description: selectedBill?.description, amount: selectedBill?.total_amount }]).map((item, idx) => (
                      <View key={idx} style={styles.lineItem}>
                        <Text style={styles.lineItemName}>{item.description || item.name || 'Service Fee'}</Text>
                        <Text style={styles.lineItemPrice}>₹{item.amount}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.totalBox}>
                    <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalVal}>₹{selectedBill?.total_amount}</Text></View>
                    <View style={styles.totalRow}><Text style={styles.totalLabel}>Insurance Offset</Text><Text style={[styles.totalVal, { color: COLORS.emerald }]}>- ₹{selectedBill?.insurance_coverage || 0}</Text></View>
                    <View style={[styles.totalRow, { marginTop: 15, pt: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                      <Text style={styles.grandTotalLabel}>Grand Total</Text>
                      <Text style={styles.grandTotalPrice}>₹{selectedBill?.balance_due ?? selectedBill?.total_amount}</Text>
                    </View>
                  </View>

                  {selectedBill?.balance_due > 0 && (
                    <TouchableOpacity style={styles.mainPayBtn} onPress={() => setShowPaymentModal(true)}>
                      <Text style={styles.mainPayText}>Authorize Payment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Picker Modal */}
      <Modal visible={showPaymentModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.paymentPickerContent}>
            <Text style={styles.pickerTitle}>Authorize Settlement</Text>
            <Text style={styles.pickerSub}>Amount to charge: ₹{selectedBill?.balance_due ?? selectedBill?.total_amount}</Text>
            
            <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'CARD' && styles.methodActive]} onPress={() => setPaymentMethod('CARD')}>
              <MaterialIcons name="credit-card" size={24} color={paymentMethod === 'CARD' ? COLORS.primary : COLORS.textLight} />
              <Text style={[styles.methodLabel, paymentMethod === 'CARD' && styles.methodLabelActive]}>Credit / Debit Card</Text>
              {paymentMethod === 'CARD' && <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'UPI' && styles.methodActive]} onPress={() => setPaymentMethod('UPI')}>
              <MaterialIcons name="qr-code" size={24} color={paymentMethod === 'UPI' ? COLORS.emerald : COLORS.textLight} />
              <Text style={[styles.methodLabel, paymentMethod === 'UPI' && styles.methodLabelActive]}>UPI (GPay, PhonePe)</Text>
              {paymentMethod === 'UPI' && <MaterialIcons name="check-circle" size={20} color={COLORS.emerald} />}
            </TouchableOpacity>

            <View style={styles.pickerActions}>
              <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.pickerConfirm, (!paymentMethod || isProcessingPayment) && { opacity: 0.5 }]} 
                onPress={handlePaymentSubmit}
                disabled={!paymentMethod || isProcessingPayment}
              >
                {isProcessingPayment ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.pickerConfirmText}>Pay Now</Text>}
              </TouchableOpacity>
            </View>
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
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  analyticsRow: { flexDirection: 'row', padding: 20, gap: 12 },
  analyticsBox: { flex: 1, padding: 16, borderRadius: 24, elevation: 1 },
  analyticsIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  analyticsLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.textLight, letterSpacing: 1 },
  analyticsVal: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  insuranceCard: { marginHorizontal: 20, backgroundColor: '#eff6ff', padding: 16, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  insuranceName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginTop: 2 },
  insuranceBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  insuranceBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 24, gap: 10 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f1f5f9' },
  tabActive: { backgroundColor: COLORS.primary },
  tabLabel: { fontSize: 13, fontWeight: 'bold', color: COLORS.textLight },
  tabLabelActive: { color: 'white' },
  listContainer: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  billRef: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  billDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', pt: 16, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  description: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  billType: { fontSize: 10, color: COLORS.textLight, textTransform: 'uppercase', marginTop: 2 },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  balanceDue: { fontSize: 11, color: COLORS.rose, fontWeight: 'bold', marginTop: 2 },
  cardActions: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between', alignItems: 'center' },
  actionIconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  payBtnSmall: { backgroundColor: COLORS.emerald, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, gap: 6 },
  payBtnTextSmall: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  historyCard: { backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 12, color: COLORS.textLight },
  historyAmount: { fontSize: 15, fontWeight: 'bold', color: COLORS.emerald },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  historyMethod: { fontSize: 12, fontWeight: 'bold', color: COLORS.text },
  historyStatus: { fontSize: 10, fontWeight: 'bold', color: COLORS.emerald },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentFull: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', overflow: 'hidden' },
  modalHeaderDark: { backgroundColor: COLORS.text, padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitleWhite: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  modalSubWhite: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailValText: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  lineItemsBox: { gap: 10 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#f8fafc', borderRadius: 16 },
  lineItemName: { fontSize: 13, color: COLORS.text, fontWeight: 'bold' },
  lineItemPrice: { fontSize: 13, fontWeight: 'bold', color: COLORS.text },
  totalBox: { backgroundColor: COLORS.text, borderRadius: 24, padding: 20, marginTop: 30 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' },
  totalVal: { fontSize: 14, color: 'white', fontWeight: 'bold' },
  grandTotalLabel: { fontSize: 18, color: 'white', fontWeight: 'bold' },
  grandTotalPrice: { fontSize: 24, color: COLORS.indigo, fontWeight: 'bold' },
  mainPayBtn: { backgroundColor: COLORS.indigo, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  mainPayText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  paymentPickerContent: { backgroundColor: 'white', padding: 32, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  pickerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  pickerSub: { fontSize: 14, color: COLORS.textLight, marginTop: 8, marginBottom: 24 },
  methodBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, backgroundColor: '#f8fafc', marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  methodActive: { borderColor: COLORS.primary, backgroundColor: '#eff6ff' },
  methodLabel: { flex: 1, fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginLeft: 15 },
  methodLabelActive: { color: COLORS.primary },
  pickerActions: { flexDirection: 'row', marginTop: 24, gap: 15 },
  pickerCancel: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' },
  pickerCancelText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textLight },
  pickerConfirm: { flex: 2, backgroundColor: COLORS.primary, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pickerConfirmText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#cbd5e1', fontStyle: 'italic' }
});

export default BillingPaymentsScreen;
