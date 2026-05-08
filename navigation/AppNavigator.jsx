import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from '@expo/vector-icons';

// Auth Screens
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import OtpVerificationScreen from "../screens/OtpVerificationScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import RegisterScreen from "../screens/RegisterScreen";

// Quick Action Screens deleted as requested.

// New Patient Screens (Flat structure)
import DashboardOverviewScreen from '../screens/PatientScreen/DashboardOverviewScreen';
import MyAppointmentsScreen from '../screens/PatientScreen/MyAppointmentsScreen';
import MedicalRecordsScreen from '../screens/PatientScreen/MedicalRecordsScreen';
import PrescriptionsScreen from '../screens/PatientScreen/PrescriptionsScreen';
import TestResultsScreen from '../screens/PatientScreen/TestResultsScreen';
import BillingPaymentsScreen from '../screens/PatientScreen/BillingPaymentsScreen';
import MessagesScreen from '../screens/PatientScreen/MessagesScreen';
import MyProfileScreen from '../screens/PatientScreen/MyProfileScreen';
import DischargeSummaryScreen from '../screens/PatientScreen/DischargeSummaryScreen';
import DocumentStorageScreen from '../screens/PatientScreen/DocumentStorageScreen';
import { useAppContext } from '../context/AppContext';
import PatientSidebarScreen from '../screens/PatientSidebarScreen';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;
const Stack = createNativeStackNavigator();
const PatientStack = createNativeStackNavigator();




function MainPatientContainer({ navigation }) {
  const [activeScreen, setActiveScreen] = useState('PatientOverview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0.5, duration: 250, useNativeDriver: true })
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start(() => setDrawerOpen(false));
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Top Header with Menu Toggle */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={openDrawer}>
          <MaterialIcons name="menu" size={28} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>PATIENT</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PatientPortal', { screen: 'Profile' })}>
          <MaterialIcons name="account-circle" size={28} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <PatientStack.Navigator
          screenOptions={{ headerShown: false }}
          screenListeners={{
            state: (e) => {
              // Extract the active screen name to keep the Drawer highlighted correctly
              const currentRoute = e.data.state?.routes[e.data.state.index]?.name;
              if (currentRoute) {
                setActiveScreen(currentRoute);
              }
            },
          }}
        >
          {/* Main Patient Screens */}
          <PatientStack.Screen name="PatientOverview" component={DashboardOverviewScreen} />
          <PatientStack.Screen name="Appointments" component={MyAppointmentsScreen} />
          <PatientStack.Screen name="MedicalRecords" component={MedicalRecordsScreen} />
          <PatientStack.Screen name="DischargeSummary" component={DischargeSummaryScreen} />
          <PatientStack.Screen name="Prescriptions" component={PrescriptionsScreen} />
          <PatientStack.Screen name="TestResults" component={TestResultsScreen} />
          <PatientStack.Screen name="Billing" component={BillingPaymentsScreen} />
          <PatientStack.Screen name="Messages" component={MessagesScreen} />
          <PatientStack.Screen name="Profile" component={MyProfileScreen} />
          <PatientStack.Screen name="DocumentStorage" component={DocumentStorageScreen} />

        </PatientStack.Navigator>
      </View>

      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <PatientSidebarScreen
          navigation={navigation}
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          closeDrawer={closeDrawer}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

export default function AppNavigator() {
  const { currentUser } = useAppContext();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!currentUser ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTP" component={OtpVerificationScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          {/* Main App Container -> Now houses all other patient screens */}
          <Stack.Screen name="PatientPortal" component={MainPatientContainer} />
        </>
      )}
    </Stack.Navigator>
  );
}


const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    height: 56
  },
  topHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 20,
    width: DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 15
  }
});
