import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

export default function PatientSidebarScreen({ navigation, activeScreen, closeDrawer }) {
  const { logout } = useAppContext();

  const navigateTo = (screenName) => {
    // Navigate via the parent 'PatientPortal' screen state
    navigation.navigate('PatientPortal', {
      screen: screenName
    });
    closeDrawer();
  };

  const NavItem = ({ label, icon, screenName, color, onPress }) => (
    <TouchableOpacity
      style={[styles.navItem, activeScreen === screenName && styles.activeItem]}
      onPress={onPress || (() => navigateTo(screenName))}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons
          name={icon}
          size={24}
          color={color || (activeScreen === screenName ? "#1d4ed8" : "#2563eb")}
          style={{ marginRight: 15 }}
        />
        <Text style={[styles.navItemText, activeScreen === screenName && styles.activeText, color && { color }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleLogout = () => {
    closeDrawer();
    logout();
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ backgroundColor: '#2563eb', padding: 8, borderRadius: 10, marginRight: 12 }}>
            <MaterialIcons name="domain" size={24} color="white" />
          </View>
          <View>
            <Text style={{ color: '#1d4ed8', fontSize: 18, fontWeight: 'bold' }}>Levitica</Text>
            <Text style={{ color: '#64748b', fontSize: 11 }}>Hospital Management System</Text>
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>Patient Portal</Text>
          <TouchableOpacity onPress={closeDrawer} style={{ padding: 4 }}>
            <MaterialIcons name="close" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingTop: 10 }}>
        <NavItem label="Patient Overview" icon="dashboard" screenName="PatientOverview" />
        <NavItem label="My Appointments" icon="event-available" screenName="Appointments" />
        <NavItem label="Medical Records" icon="assignment" screenName="MedicalRecords" />
        <NavItem label="Discharge Summary" icon="description" screenName="DischargeSummary" />
        <NavItem label="Prescriptions" icon="medication" screenName="Prescriptions" />
        <NavItem label="Test Results" icon="biotech" screenName="TestResults" />
        <NavItem label="Billing & Payments" icon="credit-card" screenName="Billing" />
        <NavItem label="My Profile" icon="person" screenName="Profile" />
        <NavItem label="Messages" icon="forum" screenName="Messages" />
        <NavItem label="Document Storage" icon="folder" screenName="DocumentStorage" />


        <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 15, paddingTop: 5 }}>
          <NavItem label="Logout" icon="logout" screenName="Logout" color="#ef4444" onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  navItem: {
    paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  activeItem: {
    backgroundColor: '#e0f2fe',
    borderLeftColor: '#2563eb'
  },
  navItemText: { fontSize: 15, color: '#475569', fontWeight: '500' },
  activeText: { color: '#1d4ed8', fontWeight: '700' },
});
