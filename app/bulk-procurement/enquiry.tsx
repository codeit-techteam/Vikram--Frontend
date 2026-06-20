import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { FormField } from '@components/FormField';

const MATERIAL_TYPES = [
  { id: 'cement', label: 'Cement', emoji: '🧱' },
  { id: 'steel', label: 'Steel', emoji: '🔩' },
  { id: 'sand', label: 'Sand', emoji: '🏖' },
  { id: 'bricks', label: 'Bricks', emoji: '🧱' },
  { id: 'stone', label: 'Stone Chips', emoji: '🪨' },
  { id: 'mixed', label: 'Mixed Load', emoji: '📦' },
];

const BUDGET_RANGES = ['Under ₹1L', '₹1L - ₹5L', '₹5L - ₹20L', '₹20L+'];

const TIMELINES = ['Within 24 hours', 'This week', 'This month', 'Flexible'];

const UNITS = ['Bags', 'Tons', 'MT', 'Pieces', 'Cubic Ft'];

type FormState = {
  name: string;
  company: string;
  phone: string;
  email: string;
  materials: string[];
  quantity: string;
  unit: string;
  budget: string;
  address: string;
  city: string;
  timeline: string;
  notes: string;
  needGstInvoice: boolean;
};

type FormErrors = Partial<Record<keyof FormState | 'materials', string>>;

function SectionLabel({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.iconBox}>
        <Ionicons name={icon} size={15} color="#FEB623" />
      </View>
      <Text style={sectionStyles.text}>{text}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});

export default function BulkEnquiryScreen() {
  const [form, setForm] = useState<FormState>({
    name: '',
    company: '',
    phone: '',
    email: '',
    materials: [],
    quantity: '',
    unit: 'Tons',
    budget: '',
    address: '',
    city: '',
    timeline: '',
    notes: '',
    needGstInvoice: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const toggleMaterial = (id: string) => {
    void Haptics.selectionAsync();
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.includes(id)
        ? prev.materials.filter((m) => m !== id)
        : [...prev.materials, id],
    }));
    if (errors.materials) {
      setErrors((prev) => ({ ...prev, materials: undefined }));
    }
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.company.trim()) newErrors.company = 'Company name is required';
    if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Enter valid 10-digit number';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Enter valid email';
    }
    if (form.materials.length === 0) newErrors.materials = 'Select at least one material';
    if (!form.quantity.trim()) newErrors.quantity = 'Quantity is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/bulk-procurement/enquiry-success');
    }, 1500);
  };

  const selectUnit = (unit: string) => {
    void Haptics.selectionAsync();
    updateField('unit', unit);
    setUnitPickerOpen(false);
  };

  const selectBudget = (range: string) => {
    void Haptics.selectionAsync();
    updateField('budget', range);
  };

  const selectTimeline = (timeline: string) => {
    void Haptics.selectionAsync();
    updateField('timeline', timeline);
  };

  const toggleGstInvoice = () => {
    void Haptics.selectionAsync();
    updateField('needGstInvoice', !form.needGstInvoice);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <BackHeader title="Bulk Enquiry" backgroundColor="#F5F5F5" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroBanner}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="cube-outline" size={22} color="#1A1A1A" />
            </View>
            <Text style={styles.heroTitle}>Get a Custom Bulk Quote</Text>
            <Text style={styles.heroSubtitle}>
              Fill in your project details and our procurement team will reach out within 2 business
              hours with the best pricing.
            </Text>
          </View>

          <View style={styles.formCard}>
            <SectionLabel icon="person-outline" text="Contact Details" />

            <FormField
              label="Full Name"
              required
              placeholder="Enter your name"
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              icon="person-outline"
              error={errors.name}
            />

            <FormField
              label="Company Name"
              required
              placeholder="Enter company name"
              value={form.company}
              onChangeText={(v) => updateField('company', v)}
              icon="business-outline"
              error={errors.company}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Mobile Number"
                  required
                  placeholder="98765 43210"
                  value={form.phone}
                  onChangeText={(v) => updateField('phone', v.replace(/\D/g, '').slice(0, 10))}
                  icon="call-outline"
                  keyboardType="phone-pad"
                  maxLength={10}
                  error={errors.phone}
                  prefix="+91"
                />
              </View>
            </View>

            <FormField
              label="Email Address"
              placeholder="you@company.com"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <View style={styles.divider} />

            <SectionLabel icon="layers-outline" text="Material Requirements" />

            <Text style={styles.fieldLabel}>
              Material Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipRow}>
              {MATERIAL_TYPES.map((material) => (
                <TouchableOpacity
                  key={material.id}
                  onPress={() => toggleMaterial(material.id)}
                  style={[styles.chip, form.materials.includes(material.id) && styles.chipActive]}>
                  <Text style={{ fontSize: 14 }}>{material.emoji}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      form.materials.includes(material.id) && styles.chipTextActive,
                    ]}>
                    {material.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.materials ? <Text style={styles.errorText}>{errors.materials}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Estimated Quantity"
                  required
                  placeholder="e.g. 500"
                  value={form.quantity}
                  onChangeText={(v) => updateField('quantity', v.replace(/\D/g, ''))}
                  icon="calculator-outline"
                  keyboardType="number-pad"
                  error={errors.quantity}
                />
              </View>
              <View style={{ width: 110 }}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <TouchableOpacity
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setUnitPickerOpen(true);
                  }}
                  style={styles.unitPicker}>
                  <Text style={styles.unitPickerText}>{form.unit}</Text>
                  <Ionicons name="chevron-down" size={16} color="#888" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Estimated Budget Range</Text>
            <View style={styles.chipRow}>
              {BUDGET_RANGES.map((range) => (
                <TouchableOpacity
                  key={range}
                  onPress={() => selectBudget(range)}
                  style={[styles.chip, form.budget === range && styles.chipActive]}>
                  <Text style={[styles.chipText, form.budget === range && styles.chipTextActive]}>
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <SectionLabel icon="location-outline" text="Delivery Details" />

            <FormField
              label="Project Site Address"
              required
              placeholder="Enter delivery address"
              value={form.address}
              onChangeText={(v) => updateField('address', v)}
              icon="location-outline"
              multiline
              error={errors.address}
            />

            <FormField
              label="City"
              required
              placeholder="e.g. Delhi"
              value={form.city}
              onChangeText={(v) => updateField('city', v)}
              icon="map-outline"
              error={errors.city}
            />

            <Text style={[styles.fieldLabel, { marginTop: 4 }]}>When do you need delivery?</Text>
            <View style={styles.chipRow}>
              {TIMELINES.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => selectTimeline(t)}
                  style={[styles.chip, form.timeline === t && styles.chipActive]}>
                  <Text style={[styles.chipText, form.timeline === t && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <FormField
              label="Additional Requirements"
              placeholder="Any specific grade, brand preference, or delivery instructions..."
              value={form.notes}
              onChangeText={(v) => updateField('notes', v)}
              icon="document-text-outline"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity onPress={toggleGstInvoice} style={styles.checkboxRow}>
              <View style={[styles.checkbox, form.needGstInvoice && styles.checkboxActive]}>
                {form.needGstInvoice ? (
                  <Ionicons name="checkmark" size={14} color="#1A1A1A" />
                ) : null}
              </View>
              <Text style={styles.checkboxLabel}>I need a GST invoice for this order</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.trustNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#888" />
            <Text style={styles.trustNoteText}>
              Your information is secure and will only be used to process your bulk quote.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.stickyFooter}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <>
                <Ionicons name="send" size={17} color="#1A1A1A" />
                <Text style={styles.submitBtnText}>Submit Enquiry</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={unitPickerOpen} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setUnitPickerOpen(false)}
          style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Unit</Text>
            {UNITS.map((unit) => (
              <TouchableOpacity
                key={unit}
                onPress={() => selectUnit(unit)}
                style={[styles.modalOption, form.unit === unit && styles.modalOptionActive]}>
                <Text
                  style={[
                    styles.modalOptionText,
                    form.unit === unit && styles.modalOptionTextActive,
                  ]}>
                  {unit}
                </Text>
                {form.unit === unit ? (
                  <Ionicons name="checkmark" size={18} color="#FEB623" />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    backgroundColor: '#FEB623',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  heroIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#1A1A1A',
    opacity: 0.75,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 7,
  },
  required: { color: '#FF3B30' },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  chipActive: {
    backgroundColor: '#FEB623',
    borderColor: '#FEB623',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#1A1A1A',
  },
  unitPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#F8F8F8',
    marginTop: 7,
  },
  unitPickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#FEB623',
    borderColor: '#FEB623',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  trustNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  trustNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  stickyFooter: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitBtn: {
    backgroundColor: '#FEB623',
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C8900A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionActive: {
    backgroundColor: '#FFFBF0',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
});
