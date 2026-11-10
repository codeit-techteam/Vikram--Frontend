import { SearchExperience } from '@components/search/SearchExperience';
import { useSearch } from '@hooks/useSearch';
import { safeGoBack } from '@utils/navigation';
import { useLocalSearchParams } from 'expo-router';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const search = useSearch({ alwaysActive: true, initialQuery });

  return (
    <SearchExperience
      {...search}
      onClose={() => {
        search.deactivateSearch();
        safeGoBack();
      }}
    />
  );
}
