import { useEffect } from "react";
import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 items-center justify-center bg-primary px-6">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-white/20">
        <MaterialIcons name="local-hospital" size={52} color="#ffffff" />
      </View>
      <Text className="mt-6 text-3xl font-bold text-white">CityCare Hospital</Text>
      <Text className="mt-2 text-center text-base text-white/90">
        Caring for your health, every day.
      </Text>
    </View>
  );
}
