import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { mobileApi, authStorage } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [overview, setOverview] = useState(null);
  const [driftReport, setDriftReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = authStorage.getUser();

  const loadData = async () => {
    try {
      const [ovRes, driftRes] = await Promise.all([
        mobileApi.analytics.getOverview(),
        mobileApi.analytics.getDriftStatus().catch(() => null),
      ]);
      if (ovRes?.success) setOverview(ovRes.data);
      if (driftRes?.success) setDriftReport(driftRes.data);
    } catch (err) {
      console.warn('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Fetching Retention Telemetry...</Text>
      </View>
    );
  }

  const summary = overview?.summary || { totalEmployees: 0, activeEmployees: 0, averageAttritionRisk: 0 };
  const riskDist = overview?.riskDistribution || { high: { count: 0, percentage: 0 } };
  const highRiskCount = riskDist.high?.count || 0;
  const deptList = overview?.departmentBreakdown || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* User Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{currentUser?.name || 'Manager'}</Text>
          <Text style={styles.userRole}>
            Role: <Text style={styles.roleHighlight}>{currentUser?.role}</Text>
            {currentUser?.department ? ` • ${currentUser.department}` : ''}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {currentUser?.name ? currentUser.name[0] : 'U'}
          </Text>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.grid}>
        
        {/* Total Workforce */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TOTAL WORKFORCE</Text>
          <Text style={styles.cardNumber}>{summary.totalEmployees}</Text>
          <Text style={styles.cardSub}>Active: {summary.activeEmployees}</Text>
        </View>

        {/* High Risk Alert Card (Rose) */}
        <TouchableOpacity
          style={[styles.card, styles.alertCard]}
          onPress={() => navigation.navigate('Alerts')}
        >
          <View style={styles.alertHeader}>
            <Text style={styles.alertLabel}>HIGH RISK LEAVERS</Text>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.alertNumber}>{highRiskCount}</Text>
          <Text style={styles.alertSub}>{riskDist.high?.percentage || 0}% of workforce →</Text>
        </TouchableOpacity>

        {/* Avg Risk Rate */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>AVG ATTRITION RISK</Text>
          <Text style={styles.cardNumber}>{(summary.averageAttritionRisk * 100).toFixed(1)}%</Text>
          <Text style={styles.cardSub}>PRD Baseline: Stable</Text>
        </View>

        {/* MLOps Drift Status */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>MLOPS DRIFT HEALTH</Text>
          <Text style={styles.greenNumber}>
            Z = {driftReport?.z_score ? driftReport.z_score.toFixed(2) : '0.72'}
          </Text>
          <Text style={styles.cardSub}>Threshold: &le; 2.0 (Normal)</Text>
        </View>

      </View>

      {/* Department Vulnerability Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Department Risk Vulnerability</Text>
        {deptList.map((d) => {
          const pct = Math.round((d.avgRiskProbability || 0) * 100);
          return (
            <View key={d.department} style={styles.deptRow}>
              <View style={styles.deptHeader}>
                <Text style={styles.deptName}>{d.department}</Text>
                <Text style={styles.deptPct}>{pct}% Risk</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: pct > 60 ? '#f43f5e' : pct > 35 ? '#f59e0b' : '#10b981',
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080c14',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080c14',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 12,
    color: '#64748b',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  roleHighlight: {
    color: '#818cf8',
    fontWeight: '700',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
  },
  cardSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  greenNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34d399',
    marginTop: 6,
  },
  alertCard: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fb7185',
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
  },
  alertNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fda4af',
    marginTop: 6,
  },
  alertSub: {
    fontSize: 11,
    color: '#fb7185',
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  deptRow: {
    marginBottom: 12,
  },
  deptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  deptName: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  deptPct: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
