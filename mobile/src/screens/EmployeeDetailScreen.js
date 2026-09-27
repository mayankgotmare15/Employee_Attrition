import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { mobileApi } from '../services/api';

export default function EmployeeDetailScreen({ route, navigation }) {
  const { employeeId } = route.params;
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await mobileApi.employees.getById(employeeId);
        if (res?.success) {
          setEmployee(res.data);
        }
      } catch (err) {
        console.warn('Failed to load employee details:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [employeeId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Employee profile not found.</Text>
      </View>
    );
  }

  const pred = employee.latestPrediction;
  const topFactors = pred?.topRiskFactors || [];
  const history = employee.history || [];
  const pct = pred ? Math.round(pred.attritionProbability * 100) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{employee.firstName[0]}{employee.lastName[0]}</Text>
        </View>
        <Text style={styles.name}>{employee.firstName} {employee.lastName}</Text>
        <Text style={styles.role}>{employee.jobRole} • {employee.department}</Text>
        <Text style={styles.meta}>ID #{employee.employeeNumber} • {employee.email}</Text>
      </View>

      {/* Risk Calibration Card */}
      {pred ? (
        <View style={[styles.riskCard, pred.riskTier === 'HIGH' ? styles.riskHigh : pred.riskTier === 'MEDIUM' ? styles.riskMed : styles.riskLow]}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskLabel}>ATTRITION RISK CALIBRATION</Text>
            <Text style={styles.riskTierText}>{pred.riskTier} RISK</Text>
          </View>
          <Text style={styles.probabilityText}>{pct}% Probability</Text>
          <Text style={styles.modelMeta}>Model {pred.modelVersion?.version || 'v1.2.0'} • MLOps Calibrated</Text>

          {/* Retention Recommendation */}
          <View style={styles.strategyBox}>
            <Text style={styles.strategyLabel}>Retention Intervention Plan:</Text>
            <Text style={styles.strategyText}>{pred.recommendedAction}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.unscoredText}>No AI attrition evaluation recorded yet.</Text>
        </View>
      )}

      {/* SHAP Feature Drivers */}
      {topFactors.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SHAP Risk Contributors</Text>
          <Text style={styles.sectionSubtitle}>Features that influence attrition decision</Text>

          <View style={styles.factorsList}>
            {topFactors.map((f, idx) => {
              const isIncrease = f.impact === 'Increases Risk' || f.importance > 0;
              return (
                <View key={idx} style={styles.factorRow}>
                  <View style={styles.factorHeader}>
                    <Text style={styles.factorName}>{f.feature}</Text>
                    <Text style={[styles.factorScore, isIncrease ? styles.scoreRed : styles.scoreGreen]}>
                      {isIncrease ? '+' : ''}{f.importance.toFixed(3)} ({f.impact})
                    </Text>
                  </View>
                  <View style={styles.factorBarBg}>
                    <View
                      style={[
                        styles.factorBarFill,
                        {
                          width: `${Math.min(Math.abs(f.importance) * 120, 100)}%`,
                          backgroundColor: isIncrease ? '#f43f5e' : '#10b981',
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Employment & Sentiment */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>HR Attributes & Sentiment</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Salary:</Text>
          <Text style={styles.detailValue}>${employee.monthlyIncome}/mo</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Company Tenure:</Text>
          <Text style={styles.detailValue}>{employee.yearsAtCompany} years</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Years in Current Role:</Text>
          <Text style={styles.detailValue}>{employee.yearsInCurrentRole} years</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mandatory OverTime:</Text>
          <Text style={[styles.detailValue, employee.overTime === 'Yes' ? styles.scoreRed : styles.scoreGreen]}>
            {employee.overTime}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Job Satisfaction:</Text>
          <Text style={styles.detailValue}>{employee.jobSatisfaction}/4</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Work-Life Balance:</Text>
          <Text style={styles.detailValue}>{employee.workLifeBalance}/4</Text>
        </View>
      </View>

      {/* Historical Evaluations (PRD FR-4) */}
      {history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Evaluation Trajectory ({history.length})</Text>
          {history.map((h) => (
            <View key={h.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyDate}>{new Date(h.predictedAt).toLocaleDateString()}</Text>
                <Text style={styles.historyModel}>Model {h.modelVersion?.version || 'v1.2.0'}</Text>
              </View>
              <Text style={styles.historyProb}>{Math.round(h.attritionProbability * 100)}% ({h.riskTier})</Text>
            </View>
          ))}
        </View>
      )}

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
  errorText: {
    color: '#fb7185',
    fontSize: 14,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  role: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  riskCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  riskHigh: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  riskMed: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  riskLow: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  riskTierText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  probabilityText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 6,
  },
  modelMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  strategyBox: {
    marginTop: 14,
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 12,
  },
  strategyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#818cf8',
    marginBottom: 4,
  },
  strategyText: {
    fontSize: 12,
    color: '#f1f5f9',
    lineHeight: 17,
  },
  card: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  unscoredText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 14,
  },
  factorsList: {
    gap: 10,
  },
  factorRow: {
    marginBottom: 8,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  factorScore: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  scoreRed: { color: '#fb7185' },
  scoreGreen: { color: '#34d399' },
  factorBarBg: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  historyModel: {
    fontSize: 10,
    color: '#64748b',
  },
  historyProb: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818cf8',
  },
});
