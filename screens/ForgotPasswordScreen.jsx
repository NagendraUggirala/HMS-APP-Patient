import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSendResetCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    // Basic email format check
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://hospital-backend-9mg3.onrender.com/api/v1/auth/patient/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmed }),
      });

      const res = await response.json();

      if (res.success) {
        Alert.alert(
          "Reset Link Sent",
          res.message || `A password reset link has been sent to ${trimmed}. Please check your email inbox.`,
          [
            {
              text: "Back to Login",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Request Failed", res.message || "Unable to send reset code. Please try again.");
      }
    } catch (err) {
      Alert.alert(
        "Request Failed",
        "Could not connect to server. Please check your internet connection and try again."
      );
      console.error("Forgot Password Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={22} color="#1e3a5f" />
          </TouchableOpacity>
        </View>

        {/* ── Illustration area ── */}
        <View style={styles.illustrationWrap}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="lock-reset" size={44} color="#0D6EFD" />
          </View>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter the email address linked to your account and we'll
            send you a verification code to reset your password.
          </Text>

          {/* Email field */}
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="email" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="user@example.com"
              placeholderTextColor="#c0c9d8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {email.length > 0 && (
              <TouchableOpacity onPress={() => setEmail("")}>
                <MaterialIcons name="cancel" size={18} color="#d1d5db" />
              </TouchableOpacity>
            )}
          </View>

          {/* Send button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={onSendResetCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="send" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Send Reset Code</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerLabel}>Or</Text>
            <View style={styles.divider} />
          </View>

          {/* Back to login */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="login" size={18} color="#0D6EFD" />
            <Text style={styles.secondaryBtnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info tip ── */}
        <View style={styles.infoTip}>
          <MaterialIcons name="info-outline" size={18} color="#6b7280" />
          <Text style={styles.infoText}>
            If you don't receive the code within 2 minutes, check your spam
            folder or request a new code.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: "#f0f4ff" },
  container: { paddingBottom: 40 },

  // header
  header: { paddingHorizontal: 16, paddingTop: 52 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  // illustration
  illustrationWrap: { alignItems: "center", marginTop: 24, marginBottom: 8 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#e0edff",
    alignItems: "center",
    justifyContent: "center",
  },

  // card
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#004fbd",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#1e3a5f" },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },

  // fields
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: "#fafafa",
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: "#1e3a5f" },

  // buttons
  primaryBtn: {
    marginTop: 22,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0D6EFD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerLabel: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
  },

  secondaryBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#0D6EFD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "700", color: "#0D6EFD" },

  // info tip
  infoTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginTop: 20,
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 12, color: "#6b7280", lineHeight: 18 },
});
