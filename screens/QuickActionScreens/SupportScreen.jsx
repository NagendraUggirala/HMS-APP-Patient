import { View, Text, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function SupportScreen({ navigation }) {
  return (
    <View className="flex-1 bg-background-light">
      <View className="flex-row items-center justify-between border-b bg-white p-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
            <MaterialIcons name="arrow-back" size={22} />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-bold">Support Center</Text>
        </View>
        <MaterialIcons name="notifications" size={22} color="gray" />
      </View>

      <ScrollView>
        <View className="p-4">
          <Text className="mb-3 text-xl font-bold">How can we help?</Text>

          <View className="h-12 flex-row items-center rounded-xl border bg-white px-3">
            <MaterialIcons name="search" size={20} color="gray" />
            <TextInput placeholder="Search FAQs..." className="ml-2 flex-1" />
          </View>
        </View>

        <View className="px-4">
          <Text className="mb-3 font-bold">FAQ Categories</Text>

          <View className="flex-row flex-wrap justify-between">
            {[
              { name: "Appointments", icon: "calendar-month" },
              { name: "Billing", icon: "receipt-long" },
              { name: "Records", icon: "folder" },
              { name: "Tech Support", icon: "settings" },
            ].map((item) => (
              <View key={item.name} className="mb-3 w-[48%] rounded-xl bg-white p-4">
                <MaterialIcons name={item.icon} size={24} color="#007bff" />
                <Text className="mt-2 font-bold">{item.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-6 px-4">
          <Text className="mb-3 font-bold">Contact Support</Text>

          <TouchableOpacity className="mb-3 flex-row items-center justify-between rounded-xl bg-primary p-4">
            <View className="flex-row items-center">
              <MaterialIcons name="forum" size={20} color="white" />
              <View className="ml-3">
                <Text className="font-bold text-white">Live Chat</Text>
                <Text className="text-xs text-white">9 AM - 6 PM</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity className="mb-3 flex-row items-center justify-between rounded-xl bg-white p-4">
            <View className="flex-row items-center">
              <MaterialIcons name="call" size={20} color="#007bff" />
              <Text className="ml-3 font-bold">Call Hospital</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-white p-4">
            <View className="flex-row items-center">
              <MaterialIcons name="email" size={20} color="#007bff" />
              <Text className="ml-3 font-bold">Email Support</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        <View className="mt-6 p-4">
          <View className="rounded-xl bg-white p-4">
            <Text className="mb-2 font-bold">Rate your experience</Text>

            <View className="flex-row justify-between">
              {[1, 2, 3, 4, 5].map((item) => (
                <MaterialIcons key={item} name="star-border" size={24} color="gray" />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="flex-row justify-around border-t bg-white p-3">
        {[
          { icon: "home", label: "Home" },
          { icon: "description", label: "Records" },
          { icon: "chat", label: "Messages" },
          { icon: "help", label: "Support" },
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
