import { useMemo, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function OtpVerificationScreen({ navigation, route }) {
  const [otp, setOtp] = useState("");
  const phone = route?.params?.phone ?? "";
  const maskedPhone = useMemo(() => {
    if (phone.length < 4) return phone;
    return `******${phone.slice(-4)}`;
  }, [phone]);

  const onVerify = () => {
    const sanitized = otp.replace(/\D/g, "");
    if (sanitized.length < 4) {
      Alert.alert("Invalid OTP", "Please enter a valid OTP.");
      return;
    }

    navigation.replace("Dashboard");
  };

  return (
    <View className="flex-1 bg-background-light px-5 pt-20">
      <View className="mb-8 items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <MaterialIcons name="sms" size={30} color="#0D6EFD" />
        </View>
        <Text className="mt-5 text-3xl font-bold">Verify OTP</Text>
        <Text className="mt-2 text-center text-gray-500">
          Enter the code sent to {maskedPhone || "your number"}
        </Text>
      </View>

      <TextInput
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="Enter OTP"
        className="rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg"
      />

      <TouchableOpacity
        onPress={onVerify}
        className="mt-5 h-14 items-center justify-center rounded-xl bg-primary"
      >
        <Text className="text-base font-bold text-white">Verify & Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4 items-center">
        <Text className="font-medium text-primary">Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );
}
