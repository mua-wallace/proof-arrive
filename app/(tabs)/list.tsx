import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { getAllArrivals } from '@/services/storage';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SwipeableTab } from '@/components/swipeable-tab';

const TABS = ['index', 'list', 'profile'];

interface ArrivalItem {
  id: string;
  vehicleId: string;
  centerId: string;
  operationType: string;
  scanTimestamp: number;
  synced: number;
}

export default function ScannedListScreen() {
  const [arrivals, setArrivals] = useState<ArrivalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadArrivals();
  }, []);

  const loadArrivals = async () => {
    try {
      const data = await getAllArrivals();
      setArrivals(data);
    } catch (error) {
      console.error('Failed to load arrivals:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArrivals();
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const renderItem = ({ item }: { item: ArrivalItem }) => {
    const isSynced = item.synced === 1 || item.synced === true;
    const operationType = item.operationType.toUpperCase();
    const isOperationLoading = operationType === 'LOADING';
    
    return (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.7}
        onPress={() => {
          // TODO: Navigate to detail view if needed
        }}>
        <View style={styles.itemContent}>
          {/* Header Section */}
          <View style={styles.itemHeader}>
            <View style={styles.vehicleInfo}>
              <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
                <MaterialIcons 
                  name="directions-car" 
                  size={20} 
                  color={tintColor} 
                />
              </View>
              <View style={styles.vehicleTextContainer}>
                <ThemedText type="defaultSemiBold" style={styles.vehicleId}>
                  {item.vehicleId}
                </ThemedText>
                <ThemedText style={styles.centerId}>
                  {item.centerId}
                </ThemedText>
              </View>
            </View>
            <View
              style={[
                styles.syncBadge,
                {
                  backgroundColor: isSynced ? '#4CAF50' + '20' : '#FF9800' + '20',
                  borderColor: isSynced ? '#4CAF50' : '#FF9800',
                },
              ]}>
              <MaterialIcons
                name={isSynced ? 'cloud-done' : 'cloud-upload'}
                size={12}
                color={isSynced ? '#4CAF50' : '#FF9800'}
                style={styles.syncIcon}
              />
              <ThemedText
                style={[
                  styles.syncText,
                  {
                    color: isSynced ? '#4CAF50' : '#FF9800',
                  },
                ]}>
                {isSynced ? 'Synced' : 'Pending'}
              </ThemedText>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Details Section */}
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <MaterialIcons
                  name={isOperationLoading ? 'upload' : 'download'}
                  size={14}
                  color={tintColor}
                  style={styles.detailIcon}
                />
                <View style={styles.detailTextContainer}>
                  <ThemedText style={styles.detailLabel}>Operation</ThemedText>
                  <ThemedText style={[styles.detailValue, { color: tintColor }]}>
                    {operationType}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailItem}>
                <MaterialIcons
                  name="access-time"
                  size={14}
                  color={tintColor}
                  style={styles.detailIcon}
                />
                <View style={styles.detailTextContainer}>
                  <ThemedText style={styles.detailLabel}>Time</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {formatTime(item.scanTimestamp)}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailItem}>
                <MaterialIcons
                  name="calendar-today"
                  size={14}
                  color={tintColor}
                  style={styles.detailIcon}
                />
                <View style={styles.detailTextContainer}>
                  <ThemedText style={styles.detailLabel}>Date</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {formatDate(item.scanTimestamp)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.loadingText}>Loading arrivals...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SwipeableTab currentTab="list" tabs={TABS}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Scanned Arrivals
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {arrivals.length} {arrivals.length === 1 ? 'record' : 'records'}
        </ThemedText>
      </View>

      {arrivals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No arrivals recorded yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Start scanning QR codes to record vehicle arrivals
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={arrivals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />
          }
        />
      )}
    </ThemedView>
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  listContent: {
    padding: 12,
    paddingTop: 8,
  },
  item: {
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContent: {
    padding: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  vehicleTextContainer: {
    flex: 1,
  },
  vehicleId: {
    fontSize: 15,
    marginBottom: 2,
  },
  centerId: {
    fontSize: 11,
    opacity: 0.6,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
    flexShrink: 0,
  },
  syncIcon: {
    marginRight: 3,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 12,
    marginHorizontal: 2,
  },
  itemDetails: {
    gap: 8,
    paddingHorizontal: 2,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  detailIcon: {
    marginRight: 6,
    opacity: 0.8,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginBottom: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});

