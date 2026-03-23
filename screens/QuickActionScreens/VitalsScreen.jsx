import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function VitalsScreen({ navigation }) {
  return (
    <View className="flex-1 bg-background-light">
      <View className="flex-row items-center justify-between border-b bg-white p-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
            <MaterialIcons name="arrow-back" size={22} />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-bold">Vitals Analytics</Text>
        </View>

        <TouchableOpacity className="rounded-lg bg-primary/10 px-3 py-2">
          <Text className="text-sm font-semibold text-primary">Export</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-around border-b bg-white">
        {["7 Days", "30 Days", "90 Days"].map((tab, i) => (
          <Text
            key={tab}
            className={`py-3 ${i === 0 ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          >
            {tab}
          </Text>
        ))}
      </View>

      <ScrollView>
        <View className="p-4">
          <View className="rounded-xl bg-white p-4">
            <Text className="text-gray-500">Blood Glucose</Text>
            <Text className="text-2xl font-bold">105 mg/dL</Text>
            <Text className="text-xs text-green-600">Normal</Text>

            <View className="mt-4 h-20 flex-row items-end justify-between">
              {[40, 70, 60, 90, 30, 80, 50].map((h, i) => (
                <View key={i} style={{ height: h }} className="w-3 rounded bg-primary" />
              ))}
            </View>
          </View>
        </View>

        <View className="px-4">
          <View className="rounded-xl bg-white p-4">
            <Text className="text-gray-500">Blood Pressure</Text>
            <Text className="text-2xl font-bold">138/88 mmHg</Text>
            <Text className="text-xs text-yellow-600">Warning</Text>

            <View className="mt-4 h-20 flex-row items-end justify-between">
              {[60, 50, 70, 80, 40, 75, 65].map((h, i) => (
                <View key={i} style={{ height: h }} className="w-3 rounded bg-yellow-500" />
              ))}
            </View>
          </View>
        </View>

        <View className="p-4">
          <Text className="mb-2 font-bold">AI Alerts</Text>

          <View className="mb-3 rounded-xl bg-red-100 p-4">
            <Text className="font-bold text-red-600">Spike Detected</Text>
            <Text className="text-xs text-red-500">Sugar increased suddenly</Text>
          </View>

          <View className="rounded-xl bg-gray-100 p-4">
            <Text className="font-bold">Stability Insight</Text>
            <Text className="text-xs text-gray-500">BP stable in mornings</Text>
          </View>
        </View>

        <View className="mb-6 px-4">
          <View className="rounded-xl bg-white p-4">
            <Text className="mb-3 font-bold">Glucose Range</Text>

            <View className="h-2 flex-row overflow-hidden rounded-full">
              <View className="flex-1 bg-green-500" />
              <View className="flex-1 bg-yellow-500" />
              <View className="flex-1 bg-red-500" />
            </View>

            <View className="mt-2 flex-row justify-between">
              <Text className="text-xs text-green-600">Normal</Text>
              <Text className="text-xs text-yellow-600">Warning</Text>
              <Text className="text-xs text-red-600">Critical</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="flex-row justify-around border-t bg-white p-3">
        {[
          { icon: "home", label: "Home" },
          { icon: "favorite", label: "Vitals" },
          { icon: "bar-chart", label: "Insights" },
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
