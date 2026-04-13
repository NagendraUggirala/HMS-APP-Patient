import { useMemo, useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { API_ENDPOINTS } from "../config/api";

const TAB_EMAIL = "email";
const TAB_PHONE = "phone";

export default function LoginScreen({ navigation, route }) {
  const { login } = useAppContext();

  // ── email / password ───────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pre-fill email if passed from Registration or other screens
  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const onEmailLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    if (!password) {
      Alert.alert("Missing password", "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const res = await response.json();

      const findToken = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        let found = obj.token || obj.accessToken || obj.access_token || obj.access || obj.jwt;
        if (found) return found;
        for (const v of Object.values(obj)) {
          if (typeof v === 'object') {
            const nested = findToken(v);
            if (nested) return nested;
          }
        }
        return null;
      };

      const t = findToken(res);

      if (t) {
        login({
          ...(res.user || res.data?.user || res.data || {}),
          token: typeof t === 'string' ? t : (t.access || t.token || t.accessToken)
        });
      } else {
        Alert.alert("Login Failed", res.message || "Could not find authorization token in response.");
      }
    } catch (err) {
      Alert.alert("Login failed", "Unable to connect to server. Please try again later.");
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <MaterialIcons name="local-hospital" size={28} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.appName}>Hospital Patient App</Text>
          <Text style={styles.appTagline}>Your health, in your hands</Text>
        </View>
      </View>

      {/* ── Card ── */}
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to access your health records
        </Text>

        {route.params?.registrationSuccess && (
          <View style={styles.successBanner}>
            <MaterialIcons name="check-circle" size={18} color="#059669" />
            <Text style={styles.successText}>Registration successful! Please log in.</Text>
          </View>
        )}

        <View>
          {/* Email */}
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
          </View>

          {/* Password */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#c0c9d8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={onEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Log In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>


      {/* ── Register CTA ── */}
      <View style={styles.registerRow}>
        <Text style={styles.registerPrompt}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerLink}> Register</Text>
        </TouchableOpacity>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerIssue}>Facing issues logging in?</Text>
        <TouchableOpacity style={styles.emergencyBtn}>
          <MaterialIcons name="emergency" size={18} color="red" />
          <Text style={styles.emergencyText}>Emergency Call</Text>
        </TouchableOpacity>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>Terms of Service</Text>
          <Text style={styles.footerSep}> · </Text>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f0f4ff" },
  container: { paddingBottom: 40 },

  // header
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 52,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#0D6EFD",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { marginLeft: 12 },
  appName: { fontSize: 17, fontWeight: "700", color: "#1e3a5f" },
  appTagline: { fontSize: 12, color: "#6b7280" },

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
  title: { fontSize: 26, fontWeight: "800", color: "#1e3a5f" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 20 },

  // tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#9ca3af" },
  tabLabelActive: { color: "#0D6EFD" },

  // fields
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#374151", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
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

  // forgot
  forgotRow: { alignItems: "flex-end", marginTop: 10, marginBottom: 6 },
  forgotText: { fontSize: 13, color: "#0D6EFD", fontWeight: "600" },

  // primary button
  primaryBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0D6EFD",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // OTP channels
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerLabel: { marginHorizontal: 10, fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase" },
  channelBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  channelIcon: { borderRadius: 24, backgroundColor: "#dcfce7", padding: 8 },
  channelText: { marginLeft: 12 },
  channelTitle: { fontSize: 14, fontWeight: "700", color: "#1e3a5f" },
  channelSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  // register CTA
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    marginBottom: 4,
  },
  registerPrompt: { fontSize: 14, color: "#6b7280" },
  registerLink: { fontSize: 14, fontWeight: "700", color: "#0D6EFD" },

  // footer
  footer: { alignItems: "center", marginTop: 28, paddingHorizontal: 20 },
  footerIssue: { fontSize: 13, color: "#6b7280", marginBottom: 10 },
  emergencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
  },
  emergencyText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },
  footerLinks: { flexDirection: "row", marginTop: 16 },
  footerLink: { fontSize: 11, color: "#9ca3af" },
  footerSep: { fontSize: 11, color: "#9ca3af" },

  // Success Banner
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  successText: {
    color: "#065f46",
    fontSize: 13,
    fontWeight: "600",
  },
});
