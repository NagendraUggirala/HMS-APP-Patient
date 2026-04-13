import { useRef, useState } from "react";
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

export default function ResetPasswordScreen({ navigation, route }) {
  const email = route.params?.email ?? "";

  // ── passwords ──────────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── password strength ──────────────────────────────────────────────────────
  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-4
  };

  const strength = getStrength(newPassword);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#e5e7eb", "#ef4444", "#f59e0b", "#22c55e", "#0D6EFD"];

  // ── submit ─────────────────────────────────────────────────────────────────
  const onResetPassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert(
        "Password too short",
        "Password must be at least 8 characters."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // TODO: replace with real API call
      // await ApiService.post("/auth/reset-password", {
      //   email,
      //   new_password: newPassword,
      // });
      await new Promise((r) => setTimeout(r, 1200));

      Alert.alert(
        "Password Reset",
        "Your password has been successfully reset. Please log in with your new password.",
        [
          {
            text: "Go to Login",
            onPress: () => navigation.navigate("Login", { email }),
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        "Reset Failed",
        err?.message ?? "Invalid code or request failed. Please try again."
      );
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
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>Step 2 of 2</Text>
          </View>
        </View>

        {/* ── Icon ── */}
        <View style={styles.illustrationWrap}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="verified-user" size={44} color="#0D6EFD" />
          </View>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below for {" "}
            <Text style={styles.emailHighlight}>{email}</Text>.
          </Text>

          {/* New password */}
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>
            New Password
          </Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor="#c0c9d8"
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew((v) => !v)}>
              <MaterialIcons
                name={showNew ? "visibility-off" : "visibility"}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Strength meter */}
          {newPassword.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBar}>
                {[1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthSeg,
                      {
                        backgroundColor:
                          strength >= level
                            ? strengthColors[strength]
                            : "#e5e7eb",
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[
                  styles.strengthLabel,
                  { color: strengthColors[strength] },
                ]}
              >
                {strengthLabels[strength]}
              </Text>
            </View>
          )}

          {/* Confirm password */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Confirm Password
          </Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              placeholderTextColor="#c0c9d8"
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
              <MaterialIcons
                name={showConfirm ? "visibility-off" : "visibility"}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Match indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchRow}>
              <MaterialIcons
                name={
                  newPassword === confirmPassword
                    ? "check-circle"
                    : "cancel"
                }
                size={16}
                color={
                  newPassword === confirmPassword ? "#22c55e" : "#ef4444"
                }
              />
              <Text
                style={{
                  fontSize: 12,
                  marginLeft: 6,
                  color:
                    newPassword === confirmPassword ? "#22c55e" : "#ef4444",
                }}
              >
                {newPassword === confirmPassword
                  ? "Passwords match"
                  : "Passwords do not match"}
              </Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={onResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="lock-open" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Reset Password</Text>
              </>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 52,
  },
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
  stepBadge: {
    backgroundColor: "#e0edff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stepText: { fontSize: 12, fontWeight: "700", color: "#0D6EFD" },

  // illustration
  illustrationWrap: { alignItems: "center", marginTop: 20, marginBottom: 8 },
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
    marginBottom: 22,
    lineHeight: 20,
  },
  emailHighlight: { fontWeight: "700", color: "#0D6EFD" },

  // fields
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },

 

  // input
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

  // strength
  strengthWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  strengthBar: { flexDirection: "row", flex: 1, gap: 4 },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", width: 42 },

  // match
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  // buttons
  primaryBtn: {
    marginTop: 24,
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
});
