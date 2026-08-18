import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import {
  getCategoryIcon,
  getDefaultUnit,
  getUnitsForSlug,
  isBricksSlug,
  isRmcSlug,
  MIXED_LOAD_SLUG,
} from '@constants/bulkEnquiry';
import { normalizeUnitLabel } from '@utils/units';
import { useSites } from '@hooks/useSites';
import {
  bulkApi,
  type BulkDeliveryRequirement,
  type BulkFormConfig,
  type BulkPreferredContact,
  type CreateBulkEnquiryPayload,
} from '@services/bulk.api';
import { LocationService } from '@services/LocationService';
import { SITE_TYPE_OPTIONS } from '@services/sites.api';
import { useBulkEnquiryStore } from '@store/bulkEnquiryStore';
import { useAuthStore } from '@store/useAuthStore';
import { useUserStore } from '@store/userStore';
import { requireAuth } from '@utils/requireAuth';
import { showToast } from '@utils/toast';

const DRAFT_KEY = 'bulk-enquiry-draft';
const NOTES_MAX = 1000;

type LocationSource = 'saved' | 'gps' | 'manual' | null;

type QuantityLine = { quantity: string; unit: string };

type FormState = {
  selectedSlugs: string[];
  isMixedMode: boolean;
  productType: string;
  grade: string;
  materialTypeLabel: string;
  quantityBySlug: Record<string, QuantityLine>;
  contactPhone: string;
  contactEmail: string;
  location: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  addressId: string | null;
  locationSource: LocationSource;
  deliveryRequirement: BulkDeliveryRequirement | '';
  preferredContact: BulkPreferredContact;
  notes: string;
  projectName: string;
  siteType: string;
  expectedStartDate: string;
  companyName: string;
  showProjectDetails: boolean;
};

type FormErrors = Partial<
  Record<
    | 'materials'
    | 'productType'
    | 'quantity'
    | 'contactPhone'
    | 'contactEmail'
    | 'location'
    | 'deliveryRequirement'
    | 'notes',
    string
  >
> & {
  quantityBySlug?: Record<string, string>;
};

const EMPTY_FORM: FormState = {
  selectedSlugs: [],
  isMixedMode: false,
  productType: '',
  grade: '',
  materialTypeLabel: '',
  quantityBySlug: {},
  contactPhone: '',
  contactEmail: '',
  location: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  latitude: null,
  longitude: null,
  addressId: null,
  locationSource: null,
  deliveryRequirement: '',
  preferredContact: 'CALL',
  notes: '',
  projectName: '',
  siteType: '',
  expectedStartDate: '',
  companyName: '',
  showProjectDetails: false,
};

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function SectionLabel({
  icon,
  text,
  step,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  step?: number;
}) {
  return (
    <View style={sectionStyles.container}>
      {step != null ? (
        <View style={sectionStyles.stepBadge}>
          <Text style={sectionStyles.stepText}>{step}</Text>
        </View>
      ) : (
        <View style={sectionStyles.iconBox}>
          <Ionicons name={icon} size={15} color="#FEB623" />
        </View>
      )}
      <Text style={sectionStyles.text}>{text}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#1A2332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FEB623',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
});

function draftPayload(form: FormState) {
  return {
    selectedSlugs: form.selectedSlugs,
    isMixedMode: form.isMixedMode,
    productType: form.productType,
    grade: form.grade,
    materialTypeLabel: form.materialTypeLabel,
    quantityBySlug: form.quantityBySlug,
    contactPhone: form.contactPhone,
    contactEmail: form.contactEmail,
    location: form.location,
    addressLine: form.addressLine,
    city: form.city,
    state: form.state,
    pincode: form.pincode,
    latitude: form.latitude,
    longitude: form.longitude,
    addressId: form.addressId,
    locationSource: form.locationSource,
    deliveryRequirement: form.deliveryRequirement,
    preferredContact: form.preferredContact,
    notes: form.notes,
    projectName: form.projectName,
    siteType: form.siteType,
    expectedStartDate: form.expectedStartDate,
    companyName: form.companyName,
    showProjectDetails: form.showProjectDetails,
  };
}

export default function BulkEnquiryScreen() {
  const user = useUserStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isGuest = useAuthStore((s) => s.isGuest);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const submitEnquiry = useBulkEnquiryStore((s) => s.submitEnquiry);
  const storeSubmitting = useBulkEnquiryStore((s) => s.isSubmitting);

  const { data: sites = [] } = useSites(isLoggedIn && !isGuest);

  const [formConfig, setFormConfig] = useState<BulkFormConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [unitPickerSlug, setUnitPickerSlug] = useState<string | null>(null);
  const [addressMode, setAddressMode] = useState(false);
  const [locating, setLocating] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [draftChecked, setDraftChecked] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextDraftSave = useRef(false);

  const categories = formConfig?.categories ?? [];
  const deliveryOptions = formConfig?.deliveryRequirements ?? [];
  const contactOptions = useMemo(
    () =>
      (formConfig?.preferredContacts ?? []).filter(
        (option) => option.value !== 'BOTH',
      ),
    [formConfig?.preferredContacts],
  );
  const brickTypes = formConfig?.brickProductTypes ?? [];
  const brickGrades = formConfig?.brickGrades ?? [];

  const materialSlugs = useMemo(
    () => form.selectedSlugs.filter((s) => s !== MIXED_LOAD_SLUG),
    [form.selectedSlugs],
  );

  const bricksSelected = useMemo(
    () => materialSlugs.some((s) => isBricksSlug(s)),
    [materialSlugs],
  );
  const rmcSelected = useMemo(
    () => materialSlugs.some((s) => isRmcSlug(s)),
    [materialSlugs],
  );

  const availableUnits = useMemo(
    () =>
      unitPickerSlug
        ? getUnitsForSlug(unitPickerSlug, formConfig?.units ?? [])
        : [],
    [unitPickerSlug, formConfig?.units],
  );

  const selectedCategoryNames = useMemo(() => {
    return form.selectedSlugs
      .map((slug) => categories.find((c) => c.slug === slug)?.name ?? slug)
      .filter(Boolean);
  }, [form.selectedSlugs, categories]);

  const profileIncomplete = !user.name?.trim();
  const isBusy = submitting || storeSubmitting;

  useEffect(() => {
    const ok = requireAuth('Please log in to submit a bulk enquiry.');
    setAuthChecked(true);
    if (!ok) return;

    void (async () => {
      try {
        await refreshProfile();
      } catch {
        // Profile refresh is best-effort; form still usable with cached user.
      }
    })();
  }, [refreshProfile]);

  useEffect(() => {
    if (!isLoggedIn || isGuest) return;

    let cancelled = false;
    setConfigLoading(true);
    void bulkApi
      .getFormConfig()
      .then((config) => {
        if (!cancelled) setFormConfig(config);
      })
      .catch(() => {
        if (!cancelled) {
          showToast('Could not load enquiry form. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isGuest]);

  useEffect(() => {
    if (!isLoggedIn || isGuest || draftChecked) return;

    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (!raw) {
          setDraftChecked(true);
          return;
        }
        const parsed = JSON.parse(raw) as Partial<FormState>;
        Alert.alert(
          'Restore draft?',
          'You have an unsaved bulk enquiry draft. Restore it?',
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                void AsyncStorage.removeItem(DRAFT_KEY);
                setDraftChecked(true);
              },
            },
            {
              text: 'Restore',
              onPress: () => {
                skipNextDraftSave.current = true;
                const parsedForm = parsed as Partial<FormState> & {
                  quantity?: string;
                  unit?: string;
                  preferredContact?: string;
                };
                const restored: Partial<FormState> = { ...parsedForm };
                if (
                  !parsedForm.quantityBySlug &&
                  (parsedForm.quantity || parsedForm.unit)
                ) {
                  const slugs = (parsedForm.selectedSlugs ?? []).filter(
                    (s) => s !== MIXED_LOAD_SLUG,
                  );
                  restored.quantityBySlug = Object.fromEntries(
                    slugs.map((slug) => [
                      slug,
                      {
                        quantity: parsedForm.quantity ?? '',
                        unit: parsedForm.unit ?? '',
                      },
                    ]),
                  );
                }
                if (parsedForm.preferredContact === 'BOTH') {
                  restored.preferredContact = 'CALL';
                }
                setForm((prev) => ({ ...prev, ...restored }));
                if (
                  parsed.locationSource === 'manual' ||
                  parsed.addressLine ||
                  parsed.city
                ) {
                  setAddressMode(true);
                }
                setDraftChecked(true);
              },
            },
          ],
        );
      } catch {
        setDraftChecked(true);
      }
    })();
  }, [isLoggedIn, isGuest, draftChecked]);

  useEffect(() => {
    if (!draftChecked || skipNextDraftSave.current) {
      skipNextDraftSave.current = false;
      return;
    }
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      void AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload(form)));
    }, 500);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [form, draftChecked]);

  useEffect(() => {
    setForm((prev) => {
      const fallbackUnits = formConfig?.units ?? [];
      const next: Record<string, QuantityLine> = { ...prev.quantityBySlug };
      let changed = false;

      for (const slug of materialSlugs) {
        const units = getUnitsForSlug(slug, fallbackUnits);
        const current = next[slug] ?? { quantity: '', unit: '' };
        const nextUnit = units.includes(current.unit)
          ? current.unit
          : (getDefaultUnit([slug], fallbackUnits) ?? units[0] ?? '');
        if (!next[slug] || next[slug].unit !== nextUnit) {
          next[slug] = { ...current, unit: nextUnit };
          changed = true;
        }
      }

      for (const slug of Object.keys(next)) {
        if (!materialSlugs.includes(slug)) {
          delete next[slug];
          changed = true;
        }
      }

      return changed ? { ...prev, quantityBySlug: next } : prev;
    });
  }, [materialSlugs, formConfig?.units]);

  useEffect(() => {
    if (user.company && !form.companyName) {
      setForm((prev) => ({ ...prev, companyName: user.company }));
    }
  }, [user.company, form.companyName]);

  useEffect(() => {
    setForm((prev) => {
      const nextPhone =
        prev.contactPhone.trim() || normalizePhoneDigits(user.phone ?? '');
      const nextEmail = prev.contactEmail.trim() || (user.email ?? '').trim();
      if (nextPhone === prev.contactPhone && nextEmail === prev.contactEmail) {
        return prev;
      }
      return {
        ...prev,
        contactPhone: nextPhone,
        contactEmail: nextEmail,
      };
    });
  }, [user.phone, user.email]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const updateQuantityLine = (slug: string, patch: Partial<QuantityLine>) => {
    setForm((prev) => ({
      ...prev,
      quantityBySlug: {
        ...prev.quantityBySlug,
        [slug]: {
          ...(prev.quantityBySlug[slug] ?? { quantity: '', unit: '' }),
          ...patch,
        },
      },
    }));
    if (errors.quantity || errors.quantityBySlug?.[slug]) {
      setErrors((prev) => {
        const nextBySlug = { ...(prev.quantityBySlug ?? {}) };
        delete nextBySlug[slug];
        return {
          ...prev,
          quantity: Object.keys(nextBySlug).length ? prev.quantity : undefined,
          quantityBySlug: nextBySlug,
        };
      });
    }
  };

  const toggleCategory = (slug: string) => {
    void Haptics.selectionAsync();
    setForm((prev) => {
      if (slug === MIXED_LOAD_SLUG) {
        const enabling = !prev.selectedSlugs.includes(MIXED_LOAD_SLUG);
        if (enabling) {
          return {
            ...prev,
            isMixedMode: true,
            selectedSlugs: Array.from(
              new Set([
                ...prev.selectedSlugs.filter((s) => s !== MIXED_LOAD_SLUG),
                MIXED_LOAD_SLUG,
              ]),
            ),
          };
        }
        const remaining = prev.selectedSlugs.filter((s) => s !== MIXED_LOAD_SLUG);
        return {
          ...prev,
          isMixedMode: remaining.length > 1,
          selectedSlugs: remaining,
        };
      }

      const withoutMixed = prev.selectedSlugs.filter((s) => s !== MIXED_LOAD_SLUG);
      const nextMaterials = withoutMixed.includes(slug)
        ? withoutMixed.filter((s) => s !== slug)
        : [...withoutMixed, slug];
      const keepMixedChip = prev.selectedSlugs.includes(MIXED_LOAD_SLUG);
      const isMixedMode = keepMixedChip || nextMaterials.length > 1;
      const fallbackUnits = formConfig?.units ?? [];
      const quantityBySlug: Record<string, QuantityLine> = {};
      for (const materialSlug of nextMaterials) {
        const existing = prev.quantityBySlug[materialSlug];
        const units = getUnitsForSlug(materialSlug, fallbackUnits);
        quantityBySlug[materialSlug] = {
          quantity: existing?.quantity ?? '',
          unit:
            existing?.unit && units.includes(existing.unit)
              ? existing.unit
              : (getDefaultUnit([materialSlug], fallbackUnits) ??
                units[0] ??
                ''),
        };
      }

      return {
        ...prev,
        isMixedMode,
        selectedSlugs: keepMixedChip
          ? [MIXED_LOAD_SLUG, ...nextMaterials]
          : nextMaterials,
        quantityBySlug,
        productType: nextMaterials.some((s) => isBricksSlug(s))
          ? prev.productType
          : '',
        grade: nextMaterials.some((s) => isBricksSlug(s)) ? prev.grade : '',
        materialTypeLabel: nextMaterials.some((s) => isRmcSlug(s))
          ? prev.materialTypeLabel
          : '',
      };
    });
    if (errors.materials) {
      setErrors((prev) => ({ ...prev, materials: undefined }));
    }
  };

  const selectSavedSite = (siteId: string) => {
    void Haptics.selectionAsync();
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;
    setAddressMode(false);
    setForm((prev) => ({
      ...prev,
      // Delivery sites are not Address rows — send location fields only (no addressId).
      addressId: null,
      locationSource: 'saved',
      location: [site.fullAddress, site.city, site.state, site.pincode]
        .filter(Boolean)
        .join(', '),
      addressLine: site.fullAddress,
      city: site.city,
      state: site.state,
      pincode: site.pincode,
      latitude: site.latitude,
      longitude: site.longitude,
      siteType: site.siteType ?? prev.siteType,
    }));
    setErrors((prev) => ({ ...prev, location: undefined }));
  };

  const useCurrentLocation = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocating(true);
    setAddressMode(false);

    try {
      const addr = await LocationService.fetchCurrentAddress();
      setForm((prev) => ({
        ...prev,
        addressId: null,
        locationSource: 'gps',
        location: addr.fullAddress || [addr.city, addr.state, addr.pincode].filter(Boolean).join(', '),
        addressLine: addr.fullAddress,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        latitude: addr.latitude,
        longitude: addr.longitude,
      }));
      setErrors((prev) => ({ ...prev, location: undefined }));
    } catch (error) {
      const denied =
        error instanceof Error && error.message === 'LOCATION_PERMISSION_DENIED';
      setErrors((prev) => ({
        ...prev,
        location: denied
          ? 'Location permission denied. Enter address manually.'
          : 'Could not detect location. Enter address manually.',
      }));
      setAddressMode(true);
      setForm((prev) => ({
        ...prev,
        locationSource: 'manual',
        addressId: null,
      }));
    } finally {
      setLocating(false);
    }
  }, []);

  const openManualAddress = () => {
    void Haptics.selectionAsync();
    setAddressMode(true);
    setForm((prev) => ({
      ...prev,
      locationSource: 'manual',
      addressId: null,
      latitude: null,
      longitude: null,
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const materials = form.selectedSlugs.filter((s) => s !== MIXED_LOAD_SLUG);

    if (materials.length === 0) {
      newErrors.materials = form.isMixedMode
        ? 'Select at least one material for mixed load'
        : 'Select at least one material category';
    }

    if (bricksSelected && !form.productType.trim()) {
      newErrors.productType = 'Brick type is required';
    }

    const quantityBySlug: Record<string, string> = {};
    for (const slug of materials) {
      const line = form.quantityBySlug[slug];
      const qty = Number(line?.quantity);
      if (!line?.quantity?.trim() || !Number.isFinite(qty) || qty <= 0) {
        quantityBySlug[slug] = 'Enter a quantity greater than 0';
      } else if (!line.unit?.trim()) {
        quantityBySlug[slug] = 'Select a unit';
      }
    }
    if (Object.keys(quantityBySlug).length > 0) {
      newErrors.quantity = 'Enter quantity and unit for each selected material';
      newErrors.quantityBySlug = quantityBySlug;
    }

    const phone = normalizePhoneDigits(form.contactPhone);
    if (!phone || phone.length !== 10) {
      newErrors.contactPhone = 'Enter a valid 10-digit mobile number';
    }

    if (!form.contactEmail.trim()) {
      newErrors.contactEmail = 'Email is required';
    } else if (!isValidEmail(form.contactEmail)) {
      newErrors.contactEmail = 'Enter a valid email address';
    }

    const locationText =
      form.location.trim() ||
      [form.addressLine, form.city, form.state, form.pincode]
        .filter(Boolean)
        .join(', ')
        .trim();
    if (!locationText) newErrors.location = 'Delivery location is required';

    if (!form.deliveryRequirement) {
      newErrors.deliveryRequirement = 'Select delivery requirement';
    }

    if (form.notes.length > NOTES_MAX) {
      newErrors.notes = `Notes must be under ${NOTES_MAX} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): CreateBulkEnquiryPayload => {
    const materials = form.selectedSlugs.filter((s) => s !== MIXED_LOAD_SLUG);
    const location =
      form.location.trim() ||
      [form.addressLine, form.city, form.state, form.pincode]
        .filter(Boolean)
        .join(', ');
    const isMixed =
      form.isMixedMode ||
      materials.length > 1 ||
      form.selectedSlugs.includes(MIXED_LOAD_SLUG);

    const materialQuantities = materials.map((slug) => {
      const line = form.quantityBySlug[slug];
      const unit = normalizeUnitLabel(line?.unit) || line?.unit || '';
      return {
        slug,
        quantity: Number(line?.quantity),
        unit,
      };
    });
    const firstLine = materialQuantities[0];

    const payload: CreateBulkEnquiryPayload = {
      estimatedQuantity: firstLine?.quantity ?? 0,
      unit: firstLine?.unit || 'Bags',
      materialQuantities,
      deliveryRequirement: form.deliveryRequirement as BulkDeliveryRequirement,
      location,
      preferredContact: form.preferredContact,
      contactPhone: normalizePhoneDigits(form.contactPhone),
      contactEmail: form.contactEmail.trim(),
    };

    if (isMixed) {
      payload.isMixedLoad = true;
      payload.materialCategorySlugs = materials;
    } else if (materials[0]) {
      payload.materialCategorySlug = materials[0];
    }

    if (bricksSelected) {
      payload.productType = form.productType;
      if (form.grade) payload.grade = form.grade;
    }
    if (rmcSelected && form.materialTypeLabel.trim()) {
      payload.materialTypeLabel = form.materialTypeLabel.trim();
    }
    if (form.addressLine.trim()) payload.addressLine = form.addressLine.trim();
    if (form.city.trim()) payload.city = form.city.trim();
    if (form.state.trim()) payload.state = form.state.trim();
    if (form.pincode.trim()) payload.pincode = form.pincode.trim();
    if (form.latitude != null) payload.latitude = form.latitude;
    if (form.longitude != null) payload.longitude = form.longitude;
    if (form.addressId) payload.addressId = form.addressId;
    if (form.notes.trim()) payload.additionalNotes = form.notes.trim().slice(0, NOTES_MAX);
    if (form.projectName.trim()) payload.projectName = form.projectName.trim();
    if (form.siteType.trim()) payload.siteType = form.siteType.trim();
    if (form.expectedStartDate.trim()) {
      payload.expectedStartDate = form.expectedStartDate.trim();
    }
    if (form.companyName.trim() || user.company) {
      payload.companyName = (form.companyName || user.company).trim();
    }

    return payload;
  };

  const handleSubmit = () => {
    if (isBusy) return;
    if (!requireAuth('Please log in to submit a bulk enquiry.')) return;

    if (!validate()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Please fix the highlighted fields');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    void (async () => {
      try {
        const created = await submitEnquiry(buildPayload());
        await AsyncStorage.removeItem(DRAFT_KEY);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(
          `/bulk-procurement/enquiry-success?enquiryNumber=${encodeURIComponent(created.enquiryNumber)}` as Href,
        );
      } catch (error) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(
          error instanceof Error ? error.message : 'Failed to submit enquiry',
        );
      } finally {
        setSubmitting(false);
      }
    })();
  };

  if (!authChecked || (!isLoggedIn || isGuest)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F7' }} edges={['top']}>
        <BackHeader title="Bulk Enquiry" backgroundColor="#F3F4F7" />
        <View style={styles.gatedState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="lock-closed-outline" size={28} color="#FEB623" />
          </View>
          <Text style={styles.emptyTitle}>Login required</Text>
          <Text style={styles.emptySubtitle}>
            Please log in to submit a bulk procurement enquiry.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F7' }} edges={['top']}>
      <BackHeader title="Bulk Enquiry" backgroundColor="#F3F4F7" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        {configLoading ? (
          <View style={styles.gatedState}>
            <ActivityIndicator size="large" color="#FEB623" />
            <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
              Loading form…
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 148 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <LinearGradient
                colors={['#1A2332', '#243044']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBanner}>
                <View style={styles.heroGlow} />
                <View style={styles.heroIconCircle}>
                  <Ionicons name="cube" size={18} color="#1A1A1A" />
                </View>
                <Text style={styles.heroTitle}>Get a Custom Bulk Quote</Text>
                <Text style={styles.heroSubtitle}>
                  Tell us what you need — our procurement team will contact you shortly
                  with the best pricing.
                </Text>
                <View style={styles.heroPills}>
                  <View style={styles.heroPill}>
                    <Ionicons name="flash" size={11} color="#FEB623" />
                    <Text style={styles.heroPillText}>Fast response</Text>
                  </View>
                  <View style={styles.heroPill}>
                    <Ionicons name="pricetag" size={11} color="#FEB623" />
                    <Text style={styles.heroPillText}>Custom pricing</Text>
                  </View>
                  <View style={styles.heroPill}>
                    <Ionicons name="people" size={11} color="#FEB623" />
                    <Text style={styles.heroPillText}>Dedicated team</Text>
                  </View>
                </View>
              </LinearGradient>

              {profileIncomplete ? (
                <TouchableOpacity
                  style={styles.profilePrompt}
                  onPress={() => router.push('/account/edit-profile' as Href)}
                  activeOpacity={0.85}>
                  <Ionicons name="person-circle-outline" size={20} color="#1A1A1A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profilePromptTitle}>Complete your profile</Text>
                    <Text style={styles.profilePromptText}>
                      Add your name so our team can address you properly.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#888" />
                </TouchableOpacity>
              ) : null}

              <View style={styles.formCard}>
                <SectionLabel icon="layers-outline" text="Tell us what you need" step={1} />

                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>
                    Material Category <Text style={styles.required}>*</Text>
                  </Text>
                  {materialSlugs.length > 0 ? (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={11} color="#1A1A1A" />
                      <Text style={styles.selectedBadgeText}>
                        {materialSlugs.length === 1
                          ? '1 selected'
                          : `${materialSlugs.length} selected`}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.hintText}>
                  Select one or more materials (e.g. Bricks + Cement). Enter
                  quantity and unit for each selected material.
                </Text>

                <View style={styles.chipRow}>
                  {categories.map((material) => {
                    const selected = form.selectedSlugs.includes(material.slug);
                    const icon = getCategoryIcon(material.slug);
                    return (
                      <TouchableOpacity
                        key={material.id}
                        onPress={() => toggleCategory(material.slug)}
                        style={[styles.materialChip, selected && styles.materialChipActive]}
                        activeOpacity={0.8}>
                        <View
                          style={[
                            styles.materialIcon,
                            selected && styles.materialIconActive,
                          ]}>
                          <Ionicons
                            name={icon}
                            size={14}
                            color={selected ? '#1A1A1A' : '#6B7280'}
                          />
                        </View>
                        <Text
                          style={[
                            styles.materialChipText,
                            selected && styles.materialChipTextActive,
                          ]}>
                          {material.name}
                        </Text>
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={16} color="#1A1A1A" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.materials ? (
                  <Text style={styles.errorText}>{errors.materials}</Text>
                ) : null}

                {bricksSelected ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.fieldLabel}>
                      Brick Type <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.chipRow}>
                      {brickTypes.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => {
                            void Haptics.selectionAsync();
                            updateField('productType', opt.value);
                          }}
                          style={[
                            styles.chip,
                            form.productType === opt.value && styles.chipActive,
                          ]}>
                          <Text
                            style={[
                              styles.chipText,
                              form.productType === opt.value && styles.chipTextActive,
                            ]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {errors.productType ? (
                      <Text style={styles.errorText}>{errors.productType}</Text>
                    ) : null}

                    {brickGrades.length > 0 ? (
                      <>
                        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                          Grade (optional)
                        </Text>
                        <View style={styles.chipRow}>
                          {brickGrades.map((opt) => (
                            <TouchableOpacity
                              key={opt.value}
                              onPress={() => {
                                void Haptics.selectionAsync();
                                updateField(
                                  'grade',
                                  form.grade === opt.value ? '' : opt.value,
                                );
                              }}
                              style={[
                                styles.chip,
                                form.grade === opt.value && styles.chipActive,
                              ]}>
                              <Text
                                style={[
                                  styles.chipText,
                                  form.grade === opt.value && styles.chipTextActive,
                                ]}>
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    ) : null}
                  </View>
                ) : null}

                {rmcSelected ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.fieldLabel}>Material type (optional)</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="construct-outline" size={17} color="#999" />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. M20, M25"
                        placeholderTextColor="#AAAAAA"
                        value={form.materialTypeLabel}
                        onChangeText={(v) => updateField('materialTypeLabel', v)}
                      />
                    </View>
                  </View>
                ) : null}

                {materialSlugs.length > 0 ? (
                  <View style={{ marginTop: 14, gap: 12 }}>
                    {materialSlugs.map((slug) => {
                      const category =
                        categories.find((c) => c.slug === slug)?.name ?? slug;
                      const line = form.quantityBySlug[slug] ?? {
                        quantity: '',
                        unit: '',
                      };
                      const units = getUnitsForSlug(slug, formConfig?.units ?? []);
                      const lineError = errors.quantityBySlug?.[slug];
                      const unitLabel =
                        units.length > 1 && !line.unit
                          ? 'Select Unit'
                          : line.unit || 'Unit';
                      return (
                        <View key={slug}>
                          <Text style={styles.fieldLabel}>
                            {category} quantity{' '}
                            <Text style={styles.required}>*</Text>
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                              <View
                                style={[
                                  styles.inputWrapper,
                                  lineError && styles.inputWrapperError,
                                ]}>
                                <Ionicons
                                  name="calculator-outline"
                                  size={17}
                                  color="#999"
                                />
                                <TextInput
                                  style={styles.input}
                                  placeholder="Enter quantity"
                                  placeholderTextColor="#AAAAAA"
                                  value={line.quantity}
                                  onChangeText={(v) =>
                                    updateQuantityLine(slug, {
                                      quantity: v.replace(/[^\d.]/g, ''),
                                    })
                                  }
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>
                            <View style={{ width: 118 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  if (units.length === 0) return;
                                  void Haptics.selectionAsync();
                                  setUnitPickerSlug(slug);
                                }}
                                disabled={units.length === 0}
                                style={[
                                  styles.unitPicker,
                                  units.length === 0 && { opacity: 0.5 },
                                  lineError &&
                                    !line.unit &&
                                    styles.inputWrapperError,
                                ]}>
                                <Text
                                  style={[
                                    styles.unitPickerText,
                                    !line.unit &&
                                      units.length > 1 && { color: '#888' },
                                  ]}
                                  numberOfLines={1}>
                                  {units.length === 0 ? 'Unit' : unitLabel}
                                </Text>
                                <Ionicons
                                  name="chevron-down"
                                  size={16}
                                  color="#888"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                          {lineError ? (
                            <Text style={styles.errorText}>{lineError}</Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                {errors.quantity && materialSlugs.length === 0 ? (
                  <Text style={styles.errorText}>{errors.quantity}</Text>
                ) : null}

              </View>

              <View style={styles.formCard}>
                <SectionLabel icon="call-outline" text="Your contact details" step={2} />

                <Text style={styles.fieldLabel}>
                  Mobile Number <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.contactPhone && styles.inputWrapperError,
                  ]}>
                  <Ionicons name="phone-portrait-outline" size={17} color="#999" />
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#AAAAAA"
                    value={form.contactPhone}
                    onChangeText={(v) =>
                      updateField('contactPhone', normalizePhoneDigits(v))
                    }
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                {errors.contactPhone ? (
                  <Text style={styles.errorText}>{errors.contactPhone}</Text>
                ) : null}

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.contactEmail && styles.inputWrapperError,
                  ]}>
                  <Ionicons name="mail-outline" size={17} color="#999" />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#AAAAAA"
                    value={form.contactEmail}
                    onChangeText={(v) => updateField('contactEmail', v.trimStart())}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.contactEmail ? (
                  <Text style={styles.errorText}>{errors.contactEmail}</Text>
                ) : null}

              </View>

              <View style={styles.formCard}>
                <SectionLabel icon="location-outline" text="Delivery location" step={3} />

                {sites.length > 0 ? (
                  <View style={{ marginBottom: 10, gap: 8 }}>
                    <Text style={styles.fieldLabel}>Saved addresses</Text>
                    {sites.map((site) => {
                      const selected =
                        form.locationSource === 'saved' &&
                        form.addressLine === site.fullAddress &&
                        form.city === site.city;
                      return (
                        <TouchableOpacity
                          key={site.id}
                          onPress={() => selectSavedSite(site.id)}
                          style={[
                            styles.savedSite,
                            selected && styles.savedSiteActive,
                          ]}
                          activeOpacity={0.85}>
                          <Ionicons
                            name={selected ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={selected ? '#FEB623' : '#AAA'}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.savedSiteName}>{site.siteName}</Text>
                            <Text style={styles.savedSiteAddress} numberOfLines={2}>
                              {[site.fullAddress, site.city].filter(Boolean).join(', ')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

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

                  {!addressMode && form.locationSource !== 'manual' ? (
                    <TouchableOpacity
                      onPress={openManualAddress}
                      style={styles.enterCityBtn}>
                      <Ionicons name="map-outline" size={16} color="#666" />
                      <Text style={styles.enterCityBtnText}>Enter Address</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ gap: 8 }}>
                      <View
                        style={[
                          styles.inputWrapper,
                          errors.location && styles.inputWrapperError,
                        ]}>
                        <Ionicons name="home-outline" size={17} color="#999" />
                        <TextInput
                          style={styles.input}
                          placeholder="Address line"
                          placeholderTextColor="#AAAAAA"
                          value={form.addressLine}
                          onChangeText={(v) => {
                            updateField('addressLine', v);
                            updateField(
                              'location',
                              [v, form.city, form.state, form.pincode]
                                .filter(Boolean)
                                .join(', '),
                            );
                            updateField('locationSource', 'manual');
                            updateField('addressId', null);
                          }}
                        />
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={[styles.inputWrapper, { flex: 1 }]}>
                          <TextInput
                            style={styles.input}
                            placeholder="City"
                            placeholderTextColor="#AAAAAA"
                            value={form.city}
                            onChangeText={(v) => {
                              updateField('city', v);
                              updateField(
                                'location',
                                [form.addressLine, v, form.state, form.pincode]
                                  .filter(Boolean)
                                  .join(', '),
                              );
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                        <View style={[styles.inputWrapper, { flex: 1 }]}>
                          <TextInput
                            style={styles.input}
                            placeholder="State"
                            placeholderTextColor="#AAAAAA"
                            value={form.state}
                            onChangeText={(v) => {
                              updateField('state', v);
                              updateField(
                                'location',
                                [form.addressLine, form.city, v, form.pincode]
                                  .filter(Boolean)
                                  .join(', '),
                              );
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                      </View>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Pincode"
                          placeholderTextColor="#AAAAAA"
                          value={form.pincode}
                          onChangeText={(v) => {
                            updateField('pincode', v.replace(/\D/g, '').slice(0, 6));
                            updateField(
                              'location',
                              [
                                form.addressLine,
                                form.city,
                                form.state,
                                v.replace(/\D/g, '').slice(0, 6),
                              ]
                                .filter(Boolean)
                                .join(', '),
                            );
                          }}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                    </View>
                  )}

                  {(form.locationSource === 'gps' || form.locationSource === 'saved') &&
                  form.location ? (
                    <View style={styles.detectedCity}>
                      <Ionicons name="checkmark-circle" size={14} color="#FEB623" />
                      <Text style={styles.detectedCityText}>{form.location}</Text>
                    </View>
                  ) : null}
                </View>
                {errors.location ? (
                  <Text style={styles.errorText}>{errors.location}</Text>
                ) : null}

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                  Delivery Requirement <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.chipRow}>
                  {deliveryOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        updateField(
                          'deliveryRequirement',
                          option.value as BulkDeliveryRequirement,
                        );
                      }}
                      style={[
                        styles.chip,
                        form.deliveryRequirement === option.value && styles.chipActive,
                      ]}
                      activeOpacity={0.8}>
                      <Text
                        style={[
                          styles.chipText,
                          form.deliveryRequirement === option.value &&
                            styles.chipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.deliveryRequirement ? (
                  <Text style={styles.errorText}>{errors.deliveryRequirement}</Text>
                ) : null}

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                  Preferred contact
                </Text>
                <View style={styles.chipRow}>
                  {(contactOptions.length
                    ? contactOptions
                    : [
                        { value: 'CALL', label: 'Call' },
                        { value: 'WHATSAPP', label: 'WhatsApp' },
                      ]
                  ).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        updateField(
                          'preferredContact',
                          option.value as BulkPreferredContact,
                        );
                      }}
                      style={[
                        styles.chip,
                        form.preferredContact === option.value && styles.chipActive,
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          form.preferredContact === option.value &&
                            styles.chipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ marginTop: 14 }}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Additional Notes</Text>
                    <Text style={styles.charCount}>
                      {form.notes.length}/{NOTES_MAX}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      { alignItems: 'flex-start', paddingVertical: 10 },
                      errors.notes && styles.inputWrapperError,
                    ]}>
                    <Ionicons
                      name="document-text-outline"
                      size={17}
                      color="#999"
                      style={{ marginTop: 2 }}
                    />
                    <TextInput
                      style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
                      placeholder="Need unloading, night delivery, premium brand…"
                      placeholderTextColor="#AAAAAA"
                      value={form.notes}
                      onChangeText={(v) => updateField('notes', v.slice(0, NOTES_MAX))}
                      multiline
                      maxLength={NOTES_MAX}
                    />
                  </View>
                  {errors.notes ? (
                    <Text style={styles.errorText}>{errors.notes}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    void Haptics.selectionAsync();
                    updateField('showProjectDetails', !form.showProjectDetails);
                  }}
                  style={styles.projectToggle}
                  activeOpacity={0.8}>
                  <Text style={styles.projectToggleText}>
                    {form.showProjectDetails ? 'Hide' : 'Add'} project details (optional)
                  </Text>
                  <Ionicons
                    name={form.showProjectDetails ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#666"
                  />
                </TouchableOpacity>

                {form.showProjectDetails ? (
                  <View style={{ gap: 10, marginTop: 4 }}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="briefcase-outline" size={17} color="#999" />
                      <TextInput
                        style={styles.input}
                        placeholder="Project name"
                        placeholderTextColor="#AAAAAA"
                        value={form.projectName}
                        onChangeText={(v) => updateField('projectName', v)}
                      />
                    </View>
                    <Text style={styles.fieldLabel}>Site type</Text>
                    <View style={styles.chipRow}>
                      {SITE_TYPE_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => {
                            void Haptics.selectionAsync();
                            updateField(
                              'siteType',
                              form.siteType === opt.value ? '' : opt.value,
                            );
                          }}
                          style={[
                            styles.chip,
                            form.siteType === opt.value && styles.chipActive,
                          ]}>
                          <Text
                            style={[
                              styles.chipText,
                              form.siteType === opt.value && styles.chipTextActive,
                            ]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="calendar-outline" size={17} color="#999" />
                      <TextInput
                        style={styles.input}
                        placeholder="Expected start (YYYY-MM-DD)"
                        placeholderTextColor="#AAAAAA"
                        value={form.expectedStartDate}
                        onChangeText={(v) => updateField('expectedStartDate', v)}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                ) : null}

              </View>

              <View style={styles.formCard}>
                <SectionLabel icon="eye-outline" text="Review" />
                <View style={styles.reviewBox}>
                  <ReviewRow
                    label="Materials"
                    value={
                      selectedCategoryNames.length
                        ? selectedCategoryNames
                            .filter((n) => n.toLowerCase() !== 'mixed load')
                            .join(', ') || selectedCategoryNames.join(', ')
                        : '—'
                    }
                  />
                  <ReviewRow
                    label="Quantity"
                    value={
                      materialSlugs
                        .map((slug) => {
                          const name =
                            categories.find((c) => c.slug === slug)?.name ?? slug;
                          const line = form.quantityBySlug[slug];
                          if (!line?.quantity || !line.unit) return null;
                          return `${name}: ${line.quantity} ${line.unit}`;
                        })
                        .filter(Boolean)
                        .join(', ') || '—'
                    }
                  />
                  <ReviewRow
                    label="Mobile"
                    value={form.contactPhone || '—'}
                  />
                  <ReviewRow
                    label="Email"
                    value={form.contactEmail || '—'}
                  />
                  <ReviewRow label="Location" value={form.location || '—'} />
                  <ReviewRow
                    label="Delivery"
                    value={
                      deliveryOptions.find((d) => d.value === form.deliveryRequirement)
                        ?.label || '—'
                    }
                  />
                  <ReviewRow
                    label="Contact"
                    value={
                      contactOptions.find((c) => c.value === form.preferredContact)
                        ?.label ||
                      (form.preferredContact === 'WHATSAPP' ? 'WhatsApp' : 'Call')
                    }
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.stickyFooter}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isBusy}
                style={[styles.submitBtn, isBusy && { opacity: 0.7 }]}
                activeOpacity={0.85}>
                {isBusy ? (
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
                  Our procurement team will contact you shortly.
                </Text>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      <Modal visible={unitPickerSlug != null} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setUnitPickerSlug(null)}
          style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {unitPickerSlug
                ? `Select unit for ${
                    categories.find((c) => c.slug === unitPickerSlug)?.name ??
                    'material'
                  }`
                : 'Select Unit'}
            </Text>
            {availableUnits.map((unit) => (
              <TouchableOpacity
                key={unit}
                onPress={() => {
                  if (!unitPickerSlug) return;
                  void Haptics.selectionAsync();
                  updateQuantityLine(unitPickerSlug, { unit });
                  setUnitPickerSlug(null);
                }}
                style={[
                  styles.modalOption,
                  form.quantityBySlug[unitPickerSlug ?? '']?.unit === unit &&
                    styles.modalOptionActive,
                ]}>
                <Text
                  style={[
                    styles.modalOptionText,
                    form.quantityBySlug[unitPickerSlug ?? '']?.unit === unit &&
                      styles.modalOptionTextActive,
                  ]}>
                  {unit}
                </Text>
                {form.quantityBySlug[unitPickerSlug ?? '']?.unit === unit ? (
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    backgroundColor: '#1A2332',
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    right: -36,
    top: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(254,182,35,0.14)',
  },
  heroIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 19,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  profilePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8E6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEB623',
  },
  profilePromptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  profilePromptText: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 7,
  },
  required: { color: '#FF3B30' },
  hintText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    lineHeight: 17,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 7,
  },
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
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E6E8EC',
    backgroundColor: '#F7F8FA',
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
  materialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E6E8EC',
    backgroundColor: '#F7F8FA',
  },
  materialChipActive: {
    backgroundColor: '#FEB623',
    borderColor: '#FEB623',
  },
  materialIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialIconActive: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  materialChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  materialChipTextActive: {
    color: '#1A1A1A',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E6E8EC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#FAFBFC',
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
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
    borderColor: '#E6E8EC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#FAFBFC',
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
  savedSite: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E6E8EC',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FAFBFC',
  },
  savedSiteActive: {
    borderColor: '#FEB623',
    backgroundColor: '#FFFBF0',
  },
  savedSiteName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  savedSiteAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E6E8EC',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#FAFBFC',
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
    borderColor: '#E6E8EC',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#FAFBFC',
  },
  enterCityBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detectedCity: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
  },
  detectedCityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  projectToggle: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
  },
  projectToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
  },
  reviewBox: {
    backgroundColor: '#F7F8FA',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FEB623',
  },
  reviewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewLabel: {
    width: 78,
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  reviewValue: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  stickyFooter: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 10 : 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF0F3',
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
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
  gatedState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 14,
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
