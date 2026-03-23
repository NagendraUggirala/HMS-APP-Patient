import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function AppointmentScreen({ navigation }) {
  return (
    <View className="flex-1 bg-background-light">
      <View className="bg-white px-4 pb-2 pt-6">
        <View className="mb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.navigate("Dashboard")}
            className="mr-3 rounded-full bg-gray-100 p-2"
          >
            <MaterialIcons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <MaterialIcons name="location-on" size={20} color="#007bff" />
            <View className="ml-2">
              <Text className="text-xs text-gray-400">Location</Text>
              <Text className="font-semibold">Hyderabad, India</Text>
            </View>
          </View>

          <TouchableOpacity className="rounded-full bg-gray-100 p-2">
            <MaterialIcons name="notifications" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="h-12 flex-1 flex-row items-center rounded-xl border bg-white px-3">
            <MaterialIcons name="search" size={20} color="gray" />
            <TextInput placeholder="Search doctors, clinics..." className="ml-2 flex-1" />
          </View>

          <TouchableOpacity className="ml-2 rounded-xl bg-primary p-3">
            <MaterialIcons name="tune" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
          {["All", "Cardiology", "Pediatrics", "Neurology"].map((item, i) => (
            <TouchableOpacity
              key={item}
              className={`mr-3 rounded-full px-4 py-2 ${
                i === 0 ? "bg-primary" : "border bg-white"
              }`}
            >
              <Text className={i === 0 ? "text-white" : "text-gray-600"}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView>
        <View className="mt-4 flex-row items-center justify-between px-4">
          <Text className="text-lg font-bold">Top Specialists</Text>
          <Text className="font-semibold text-primary">View All</Text>
        </View>

        <View className="mt-4 px-4">
          {[
            {
              name: "Dr. James Wilson",
              role: "Cardiologist",
              rating: "4.9",
              available: "Available Today",
            },
            {
              name: "Dr. Sarah Miller",
              role: "Pediatrician",
              rating: "4.8",
              available: "Tomorrow",
            },
            {
              name: "Dr. Elena Rodriguez",
              role: "Dermatologist",
              rating: "5.0",
              available: "Available Today",
            },
            {
              name: "Dr. Michael Chen",
              role: "General Doctor",
              rating: "4.7",
              available: "2 Days",
            },
          ].map((doc, i) => (
            <View key={doc.name} className="mb-4 flex-row rounded-xl bg-white p-4">
              <Image
                source={{ uri: `https://i.pravatar.cc/150?img=${i + 5}` }}
                className="h-24 w-24 rounded-lg"
              />

              <View className="ml-4 flex-1 justify-between">
                <View>
                  <Text className="text-base font-bold">{doc.name}</Text>
                  <Text className="text-xs text-gray-500">{doc.role}</Text>

                  <View className="mt-1 flex-row items-center">
                    <MaterialIcons name="star" size={14} color="gold" />
                    <Text className="ml-1 text-xs">{doc.rating}</Text>
                  </View>
                </View>

                <View className="mt-2 flex-row items-center justify-between">
                  <View className="flex-row">
                    <MaterialIcons name="videocam" size={18} color="#007bff" />
                    <MaterialIcons name="call" size={18} color="#007bff" />
                    <MaterialIcons name="medical-services" size={18} color="#007bff" />
                  </View>

                  <Text className="text-xs text-green-600">{doc.available}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row justify-around border-t bg-white p-3">
        {[
          { icon: "home", label: "Home" },
          { icon: "search", label: "Discover" },
          { icon: "calendar-today", label: "Appts" },
          { icon: "chat", label: "Chats" },
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
