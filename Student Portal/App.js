import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity, StatusBar, Image, Modal, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Change this to your backend host when not using emulator
const BACKEND_BASE = 'http://10.0.2.2:3000';
// Optionally provide a logo URL (remote). If you want to use a local asset,
// put the file on a server or update this value to a reachable URL.
// Example: const LOGO_URL = 'https://example.com/my-logo.png'
const LOGO_URL = null;

// Configure how notifications are shown when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false })
});

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const usernameRef = useRef('');
  const passwordRef = useRef('');
  const [token, setToken] = useState(null);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    const u = usernameRef.current || username;
    const p = passwordRef.current || password;
    if (!u || !p) return Alert.alert('Please enter username and password');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Login failed', data && data.error ? data.error : 'Unknown error');
      } else {
        setToken(data.token);
        setStudent(data.student);
        fetchAttendance(data.token);
        fetchNotifications(data.token);
        // register for notifications (best-effort)
        try { registerForPushNotificationsAsync().then(t => setExpoPushToken(t)); } catch(e){/* ignore */}
      }
    } catch (e) {
      Alert.alert('Network error', String(e));
    } finally {
      setLoading(false);
    }
  };

  // Register and set up notification listeners
  useEffect(() => {
    let subscriptionReceived;
    let subscriptionResponse;
    async function setup() {
      try {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
      } catch (e) {
        // ignore
      }

      subscriptionReceived = Notifications.addNotificationReceivedListener(notification => {
        setLastNotification(notification);
      });

      subscriptionResponse = Notifications.addNotificationResponseReceivedListener(response => {
        // Open notification list when user taps the notification
        setShowNotificationsModal(true);
      });
    }
    setup();

    return () => {
      if (subscriptionReceived) subscriptionReceived.remove();
      if (subscriptionResponse) subscriptionResponse.remove();
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      return null;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  }

  // Helper to send a local test notification (used for testing)
  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Attendance Alert',
        body: 'You have a recent absence or late mark. Tap to view.',
        data: { openNotifications: true }
      },
      trigger: { seconds: 1 }
    });
  };

  const fetchAttendance = async (t = token) => {
    if (!t) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/student/attendance`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      const data = await res.json();
      if (res.ok) setAttendance(data);
    } catch (e) {
      console.warn('attendance fetch error', e);
    }
  };

  const fetchNotifications = async (t = token) => {
    if (!t) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/student/notifications`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      const data = await res.json();
      if (res.ok) setNotifications(data);
    } catch (e) {
      console.warn('notifications fetch error', e);
    }
  };

  const logout = () => {
    setToken(null);
    setStudent(null);
    setAttendance([]);
    setNotifications([]);
    setUsername('');
    setPassword('');
  };

  // Minimal header matching portal style
  const Header = () => (
    <View style={styles.header}>
      {LOGO_URL ? (
        <View style={styles.logoRow}>
          <Image source={{ uri: LOGO_URL }} style={styles.logoImage} resizeMode="contain" />
          <View>
            <Text style={styles.logoTitle}>Teacher Portal</Text>
            <Text style={styles.logoSub}>Student</Text>
          </View>
        </View>
      ) : (
        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', width: '100%'}}>
          <View>
            <Text style={styles.logoTitle}>Teacher Portal</Text>
            <Text style={styles.logoSub}>Student</Text>
          </View>
          <View style={{flexDirection:'row', alignItems:'center'}}>
            <TouchableOpacity onPress={() => setShowNotificationsModal(true)} style={{marginRight:12}}>
              <Text style={{fontSize:22}}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sendTestNotification}>
              <Text style={{fontSize:14, color:'#2563eb', fontWeight:'700'}}>Test Notify</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const LoginCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Student Login</Text>
      <TextInput
        placeholder="Username"
        defaultValue={username}
        onChangeText={(t) => { usernameRef.current = t; setUsername(t); }}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#64748b"
        returnKeyType="next"
      />
      <TextInput
        placeholder="Password"
        defaultValue={password}
        onChangeText={(t) => { passwordRef.current = t; setPassword(t); }}
        style={styles.input}
        secureTextEntry
        autoCorrect={false}
        placeholderTextColor="#64748b"
        returnKeyType="go"
      />
      <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={login} disabled={loading}>
        <Text style={styles.primaryButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  );

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#f6f9fb" barStyle="dark-content" />
        <Header />
        <LoginCard />
      </SafeAreaView>
    );
  }

  const renderNotification = ({ item }) => (
    <View style={styles.noticeCard}>
      <Text style={styles.noticeText}>{item.note}</Text>
    </View>
  );

  const renderAttendance = ({ item }) => {
    const statusStyle = item.status === 'Present' ? styles.presentBadge : (item.status === 'Late' ? styles.lateBadge : styles.absentBadge);
    return (
      <View style={styles.attCard}>
        <View style={{flex:1}}>
          <Text style={styles.attDate}>{item.attendanceDate}</Text>
          <Text style={styles.attMeta}>Recorded at: {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</Text>
        </View>
        <View style={[styles.badge, statusStyle]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f6f9fb" barStyle="dark-content" />
      <Header />

      <View style={styles.main}>
        <View style={styles.topRow}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeName}>{student ? `${student.firstName} ${student.lastName}` : ''}</Text>
            <Text style={styles.welcomeSub}>{student ? `${student.course} • ${student.section}` : ''}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        {notifications.length === 0 ? <Text style={styles.empty}>No recent alerts</Text> : <FlatList data={notifications} keyExtractor={(i) => String(i.id)} renderItem={renderNotification} />}

        <Text style={[styles.sectionTitle, {marginTop:16}]}>Attendance History</Text>
        {attendance.length === 0 ? <Text style={styles.empty}>No attendance records</Text> : <FlatList data={attendance} keyExtractor={(i) => String(i.id)} renderItem={renderAttendance} />}

        <Modal visible={showNotificationsModal} animationType="slide" onRequestClose={() => setShowNotificationsModal(false)}>
          <SafeAreaView style={{flex:1, backgroundColor:'#f6f9fb'}}>
            <View style={{padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
              <Text style={{fontSize:18, fontWeight:'700'}}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)} style={{padding:8}}><Text style={{color:'#2563eb', fontWeight:'700'}}>Close</Text></TouchableOpacity>
            </View>
            <ScrollView style={{paddingHorizontal:16}}>
              {notifications.length === 0 ? <Text style={{color:'#64748b'}}>No notifications</Text> : notifications.map(n => (
                <View key={String(n.id)} style={{backgroundColor:'#fff', padding:12, marginBottom:8, borderRadius:8, borderWidth:1, borderColor:'#e6eef9'}}>
                  <Text style={{fontWeight:'700'}}>{n.status || ''}</Text>
                  <Text style={{color:'#64748b', marginTop:4}}>{n.note || (`${n.status} on ${n.date}`)}</Text>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.ghostButton} onPress={() => { fetchAttendance(); fetchNotifications(); }}>
            <Text style={styles.ghostText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f9fb' },
  header: { padding: 20, paddingTop: 30, backgroundColor: 'transparent', alignItems: 'flex-start' },
  logoTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  logoSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  card: { margin: 16, padding: 20, backgroundColor: '#ffffff', borderRadius: 12, shadowColor: '#020617', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', padding: 12, marginBottom: 12, borderRadius: 8, fontSize: 14, backgroundColor: '#fff', color: '#0f172a' },
  primaryButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  buttonDisabled: { opacity: 0.7 },
  main: { flex: 1, paddingHorizontal: 16, paddingBottom: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  welcomeCard: { flex: 1, backgroundColor: '#ffffff', padding: 14, borderRadius: 10, marginRight: 8, shadowColor: '#020617', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  welcomeName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  welcomeSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ef4444', borderRadius: 10 },
  logoutText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 6, marginBottom: 6 },
  empty: { color: '#64748b', marginBottom: 8 },
  noticeCard: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, borderColor: '#e6eef9', borderWidth: 1 },
  noticeText: { color: '#0f172a' },
  attCard: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, borderColor: '#e6eef9', borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  attDate: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  attMeta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  presentBadge: { backgroundColor: '#dcfce7' },
  absentBadge: { backgroundColor: '#fee2e2' },
  lateBadge: { backgroundColor: '#fef3c7' },
  badgeText: { fontWeight: '700', color: '#0f172a' },
  actionRow: { marginTop: 10, alignItems: 'flex-end' },
  ghostButton: { padding: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' },
  ghostText: { color: '#2563eb', fontWeight: '700' }
});
