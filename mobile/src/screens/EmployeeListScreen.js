import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { mobileApi } from '../services/api';

export default function EmployeeListScreen({ navigation }) {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEmployees = async () => {
    try {
      const res = await mobileApi.employees.getAll({ search, department });
      if (res?.success) {
        setEmployees(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load employees:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [search, department]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  const renderItem = ({ item }) => {
    const pred = item.latestPrediction;
    const tier = pred?.riskTier || 'UNSCORED';
    const pct = pred ? `${Math.round(pred.attritionProbability * 100)}%` : 'N/A';

    return (
      <TouchableOpacity
        style={styles.empRow}
        onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.id })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.firstName[0]}{item.lastName[0]}</Text>
        </View>

        <View style={styles.empInfo}>
          <Text style={styles.empName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.empRole}>{item.jobRole} • {item.department}</Text>
          <Text style={styles.empMeta}>${item.monthlyIncome}/mo • {item.yearsAtCompany}y tenure</Text>
        </View>

        <View style={styles.riskColumn}>
          <View
            style={[
              styles.riskBadge,
              tier === 'HIGH'
                ? styles.badgeHigh
                : tier === 'MEDIUM'
                ? styles.badgeMed
                : tier === 'LOW'
                ? styles.badgeLow
                : styles.badgeNone,
            ]}
          >
            <Text
              style={[
                styles.riskText,
                tier === 'HIGH'
                  ? styles.textHigh
                  : tier === 'MEDIUM'
                  ? styles.textMed
                  : tier === 'LOW'
                  ? styles.textLow
                  : styles.textNone,
              ]}
            >
              {tier === 'UNSCORED' ? 'Unscored' : `${tier} (${pct})`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search workforce by name or ID..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Department Filter Chips */}
      <View style={styles.filterRow}>
        {['', 'Sales', 'Research & Development', 'Human Resources'].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.chip, department === d && styles.activeChip]}
            onPress={() => setDepartment(d)}
          >
            <Text style={[styles.chipText, department === d && styles.activeChipText]}>
              {d === '' ? 'All Depts' : d === 'Research & Development' ? 'R&D' : d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
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
  searchBox: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeChip: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  chipText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  activeChipText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empRow: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#312e81',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#c7d2fe',
    fontWeight: '700',
    fontSize: 13,
  },
  empInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  empRole: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  empMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  riskColumn: {
    alignItems: 'flex-end',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeHigh: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#f43f5e',
  },
  badgeMed: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  badgeLow: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  badgeNone: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textHigh: { color: '#fda4af' },
  textMed: { color: '#fcd34d' },
  textLow: { color: '#6ee7b7' },
  textNone: { color: '#94a3b8' },
});
