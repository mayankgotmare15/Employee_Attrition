import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { mobileApi } from '../services/api';

export default function AlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async () => {
    try {
      const res = await mobileApi.analytics.getOverview();
      if (res?.success) {
        setAlerts(res.data?.urgentAttentionEmployees || []);
      }
    } catch (err) {
      console.warn('Failed to load alerts:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const renderAlertItem = ({ item }) => {
    const pct = Math.round(item.attritionProbability * 100);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.employeeId })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.role}>{item.jobRole} • {item.department}</Text>
          </View>
          <View style={styles.probBadge}>
            <Text style={styles.probText}>{pct}% Risk</Text>
          </View>
        </View>

        {/* SHAP Drivers */}
        <View style={styles.factorsBox}>
          <Text style={styles.factorsLabel}>Primary Risk Stressors:</Text>
          <View style={styles.factorsRow}>
            {(item.topFactors || []).slice(0, 2).map((f, idx) => (
              <View key={idx} style={styles.factorPill}>
                <Text style={styles.factorPillText}>
                  {f.feature} ({f.importance > 0 ? '+' : ''}{f.importance.toFixed(2)})
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Strategy */}
        <View style={styles.actionBox}>
          <Text style={styles.actionLabel}>Retention Recommendation:</Text>
          <Text style={styles.actionText} numberOfLines={2}>
            {item.recommendedAction}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.compText}>Salary: ${item.monthlyIncome}/mo</Text>
          <Text style={styles.viewPlanText}>View Full Profile →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBanner}>
        <Text style={styles.bannerTitle}>Priority Retention Alerts</Text>
        <Text style={styles.bannerSubtitle}>
          Immediate proactive interventions required (Attrition &gt; 70%)
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f43f5e" />
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No high-risk attrition alerts active.</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => String(item.employeeId)}
          renderItem={renderAlertItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f43f5e" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080c14',
  },
  topBanner: {
    padding: 20,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderBottomColor: 'rgba(244, 63, 94, 0.2)',
    borderBottomWidth: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#fb7185',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  role: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  probBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: '#f43f5e',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  probText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fda4af',
  },
  factorsBox: {
    marginTop: 12,
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 10,
    borderColor: '#1e293b',
    borderWidth: 1,
  },
  factorsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  factorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  factorPill: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  factorPillText: {
    fontSize: 10,
    color: '#fda4af',
    fontWeight: '600',
  },
  actionBox: {
    marginTop: 10,
    paddingHorizontal: 2,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#818cf8',
    marginBottom: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopColor: '#1e293b',
    borderTopWidth: 1,
  },
  compText: {
    fontSize: 11,
    color: '#64748b',
  },
  viewPlanText: {
    fontSize: 11,
    color: '#818cf8',
    fontWeight: '700',
  },
});
