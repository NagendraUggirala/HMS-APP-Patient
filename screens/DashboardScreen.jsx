import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const actions = [
  { icon: "calendar-today", label: "Appointment", screen: "Appointment" },
  { icon: "medication", label: "Medicine", screen: "OrderMedicine" },
  { icon: "science", label: "Lab Test", screen: "LabTest" },
  { icon: "description", label: "Records", screen: "HealthRecords" },
  { icon: "chat", label: "Support", screen: "Support" },
  { icon: "favorite", label: "Vitals", screen: "Vitals" },
];

export default function DashboardScreen({ navigation }) {
  return (
    <View className="flex-1 bg-background-light">
      <View className="flex-row items-center justify-between border-b bg-white p-4">
        <View className="flex-row items-center">
          <View className="rounded-lg bg-blue-100 p-2">
            <MaterialIcons name="local-hospital" size={22} color="#0D6EFD" />
          </View>
          <Text className="ml-3 text-lg font-bold">HealthPortal</Text>
        </View>

        <View className="flex-row items-center">
          <MaterialIcons name="notifications" size={22} color="gray" />
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            className="ml-3 h-10 w-10 rounded-full border-2 border-primary"
          />
        </View>
      </View>

      <ScrollView>
        <View className="flex-row items-center bg-white p-4">
          <Image
            source={{ uri: "https://i.pravatar.cc/150" }}
            className="h-20 w-20 rounded-lg"
          />
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold">John Doe</Text>
            <Text className="text-gray-500">
              Patient ID: <Text className="text-primary">#12345-MED</Text>
            </Text>
            <View className="mt-2 flex-row">
              <Text className="rounded bg-blue-100 px-2 py-1 text-xs text-primary">O+</Text>
              <Text className="ml-2 rounded bg-green-100 px-2 py-1 text-xs text-green-600">
                Insurance
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4">
          <Text className="mb-3 font-bold">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {actions.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigation.navigate(item.screen, { title: item.label, icon: item.icon })}
                className="mb-3 w-[30%] items-center rounded-lg bg-white p-4"
              >
                <MaterialIcons name={item.icon} size={22} color="#0D6EFD" />
                <Text className="mt-2 text-center text-xs">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-4">
          <Text className="mb-3 font-bold">Upcoming Consultation</Text>
          <View className="rounded-xl bg-primary p-5">
            <Text className="text-lg font-bold text-white">Dr. Sarah Jenkins</Text>
            <Text className="text-sm text-white/80">Cardiologist - Online</Text>
            <Text className="mt-4 text-white">Tomorrow, 10:30 AM</Text>
            <Text className="mt-1 text-white">Fee: INR 120</Text>

            <TouchableOpacity className="mt-4 items-center rounded-lg bg-white py-3">
              <Text className="font-bold text-primary">Join Video Call</Text>
            </TouchableOpacity>

            <View className="mt-3 flex-row justify-between">
              <TouchableOpacity className="rounded-lg border border-white px-4 py-2">
                <Text className="text-xs text-white">Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity className="rounded-lg border border-white px-4 py-2">
                <Text className="text-xs text-white">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="p-4">
          <Text className="mb-3 font-bold">Family Members</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["Emily", "Mike", "Sarah"].map((name, i) => (
              <View key={name} className="mr-4 items-center">
                <Image
                  source={{ uri: `https://i.pravatar.cc/100?img=${i + 3}` }}
                  className="h-16 w-16 rounded-full"
                />
                <Text className="mt-1 text-xs">{name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="p-4">
          <View className="rounded-lg bg-white p-4">
            <Text className="mb-2 font-bold">Heart Rate</Text>
            <View className="h-24 flex-row items-end justify-between">
              {[40, 60, 30, 70, 90, 50, 55].map((h, i) => (
                <View key={`${h}-${i}`} style={{ height: h }} className="w-3 rounded bg-primary" />
              ))}
            </View>
            <Text className="mt-3 text-2xl font-bold">72 bpm</Text>
          </View>
        </View>
      </ScrollView>

      <View className="flex-row justify-around border-t bg-white p-3">
        {[
          { icon: "home", label: "Home" },
          { icon: "description", label: "Records" },
          { icon: "forum", label: "Chats" },
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
