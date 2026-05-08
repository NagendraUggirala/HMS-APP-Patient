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
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import {
  getMyPatientProfile,
  getOverviewMetrics,
  getRecentVitals,
  getDashboardNotifications,
  getMyLabResults,
  getActivePrescriptions
} from '../../services/patientApi';

const { width } = Dimensions.get('window');

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.prescriptions)) return payload.prescriptions;
  return [];
};

const defaultDashboardData = {
  patientInfo: { name: 'Patient', age: '—', bloodGroup: '—', doctor: '—', lastVisit: '—' },
  healthMetrics: { bloodPressure: '—', bloodSugar: '—', weight: '—', bmi: '—', cholesterol: '—' },
  upcomingAppointments: [],
  recentTestResults: [],
  currentPrescriptions: [],
  bills: { pending: 0, paid: 0, nextDue: '—' },
  reminders: []
};

const DashboardOverviewScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [profileRes, metricsRes, vitalsRes, notificationsRes, labsRes, rxRes] = await Promise.allSettled([
        getMyPatientProfile().then(r => r.json()),
        getOverviewMetrics().then(r => r.json()),
        getRecentVitals().then(r => r.json()),
        getDashboardNotifications().then(r => r.json()),
        getMyLabResults().then(r => r.json()),
        getActivePrescriptions().then(r => r.json())
      ]);

      const profile = profileRes.status === 'fulfilled' ? profileRes.value : {};
      const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value : {};
      const vitals = vitalsRes.status === 'fulfilled' ? vitalsRes.value : {};
      const notifications = notificationsRes.status === 'fulfilled' ? notificationsRes.value : {};
      const labs = labsRes.status === 'fulfilled' ? extractList(labsRes.value).slice(0, 3) : [];
      const rx = rxRes.status === 'fulfilled' ? extractList(rxRes.value).slice(0, 3) : [];

      const pData = Array.isArray(profile?.data || profile) ? (profile.data || profile)[0] : (profile.data || profile || {});
      const vData = vitals?.data || vitals || {};
      const mData = metrics?.data || metrics || {};

      setDashboardData({
        patientInfo: {
          name: pData.full_name || pData.name || pData.first_name || pData.fullName || 'Patient',
          age: pData.age || '—',
          bloodGroup: pData.blood_group || pData.blood_type || pData.bloodgroup || pData.bloodGroup || '—',
          doctor: pData.primary_doctor || mData.primary_doctor || '—',
          lastVisit: mData.last_visit || '—'
        },
        healthMetrics: {
          bloodPressure: vData.blood_pressure || vData.bp || '—',
          bloodSugar: vData.blood_sugar || '—',
          weight: vData.weight || pData.weight || '—',
          bmi: vData.bmi || pData.bmi || '—',
          cholesterol: vData.cholesterol || '—'
        },
        upcomingAppointments: Array.isArray(mData.upcoming_appointments) ? mData.upcoming_appointments : [],
        recentTestResults: labs,
        currentPrescriptions: rx,
        bills: {
          pending: mData.pending_bills || mData.bills?.pending || 0,
          paid: mData.paid_bills || mData.bills?.paid || 0,
          nextDue: mData.next_bill_due || '—'
        },
        reminders: Array.isArray(notifications?.data) ? notifications.data : (Array.isArray(notifications) ? notifications : [])
      });
    } catch (err) {
      console.error('[Dashboard] error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => loadDashboardData(true);

  const MetricCard = ({ label, value, icon, color, bgColor }) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: bgColor }]}>
        <FontAwesome5 name={icon} size={16} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loaderText}>Preparing your health dashboard...</Text>
      </View>
    );
  }

  const { patientInfo, healthMetrics, bills, reminders, upcomingAppointments, recentTestResults, currentPrescriptions } = dashboardData;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} color="#2563eb" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.patientName}>{patientInfo.name}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
            onPress={() => navigation.navigate('Appointments')}
          >
            <Ionicons name="calendar-outline" size={20} color="#2563eb" />
            <Text style={[styles.actionText, { color: '#2563eb' }]}>Book Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#16a34a" />
            <Text style={[styles.actionText, { color: '#16a34a' }]}>Message Doctor</Text>
          </TouchableOpacity>
        </View>

        {/* Health Summary Banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.bannerHeader}>
            <View>
              <Text style={styles.bannerTitle}>Health Summary</Text>
              <Text style={styles.bannerSubtitle}>Primary Doctor: {patientInfo.doctor}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('MedicalRecords')} style={styles.historyBtn}>
              <Text style={styles.historyBtnText}>View History</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsGrid}>
            <MetricCard label="BP" value={healthMetrics.bloodPressure} icon="heartbeat" color="#ef4444" bgColor="#fef2f2" />
            <MetricCard label="Sugar" value={healthMetrics.bloodSugar} icon="tint" color="#6366f1" bgColor="#eef2ff" />
            <MetricCard label="Weight" value={healthMetrics.weight} icon="weight" color="#f59e0b" bgColor="#fffbeb" />
            <MetricCard label="BMI" value={healthMetrics.bmi} icon="user-check" color="#10b981" bgColor="#ecfdf5" />
            <MetricCard label="Cholesterol" value={healthMetrics.cholesterol} icon="flask" color="#f97316" bgColor="#fff7ed" />
            <MetricCard label="Blood" value={patientInfo.bloodGroup} icon="tint" color="#e11d48" bgColor="#fff1f2" />
          </ScrollView>
        </View>

        {/* Widgets Row */}
        <View style={styles.widgetContainer}>
          {/* Upcoming Appointments */}
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Appointments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingAppointments.length === 0 ? (
              <Text style={styles.emptyWidget}>No upcoming visits</Text>
            ) : upcomingAppointments.map((app, i) => (
              <View key={i} style={styles.widgetItem}>
                <View style={styles.itemIcon}><Ionicons name="calendar" size={16} color="#2563eb" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{app.doctor_name || 'General'}</Text>
                  <Text style={styles.itemSubtitle}>{app.appointment_date || app.date}</Text>
                </View>
                <View style={styles.statusDot} />
              </View>
            ))}
          </View>

          {/* Test Results */}
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Recent Labs</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TestResults')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentTestResults.length === 0 ? (
              <Text style={styles.emptyWidget}>No recent tests</Text>
            ) : recentTestResults.map((test, i) => (
              <View key={i} style={styles.widgetItem}>
                <View style={[styles.itemIcon, { backgroundColor: '#f5f3ff' }]}><Ionicons name="flask" size={16} color="#7c3aed" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{test.test_name || 'Test'}</Text>
                  <Text style={styles.itemSubtitle}>{test.status || 'Completed'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
              </View>
            ))}
          </View>
        </View>

        {/* Billing & Meds Row */}
        <View style={styles.widgetContainer}>
          {/* Billing */}
          <View style={styles.widget}>
            <Text style={styles.widgetTitle}>Financials</Text>
            <View style={styles.billingRow}>
              <View style={styles.billingBox}>
                <Text style={styles.billLabel}>Pending</Text>
                <Text style={[styles.billValue, { color: '#ef4444' }]}>₹{bills.pending}</Text>
              </View>
              <View style={styles.billingBox}>
                <Text style={styles.billLabel}>Settled</Text>
                <Text style={[styles.billValue, { color: '#10b981' }]}>₹{bills.paid}</Text>
              </View>
            </View>
          </View>

          {/* Reminders */}
          <View style={styles.widget}>
            <Text style={styles.widgetTitle}>Reminders</Text>
            {reminders.slice(0, 2).map((r, i) => (
              <View key={i} style={styles.reminderItem}>
                <Ionicons name="notifications" size={14} color="#f59e0b" />
                <Text style={styles.reminderText} numberOfLines={1}>{r.message || r.title}</Text>
              </View>
            ))}
            {reminders.length === 0 && <Text style={styles.emptyWidget}>All caught up!</Text>}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 30 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#64748b', fontWeight: '500' },

  header: { padding: 24, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeText: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  patientName: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
  patientStats: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  profileBtn: { marginTop: 4 },

  quickActions: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 8 },
  actionText: { fontWeight: 'bold', fontSize: 13 },

  summaryBanner: { marginHorizontal: 24, padding: 20, backgroundColor: '#fff', borderRadius: 28, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  bannerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  bannerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  historyBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  historyBtnText: { color: 'white', fontSize: 11, fontWeight: 'bold' },

  metricsGrid: { gap: 12 },
  metricCard: { width: 100, backgroundColor: '#fff', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: '#f8fafc', alignItems: 'center', elevation: 1 },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  metricValue: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },

  widgetContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 15, marginTop: 20 },
  widget: { flex: 1, backgroundColor: '#fff', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  widgetTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  seeAll: { fontSize: 11, color: '#2563eb', fontWeight: 'bold' },
  emptyWidget: { fontSize: 12, color: '#94a3b8', textAlign: 'center', paddingVertical: 10 },

  widgetItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  itemIcon: { width: 32, height: 32, backgroundColor: '#eff6ff', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  itemSubtitle: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },

  billingRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  billingBox: { flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 12, alignItems: 'center' },
  billLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase' },
  billValue: { fontSize: 15, fontWeight: 'bold', marginTop: 4 },

  reminderItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#fdfaf2', padding: 8, borderRadius: 10 },
  reminderText: { fontSize: 11, color: '#92400e', fontWeight: '500', flex: 1 }
});

export default DashboardOverviewScreen;
