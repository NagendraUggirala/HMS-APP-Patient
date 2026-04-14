import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * ScreenContainer
 *
 * A consistent wrapper for every screen in the app.
 * Props:
 *   scroll  – boolean (default true). Set to false for full-height non-scroll screens.
 *   style   – additional styles applied to the inner content container.
 *   edges   – SafeAreaView edges (default ["top","bottom"]).
 */
export default function ScreenContainer({
  children,
  scroll = true,
  style,
  edges = ["top", "bottom"],
}) {
  if (scroll) {
    return (
      <SafeAreaView edges={edges} className="flex-1 bg-surface-50">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-4 py-4" style={style}>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-surface-50">
      <View className="flex-1 px-4 py-4" style={style}>
        {children}
      </View>
    </SafeAreaView>
  );
}
