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
import * as DocumentPicker from 'expo-document-picker';
import { 
  getMyDocuments, 
  uploadMyDocument, 
  deleteMyDocument, 
  downloadMyDocument,
  getMyDocumentStatistics 
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

const CATEGORIES = [
  { label: "ID Proof", value: "ID_PROOF" },
  { label: "Insurance Card", value: "INSURANCE_CARD" },
  { label: "Medical Report", value: "MEDICAL_REPORT" },
  { label: "Prescription", value: "PRESCRIPTION" },
  { label: "Lab Result", value: "LAB_RESULT" },
  { label: "Discharge Summary", value: "DISCHARGE_SUMMARY" }
];

const DocumentStorageScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [uploadData, setUploadData] = useState({
    title: "",
    category: "ID_PROOF",
    file: null,
    description: "",
    documentDate: new Date().toISOString().split('T')[0],
    isSensitive: false
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [docsRes, statsRes] = await Promise.allSettled([
        getMyDocuments({ 
          documentType: category === "All" ? undefined : category,
          page: 1,
          limit: 20
        }),
        getMyDocumentStatistics()
      ]);

      if (docsRes.status === 'fulfilled') {
        const docsData = await docsRes.value.json().catch(() => ({}));
        let records = docsData.data?.records || docsData.records || docsData.data || docsData.documents || [];
        setDocuments(records);
      }

      if (statsRes.status === 'fulfilled') {
        const statsData = await statsRes.value.json().catch(() => ({}));
        setStats(statsData.data || statsData || null);
      }
    } catch (err) {
      console.error('[Vault] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.assets && result.assets.length > 0) {
        setUploadData({ ...uploadData, file: result.assets[0] });
      }
    } catch (err) {
      console.error('Pick error:', err);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.title || !uploadData.file) {
      Alert.alert("Missing Info", "Please provide a title and select a file.");
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("document", {
      uri: uploadData.file.uri,
      name: uploadData.file.name,
      type: uploadData.file.mimeType || 'application/octet-stream'
    });
    formData.append("document_type", uploadData.category);
    formData.append("title", uploadData.title);
    formData.append("description", uploadData.description);
    formData.append("document_date", uploadData.documentDate);
    formData.append("is_sensitive", uploadData.isSensitive ? "true" : "false");
    
    try {
      const res = await uploadMyDocument(formData);
      if (res.ok) {
        Alert.alert("Success", "Document vaulted successfully!");
        setIsModalOpen(false);
        fetchData(true);
        setUploadData({ title: "", category: "ID_PROOF", file: null, description: "", documentDate: new Date().toISOString().split('T')[0], isSensitive: false });
      } else {
        Alert.alert("Error", "Upload failed.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Document", "This action cannot be undone. Proceed?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          await deleteMyDocument(id);
          fetchData(true);
        }
      }
    ]);
  };

  const handleDownload = async (doc) => {
    try {
      const res = await downloadMyDocument(doc.document_id || doc.id);
      if (res.ok) Alert.alert("Success", "Download started.");
    } catch (e) {
      Alert.alert("Error", "Download failed.");
    }
  };

  const filteredDocs = documents.filter(doc => 
    (doc.title || doc.file_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getDocIcon = (type) => {
    switch (type) {
      case 'INSURANCE_CARD': return <MaterialIcons name="security" size={24} color="#3b82f6" />;
      case 'ID_PROOF': return <MaterialIcons name="badge" size={24} color="#a855f7" />;
      case 'MEDICAL_REPORT': return <MaterialIcons name="assignment" size={24} color="#10b981" />;
      case 'LAB_RESULT': return <MaterialIcons name="biotech" size={24} color="#f59e0b" />;
      case 'DISCHARGE_SUMMARY': return <MaterialIcons name="description" size={24} color="#6366f1" />;
      default: return <MaterialIcons name="insert-drive-file" size={24} color="#64748b" />;
    }
  };

  if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Document Vault</Text>
            <Text style={styles.subtitle}>Secure storage for health records</Text>
          </View>
          <TouchableOpacity style={styles.uploadMainBtn} onPress={() => setIsModalOpen(true)}>
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#eff6ff' }]}><MaterialIcons name="folder" size={18} color={COLORS.primary} /></View>
            <Text style={styles.statLabel}>TOTAL FILES</Text>
            <Text style={styles.statVal}>{stats?.total_documents || 0}</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#f0fdf4' }]}><MaterialIcons name="storage" size={18} color={COLORS.emerald} /></View>
            <Text style={styles.statLabel}>STORAGE USED</Text>
            <Text style={styles.statVal}>{((stats?.total_size || 0) / (1024 * 1024)).toFixed(1)} MB</Text>
          </View>
        </View>

        {/* Search & Filter */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search by title..." 
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
            {['All', ...CATEGORIES.map(c => c.value)].map(c => (
              <TouchableOpacity key={c} style={[styles.catTab, category === c && styles.catActive]} onPress={() => setCategory(c)}>
                <Text style={[styles.catLabel, category === c && styles.catLabelActive]}>{c.replace(/_/g, ' ')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Doc List */}
        <View style={styles.listContainer}>
          {filteredDocs.map((doc, i) => (
            <View key={i} style={styles.docCard}>
              <View style={styles.docHeader}>
                <View style={[styles.iconBox, doc.is_sensitive && { backgroundColor: '#fef2f2' }]}>
                  {doc.is_sensitive ? <MaterialIcons name="lock" size={24} color={COLORS.rose} /> : getDocIcon(doc.document_type)}
                </View>
                <View style={styles.docActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownload(doc)}><MaterialIcons name="file-download" size={20} color={COLORS.primary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(doc.document_id || doc.id)}><MaterialIcons name="delete-outline" size={20} color={COLORS.rose} /></TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.docTitle} numberOfLines={1}>{doc.title || doc.file_name}</Text>
              <Text style={styles.docDesc} numberOfLines={2}>{doc.description || "No description provided."}</Text>
              
              <View style={styles.docTags}>
                <View style={styles.tag}><Text style={styles.tagText}>{doc.document_type?.replace(/_/g, ' ')}</Text></View>
                {doc.is_sensitive && <View style={[styles.tag, { backgroundColor: '#fef2f2' }]}><Text style={[styles.tagText, { color: COLORS.rose }]}>SENSITIVE</Text></View>}
              </View>

              <View style={styles.docFooter}>
                <View style={styles.footerItem}><MaterialIcons name="event" size={12} color="#94a3b8" /><Text style={styles.footerText}>{doc.document_date || doc.upload_date?.split('T')[0]}</Text></View>
                <View style={styles.footerItem}><MaterialIcons name="info-outline" size={12} color="#94a3b8" /><Text style={styles.footerText}>{((doc.file_size || 0) / 1024).toFixed(0)} KB</Text></View>
              </View>
            </View>
          ))}
          {filteredDocs.length === 0 && <View style={styles.empty}><FontAwesome5 name="folder-open" size={48} color="#e2e8f0" /><Text style={styles.emptyText}>Vault is empty</Text></View>}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Secure Upload</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}><MaterialIcons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Document Title *</Text>
              <TextInput style={styles.input} placeholder="e.g. Health ID 2024" value={uploadData.title} onChangeText={t => setUploadData({...uploadData, title: t})} />
              
              <Text style={styles.inputLabel}>Category *</Text>
              <View style={styles.catPicker}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c.value} style={[styles.catChip, uploadData.category === c.value && styles.catChipActive]} onPress={() => setUploadData({...uploadData, category: c.value})}>
                    <Text style={[styles.catChipText, uploadData.category === c.value && styles.catChipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TextInput style={styles.input} value={uploadData.documentDate} onChangeText={t => setUploadData({...uploadData, documentDate: t})} />
                </View>
                <TouchableOpacity style={[styles.sensitiveBtn, uploadData.isSensitive && styles.sensitiveBtnActive]} onPress={() => setUploadData({...uploadData, isSensitive: !uploadData.isSensitive})}>
                  <MaterialIcons name={uploadData.isSensitive ? "lock" : "lock-open"} size={20} color={uploadData.isSensitive ? "white" : COLORS.textLight} />
                  <Text style={[styles.sensitiveText, uploadData.isSensitive && { color: 'white' }]}>Sensitive</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="Notes..." value={uploadData.description} onChangeText={t => setUploadData({...uploadData, description: t})} />

              <TouchableOpacity style={[styles.filePicker, uploadData.file && styles.filePickerActive]} onPress={handlePickDocument}>
                <MaterialIcons name={uploadData.file ? "check-circle" : "cloud-upload"} size={32} color={uploadData.file ? COLORS.emerald : COLORS.primary} />
                <Text style={styles.filePickerText}>{uploadData.file ? uploadData.file.name : "Select Document (Max 10MB)"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.mainUploadBtn, isUploading && { opacity: 0.7 }]} onPress={handleUpload} disabled={isUploading}>
                {isUploading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.mainUploadText}>Vault Document</Text>}
              </TouchableOpacity>
            </ScrollView>
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
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  uploadMainBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  statsRow: { flexDirection: 'row', padding: 20, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.textLight, letterSpacing: 1 },
  statVal: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  filterSection: { marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, paddingHorizontal: 16, height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: COLORS.text },
  categoryBar: { marginTop: 15, paddingLeft: 20 },
  catTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  catActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.textLight },
  catLabelActive: { color: 'white' },
  listContainer: { padding: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  docCard: { width: (width - 52) / 2, backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 16, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  docActions: { gap: 8 },
  actionBtn: { padding: 4 },
  docTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  docDesc: { fontSize: 11, color: COLORS.textLight, marginTop: 4, height: 32 },
  docTags: { flexDirection: 'row', gap: 6, marginVertical: 12 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f1f5f9' },
  tagText: { fontSize: 8, fontWeight: 'bold', color: COLORS.textLight },
  docFooter: { flexDirection: 'row', justifyContent: 'space-between', pt: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold' },
  empty: { width: '100%', padding: 60, alignItems: 'center' },
  emptyText: { color: '#cbd5e1', fontWeight: 'bold', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, fontSize: 15, color: COLORS.text, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  catPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9' },
  catChipActive: { backgroundColor: COLORS.primary },
  catChipText: { fontSize: 11, fontWeight: 'bold', color: COLORS.textLight },
  catChipTextActive: { color: 'white' },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 20, alignItems: 'flex-end' },
  sensitiveBtn: { flex: 1, height: 50, borderRadius: 16, backgroundColor: '#f8fafc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  sensitiveBtnActive: { backgroundColor: COLORS.rose, borderColor: COLORS.rose },
  sensitiveText: { fontSize: 13, fontWeight: 'bold', color: COLORS.textLight },
  filePicker: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 24, padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  filePickerActive: { backgroundColor: '#ecfdf5', borderColor: COLORS.emerald },
  filePickerText: { fontSize: 13, fontWeight: 'bold', color: COLORS.textLight, marginTop: 12, textAlign: 'center' },
  mainUploadBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  mainUploadText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default DocumentStorageScreen;
