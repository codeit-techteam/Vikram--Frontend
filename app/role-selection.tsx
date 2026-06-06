import { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { PrimaryButton } from '@components/PrimaryButton';
import { RoleCard } from '@components/RoleCard';
import { images } from '@constants/images';
import type { StringKey } from '@constants/strings';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useAuthStore, type UserRole } from '@store/useAuthStore';

const ROLE_CONFIG: {
  role: UserRole;
  titleKey: StringKey;
  subtitleKey: StringKey;
  imageUrl: string;
  icon: 'home-outline' | 'people-outline' | 'color-palette-outline' | 'construct-outline';
}[] = [
  {
    role: 'individual',
    titleKey: 'roleIndividual',
    subtitleKey: 'roleIndividualDesc',
    imageUrl: images.roleIndividual,
    icon: 'home-outline',
  },
  {
    role: 'contractor',
    titleKey: 'roleContractor',
    subtitleKey: 'roleContractorDesc',
    imageUrl: images.roleContractor,
    icon: 'people-outline',
  },
  {
    role: 'interior_designer',
    titleKey: 'roleInterior',
    subtitleKey: 'roleInteriorDesc',
    imageUrl: images.roleInterior,
    icon: 'color-palette-outline',
  },
  {
    role: 'builder_developer',
    titleKey: 'roleBuilder',
    subtitleKey: 'roleBuilderDesc',
    imageUrl: images.roleBuilder,
    icon: 'construct-outline',
  },
];

export default function RoleSelectionScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const selectedRole = useAuthStore((s) => s.selectedRole);
  const setSelectedRole = useAuthStore((s) => s.setSelectedRole);

  const roles = useMemo(
    () =>
      ROLE_CONFIG.map((role) => ({
        ...role,
        title: t(role.titleKey),
        subtitle: t(role.subtitleKey),
      })),
    [language, t],
  );

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push('/complete-profile');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      <View className="mb-4 px-5 pt-2">
        <BrandLogo size="sm" />
      </View>

      <View className="mt-6 items-center px-5">
        <Text className="text-2xl font-bold text-text">{t('selectRole')}</Text>
        <Text className="mt-1 text-sm text-text-secondary">{t('personalizeExperience')}</Text>
      </View>

      <ScrollView
        className="mt-6 flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          <View className="flex-row gap-3">
            <RoleCard
              {...roles[0]}
              selected={selectedRole === roles[0].role}
              onSelect={setSelectedRole}
            />
            <RoleCard
              {...roles[1]}
              selected={selectedRole === roles[1].role}
              onSelect={setSelectedRole}
            />
          </View>
          <View className="flex-row gap-3">
            <RoleCard
              {...roles[2]}
              selected={selectedRole === roles[2].role}
              onSelect={setSelectedRole}
            />
            <RoleCard
              {...roles[3]}
              selected={selectedRole === roles[3].role}
              onSelect={setSelectedRole}
            />
          </View>
        </View>
      </ScrollView>

      <View className="px-5 pb-2 pt-4">
        <PrimaryButton
          title={t('continueBtn')}
          onPress={handleContinue}
          disabled={!selectedRole}
        />
      </View>
    </SafeAreaView>
  );
}
