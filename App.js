import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import "./global.css";
import DashboardScreen from "./screens/DashboardScreen";
import LoginScreen from "./screens/LoginScreen";
import OtpVerificationScreen from "./screens/OtpVerificationScreen";
import AppointmentScreen from "./screens/QuickActionScreens/AppointmentScreen";
import HealthRecordsScreen from "./screens/QuickActionScreens/HealthRecordsScreen";
import LabTestScreen from "./screens/QuickActionScreens/LabTestScreen";
import OrderMedicineScreen from "./screens/QuickActionScreens/OrderMedicineScreen";
import SupportScreen from "./screens/QuickActionScreens/SupportScreen";
import VitalsScreen from "./screens/QuickActionScreens/VitalsScreen";
import SplashScreen from "./screens/SplashScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OTP" component={OtpVerificationScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Appointment" component={AppointmentScreen} />
        <Stack.Screen name="OrderMedicine" component={OrderMedicineScreen} />
        <Stack.Screen name="LabTest" component={LabTestScreen} />
        <Stack.Screen name="HealthRecords" component={HealthRecordsScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Vitals" component={VitalsScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
