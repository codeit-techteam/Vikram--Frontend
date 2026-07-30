import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type {
  ApiSearchResponse,
  ApiSearchSuggestions,
} from '@/types/api-catalog';
import { adaptApiSearchProduct } from '@utils/catalogAdapters';
import type { SearchProduct } from '@constants/searchData';
import type { Suggestion } from '@utils/searchUtils';

const SEARCH_BASE = '/search';

export interface SearchResultPage {
  products: SearchProduct[];
  categories: ApiSearchResponse['categories'];
  offers: ApiSearchResponse['offers'];
  meta: ApiSearchResponse['meta'];
}

export async function searchCatalog(params: {
  q: string;
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
}): Promise<SearchResultPage> {
  const query = new URLSearchParams();
  query.set('q', params.q);
  if (params.page != null) query.set('page', String(params.page));
  if (params.limit != null) query.set('limit', String(params.limit));
  if (params.category) query.set('category', params.category);
  if (params.sort) query.set('sort', params.sort);

  const { data } = await api.get<ApiResponse<ApiSearchResponse>>(
    `${SEARCH_BASE}?${query.toString()}`,
  );
  const payload = data.data;
  const products = (payload.products ?? payload.items ?? []).map(adaptApiSearchProduct);

  return {
    products,
    categories: payload.categories ?? [],
    offers: payload.offers ?? [],
    meta: payload.meta,
  };
}

export async function fetchSearchSuggestions(q: string): Promise<{
  suggestions: Suggestion[];
  popular: string[];
}> {
  const query = new URLSearchParams();
  query.set('q', q);
  const { data } = await api.get<ApiResponse<ApiSearchSuggestions>>(
    `${SEARCH_BASE}/suggestions?${query.toString()}`,
  );
  const payload = data.data;

  const suggestions: Suggestion[] = [];
  const seen = new Set<string>();

  const push = (text: string, type: Suggestion['type'], category?: string, id?: string) => {
    const baseId = id ?? text;
    const uniqueId = `${type}-${baseId}`;
    if (seen.has(uniqueId)) return;
    seen.add(uniqueId);
    suggestions.push({
      id: uniqueId,
      text,
      type,
      category,
    });
  };

  for (const item of payload.matchingProducts ?? []) {
    push(item.text, 'product', undefined, item.slug ?? item.text);
  }
  for (const item of payload.matchingCategories ?? []) {
    push(item.text, 'category', item.slug, item.slug ?? item.text);
  }
  for (const item of payload.matchingOffers ?? []) {
    push(item.text, 'brand', undefined, item.slug ?? item.text);
  }
  for (const item of payload.matching ?? []) {
    const type =
      item.type === 'category'
        ? 'category'
        : item.type === 'product'
          ? 'product'
          : item.type === 'brand'
            ? 'brand'
            : 'product';
    push(item.text, type, item.slug, item.slug ?? item.text);
  }

  return {
    suggestions,
    popular: payload.popularSearches ?? payload.popular ?? [],
  };
}

export async function fetchTrendingSearches(): Promise<string[]> {
  const { data } = await api.get<ApiResponse<string[]>>(`${SEARCH_BASE}/trending`);
  return data.data ?? [];
}

export const searchService = {
  searchCatalog,
  fetchSearchSuggestions,
  fetchTrendingSearches,
};
