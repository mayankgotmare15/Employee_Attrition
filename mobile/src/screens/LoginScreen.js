import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { mobileApi } from '../services/api';

const DEMO_PERSONAS = [
  { label: 'Sales Dept Manager (Pranav)', email: 'deptmanager@company.com', role: 'DEPT_MANAGER' },
  { label: 'HR Manager (Pooja)', email: 'hrmanager@company.com', role: 'HR_MANAGER' },
  { label: 'HR Analyst (Mayank)', email: 'hranalyst@company.com', role: 'HR_ANALYST' },
];

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('deptmanager@company.com');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (loginEmail = email, loginPass = password) => {
    try {
      setLoading(true);
      setError(null);
      const res = await mobileApi.auth.login(loginEmail, loginPass);
      if (res.success) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
          <Text style={styles.brandTitle}>RetainIQ Mobile</Text>
          <Text style={styles.brandSubtitle}>Executive Workforce Retention & MLOps</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Enter corporate email"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter password"
            placeholderTextColor="#64748b"
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => handleLogin(email, password)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In to Mobile Portal</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 1-Click Demo Personas */}
        <View style={styles.personasSection}>
          <Text style={styles.personasTitle}>QUICK 1-CLICK DEMO PERSONAS</Text>
          {DEMO_PERSONAS.map((p) => (
            <TouchableOpacity
              key={p.email}
              style={styles.personaCard}
              onPress={() => handleLogin(p.email, 'Password@123')}
              disabled={loading}
            >
              <View>
                <Text style={styles.personaLabel}>{p.label}</Text>
                <Text style={styles.personaEmail}>{p.email}</Text>
              </View>
              <Text style={styles.personaArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080c14',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fb7185',
    fontSize: 12,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#090d16',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 13,
  },
  loginBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  personasSection: {
    marginTop: 28,
  },
  personasTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  personaCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    marginBottom: 8,
  },
  personaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  personaEmail: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  personaArrow: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: 'bold',
  },
});
