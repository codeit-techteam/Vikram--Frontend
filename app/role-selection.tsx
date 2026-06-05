import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { PrimaryButton } from '@components/PrimaryButton';
import { RoleCard } from '@components/RoleCard';
import { images } from '@constants/images';
import { useAuthStore, type UserRole } from '@store/useAuthStore';

const ROLES: {
  role: UserRole;
  title: string;
  subtitle: string;
  imageUrl: string;
  icon: 'home-outline' | 'people-outline' | 'color-palette-outline' | 'construct-outline';
}[] = [
  {
    role: 'individual',
    title: 'Individual',
    subtitle: 'Order materials for personal or home projects.',
    imageUrl: images.roleIndividual,
    icon: 'home-outline',
  },
  {
    role: 'contractor',
    title: 'Contractor',
    subtitle: 'Manage site logistics, labor, and procurement.',
    imageUrl: images.roleContractor,
    icon: 'people-outline',
  },
  {
    role: 'interior_designer',
    title: 'Interior Designer / Architect',
    subtitle: 'Source premium materials and manage interiors.',
    imageUrl: images.roleInterior,
    icon: 'color-palette-outline',
  },
  {
    role: 'builder_developer',
    title: 'Builder / Developer',
    subtitle: 'Handle large-scale construction and projects.',
    imageUrl: images.roleBuilder,
    icon: 'construct-outline',
  },
];

export default function RoleSelectionScreen() {
  const selectedRole = useAuthStore((s) => s.selectedRole);
  const setSelectedRole = useAuthStore((s) => s.setSelectedRole);

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
        <Text className="text-2xl font-bold text-text">Select Your Role</Text>
        <Text className="mt-1 text-sm text-text-secondary">
          Personalize your BuildPro experience
        </Text>
      </View>

      <ScrollView
        className="mt-6 flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          <View className="flex-row gap-3">
            <RoleCard
              {...ROLES[0]}
              selected={selectedRole === ROLES[0].role}
              onSelect={setSelectedRole}
            />
            <RoleCard
              {...ROLES[1]}
              selected={selectedRole === ROLES[1].role}
              onSelect={setSelectedRole}
            />
          </View>
          <View className="flex-row gap-3">
            <RoleCard
              {...ROLES[2]}
              selected={selectedRole === ROLES[2].role}
              onSelect={setSelectedRole}
            />
            <RoleCard
              {...ROLES[3]}
              selected={selectedRole === ROLES[3].role}
              onSelect={setSelectedRole}
            />
          </View>
        </View>
      </ScrollView>

      <View className="px-5 pb-2 pt-4">
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedRole}
        />
      </View>
    </SafeAreaView>
  );
}
