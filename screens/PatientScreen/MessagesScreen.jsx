import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
  StatusBar,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import {
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markMessageAsRead
} from '../../services/patientApi';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#2563eb', // Indigo
  emerald: '#059669',
  bg: '#f8fafc',
  white: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#f1f5f9'
};

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.conversations)) return payload.conversations;
  if (Array.isArray(payload.messages)) return payload.messages;
  return [];
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
};

const MessagesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef(null);

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getMyConversations();
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        setConversations(extractList(payload));
      }
    } catch (err) {
      console.error('[Messages] conv fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const handleSelectConv = async (conv) => {
    setSelectedConv(conv);
    setMessagesLoading(true);
    const convId = conv.id || conv.conversation_id;
    try {
      const res = await getConversationMessages(convId);
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        const msgs = extractList(payload);
        msgs.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        setMessages(msgs);

        // Mark as read locally
        setConversations(prev => prev.map(c => 
          (c.id === convId || c.conversation_id === convId) ? { ...c, unread_count: 0 } : c
        ));

        // API mark as read
        const unread = msgs.filter(m => !m.is_read && m.sender_type !== 'PATIENT');
        for (const m of unread) {
          const mId = m.id || m.message_id;
          if (mId) markMessageAsRead(mId).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[Messages] msgs fetch error:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    const convId = selectedConv.id || selectedConv.conversation_id;
    
    setSending(true);
    try {
      const res = await sendMessage(convId, { content: newMessage.trim(), message: newMessage.trim() });
      const payload = await res.json().catch(() => ({}));
      
      if (res.ok) {
        const sentMsg = (payload.id || payload.message_id) ? payload : {
          id: Date.now(),
          content: newMessage.trim(),
          sender_type: 'PATIENT',
          created_at: new Date().toISOString(),
          is_read: false
        };
        
        setMessages(prev => [...prev, sentMsg]);
        setNewMessage('');
        
        // Update list preview
        setConversations(prev => prev.map(c => (c.id === convId || c.conversation_id === convId) ? {
          ...c, last_message: newMessage.trim(), last_message_at: new Date().toISOString()
        } : c));
      }
    } catch (err) {
      console.error('[Messages] send error:', err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.sender_type === 'PATIENT' || item.is_mine;
    return (
      <View style={[styles.msgWrapper, isMine ? styles.msgMine : styles.msgOther]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.msgText, isMine && styles.msgTextMine]}>{item.content || item.message || item.text}</Text>
          <View style={styles.msgFooter}>
            <Text style={[styles.msgTime, isMine && styles.msgTimeMine]}>{formatTime(item.created_at)}</Text>
            {isMine && <MaterialIcons name="done-all" size={12} color={item.is_read ? COLORS.emerald : 'rgba(255,255,255,0.6)'} />}
          </View>
        </View>
      </View>
    );
  };

  if (selectedConv) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedConv(null)} style={styles.backBtn}>
            <MaterialIcons name="arrow-back-ios" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{(selectedConv.doctor_name || 'H').charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.headerName}>{selectedConv.doctor_name || selectedConv.participant_name || 'Hospital Staff'}</Text>
              <Text style={styles.headerSub}>{selectedConv.department || selectedConv.role || 'Provider'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerAction}><MaterialIcons name="more-vert" size={24} color={COLORS.textLight} /></TouchableOpacity>
        </View>

        {messagesLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, i) => String(item.id || i)}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendBtn, (!newMessage.trim() || sending) && { opacity: 0.5 }]} 
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? <ActivityIndicator size="small" color="white" /> : <MaterialIcons name="send" size={22} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Secure care coordination</Text>
      </View>

      <ScrollView 
        style={styles.convList} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadConversations(true)} />}
        showsVerticalScrollIndicator={false}
      >
        {conversations.map((conv, i) => {
          const cId = conv.id || conv.conversation_id;
          return (
            <TouchableOpacity key={cId || i} style={styles.convCard} onPress={() => handleSelectConv(conv)}>
              <View style={styles.convAvatar}>
                <Text style={styles.avatarText}>{(conv.doctor_name || 'H').charAt(0)}</Text>
                {(conv.unread_count > 0) && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convTop}>
                  <Text style={styles.convName}>{conv.doctor_name || conv.participant_name || 'Hospital Staff'}</Text>
                  <Text style={styles.convTime}>{formatTime(conv.last_message_at || conv.updated_at)}</Text>
                </View>
                <Text style={styles.lastMsg} numberOfLines={1}>{conv.last_message || 'No messages yet'}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          );
        })}
        {conversations.length === 0 && <View style={styles.empty}><Ionicons name="chatbubbles-outline" size={48} color="#e2e8f0" /><Text style={styles.emptyText}>No conversations found</Text></View>}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  chatContainer: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  convList: { padding: 20 },
  convCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  convAvatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  unreadDot: { position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },
  convInfo: { flex: 1, marginLeft: 15 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  convTime: { fontSize: 10, color: COLORS.textLight },
  lastMsg: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 10, marginLeft: -10 },
  chatHeaderInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  headerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginLeft: 12 },
  headerSub: { fontSize: 10, color: COLORS.textLight, marginLeft: 12 },
  messagesList: { padding: 20 },
  msgWrapper: { marginBottom: 16, flexDirection: 'row' },
  msgMine: { justifyContent: 'flex-end' },
  msgOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  bubbleMine: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#f1f5f9', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  msgTextMine: { color: '#fff' },
  msgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 },
  msgTime: { fontSize: 9, color: COLORS.textLight },
  msgTimeMine: { color: 'rgba(255,255,255,0.7)' },
  inputArea: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  input: { flex: 1, fontSize: 14, color: COLORS.text, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  empty: { padding: 60, alignItems: 'center' },
  emptyText: { color: '#cbd5e1', fontWeight: 'bold', marginTop: 12 }
});

export default MessagesScreen;
