import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { getAllArrivals } from '@/services/storage';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import { SwipeableTab } from '@/components/swipeable-tab';
import { VehicleStatus } from '@/types/arrival';

const TABS = ['index', 'list', 'profile'];

interface ArrivalItem {
  id: string;
  vehicleId: string;
  centerId: string;
  operationType: string;
  scanTimestamp: number;
  status: string | null;
  processingStartTime: number | null;
  processingEndTime: number | null;
  exitType: string | null;
  exitDestination: string | null;
  exitTime: number | null;
  synced: number;
}

type FilterStatus = 'all' | 'in_processing' | 'ready_to_exit' | 'exited';

export default function ScannedListScreen() {
  const [arrivals, setArrivals] = useState<ArrivalItem[]>([]);
  const [filteredArrivals, setFilteredArrivals] = useState<ArrivalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const tintColor = useThemeColor({}, 'tint');
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadArrivals();
  }, []);

  // Refresh list when screen comes into focus (e.g., after status changes)
  useFocusEffect(
    useCallback(() => {
      loadArrivals();
    }, [])
  );

  const loadArrivals = async () => {
    try {
      const data = await getAllArrivals();
      setArrivals(data);
      applyFilter(data, activeFilter);
    } catch (error) {
      console.error('Failed to load arrivals:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (data: ArrivalItem[], filter: FilterStatus) => {
    if (filter === 'all') {
      setFilteredArrivals(data);
    } else {
      const filtered = data.filter((item) => {
        const itemStatus = item.status || 'in_processing';
        return itemStatus === filter;
      });
      setFilteredArrivals(filtered);
    }
  };

  useEffect(() => {
    applyFilter(arrivals, activeFilter);
  }, [activeFilter, arrivals]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'arrived':
        return '#2196F3';
      case 'in_processing':
        return '#FF9800';
      case 'ready_to_exit':
        return '#4CAF50';
      case 'exited':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'arrived':
        return 'Arrived';
      case 'in_processing':
        return 'In Processing';
      case 'ready_to_exit':
        return 'Ready to Exit';
      case 'exited':
        return 'Exited';
      default:
        return status;
    }
  };

  const getActionButton = (item: ArrivalItem) => {
    // Ensure status always has a value
    const status = (item.status || 'in_processing') as VehicleStatus;
    
    if (status === 'in_processing') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: tintColor }]}
          onPress={() => {
            router.push({
              pathname: '/end-processing',
              params: {
                id: item.id,
                vehicleId: item.vehicleId,
                operationType: item.operationType,
              },
            });
          }}
          activeOpacity={0.8}>
          <MaterialIcons name="check-circle" size={16} color="#fff" />
          <ThemedText style={styles.actionButtonText} lightColor="#fff" darkColor="#fff">
            End Processing
          </ThemedText>
        </TouchableOpacity>
      );
    }
    
    if (status === 'ready_to_exit') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => {
            router.push({
              pathname: '/exit-type',
              params: {
                id: item.id,
                vehicleId: item.vehicleId,
                centerId: item.centerId,
                operationType: item.operationType,
                vehicleGPSDevice: '', // Will be filled from QR scan
              },
            });
          }}
          activeOpacity={0.8}>
          <MaterialIcons name="exit-to-app" size={16} color="#fff" />
          <ThemedText style={styles.actionButtonText} lightColor="#fff" darkColor="#fff">
            Record Exit
          </ThemedText>
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  const renderItem = ({ item }: { item: ArrivalItem }) => {
    const isSynced = item.synced === 1 || item.synced === true;
    const operationType = item.operationType.toUpperCase();
    const isOperationLoading = operationType === 'LOADING';
    // Ensure status always has a value (default to 'in_processing' for old records)
    const itemStatus = item.status || 'in_processing';
    const statusColor = getStatusColor(itemStatus);
    const statusLabel = getStatusLabel(itemStatus);
    
    return (
      <View
        style={[
          styles.item,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadow,
          },
        ]}>
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
            <View style={styles.badgesContainer}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusColor + '20',
                    borderColor: statusColor,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.statusText,
                    {
                      color: statusColor,
                    },
                  ]}>
                  {statusLabel}
                </ThemedText>
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
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

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

          {/* Action Button */}
          {getActionButton(item) && (
            <View style={styles.actionContainer}>
              {getActionButton(item)}
            </View>
          )}
        </View>
      </View>
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

  const filterTabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: arrivals.length },
    {
      key: 'in_processing',
      label: 'Processing',
      count: arrivals.filter((a) => (a.status || 'in_processing') === 'in_processing').length,
    },
    {
      key: 'ready_to_exit',
      label: 'Ready',
      count: arrivals.filter((a) => a.status === 'ready_to_exit').length,
    },
    {
      key: 'exited',
      label: 'Exited',
      count: arrivals.filter((a) => a.status === 'exited').length,
    },
  ];

  return (
    <SwipeableTab currentTab="list" tabs={TABS}>
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) }]}>
          <ThemedText type="title" style={styles.title}>
            Vehicles
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {filteredArrivals.length} {filteredArrivals.length === 1 ? 'vehicle' : 'vehicles'}
            {activeFilter !== 'all' && ` (${arrivals.length} total)`}
          </ThemedText>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            {filterTabs.map((filter) => {
              const isActive = activeFilter === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: isActive ? tintColor : colors.cardBackground,
                      borderColor: isActive ? tintColor : colors.cardBorder,
                    },
                  ]}
                  onPress={() => {
                    setActiveFilter(filter.key);
                  }}
                  activeOpacity={0.7}>
                  <ThemedText
                    style={[
                      styles.filterTabText,
                      {
                        color: isActive ? '#fff' : colors.text,
                        fontWeight: isActive ? '600' : '500',
                      },
                    ]}>
                    {filter.label}
                  </ThemedText>
                  <View
                    style={[
                      styles.filterBadge,
                      {
                        backgroundColor: isActive ? '#fff' + '30' : colors.text + '20',
                      },
                    ]}>
                    <ThemedText
                      style={[
                        styles.filterBadgeText,
                        {
                          color: isActive ? '#fff' : colors.text,
                        },
                      ]}>
                      {filter.count}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {filteredArrivals.length === 0 ? (
          <View style={[styles.emptyContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <MaterialIcons
              name={arrivals.length === 0 ? 'directions-car' : 'filter-list'}
              size={64}
              color={colors.text + '40'}
            />
            <ThemedText style={styles.emptyText}>
              {arrivals.length === 0
                ? 'No vehicles recorded yet'
                : `No vehicles with status "${filterTabs.find((f) => f.key === activeFilter)?.label}"`}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {arrivals.length === 0
                ? 'Start scanning QR codes to record vehicle arrivals'
                : 'Try selecting a different filter'}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredArrivals}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
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
    paddingBottom: 12,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  filterContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 24,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 14,
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    paddingTop: 8,
  },
  item: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
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
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
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
  actionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

