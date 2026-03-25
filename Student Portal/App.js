import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';

// Change this to your backend host when not using emulator
const BACKEND_BASE = 'http://10.0.2.2:3000';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!username || !password) return Alert.alert('Please enter username and password');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Login failed', data && data.error ? data.error : 'Unknown error');
      } else {
        setToken(data.token);
        setStudent(data.student);
        // fetch initial data
        fetchAttendance(data.token);
        fetchNotifications(data.token);
      }
    } catch (e) {
      Alert.alert('Network error', String(e));
    } finally {
      setLoading(false);
    }
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

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Student Portal</Text>
        <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
        <Button title={loading ? 'Logging in...' : 'Login'} onPress={login} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome {student ? `${student.firstName}` : ''}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {notifications.length === 0 ? (
          <Text style={styles.empty}>No recent alerts</Text>
        ) : (
          <FlatList data={notifications} keyExtractor={(i) => String(i.id)} renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.note}</Text>
            </View>
          )} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance History</Text>
        {attendance.length === 0 ? (
          <Text style={styles.empty}>No attendance records</Text>
        ) : (
          <FlatList data={attendance} keyExtractor={(i) => String(i.id)} renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.attendanceDate} — {item.status}</Text>
            </View>
          )} />
        )}
      </View>

      <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:12}}>
        <TouchableOpacity style={styles.button} onPress={() => { fetchAttendance(); fetchNotifications(); }}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, {backgroundColor:'#c33'}]} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12, borderRadius: 6 },
  section: { marginTop: 12, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  empty: { color: '#666' },
  item: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 14 },
  button: { padding: 10, backgroundColor: '#007AFF', borderRadius: 6, minWidth: 120, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' }
});
