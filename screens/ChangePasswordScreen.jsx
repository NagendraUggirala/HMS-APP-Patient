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

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
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
    return score;
  };

  const strength = getStrength(newPassword);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#e5e7eb", "#ef4444", "#f59e0b", "#22c55e", "#0D6EFD"];

  // ── requirements checklist ─────────────────────────────────────────────────
  const requirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "One number", met: /[0-9]/.test(newPassword) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  // ── submit ─────────────────────────────────────────────────────────────────
  const onChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Missing field", "Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(
        "Password too short",
        "New password must be at least 8 characters."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert(
        "Same password",
        "New password must differ from the current password."
      );
      return;
    }

    setLoading(true);
    try {
      // TODO: replace with real API call
      // await ApiService.post("/auth/change-password", {
      //   current_password: currentPassword,
      //   new_password: newPassword,
      // });
      await new Promise((r) => setTimeout(r, 1200));

      Alert.alert(
        "Password Changed",
        "Your password has been updated successfully.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert(
        "Update Failed",
        err?.message ?? "Could not change password. Please verify your current password."
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
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* ── Icon ── */}
        <View style={styles.illustrationWrap}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="security" size={44} color="#0D6EFD" />
          </View>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.title}>Update Your Password</Text>
          <Text style={styles.subtitle}>
            For your security, please enter your current password before setting
            a new one.
          </Text>

          {/* Current password */}
          <Text style={styles.fieldLabel}>Current Password</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#c0c9d8"
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrent((v) => !v)}>
              <MaterialIcons
                name={showCurrent ? "visibility-off" : "visibility"}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.sectionDivider}>
            <View style={styles.divider} />
            <Text style={styles.dividerLabel}>New Password</Text>
            <View style={styles.divider} />
          </View>

          {/* New password */}
          <Text style={styles.fieldLabel}>New Password</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock-outline" size={20} color="#9ca3af" />
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

          {/* Requirements checklist */}
          {newPassword.length > 0 && (
            <View style={styles.requirementsList}>
              {requirements.map((req) => (
                <View key={req.label} style={styles.requirementRow}>
                  <MaterialIcons
                    name={req.met ? "check-circle" : "radio-button-unchecked"}
                    size={16}
                    color={req.met ? "#22c55e" : "#d1d5db"}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      req.met && styles.requirementMet,
                    ]}
                  >
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Confirm new password */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Confirm New Password
          </Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
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
            onPress={onChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="published-with-changes" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Security tips ── */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialIcons name="tips-and-updates" size={18} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Security Tips</Text>
          </View>
          <Text style={styles.tipItem}>
            • Don't reuse passwords across different services
          </Text>
          <Text style={styles.tipItem}>
            • Use a mix of letters, numbers, and symbols
          </Text>
          <Text style={styles.tipItem}>
            • Never share your password with anyone
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1e3a5f" },

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
  title: { fontSize: 22, fontWeight: "800", color: "#1e3a5f" },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 22,
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

  // section divider
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerLabel: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
  },

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

  // requirements
  requirementsList: { marginTop: 12, gap: 6 },
  requirementRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  requirementText: { fontSize: 12, color: "#9ca3af" },
  requirementMet: { color: "#22c55e" },

  // match
  matchRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },

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

  // tips card
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fffbeb",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  tipsTitle: { fontSize: 13, fontWeight: "700", color: "#92400e" },
  tipItem: { fontSize: 12, color: "#78716c", lineHeight: 20 },
});
