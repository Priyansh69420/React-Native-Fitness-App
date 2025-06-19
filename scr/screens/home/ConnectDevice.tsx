import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BleManager, Device } from 'react-native-ble-plx';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { SettingStackParamList } from '../../navigations/SettingStackParamList';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';

type NavigationProp = DrawerNavigationProp<SettingStackParamList, 'ConnectDevice'>;

const SMARTWATCH_SERVICE_UUID = null; 
const SCAN_TIMEOUT = 20000;

interface DeviceItemProps {
  item: Device;
  onConnect: (device: Device) => void;
}

const DeviceItem: React.FC<DeviceItemProps> = ({ item, onConnect }) => {
  return (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => onConnect(item)}
      accessibilityLabel={`Connect to ${item.name ?? 'Unknown Device'}`}
    >
      <Ionicons name="hardware-chip" size={24} color="#7A5FFF" style={styles.deviceIcon} />
      <Text style={styles.deviceName}>{item.name ?? 'Unknown Device'}</Text>
    </TouchableOpacity>
  );
};

const ConnectDeviceScreen: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const bleManager = new BleManager();
  const navigation = useNavigation<NavigationProp>();

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
      const permissionsToRequest = getAndroidPermissions();
      const validPermissions = filterValidPermissions(permissionsToRequest);

      if (validPermissions.length !== permissionsToRequest.length) {
        throw new Error('Invalid permissions in request array');
      }

      const granted = await PermissionsAndroid.requestMultiple(validPermissions);
      const allPermissionsGranted = checkAndroidPermissionsGranted(granted, validPermissions);

      if (!allPermissionsGranted) {
        warnPermissionsRequired();
        return false;
      }

      return true;
      } else if (Platform.OS === 'ios') {
      return true;
      }

      return true;
    } catch (error) {
      warnPermissionError();
      return false;
    }

    function getAndroidPermissions() {
      if (typeof Platform.Version === 'number' && Platform.Version >= 31) {
      return [
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH_CONNECT',
        !SMARTWATCH_SERVICE_UUID && 'android.permission.ACCESS_FINE_LOCATION',
      ].filter(Boolean);
      } else {
      return [
        'android.permission.BLUETOOTH',
        'android.permission.BLUETOOTH_ADMIN',
        'android.permission.ACCESS_FINE_LOCATION',
      ];
      }
    }

    function filterValidPermissions(permissions: (string | false)[]) {
      return permissions.filter((perm) => perm !== undefined && typeof perm === 'string');
    }

    function checkAndroidPermissionsGranted(granted: Record<string, string>, permissions: string[]) {
      if (typeof Platform.Version === 'number' && Platform.Version >= 31) {
      const requiredPermissions = [
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED,
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED,
      ];
      if (permissions.includes('android.permission.ACCESS_FINE_LOCATION')) {
        requiredPermissions.push(
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
      return requiredPermissions.every(Boolean);
      } else {
      return (
        granted['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
      }
    }

    function warnPermissionsRequired() {
      console.warn(
      'Bluetooth Permissions Required',
      'Please grant all necessary Bluetooth permissions in the app settings to connect to devices.'
      );
    }

    function warnPermissionError() {
      console.warn(
      'Permission Error',
      'An error occurred while requesting permissions. Please try again or check your settings.'
      );
    }
  }, []);

  const scanForDevices = useCallback(async () => {
    if (scanning) {
      return;
    }
    setDevices([]);
    setScanning(true);
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      setScanning(false);
      return;
    }

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setScanning(false);
        return;
      }

      if (device?.name) {
        if (!devices.some(d => d.id === device.id)) {
          setDevices(prevDevices => {
            if(prevDevices.some(existingDevice => existingDevice.name === device.name)) return prevDevices;

            return [...prevDevices, device];
          });
        }
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, SCAN_TIMEOUT);
  }, [bleManager, requestPermissions, scanning, setDevices]);

  const connectToDevice = useCallback(
    async (device: Device) => {
      try {
        setScanning(false);
        bleManager.stopDeviceScan();

        const connected = await bleManager.connectToDevice(device.id);
        setConnectedDevice(connected);

        const discoveredServices = await connected.discoverAllServicesAndCharacteristics();
        const services = await discoveredServices.services();

        const targetService = services.find(service => service.uuid === SMARTWATCH_SERVICE_UUID);
        if (targetService) {
          await targetService.characteristics();
        }
      } catch (error: any) {
        setConnectedDevice(null);
        console.warn('Connection Error', `Failed to connect to ${device.name ?? device.id}: ${error.message}`);
      }
    },
    [bleManager, setConnectedDevice, setScanning]
  );

  const disconnectDevice = useCallback(async () => {
    if (!connectedDevice) return;
    try {
      await bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setDevices([]);
    } catch (error: any) {
      console.warn('Disconnection Error', `Failed to disconnect from ${connectedDevice.name}: ${error.message}`);
    }
  }, [bleManager, connectedDevice]);

  useEffect(() => {
    const cleanup = () => {
      bleManager.destroy();
    };
    return cleanup;
  }, [bleManager]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Image
            source={require('../../assets/backArrowIcon.png')}
            style={styles.backIcon}
          />
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Tap Below to Connect</Text>

      {!connectedDevice && (
        <TouchableOpacity
          onPress={scanForDevices}
          style={styles.scanButton}
          disabled={scanning}
          accessibilityLabel={scanning ? 'Scanning for devices' : 'Scan for devices'}
        >
          <LinearGradient
            colors={scanning ? ['#9E4EFF', '#FF6347'] : ['#7A5FFF', '#FF9500']}
            style={styles.gradientButton}
          >
            <Ionicons name={scanning ? 'refresh' : 'bluetooth'} size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.scanLabel}>{scanning ? 'Scanning...' : 'Tap to Scan'}</Text>
        </TouchableOpacity>
      )}

      {!connectedDevice && devices.length > 0 && (
        <FlatList
          data={devices}
          renderItem={({ item }) => <DeviceItem item={item} onConnect={connectToDevice} />}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          style={styles.deviceList}
        />
      )}

      {!connectedDevice && !scanning && devices.length === 0 && (
        <Text style={styles.noDevices}>No devices found. Tap to scan.</Text>
      )}

      {connectedDevice && (
        <View style={styles.connectedContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
          <Text style={styles.connectedText}>Connected to {connectedDevice.name ?? 'Device'}</Text>
          <TouchableOpacity
            onPress={disconnectDevice}
            style={styles.disconnectButton}
            accessibilityLabel="Disconnect device"
          >
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: (height * 0.03),
    
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.05,
    position: 'relative', 
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute', 
    left: width * 0.042,
    top: height * 0.02,
  },
  backIcon: {
    width: RFValue(24, height),
    height: RFValue(24, height),
    marginRight: -(width * 0.02), 
  },
  backButton: {
    fontSize: RFPercentage(1.8), 
    color: '#007AFF',
    fontWeight: '500',
  },
  title: { 
    fontSize: 24, 
    fontWeight: '600', 
    textAlign: 'center', 
    marginVertical: 10 
  },
  scanButton: { 
    alignItems: 'center', 
    marginVertical: 20 
  },
  gradientButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLabel: { 
    marginTop: 10, 
    fontSize: 16, 
    color: '#555' 
  },
  deviceList: {
    flex: 1,
    marginHorizontal: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceIcon: {
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    color: '#333',
  },
  deviceCard: {
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
  },
  deviceTitle: { 
    fontSize: 18, 
    fontWeight: '500', 
    color: '#333', 
    marginTop: 10 
  },
  connectButton: {
    marginTop: 12,
    backgroundColor: '#6200ea',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: '600' 
  },
  noDevices: { 
    marginTop: 25, 
    textAlign: 'center', 
    color: '#888' 
  },
  connectedContainer: { 
    alignItems: 'center', 
    marginTop: 30 
  },
  connectedText: { fontSize: 18, 
    color: '#4caf50', 
    marginTop: 10 
  },
  disconnectButton: { 
    marginTop: 12,
  },
  disconnectText: { 
    fontSize: 15,
    color: '#f44336', 
    fontWeight: '600' 
  },
});

export default ConnectDeviceScreen;