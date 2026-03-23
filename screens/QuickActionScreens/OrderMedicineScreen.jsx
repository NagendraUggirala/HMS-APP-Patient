import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function OrderMedicineScreen({ navigation }) {
  return (
    <View className="flex-1 bg-background-light">
      <View className="flex-row items-center border-b bg-white p-4">
        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
          <MaterialIcons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text className="ml-3 text-lg font-bold">Order Medicines</Text>
      </View>

      <ScrollView>
        <View className="p-4">
          <View className="h-12 flex-row items-center rounded-xl border bg-white px-3">
            <MaterialIcons name="search" size={20} color="gray" />
            <TextInput placeholder="Search medicines..." className="ml-2 flex-1" />
          </View>
        </View>

        <View className="px-4">
          {[
            {
              title: "In-app Prescription",
              desc: "From doctor records",
              icon: "receipt-long",
            },
            {
              title: "Upload Prescription",
              desc: "Upload image/PDF",
              icon: "upload-file",
            },
            {
              title: "Search Medicines",
              desc: "Browse manually",
              icon: "medical-services",
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.title}
              className="mb-3 flex-row items-center rounded-xl bg-white p-4"
            >
              <View className="rounded-lg bg-blue-100 p-3">
                <MaterialIcons name={item.icon} size={20} color="#007bff" />
              </View>

              <View className="ml-3 flex-1">
                <Text className="font-bold">{item.title}</Text>
                <Text className="text-xs text-gray-500">{item.desc}</Text>
              </View>

              <MaterialIcons name="chevron-right" size={20} color="gray" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6 px-4">
          <Text className="mb-3 text-lg font-bold">Suggested Alternatives</Text>

          {[1, 2].map((item) => (
            <View key={item} className="mb-3 flex-row rounded-xl bg-white p-4">
              <Image
                source={{ uri: "https://via.placeholder.com/80" }}
                className="h-20 w-20 rounded-lg"
              />

              <View className="ml-3 flex-1">
                <Text className="font-bold">{item === 1 ? "Paracetamol" : "Ibuprofen"}</Text>
                <Text className="text-xs text-gray-500">500mg Tablets</Text>
                <Text className="mt-1 text-xs text-primary">Generic alternative</Text>

                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="font-bold">INR {item === 1 ? "50" : "80"}</Text>

                  <TouchableOpacity className="rounded-lg bg-primary px-4 py-2">
                    <Text className="text-xs text-white">Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row justify-around border-t bg-white p-3">
        {[
          { icon: "home", label: "Home" },
          { icon: "shopping-cart", label: "Orders" },
          { icon: "description", label: "Records" },
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
