import { SearchExperience } from '@components/search/SearchExperience';
import { useSearch } from '@hooks/useSearch';
import { safeGoBack } from '@utils/navigation';

export default function SearchScreen() {
  const search = useSearch({ alwaysActive: true });

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
