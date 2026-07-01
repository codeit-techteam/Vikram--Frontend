import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import {
  DELIVERY_REQUIREMENTS,
  getCategoryLabels,
  getDefaultUnit,
  getUnitsForCategories,
  MATERIAL_CATEGORIES,
} from '@constants/bulkEnquiry';
import { useBulkEnquiryStore } from '@store/bulkEnquiryStore';
import { useAuthStore } from '@store/useAuthStore';
import { useSiteStore } from '@store/useSiteStore';
import { useUserStore } from '@store/userStore';

type FormState = {
  materials: string[];
  quantity: string;
  unit: string;
  city: string;
  locationSource: 'gps' | 'manual' | null;
  gpsCoords: { latitude: number; longitude: number } | null;
  deliveryPreference: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState | 'materials' | 'location', string>>;

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
    marginBottom: 14,
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
  const user = useUserStore((s) => s.user);
  const authPhone = useAuthStore((s) => s.phoneNumber);
  const userType = useAuthStore((s) => s.selectedRole);
  const sites = useSiteStore((s) => s.sites);
  const submitEnquiry = useBulkEnquiryStore((s) => s.submitEnquiry);

  const [form, setForm] = useState<FormState>({
    materials: [],
    quantity: '',
    unit: '',
    city: '',
    locationSource: null,
    gpsCoords: null,
    deliveryPreference: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const [cityInputMode, setCityInputMode] = useState(false);
  const [locating, setLocating] = useState(false);
  const [cityFocused, setCityFocused] = useState(false);

  const availableUnits = useMemo(() => getUnitsForCategories(form.materials), [form.materials]);
  const unitLabel = availableUnits.length > 1 && !form.unit ? 'Select Unit' : form.unit || 'Unit';
  const selectedLabels = useMemo(() => getCategoryLabels(form.materials), [form.materials]);

  useEffect(() => {
    const defaultUnit = getDefaultUnit(form.materials);
    if (defaultUnit) {
      setForm((prev) => ({ ...prev, unit: defaultUnit }));
    } else if (form.materials.length > 1) {
      setForm((prev) => ({
        ...prev,
        unit: availableUnits.includes(prev.unit) ? prev.unit : '',
      }));
    } else {
      setForm((prev) => ({ ...prev, unit: '' }));
    }
  }, [form.materials, availableUnits]);

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

  const resolveCustomerPhone = () => {
    const digits = (authPhone || user.phone).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : user.phone;
  };

  const resolveCustomerId = () => {
    const phone = resolveCustomerPhone().replace(/\D/g, '');
    return phone ? `CUST-${phone}` : `CUST-${Date.now()}`;
  };

  const useCurrentLocation = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocating(true);
    setCityInputMode(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrors((prev) => ({
          ...prev,
          location: 'Location permission denied. Enter city manually.',
        }));
        setCityInputMode(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [place] = await Location.reverseGeocodeAsync(position.coords);
      const city =
        place?.city || place?.subregion || place?.district || place?.region || 'Current Location';

      setForm((prev) => ({
        ...prev,
        city,
        locationSource: 'gps',
        gpsCoords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      }));
      setErrors((prev) => ({ ...prev, city: undefined, location: undefined }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        location: 'Could not detect location. Enter city manually.',
      }));
      setCityInputMode(true);
    } finally {
      setLocating(false);
    }
  }, []);

  const validate = () => {
    const newErrors: FormErrors = {};
    if (form.materials.length === 0) newErrors.materials = 'Select at least one material';
    if (!form.quantity.trim()) newErrors.quantity = 'Quantity is required';
    if (!form.unit.trim()) newErrors.unit = 'Select a unit';
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

    const phone = resolveCustomerPhone();

    setTimeout(() => {
      submitEnquiry({
        customer: {
          name: user.name,
          phone,
          customerId: resolveCustomerId(),
          userType: userType ?? 'unknown',
          savedAddresses: sites,
        },
        categories: selectedLabels,
        quantity: form.quantity,
        unit: form.unit,
        city: form.city.trim(),
        locationSource: form.locationSource ?? 'manual',
        gpsCoords: form.gpsCoords ?? undefined,
        deliveryPreference: form.deliveryPreference,
        notes: form.notes.trim(),
      });

      setSubmitting(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/bulk-procurement/enquiry-success');
    }, 1200);
  };

  const selectUnit = (unit: string) => {
    void Haptics.selectionAsync();
    updateField('unit', unit);
    setUnitPickerOpen(false);
  };

  const selectDelivery = (preference: string) => {
    void Haptics.selectionAsync();
    updateField('deliveryPreference', preference);
  };

  const openCityInput = () => {
    void Haptics.selectionAsync();
    setCityInputMode(true);
    setForm((prev) => ({
      ...prev,
      locationSource: 'manual',
      gpsCoords: null,
    }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <BackHeader title="Bulk Enquiry" backgroundColor="#F5F5F5" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroBanner}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="cube-outline" size={22} color="#1A1A1A" />
            </View>
            <Text style={styles.heroTitle}>Get a Custom Bulk Quote</Text>
            <Text style={styles.heroSubtitle}>
              Tell us what you need — our sales team will call within 15–30 minutes with the best
              pricing.
            </Text>
          </View>

          <View style={styles.formCard}>
            <SectionLabel icon="layers-outline" text="Project Requirement" />

            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>
                Material Category <Text style={styles.required}>*</Text>
              </Text>
              {form.materials.length > 0 ? (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark" size={11} color="#1A1A1A" />
                  <Text style={styles.selectedBadgeText}>{form.materials.length} selected</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.chipRow}>
              {MATERIAL_CATEGORIES.map((material) => {
                const selected = form.materials.includes(material.id);
                return (
                  <TouchableOpacity
                    key={material.id}
                    onPress={() => toggleMaterial(material.id)}
                    style={[styles.chip, selected && styles.chipActive]}
                    activeOpacity={0.8}>
                    <Ionicons
                      name={material.icon}
                      size={14}
                      color={selected ? '#1A1A1A' : '#888'}
                    />
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {selected ? `✓ ${material.label}` : material.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.materials ? <Text style={styles.errorText}>{errors.materials}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  Estimated Quantity <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.quantity && styles.inputWrapperError,
                  ]}>
                  <Ionicons name="calculator-outline" size={17} color="#999" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter quantity"
                    placeholderTextColor="#AAAAAA"
                    value={form.quantity}
                    onChangeText={(v) => updateField('quantity', v.replace(/[^\d.]/g, ''))}
                    keyboardType="decimal-pad"
                  />
                </View>
                {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
              </View>

              <View style={{ width: 118 }}>
                <Text style={styles.fieldLabel}>
                  Unit <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (availableUnits.length === 0) return;
                    void Haptics.selectionAsync();
                    setUnitPickerOpen(true);
                  }}
                  disabled={availableUnits.length === 0}
                  style={[
                    styles.unitPicker,
                    availableUnits.length === 0 && { opacity: 0.5 },
                    errors.unit && styles.inputWrapperError,
                  ]}>
                  <Text
                    style={[
                      styles.unitPickerText,
                      !form.unit && availableUnits.length > 1 && { color: '#888' },
                    ]}
                    numberOfLines={1}>
                    {availableUnits.length === 0 ? 'Unit' : unitLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#888" />
                </TouchableOpacity>
                {errors.unit ? <Text style={styles.errorText}>{errors.unit}</Text> : null}
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>
              Delivery Location <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.locationSection}>
              <TouchableOpacity
                onPress={useCurrentLocation}
                disabled={locating}
                style={[
                  styles.locationBtn,
                  form.locationSource === 'gps' && styles.locationBtnActive,
                ]}
                activeOpacity={0.85}>
                {locating ? (
                  <ActivityIndicator size="small" color="#1A1A1A" />
                ) : (
                  <Ionicons
                    name="navigate"
                    size={16}
                    color={form.locationSource === 'gps' ? '#1A1A1A' : '#666'}
                  />
                )}
                <Text
                  style={[
                    styles.locationBtnText,
                    form.locationSource === 'gps' && styles.locationBtnTextActive,
                  ]}>
                  Use Current Location
                </Text>
              </TouchableOpacity>

              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              {!cityInputMode && form.locationSource !== 'gps' ? (
                <TouchableOpacity onPress={openCityInput} style={styles.enterCityBtn}>
                  <Ionicons name="map-outline" size={16} color="#666" />
                  <Text style={styles.enterCityBtnText}>Enter City</Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.inputWrapper,
                    cityFocused && styles.inputWrapperFocused,
                    errors.city && styles.inputWrapperError,
                  ]}>
                  <Ionicons name="map-outline" size={17} color={cityFocused ? '#FEB623' : '#999'} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Delhi"
                    placeholderTextColor="#AAAAAA"
                    value={form.city}
                    onChangeText={(v) => {
                      updateField('city', v);
                      updateField('locationSource', 'manual');
                      updateField('gpsCoords', null);
                    }}
                    onFocus={() => setCityFocused(true)}
                    onBlur={() => setCityFocused(false)}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {form.locationSource === 'gps' && form.city ? (
                <View style={styles.detectedCity}>
                  <Ionicons name="checkmark-circle" size={14} color="#FEB623" />
                  <Text style={styles.detectedCityText}>{form.city}</Text>
                </View>
              ) : null}
            </View>
            {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
            {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Delivery Requirement</Text>
            <View style={styles.chipRow}>
              {DELIVERY_REQUIREMENTS.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => selectDelivery(option)}
                  style={[
                    styles.chip,
                    form.deliveryPreference === option && styles.chipActive,
                  ]}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.chipText,
                      form.deliveryPreference === option && styles.chipTextActive,
                    ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.fieldLabel}>Additional Notes</Text>
              <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: 10 }]}>
                <Ionicons name="document-text-outline" size={17} color="#999" style={{ marginTop: 2 }} />
                <TextInput
                  style={[styles.input, { height: 64, textAlignVertical: 'top' }]}
                  placeholder="Need unloading, night delivery, premium brand, urgent..."
                  placeholderTextColor="#AAAAAA"
                  value={form.notes}
                  onChangeText={(v) => updateField('notes', v)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
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
          <View style={styles.ctaNote}>
            <Ionicons name="checkmark-circle" size={14} color="#FEB623" />
            <Text style={styles.ctaNoteText}>
              Sales Executive will contact you within 15–30 minutes.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={unitPickerOpen} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setUnitPickerOpen(false)}
          style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Unit</Text>
            {availableUnits.map((unit) => (
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
    padding: 16,
    marginBottom: 14,
  },
  heroIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#1A1A1A',
    opacity: 0.75,
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 7,
  },
  required: { color: '#FF3B30' },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4D1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 7,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },
  inputWrapperFocused: {
    borderColor: '#FEB623',
    backgroundColor: '#FFFBF0',
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    padding: 0,
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
  },
  unitPickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  locationSection: {
    gap: 10,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: '#F8F8F8',
  },
  locationBtnActive: {
    backgroundColor: '#FFF4D1',
    borderColor: '#FEB623',
  },
  locationBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  locationBtnTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  orText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
  },
  enterCityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: '#F8F8F8',
  },
  enterCityBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detectedCity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  detectedCityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
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
  ctaNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  ctaNoteText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
