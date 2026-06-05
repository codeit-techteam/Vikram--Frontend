import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ScaledPressable } from '@components/ScaledPressable';
import type { DeliverySite } from '@store/useSiteStore';

interface SiteCardProps {
  site: DeliverySite;
  editLabel: string;
  deleteLabel: string;
  onEdit: (site: DeliverySite) => void;
  onDelete: (id: string) => void;
}

export function SiteCard({ site, editLabel, deleteLabel, onEdit, onDelete }: SiteCardProps) {
  return (
    <View className="mb-3 rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-text">{site.name}</Text>
          <Text className="mt-1 text-sm text-text-secondary">{site.address}</Text>
          <Text className="mt-0.5 text-xs text-text-secondary">PIN: {site.pincode}</Text>
        </View>
        <Ionicons name="location" size={20} color="#FF6B00" />
      </View>
      <View className="mt-3 flex-row gap-4">
        <ScaledPressable onPress={() => onEdit(site)}>
          <Text className="text-sm font-medium text-secondary">{editLabel}</Text>
        </ScaledPressable>
        <ScaledPressable onPress={() => onDelete(site.id)}>
          <Text className="text-sm font-medium text-error">{deleteLabel}</Text>
        </ScaledPressable>
      </View>
    </View>
  );
}
