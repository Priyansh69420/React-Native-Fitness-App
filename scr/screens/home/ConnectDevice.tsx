import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
  Alert,
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
const SMARTWATCH_NAME_PREFIX = 'Apple Watch'; 
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
      accessibilityLabel={`Connect to ${item.name || 'Unknown Device'}`}
    >
      <Ionicons name="watch" size={24} color="#7A5FFF" style={styles.deviceIcon} />
      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
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
    console.log('requestPermissions called');
    try {
      if (Platform.OS === 'android') {
        console.log('Android platform detected, requesting permissions...');

        const permissionsToRequest = [];
        if (Platform.Version >= 31) {
          permissionsToRequest.push(
            'android.permission.BLUETOOTH_SCAN',
            'android.permission.BLUETOOTH_CONNECT'
          );
          if (!SMARTWATCH_SERVICE_UUID) {
            permissionsToRequest.push('android.permission.ACCESS_FINE_LOCATION');
          }
        } else {
          permissionsToRequest.push(
            'android.permission.BLUETOOTH',
            'android.permission.BLUETOOTH_ADMIN',
            'android.permission.ACCESS_FINE_LOCATION'
          );
        }

        console.log('Permissions to request:', permissionsToRequest);

        const validPermissions = permissionsToRequest.filter(
          (perm) => perm !== undefined && typeof perm === 'string'
        );
        if (validPermissions.length !== permissionsToRequest.length) {
          console.error('Invalid permissions detected:', permissionsToRequest);
          throw new Error('Invalid permissions in request array');
        }

        console.log('Requesting permissions:', validPermissions);

        const granted = await PermissionsAndroid.requestMultiple(validPermissions);
        console.log('Permissions granted result:', granted);

        let allPermissionsGranted = true;
        if (Platform.Version >= 31) {
          allPermissionsGranted =
            granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;
          if (validPermissions.includes('android.permission.ACCESS_FINE_LOCATION')) {
            allPermissionsGranted =
              allPermissionsGranted &&
              granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
          }
        } else {
          allPermissionsGranted =
            granted['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!allPermissionsGranted) {
          console.log('Bluetooth permissions NOT fully granted');
          Alert.alert(
            'Bluetooth Permissions Required',
            'Please grant all necessary Bluetooth permissions in the app settings to connect to devices.'
          );
          return false;
        }

        console.log('Bluetooth permissions FULLY granted');
        return true;
      } else if (Platform.OS === 'ios') {
        console.log('iOS platform, assuming BLE permissions will be prompted by system');
        return true;
      }

      console.log('Unsupported platform, assuming permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Permission Error',
        'An error occurred while requesting permissions. Please try again or check your settings.'
      );
      return false;
    }
  }, []);

  const scanForDevices = useCallback(async () => {
    console.log('scanForDevices called. Scanning state:', scanning);
    if (scanning) {
      console.log('Scan already in progress.');
      return;
    }
    setDevices([]);
    setScanning(true);
    const hasPermissions = await requestPermissions();
    console.log('Permissions check result:', hasPermissions);
    if (!hasPermissions) {
      setScanning(false);
      console.log('Permissions not granted, stopping scan attempt.');
      return;
    }
  
    console.log('Starting Bluetooth scan...');
    bleManager.startDeviceScan(
      null,
      null,
      (error, device) => {
        if (error) {
          console.log('Error during scan:', error);
          setScanning(false);
          return;
        }
  
        if (device && device.name) {
          if (!devices.some(d => d.id === device.id)) {
            setDevices(prevDevices => [...prevDevices, device]);
            console.log('Found device:', device.name, device.id);
          }
        }
      }
    );
  
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
      console.log('Scan stopped.');
    }, SCAN_TIMEOUT);
  }, [bleManager, requestPermissions, scanning, setDevices]);

  const connectToDevice = useCallback(
    async (device: Device) => {
      try {
        setScanning(false);
        bleManager.stopDeviceScan();

        const deviceIdentifier = Platform.OS === 'android' ? device.id : device.id;
        console.log(`Attempting to connect to device: ${deviceIdentifier}`);

        const connected = await bleManager.connectToDevice(device.id);
        setConnectedDevice(connected);
        console.log('Connected to:', connected.name);

        const discoveredServices = await connected.discoverAllServicesAndCharacteristics();
        const services = await discoveredServices.services();
        console.log('Discovered Services:', services.map(s => s.uuid));

        const targetService = services.find(service => service.uuid === SMARTWATCH_SERVICE_UUID);
        if (targetService) {
          const characteristics = await targetService.characteristics();
          console.log('Characteristics for service:', characteristics.map(c => c.uuid));
        }
      } catch (error: any) {
        console.log('Error connecting to device:', error);
        setConnectedDevice(null);
        Alert.alert('Connection Error', `Failed to connect to ${device.name || device.id}: ${error.message}`);
      }
    },
    [bleManager, setConnectedDevice, setScanning]
  );

  const disconnectDevice = useCallback(async () => {
    if (!connectedDevice) return;
    try {
      await bleManager.cancelDeviceConnection(connectedDevice.id);
      console.log('Disconnected from:', connectedDevice.name);
      setConnectedDevice(null);
      setDevices([]);
    } catch (error: any) {
      console.error('Error disconnecting device:', error);
      Alert.alert('Disconnection Error', `Failed to disconnect from ${connectedDevice.name}: ${error.message}`);
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

      <Text style={styles.title}>Connect to Smartwatch</Text>

      {/* Scan Button */}
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

      {/* Device List */}
      {!connectedDevice && devices.length > 0 && (
        <FlatList
          data={devices}
          renderItem={({ item }) => <DeviceItem item={item} onConnect={connectToDevice} />}
          keyExtractor={item => item.id}
          style={styles.deviceList}
        />
      )}

      {/* No Devices */}
      {!connectedDevice && !scanning && devices.length === 0 && (
        <Text style={styles.noDevices}>No devices found. Tap to scan.</Text>
      )}

      {/* Connected State */}
      {connectedDevice && (
        <View style={styles.connectedContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
          <Text style={styles.connectedText}>Connected to {connectedDevice.name || 'Device'}</Text>
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
    backgroundColor: '#fff'
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
    marginTop: 12 
  },
  disconnectText: { 
    color: '#f44336', 
    fontWeight: '600' 
  },
});

export default ConnectDeviceScreen;