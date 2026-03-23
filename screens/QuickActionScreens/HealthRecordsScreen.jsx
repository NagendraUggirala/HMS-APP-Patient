import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function HealthRecordsScreen({ navigation }) {
  return (
    <View className="flex-1 bg-background-light">
      <View className="flex-row items-center justify-between border-b bg-white p-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
            <MaterialIcons name="arrow-back" size={22} />
          </TouchableOpacity>
          <MaterialIcons name="health-and-safety" size={26} color="#007bff" />
          <Text className="ml-2 text-lg font-bold">Health Records</Text>
        </View>

        <View className="flex-row">
          <TouchableOpacity className="rounded-lg bg-primary/10 p-2">
            <MaterialIcons name="qr-code" size={20} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity className="ml-2 rounded-lg bg-gray-100 p-2">
            <MaterialIcons name="settings" size={20} color="gray" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 px-4">
          {["Summary", "Prescriptions", "Lab Reports", "Consultations"].map((tab, i) => (
            <Text
              key={tab}
              className={`mr-6 pb-2 ${
                i === 0 ? "border-b-2 border-primary text-primary" : "text-gray-500"
              }`}
            >
              {tab}
            </Text>
          ))}
        </ScrollView>

        <View className="p-4">
          <Text className="mb-2 text-xs text-gray-400">Health Profile</Text>
          <View className="rounded-xl bg-white p-4">
            <Text className="text-xs text-gray-400">Chronic Conditions</Text>
            <Text className="font-bold">Diabetes, Hypertension</Text>

            <Text className="mt-3 text-xs text-gray-400">Allergies</Text>
            <Text className="font-bold text-red-500">Penicillin, Peanuts</Text>
          </View>
        </View>

        <View className="px-4">
          <View className="rounded-xl bg-primary p-4">
            <Text className="text-xs text-white">Provider</Text>
            <Text className="text-lg font-bold text-white">BlueShield Premium</Text>

            <Text className="mt-3 text-xs text-white">Member ID</Text>
            <Text className="text-white">BS-9921-0042</Text>
          </View>
        </View>

        <View className="p-4">
          <Text className="mb-2 text-xs text-gray-400">Recent Prescriptions</Text>
          {["Metformin 500mg", "Lisinopril 10mg"].map((item) => (
            <View
              key={item}
              className="mb-2 flex-row items-center justify-between rounded-lg bg-white p-3"
            >
              <View className="flex-row items-center">
                <MaterialIcons name="medication" size={20} color="#007bff" />
                <View className="ml-2">
                  <Text className="font-bold">{item}</Text>
                  <Text className="text-xs text-gray-500">2 days ago</Text>
                </View>
              </View>
              <MaterialIcons name="download" size={20} color="#007bff" />
            </View>
          ))}
        </View>

        <View className="px-4">
          <Text className="mb-2 text-xs text-gray-400">Lab Reports</Text>
          <View className="flex-row justify-between">
            {[
              { name: "HbA1c", value: "6.4%" },
              { name: "Cholesterol", value: "182" },
            ].map((item) => (
              <View key={item.name} className="w-[48%] rounded-xl bg-white p-4">
                <Text className="text-xs text-gray-400">{item.name}</Text>
                <Text className="text-xl font-bold">{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity className="absolute bottom-24 right-6 rounded-full bg-primary p-4">
        <MaterialIcons name="share" size={22} color="white" />
      </TouchableOpacity>

      <View className="flex-row justify-around border-t bg-white p-3">
        {[
          { icon: "home", label: "Home" },
          { icon: "folder", label: "Records" },
          { icon: "medical-services", label: "Doctors" },
          { icon: "person", label: "Profile" },
        ].map((item) => (
          <View key={item.label} className="items-center">
            <MaterialIcons name={item.icon} size={22} color="gray" />
            <Text className="text-xs">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
