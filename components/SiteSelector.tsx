import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import type { DeliverySite } from '@store/deliveryStore';

interface SiteSelectorProps {
  sites: DeliverySite[];
  selectedSiteId: string;
  onSelect: (id: string) => void;
}

export function SiteSelector({ sites, selectedSiteId, onSelect }: SiteSelectorProps) {
  return (
    <View className="mt-6 px-5">
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Ionicons name="business" size={16} color="#FFFFFF" />
        </View>
        <Text className="text-base font-bold text-text">Project Site Selection</Text>
      </View>

      {sites.map((site) => {
        const selected = site.id === selectedSiteId;
        return (
          <ScaledPressable
            key={site.id}
            onPress={() => onSelect(site.id)}
            className={`mb-3 rounded-card border-2 p-4 ${
              selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
            }`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className={`text-base font-bold ${selected ? 'text-primary' : 'text-text'}`}>
                  {site.name}
                </Text>
                <Text className="mt-0.5 text-sm text-text-secondary">{site.address}</Text>
              </View>
              <View
                className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-primary bg-primary' : 'border-border'
                }`}>
                {selected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
            </View>
          </ScaledPressable>
        );
      })}
    </View>
  );
}
