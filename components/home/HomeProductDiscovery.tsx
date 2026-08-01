import { memo, useEffect, useState } from 'react';
import { InteractionManager, View } from 'react-native';

import { HomeProductSection } from '@components/home/HomeProductSection';
import { useHomeProducts } from '@hooks/useHomeProducts';
import { useTranslation } from '@store/languageStore';

interface HomeProductDiscoveryProps {
  /** When true, only Featured mounts immediately; secondary rails wait for idle. */
  deferSecondary?: boolean;
}

function HomeProductDiscoveryComponent({
  deferSecondary = true,
}: HomeProductDiscoveryProps) {
  const { t } = useTranslation();
  const {
    featured,
    offers,
    recentlyAdded,
    isLoading,
  } = useHomeProducts();

  const [showSecondary, setShowSecondary] = useState(!deferSecondary);

  useEffect(() => {
    if (!deferSecondary) {
      setShowSecondary(true);
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      setShowSecondary(true);
    });
    return () => task.cancel();
  }, [deferSecondary]);

  return (
    <View>
      <HomeProductSection
        section="featured"
        title={t('featuredProducts')}
        subtitle={t('featuredProductsSubtitle')}
        products={featured}
        isLoading={isLoading}
      />

      {showSecondary ? (
        <>
          <HomeProductSection
            section="new"
            title={t('recentlyAdded')}
            subtitle={t('recentlyAddedSubtitle')}
            products={recentlyAdded}
            isLoading={isLoading}
            maxItems={6}
          />
          <HomeProductSection
            section="offers"
            title={t('topDeals')}
            subtitle={t('topDealsSubtitle')}
            products={offers}
            isLoading={isLoading}
          />
        </>
      ) : null}
    </View>
  );
}

export const HomeProductDiscovery = memo(HomeProductDiscoveryComponent);
