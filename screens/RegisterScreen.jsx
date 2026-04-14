import { useState } from "react";
import { API_ENDPOINTS } from "../config/api";
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
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const STEPS = [
  { label: "Account", icon: "person" },
  { label: "Personal", icon: "badge" },
  { label: "Emergency", icon: "emergency" },
];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

// ── Render field helper ────────────────────────────────────────────────────
const Field = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secure,
  showToggle,
  onToggle,
  showState,
  multiline,
  maxLength,
  autoCapitalize,
}) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputRow, multiline && { height: 80, alignItems: "flex-start", paddingTop: 14 }]}>
      <MaterialIcons name={icon} size={20} color="#9ca3af" style={multiline && { marginTop: 2 }} />
      <TextInput
        style={[styles.input, multiline && { textAlignVertical: "top", height: 56 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#c0c9d8"
        keyboardType={keyboardType ?? "default"}
        secureTextEntry={secure && !showState}
        autoCapitalize={autoCapitalize ?? "none"}
        autoCorrect={false}
        multiline={multiline}
        maxLength={maxLength}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle}>
          <MaterialIcons
            name={showState ? "visibility-off" : "visibility"}
            size={20}
            color="#9ca3af"
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── Step 1: Account ────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 2: Personal Info ──────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [hospitalId, setHospitalId] = useState("");

  // ── Step 3: Emergency Contact ──────────────────────────────────────────────
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // ── Password strength ──────────────────────────────────────────────────────
  const getStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = getStrength(password);
  const strengthColors = ["#e5e7eb", "#ef4444", "#f59e0b", "#22c55e", "#0D6EFD"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  // ── Validation per step ────────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      const e = email.trim();
      if (!e || !/\S+@\S+\.\S+/.test(e)) {
        Alert.alert("Invalid email", "Please enter a valid email address.");
        return false;
      }
      if (!phone.trim()) {
        Alert.alert("Missing phone", "Please enter your phone number.");
        return false;
      }
      if (password.length < 8) {
        Alert.alert("Weak password", "Password must be at least 8 characters.");
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert("Mismatch", "Passwords do not match.");
        return false;
      }
      return true;
    }

    if (step === 1) {
      const f = (firstName || "").trim();
      const l = (lastName || "").trim();
      if (f.length < 2) {
        Alert.alert("Invalid name", "First name must be at least 2 characters.");
        return false;
      }
      if (l.length < 2) {
        Alert.alert("Invalid name", "Last name must be at least 2 characters.");
        return false;
      }
      if (!(dateOfBirth || "").trim()) {
        Alert.alert("Missing date", "Please enter your date of birth.");
        return false;
      }
      if (!gender) {
        Alert.alert("Missing gender", "Please select your gender.");
        return false;
      }
      return true;
    }

    return true;
  };

  const onNext = () => {
    Keyboard.dismiss();
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const onBack = () => {
    if (step === 0) {
      navigation.goBack();
    } else {
      setStep((s) => s - 1);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onRegister = async () => {
    Keyboard.dismiss();
    if (!validateStep()) return;

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
          hospital_id: hospitalId.trim() || undefined, // Send as undefined if empty
          date_of_birth: dateOfBirth.trim(),
          gender: gender.toLowerCase(),
          address: address.trim(),
          emergency_contact_name: emergencyName.trim(),
          emergency_contact_phone: emergencyPhone.trim(),
        }),
      });

      const res = await response.json();

      if (response.status === 409) {
        Alert.alert(
          "Account Already Exists",
          "An account with this email or phone is already registered. Would you like to log in instead?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Log In",
              onPress: () => navigation.navigate("Login", { email: email.trim() })
            }
          ]
        );
      } else if (res.success) {
        // Navigate to Login immediately with success flag
        navigation.navigate("Login", {
          email: email.trim(),
          registrationSuccess: true
        });
      } else {
        Alert.alert(
          "Registration Failed",
          res.message || "Could not create account. Please try again."
        );
      }
    } catch (err) {
      Alert.alert(
        "Registration Failed",
        "Unable to connect to server. Please check your internet and try again."
      );
      console.error("Registration Error:", err);
    } finally {
      setLoading(false);
    }
  };



  // ── Step content ───────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Field
              label="Email Address"
              icon="email"
              value={email}
              onChangeText={setEmail}
              placeholder="user@example.com"
              keyboardType="email-address"
            />
            <Field
              label="Phone Number"
              icon="phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (000) 000-0000"
              keyboardType="phone-pad"
            />
            <Field
              label="Password"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              secure
              showToggle
              onToggle={() => setShowPassword((v) => !v)}
              showState={showPassword}
            />
            {/* Strength meter */}
            {password.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4].map((lvl) => (
                    <View
                      key={lvl}
                      style={[
                        styles.strengthSeg,
                        { backgroundColor: strength >= lvl ? strengthColors[strength] : "#e5e7eb" },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColors[strength] }]}>
                  {strengthLabels[strength]}
                </Text>
              </View>
            )}
            <Field
              label="Confirm Password"
              icon="lock-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              secure
              showToggle
              onToggle={() => setShowConfirm((v) => !v)}
              showState={showConfirm}
            />
            {confirmPassword.length > 0 && (
              <View style={styles.matchRow}>
                <MaterialIcons
                  name={password === confirmPassword ? "check-circle" : "cancel"}
                  size={16}
                  color={password === confirmPassword ? "#22c55e" : "#ef4444"}
                />
                <Text
                  style={{
                    fontSize: 12,
                    marginLeft: 6,
                    color: password === confirmPassword ? "#22c55e" : "#ef4444",
                  }}
                >
                  {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
                </Text>
              </View>
            )}
          </>
        );

      case 1:
        return (
          <>
            <View style={styles.nameRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Field
                  label="First Name"
                  icon="person"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Field
                  label="Last Name"
                  icon="person-outline"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Field
              label="Date of Birth"
              icon="cake"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
              keyboardType="default"
            />

            {/* Gender selector */}
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.genderChipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field
              label="Address"
              icon="location-on"
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St, City, State"
              multiline
              autoCapitalize="sentences"
            />

            <Field
              label="Hospital ID (Optional)"
              icon="local-hospital"
              value={hospitalId}
              onChangeText={setHospitalId}
              placeholder="e.g. 3fa85f64-5717-..."
            />
          </>
        );

      case 2:
        return (
          <>
            <View style={styles.emergencyBanner}>
              <MaterialIcons name="health-and-safety" size={22} color="#ef4444" />
              <Text style={styles.emergencyBannerText}>
                This information will be used in case of a medical emergency.
              </Text>
            </View>

            <Field
              label="Emergency Contact Name"
              icon="person-pin"
              value={emergencyName}
              onChangeText={setEmergencyName}
              placeholder="Jane Doe"
              autoCapitalize="words"
            />

            <Field
              label="Emergency Contact Phone"
              icon="phone-in-talk"
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              placeholder="+1 (000) 000-0000"
              keyboardType="phone-pad"
            />

            <View style={styles.termsRow}>
              <MaterialIcons name="check-box" size={20} color="#0D6EFD" />
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </>
        );

      default:
        return null;
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
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={22} color="#1e3a5f" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* ── Step indicator ── */}
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <View key={s.label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  i <= step && styles.stepCircleActive,
                  i < step && styles.stepCircleDone,
                ]}
              >
                {i < step ? (
                  <MaterialIcons name="check" size={16} color="#fff" />
                ) : (
                  <MaterialIcons
                    name={s.icon}
                    size={16}
                    color={i <= step ? "#fff" : "#9ca3af"}
                  />
                )}
              </View>
              <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>
                {s.label}
              </Text>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
              )}
            </View>
          ))}
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.title}>{STEPS[step].label} Details</Text>
          <Text style={styles.subtitle}>
            {step === 0 && "Set up your login credentials"}
            {step === 1 && "Tell us a bit about yourself"}
            {step === 2 && "Add an emergency contact (optional but recommended)"}
          </Text>

          {renderStep()}

          {/* ── Buttons ── */}
          <View style={styles.btnRow}>
            {step > 0 && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
                <MaterialIcons name="arrow-back" size={18} color="#0D6EFD" />
                <Text style={styles.secondaryBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                loading && styles.primaryBtnDisabled,
              ]}
              onPress={step < STEPS.length - 1 ? onNext : onRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>
                    {step < STEPS.length - 1 ? "Continue" : "Create Account"}
                  </Text>
                  {step < STEPS.length - 1 && (
                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Login link ── */}
        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}> Log In</Text>
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1e3a5f" },

  // steps
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: "#0D6EFD" },
  stepCircleDone: { backgroundColor: "#22c55e" },
  stepLabel: { fontSize: 11, fontWeight: "600", color: "#9ca3af", marginLeft: 4, marginRight: 4 },
  stepLabelActive: { color: "#0D6EFD" },
  stepLine: { width: 28, height: 2, backgroundColor: "#e5e7eb", borderRadius: 1 },
  stepLineDone: { backgroundColor: "#22c55e" },

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
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 22, lineHeight: 20 },

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

  // name row
  nameRow: { flexDirection: "row" },

  // strength
  strengthWrap: { flexDirection: "row", alignItems: "center", marginBottom: 14, marginTop: -6, gap: 8 },
  strengthBar: { flexDirection: "row", flex: 1, gap: 4 },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", width: 42 },

  // match
  matchRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

  // gender
  genderRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  genderChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  genderChipActive: { borderColor: "#0D6EFD", backgroundColor: "#eef4ff" },
  genderText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  genderTextActive: { color: "#0D6EFD" },

  // emergency banner
  emergencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  emergencyBannerText: { flex: 1, fontSize: 12, color: "#991b1b", lineHeight: 18 },

  // terms
  termsRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 8, gap: 8 },
  termsText: { flex: 1, fontSize: 12, color: "#6b7280", lineHeight: 18 },
  termsLink: { color: "#0D6EFD", fontWeight: "700" },

  // buttons
  btnRow: { flexDirection: "row", marginTop: 20, gap: 10 },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0D6EFD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#0D6EFD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "700", color: "#0D6EFD" },

  // login link
  loginRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 22 },
  loginPrompt: { fontSize: 14, color: "#6b7280" },
  loginLink: { fontSize: 14, fontWeight: "700", color: "#0D6EFD" },
});
