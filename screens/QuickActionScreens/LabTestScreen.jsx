import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function LabTestScreen({ navigation }) {
  return (
    <View className="flex-1 bg-background-light">
      <View className="flex-row items-center justify-between border-b bg-white p-4">
        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
          <MaterialIcons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text className="ml-2 flex-1 text-lg font-bold">Lab Test Catalog</Text>

        <View className="relative">
          <MaterialIcons name="shopping-cart" size={22} />
          <View className="absolute -right-2 -top-2 rounded-full bg-primary px-1">
            <Text className="text-[10px] text-white">2</Text>
          </View>
        </View>
      </View>

      <ScrollView>
        <View className="bg-white p-4">
          <View className="h-12 flex-row items-center rounded-xl bg-gray-100 px-3">
            <MaterialIcons name="search" size={20} color="gray" />
            <TextInput placeholder="Search tests (CBC, Vitamin D...)" className="ml-2 flex-1" />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 px-4">
          {["All", "Popular", "Full Body", "Diabetes", "Thyroid"].map((cat, i) => (
            <TouchableOpacity
              key={cat}
              className={`mr-3 rounded-full px-4 py-2 ${i === 0 ? "bg-primary" : "border bg-white"}`}
            >
              <Text className={i === 0 ? "text-white" : "text-gray-600"}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="mt-6 px-4">
          <Text className="mb-3 text-lg font-bold">Recommended</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2].map((item) => (
              <View key={item} className="mr-4 w-64 rounded-xl bg-white p-4">
                <Text className="mb-1 text-xs text-primary">Health Package</Text>
                <Text className="font-bold">Full Body Checkup</Text>
                <Text className="mt-1 text-xs text-gray-500">
                  Complete health screening
                </Text>

                <View className="mt-4 flex-row items-center justify-between">
                  <Text className="font-bold text-primary">INR 899</Text>
                  <TouchableOpacity className="rounded-lg bg-primary px-4 py-2">
                    <Text className="text-xs text-white">Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="p-4">
          <Text className="mb-3 text-lg font-bold">Popular Tests</Text>

          {[
            { name: "CBC", desc: "Blood analysis", price: "INR 250" },
            { name: "Lipid Profile", desc: "Heart risk test", price: "INR 350" },
            { name: "HbA1c", desc: "Diabetes test", price: "INR 200" },
          ].map((test) => (
            <View key={test.name} className="mb-3 rounded-xl bg-white p-4">
              <Text className="font-bold">{test.name}</Text>
              <Text className="text-xs text-gray-500">{test.desc}</Text>

              <View className="mt-3 flex-row items-center justify-between">
                <Text className="font-bold">{test.price}</Text>
                <TouchableOpacity className="rounded-lg bg-primary/10 px-4 py-2">
                  <Text className="text-xs text-primary">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="absolute bottom-16 left-4 right-4 flex-row items-center justify-between rounded-xl bg-primary p-4">
        <Text className="font-bold text-white">2 Tests - INR 1140</Text>
        <TouchableOpacity className="rounded-lg bg-white px-4 py-2">
          <Text className="font-bold text-primary">Checkout</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-around border-t bg-white p-3">
        {["home", "science", "calendar-today", "person"].map((icon) => (
          <MaterialIcons key={icon} name={icon} size={22} color="gray" />
        ))}
      </View>
    </View>
  );
}
