import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const MedicalRecordsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <Text style={styles.headerSubtitle}>Welcome to your Medical Records panel.</Text>
      </View>

      <View style={styles.contentCard}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
            <MaterialIcons name="assignment" size={24} color="#2563eb" />
            <Text style={styles.sectionTitle}>Recent Data</Text>
        </View>
        <Text style={styles.dummyText}>
          Here you will find your Medical Records information. This section is currently showing demo content.
        </Text>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.item}>
            <Text style={styles.itemTitle}>Sample Record #00\</Text>
            <Text style={styles.itemDate}>Updated 10 Oct 2026</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  contentCard: { margin: 20, backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginLeft: 10 },
  dummyText: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  item: { padding: 15, backgroundColor: '#f8fafc', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#334155' },
  itemDate: { fontSize: 12, color: '#94a3b8', marginTop: 4 }
});

export default MedicalRecordsScreen;
