const fs = require('fs');
const path = require('path');

const screens = [
  { name: 'BookAppointmentScreen', path: 'screens/DrawerScreens/Appointments' },
  { name: 'MyAppointmentsScreen', path: 'screens/DrawerScreens/Appointments' },
  { name: 'MedicalHistoryScreen', path: 'screens/DrawerScreens/MedicalRecords' },
  { name: 'DischargeSummaryScreen', path: 'screens/DrawerScreens/MedicalRecords' },
  { name: 'DocumentsScreen', path: 'screens/DrawerScreens/MedicalRecords' },
  { name: 'CurrentAdmissionScreen', path: 'screens/DrawerScreens/IPDManagement' },
  { name: 'BedDetailsScreen', path: 'screens/DrawerScreens/IPDManagement' },
  { name: 'TreatmentPlanScreen', path: 'screens/DrawerScreens/IPDManagement' },
  { name: 'SettingsScreen', path: 'screens/DrawerScreens' }
];

screens.forEach(s => {
  fs.mkdirSync(s.path, { recursive: true });
  const fileContent = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ${s.name} = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>${s.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  text: { fontSize: 20, fontWeight: 'bold', color: '#333' }
});

export default ${s.name};
`;
  fs.writeFileSync(path.join(s.path, s.name + '.jsx'), fileContent);
});
console.log('Screens created!');
