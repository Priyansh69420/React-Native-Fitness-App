import React, { useState, useEffect, useCallback } from 'react';
import { Text, Button, FlatList, PermissionsAndroid, Platform, TouchableOpacity, Alert } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { SafeAreaView } from 'react-native-safe-area-context';

const SMARTWATCH_SERVICE_UUID = '0000FE50-0000-1000-8000-00805F9B34FB'; 
const SMARTWATCH_NAME_PREFIX = 'Apple Watch'; 
const SCAN_TIMEOUT = 10000;

interface DeviceItemProps {
    item: Device;
    onConnect: (device: Device) => void;
}

const DeviceItem: React.FC<DeviceItemProps> = ({ item, onConnect }) => (
    <TouchableOpacity onPress={() => onConnect(item)}>
        <Text>{item.name || item.id}</Text>
    </TouchableOpacity>
);

const ConnectDeviceScreen: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const bleManager = new BleManager();
    const [scanning, setScanning] = useState<boolean>(false);

    const requestPermissions = useCallback(async (): Promise<boolean> => {
      console.log('requestPermissions called');
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        console.log('Requesting Android Bluetooth permissions...');
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, 
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, 
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
        ]);
        console.log('Permissions granted result:', granted);

        const fineLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted';
        const bluetoothScanGranted = Platform.Version >= 31 ? granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' : true;
        const bluetoothConnectGranted = Platform.Version >= 31 ? granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted' : true;
        const bluetoothGranted = Platform.Version < 31 ? granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH] === 'granted' : true;

        if (!fineLocationGranted || !bluetoothScanGranted || !bluetoothConnectGranted || !bluetoothGranted) {
          console.log('Bluetooth permissions NOT fully granted');
          Alert.alert('Bluetooth Permissions Required', 'Please grant all necessary Bluetooth permissions in the app settings to connect to devices.');
          return false;
        } else {
          console.log('Bluetooth permissions FULLY granted');
          return true;
        }
      }
      console.log('Not Android or version < 23, assuming permissions granted');
      return true;
  },[]);
  
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
      [SMARTWATCH_SERVICE_UUID],
      null,
      (error, device) => {
        if (error) {
            console.log('Error during scan:', error);
            setScanning(false);
            return;
        }

        if (device && device.name && device.name.startsWith(SMARTWATCH_NAME_PREFIX) && !devices.some(d => d.id === device.id)) {
            setDevices(prevDevices => [...prevDevices, device]);
            console.log('Found device:', device.name, device.id);
        }
      }
    );

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
      console.log('Scan stopped.');
    }, SCAN_TIMEOUT);
  }, [bleManager, requestPermissions, scanning, setDevices]);

  const connectToDevice = useCallback(async (device: Device) => {
    try {
      setScanning(false);
      bleManager.stopDeviceScan();
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
  }, [bleManager, setConnectedDevice, setScanning]);

  useEffect(() => {
    const cleanup = () => {
        bleManager.destroy();
    };
    return cleanup;
  }, [bleManager]);

  return (
    <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Connect to Smartwatch</Text>
      {connectedDevice ? (
        <Text>Connected to: {connectedDevice.name || connectedDevice.id}</Text>
      ) : (
        <>
          <Button
            title={scanning ? 'Scanning...' : 'Scan for Devices'}
            onPress={scanForDevices}
            disabled={scanning}
          />
          {devices.length > 0 && (
            <FlatList
              data={devices}
              renderItem={({ item }) => <DeviceItem item={item} onConnect={connectToDevice} />}
              keyExtractor={item => item.id}
            />
          )}
          {!scanning && devices.length === 0 && <Text>No devices found.</Text>}
          {scanning && <Text>Scanning for nearby devices...</Text>}
        </>
      )}
    </SafeAreaView>
  );
};

export default ConnectDeviceScreen;