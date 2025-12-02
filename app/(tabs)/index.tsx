import { StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import { SwipeableTab } from '@/components/swipeable-tab';
import { fetchAndParseIncomingVehicles } from '@/services/incoming-vehicle-service';
import type { IncomingVehicle } from '@/types/incoming-vehicle';
import { parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

const TABS = ['index', 'list', 'profile'];

export default function IncomingArrivalsScreen() {
  const tintColor = useThemeColor({}, 'tint');
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [vehicles, setVehicles] = useState<IncomingVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadIncomingVehicles();
  }, []);

  // Refresh list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadIncomingVehicles();
    }, [])
  );

  const loadIncomingVehicles = async () => {
    try {
      setLoading(true);
      const incomingVehicles = await fetchAndParseIncomingVehicles();
      setVehicles(incomingVehicles);
    } catch (error) {
      logger.error('Failed to load incoming vehicles:', parseErrorMessage(error));
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncomingVehicles();
    setRefreshing(false);
  };

  const handleStartScanning = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scan');
  };

  const handleVehiclePress = async (vehicle: IncomingVehicle) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to scan screen with pre-filled vehicle data
    router.push({
      pathname: '/scan',
      params: {
        vehicleId: vehicle.vehicleId,
        vehicleName: vehicle.vehicleName,
        vehiclePlate: vehicle.vehiclePlate || '',
        prefill: 'true',
      },
    });
  };

  const renderVehicleCard = ({ item }: { item: IncomingVehicle }) => {
    const statusColor = item.status === 'loaded' ? '#4CAF50' : '#FF9800';
    const statusIcon = item.status === 'loaded' ? 'check-circle' : 'remove-circle';

    return (
      <TouchableOpacity
        style={[styles.vehicleCard, { borderLeftColor: statusColor }]}
        onPress={() => handleVehiclePress(item)}
        activeOpacity={0.7}>
        {/* Header: Vehicle ID and Status */}
        <View style={styles.cardHeader}>
          <View style={styles.vehicleInfo}>
            <ThemedText style={styles.vehicleId} numberOfLines={1}>
              {item.vehicleName}
            </ThemedText>
            {item.vehiclePlate && (
              <ThemedText style={styles.vehiclePlate} numberOfLines={1}>
                {item.vehiclePlate}
              </ThemedText>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <MaterialIcons name={statusIcon} size={14} color={statusColor} />
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {item.status === 'loaded' ? 'Loaded' : 'Unloaded'}
            </ThemedText>
          </View>
        </View>

        {/* Compact Details Grid */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={14} color={colors.text + 'CC'} />
            <ThemedText style={styles.detailLabel}>From:</ThemedText>
            <ThemedText style={styles.detailValue} numberOfLines={1}>
              {item.exitCenterName}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={14} color={colors.text + 'CC'} />
            <ThemedText style={styles.detailLabel}>Exited:</ThemedText>
            <ThemedText style={styles.detailValue}>{item.exitTimeFormatted}</ThemedText>
          </View>

          {item.estimatedArrivalTimeFormatted && (
            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={14} color={tintColor} />
              <ThemedText style={styles.detailLabel}>ETA:</ThemedText>
              <ThemedText style={[styles.detailValue, styles.etaValue, { color: tintColor }]}>
                {item.estimatedArrivalTimeFormatted}
              </ThemedText>
            </View>
          )}

          {item.distance && (
            <View style={styles.detailRow}>
              <MaterialIcons name="straighten" size={14} color={colors.text + 'CC'} />
              <ThemedText style={styles.detailLabel}>Distance:</ThemedText>
              <ThemedText style={styles.detailValue}>{item.distance.toFixed(1)} km</ThemedText>
            </View>
          )}
        </View>

        {/* Scan Action Hint */}
        <TouchableOpacity 
          style={[styles.scanAction, { backgroundColor: tintColor + '10', borderColor: tintColor + '30' }]}
          activeOpacity={0.8}
          onPress={() => handleVehiclePress(item)}>
          <MaterialIcons name="qr-code-scanner" size={16} color={tintColor} />
          <ThemedText style={[styles.scanActionText, { color: tintColor }]}>
            Scan Vehicle
          </ThemedText>
          <MaterialIcons name="chevron-right" size={16} color={tintColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="directions-car" size={64} color={colors.text} style={{ opacity: 0.3 }} />
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No Incoming Vehicles
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        There are no vehicles currently coming to your center.
      </ThemedText>
      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: tintColor }]}
        onPress={handleStartScanning}
        activeOpacity={0.8}>
        <ThemedText style={styles.scanButtonText} lightColor="#fff" darkColor="#fff">
          Start Scanning
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SwipeableTab currentTab="index" tabs={TABS}>
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <ThemedText type="title" style={styles.title}>
            Incoming Arrivals
          </ThemedText>
          <TouchableOpacity
            style={[styles.scanButtonHeader, { backgroundColor: tintColor }]}
            onPress={handleStartScanning}
            activeOpacity={0.8}>
            <MaterialIcons name="qr-code-scanner" size={20} color="#fff" />
            <ThemedText style={styles.scanButtonHeaderText} lightColor="#fff" darkColor="#fff">
              Start Scanning
            </ThemedText>
          </TouchableOpacity>
        </View>

        {loading && vehicles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={styles.loadingText}>Loading incoming vehicles...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            renderItem={renderVehicleCard}
            keyExtractor={(item) => item.vehicleId}
            contentContainerStyle={[
              styles.listContent,
              vehicles.length === 0 && styles.emptyListContent,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  scanButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  scanButtonHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  vehicleCard: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 8,
  },
  vehicleId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 12,
    opacity: 0.65,
    fontWeight: '400',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 20,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '500',
    minWidth: 60,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
    fontWeight: '400',
  },
  etaValue: {
    fontWeight: '600',
  },
  scanAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  scanActionText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
    lineHeight: 22,
  },
  scanButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
