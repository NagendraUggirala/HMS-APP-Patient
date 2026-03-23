import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");

  const sanitizedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const onSendOtp = () => {
    if (sanitizedPhone.length < 10) {
      Alert.alert("Invalid phone number", "Please enter at least 10 digits.");
      return;
    }

    navigation.navigate("OTP", { phone: sanitizedPhone });
  };

  return (
    <ScrollView className="flex-1 bg-background-light">
      <View className="flex-row items-center p-4">
        <MaterialIcons name="local-hospital" size={24} color="#0D6EFD" />
        <Text className="ml-4 text-lg font-bold">Hospital Patient App</Text>
      </View>

      <View className="px-4 pt-6">
        <Text className="mb-2 text-3xl font-bold">Log In</Text>
        <Text className="text-gray-500">
          Enter your details to access your health records
        </Text>
      </View>

      <View className="mt-6 px-4">
        <Text className="mb-2 text-sm font-semibold uppercase">Phone Number</Text>
        <View className="h-14 flex-row items-center rounded-xl border border-gray-300 bg-white px-3">
          <MaterialIcons name="call" size={20} color="gray" />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="000 000 0000"
            keyboardType="phone-pad"
            maxLength={14}
            className="ml-3 flex-1 text-base"
          />
        </View>
      </View>

      <View className="mt-4 px-4">
        <TouchableOpacity
          onPress={onSendOtp}
          className="h-14 items-center justify-center rounded-xl bg-primary"
        >
          <Text className="text-base font-bold text-white">Send OTP</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-8 px-4">
        <View className="mb-4 flex-row items-center">
          <View className="h-px flex-1 bg-gray-300" />
          <Text className="mx-2 text-xs font-bold text-gray-400">Verification Options</Text>
          <View className="h-px flex-1 bg-gray-300" />
        </View>

        <TouchableOpacity className="mb-3 flex-row items-center rounded-xl border bg-white p-4">
          <View className="rounded-full bg-green-100 p-2">
            <MaterialCommunityIcons name="whatsapp" size={20} color="green" />
          </View>
          <View className="ml-3">
            <Text className="font-bold">WhatsApp</Text>
            <Text className="text-xs text-gray-500">Receive code via WhatsApp</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center rounded-xl border bg-white p-4">
          <View className="rounded-full bg-blue-100 p-2">
            <MaterialIcons name="sms" size={20} color="#007bff" />
          </View>
          <View className="ml-3">
            <Text className="font-bold">SMS</Text>
            <Text className="text-xs text-gray-500">Receive code via SMS</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="mt-10 px-4">
        <TouchableOpacity className="flex-row items-center justify-center rounded-xl border-2 border-dashed border-primary p-4">
          <MaterialIcons name="fingerprint" size={28} color="#0D6EFD" />
          <MaterialIcons name="face" size={28} color="#0D6EFD" />
          <Text className="ml-2 font-semibold text-primary">Login with Biometrics</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-10 items-center border-t border-gray-200 p-6">
        <Text className="mb-3 text-gray-500">Facing issues logging in?</Text>
        <TouchableOpacity className="flex-row items-center rounded-full bg-red-100 px-4 py-2">
          <MaterialIcons name="emergency" size={18} color="red" />
          <Text className="ml-2 font-bold text-red-500">Emergency Call</Text>
        </TouchableOpacity>
        <View className="mt-4 flex-row">
          <Text className="text-xs text-gray-400">Terms of Service</Text>
          <Text className="mx-2 text-gray-400">-</Text>
          <Text className="text-xs text-gray-400">Privacy Policy</Text>
        </View>
      </View>
    </ScrollView>
  );
}
