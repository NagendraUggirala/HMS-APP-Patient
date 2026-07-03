import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import {
  getMyPatientProfile,
  updateMyPatientProfile
} from '../../services/patientApi';

const { width } = Dimensions.get('window');

// Map backend payload to frontend state (Identical to your logic)
function normalizeProfile(payload) {
  const rawData = payload?.data || payload;
  // Handle if backend returns an array instead of a single object
  const data = Array.isArray(rawData) ? rawData[0] : (rawData || {});
  
  console.log('[Profile Debug] Final mapped data:', data);
  
  return {
    basicInfo: {
      patientId: data.patient_id || data.id || data.patient_ref || data.reference || data.PatientID || 'PAT-NEW',
      name: data.full_name || data.name || data.first_name || data.fullName || 'Patient',
      age: data.age || '—',
      gender: data.gender || data.Gender || '—',
      dob: data.date_of_birth || data.dob || data.DOB || '—',
      // Dynamic lookup for blood group to handle any case or underscore variations
      bloodGroup: (
        data.blood_group || data.blood_type || data.bloodgroup || data.bloodGroup ||
        Object.entries(data).find(([k]) => k.toLowerCase().includes('blood'))?.[1] || 
        '—'
      ),
      maritalStatus: data.marital_status || data.maritalStatus || '—'
    },
    contactInfo: {
      phone: data.phone_number || data.phone || '—',
      email: data.email || '—',
      address: data.address || data.street_address || '—',
      emergencyContact: {
        name: data.emergency_contact_name || '—',
        relationship: data.emergency_contact_relationship || '—',
        phone: data.emergency_contact_phone || '—'
      }
    },
    medicalInfo: {
      height: data.height || '—',
      weight: data.weight || '—',
      bmi: data.bmi || '—',
      allergies: Array.isArray(data.allergies) ? data.allergies : (data.allergies ? [data.allergies] : []),
      chronicConditions: Array.isArray(data.chronic_conditions) ? data.chronic_conditions : (data.chronic_conditions ? [data.chronic_conditions] : []),
    },
    insuranceInfo: {
      provider: data.insurance_provider || '—',
      policyNumber: data.insurance_policy_number || '—',
      validity: data.insurance_validity || '—',
      coverage: data.insurance_coverage_type || '—',
    }
  };
}

// Prepare payload for backend (Identical to your logic)
function preparePayload(formData) {
  const clean = (val) => (val === '—' || val === undefined || val === null) ? '' : String(val).trim();

  const payload = {
    full_name: clean(formData.basicInfo.name),
    gender: clean(formData.basicInfo.gender),
    date_of_birth: clean(formData.basicInfo.dob),
    blood_group: clean(formData.basicInfo.bloodGroup),
    marital_status: clean(formData.basicInfo.maritalStatus),
    phone_number: clean(formData.contactInfo.phone),
    email: clean(formData.contactInfo.email),
    address: clean(formData.contactInfo.address),
    emergency_contact_name: clean(formData.contactInfo.emergencyContact.name),
    emergency_contact_relationship: clean(formData.contactInfo.emergencyContact.relationship),
    emergency_contact_phone: clean(formData.contactInfo.emergencyContact.phone),
    height: clean(formData.medicalInfo.height) ? parseFloat(clean(formData.medicalInfo.height)) : null,
    weight: clean(formData.medicalInfo.weight) ? parseFloat(clean(formData.medicalInfo.weight)) : null,
    insurance_provider: clean(formData.insuranceInfo.provider),
    insurance_policy_number: clean(formData.insuranceInfo.policyNumber),
    insurance_validity: clean(formData.insuranceInfo.validity),
    insurance_coverage_type: clean(formData.insuranceInfo.coverage),
  };

  Object.keys(payload).forEach(key => {
    if (payload[key] === '' || payload[key] === null) delete payload[key];
  });

  return payload;
}

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(() => normalizeProfile({}));
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(() => normalizeProfile({}));

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPatientProfile();
      const payload = await res.json().catch(() => ({}));
      const normalized = normalizeProfile(payload);
      setProfile(normalized);
      setFormData(normalized);
    } catch (err) {
      console.error('[Profile] fetch error:', err);
      Alert.alert('Error', 'Could not load profile. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = preparePayload(formData);
      const res = await updateMyPatientProfile(body);
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert('Update Failed', payload?.detail || 'Failed to update profile.');
        return;
      }

      Alert.alert('Success', 'Profile updated successfully!');
      setEditMode(false);
      loadProfile(); // Refresh
    } catch (err) {
      Alert.alert('Error', 'Connection error. Could not reach server.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditMode(false);
  };

  const InfoCard = ({ title, icon, color, children }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: color + '15' }]}>
          <FontAwesome5 name={icon} size={16} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );

  const InputField = ({ label, value, onChange, placeholder, type = 'default' }) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      {editMode ? (
        <TextInput
          style={styles.input}
          value={value === '—' ? '' : String(value)}
          onChangeText={onChange}
          placeholder={placeholder}
          keyboardType={type}
          placeholderTextColor="#94a3b8"
        />
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loaderText}>Syncing your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>Health identity & contact details</Text>
          </View>
          <View style={styles.headerActions}>
            {!editMode ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
                <MaterialIcons name="edit" size={20} color="white" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Identity Banner */}
        <View style={styles.profileBanner}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{(profile.basicInfo.name || 'P').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerName} numberOfLines={1}>{profile.basicInfo.name}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>ID: {profile.basicInfo.patientId}</Text></View>
              <View style={[styles.tag, { backgroundColor: '#fef2f2' }]}><Text style={[styles.tagText, { color: '#ef4444' }]}>{profile.basicInfo.bloodGroup}</Text></View>
            </View>
          </View>
        </View>

        {/* Sections */}
        <InfoCard title="Basic Information" icon="user-alt" color="#2563eb">
          <View style={styles.row}>
            <View style={{ flex: 1 }}><InputField label="Full Name" value={editMode ? formData.basicInfo.name : profile.basicInfo.name} onChange={(val) => handleInputChange('basicInfo', 'name', val)} /></View>
            <View style={{ flex: 1 }}><InputField label="DOB" value={editMode ? formData.basicInfo.dob : profile.basicInfo.dob} onChange={(val) => handleInputChange('basicInfo', 'dob', val)} placeholder="YYYY-MM-DD" /></View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}><InputField label="Gender" value={editMode ? formData.basicInfo.gender : profile.basicInfo.gender} onChange={(val) => handleInputChange('basicInfo', 'gender', val)} /></View>
            <View style={{ flex: 1 }}><InputField label="Marital Status" value={editMode ? formData.basicInfo.maritalStatus : profile.basicInfo.maritalStatus} onChange={(val) => handleInputChange('basicInfo', 'maritalStatus', val)} /></View>
          </View>
        </InfoCard>

        <InfoCard title="Contact Information" icon="address-book" color="#10b981">
          <InputField label="Phone" value={editMode ? formData.contactInfo.phone : profile.contactInfo.phone} onChange={(val) => handleInputChange('contactInfo', 'phone', val)} type="phone-pad" />
          <InputField label="Email" value={editMode ? formData.contactInfo.email : profile.contactInfo.email} onChange={(val) => handleInputChange('contactInfo', 'email', val)} type="email-address" />
          <InputField label="Address" value={editMode ? formData.contactInfo.address : profile.contactInfo.address} onChange={(val) => handleInputChange('contactInfo', 'address', val)} />

          <Text style={styles.subSectionTitle}>Emergency Contact</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}><InputField label="Name" value={editMode ? formData.contactInfo.emergencyContact.name : profile.contactInfo.emergencyContact.name} onChange={(val) => handleInputChange('contactInfo', 'emergencyContact', { ...formData.contactInfo.emergencyContact, name: val })} /></View>
            <View style={{ flex: 1 }}><InputField label="Relationship" value={editMode ? formData.contactInfo.emergencyContact.relationship : profile.contactInfo.emergencyContact.relationship} onChange={(val) => handleInputChange('contactInfo', 'emergencyContact', { ...formData.contactInfo.emergencyContact, relationship: val })} /></View>
          </View>
        </InfoCard>

        <InfoCard title="Medical Stats" icon="heartbeat" color="#ef4444">
          <View style={styles.row}>
            <View style={{ flex: 1 }}><InputField label="Height (cm)" value={editMode ? formData.medicalInfo.height : profile.medicalInfo.height} onChange={(val) => handleInputChange('medicalInfo', 'height', val)} type="numeric" /></View>
            <View style={{ flex: 1 }}><InputField label="Weight (kg)" value={editMode ? formData.medicalInfo.weight : profile.medicalInfo.weight} onChange={(val) => handleInputChange('medicalInfo', 'weight', val)} type="numeric" /></View>
          </View>
          <View style={styles.tagSection}>
            <Text style={styles.label}>Known Allergies</Text>
            <View style={styles.tagGrid}>
              {profile.medicalInfo.allergies.length > 0 ? profile.medicalInfo.allergies.map((a, i) => (
                <View key={i} style={styles.redTag}><Text style={styles.redTagText}>{a}</Text></View>
              )) : <Text style={styles.noneText}>No allergies reported</Text>}
            </View>
          </View>
        </InfoCard>

        <InfoCard title="Insurance Info" icon="shield-alt" color="#8b5cf6">
          <InputField label="Provider" value={editMode ? formData.insuranceInfo.provider : profile.insuranceInfo.provider} onChange={(val) => handleInputChange('insuranceInfo', 'provider', val)} />
          <InputField label="Policy Number" value={editMode ? formData.insuranceInfo.policyNumber : profile.insuranceInfo.policyNumber} onChange={(val) => handleInputChange('insuranceInfo', 'policyNumber', val)} />
        </InfoCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 40 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#64748b', fontWeight: 'bold' },

  header: { padding: 24, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  headerActions: { flexDirection: 'row' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  editBtnText: { color: 'white', fontWeight: 'bold' },
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, minWidth: 80, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold' },

  profileBanner: { margin: 20, backgroundColor: '#fff', borderRadius: 28, padding: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  bannerInfo: { marginLeft: 20, flex: 1 },
  bannerName: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tag: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },

  card: { backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 20, marginBottom: 20, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  cardBody: { gap: 15 },

  inputWrapper: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#1e293b', fontWeight: '600' },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#f1f5f9' },
  row: { flexDirection: 'row', gap: 15 },
  subSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginTop: 10, marginBottom: 5 },

  tagSection: { marginTop: 5 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  redTag: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  redTagText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
  noneText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }
});

export default ProfileScreen;
