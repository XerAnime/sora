import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useLocation, useNavigate } from '@remix-run/react';
import { mergeMeta } from '~/utils';
import { motion, type PanInfo } from 'framer-motion';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';

import type { Handle } from '~/types/handle';
import { i18next } from '~/services/i18n';
import { authenticate } from '~/services/supabase';
import { getTrending } from '~/services/tmdb/tmdb.server';
import { useHydrated } from '~/utils/react/hooks/useHydrated';
import { useTypedRouteLoaderData } from '~/utils/react/hooks/useTypedRouteLoaderData';
import { CACHE_CONTROL } from '~/utils/server/http';
import MediaList from '~/components/media/MediaList';
import { BreadcrumbItem } from '~/components/elements/Breadcrumb';
import SearchForm from '~/components/elements/SearchForm';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [, locale] = await Promise.all([
    authenticate(request, undefined, true),
    i18next.getLocale(request),
  ]);

  const url = new URL(request.url);
  let page = Number(url.searchParams.get('page')) || undefined;
  if (page && (page < 1 || page > 1000)) page = 1;

  return json(
    {
      todayTrending: await getTrending('all', 'day', locale, page),
    },
    {
      headers: { 'Cache-Control': CACHE_CONTROL.trending },
    },
  );
};

export const meta = mergeMeta(() => [
  { title: 'Sora - Search Tv Shows' },
  { name: 'description', content: 'Search Tv Shows on Sora' },
  { property: 'og:url', content: 'https://sorachill.vercel.app/search/tv/' },
  { property: 'og:title', content: 'Sora - Search Tv Shows' },
  { property: 'og:description', content: 'Search Tv Shows on Sora' },
  { name: 'twitter:title', content: 'Sora - Search Tv Shows' },
  { name: 'twitter:description', content: 'Search Tv Shows on Sora' },
]);

export const handle: Handle = {
  breadcrumb: () => (
    <BreadcrumbItem to="/search/tv" key="search-tv">
      Search Tv Shows
    </BreadcrumbItem>
  ),
  miniTitle: () => ({
    title: 'Search',
    subtitle: 'Tv Shows',
    showImage: false,
  }),
  showListViewChangeButton: true,
};

const SearchRoute = () => {
  const { todayTrending } = useLoaderData<typeof loader>() || {};
  const rootData = useTypedRouteLoaderData('root');
  const navigate = useNavigate();
  const location = useLocation();
  const isHydrated = useHydrated();
  const { t } = useTranslation();

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset?.x > 100) {
      navigate('/search/movie');
    }
    if (info.offset?.x < -100 && info.offset?.y > -50) {
      navigate('/search/anime');
    }
  };

  const onSubmit = (value: string) => {
    navigate(`/search/tv/${value}`);
  };

  return (
    <motion.div
      key={location.key}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex w-full flex-col items-center justify-center px-3 sm:px-0"
      drag={isMobile && isHydrated ? 'x' : false}
      dragConstraints={isMobile && isHydrated ? { left: 0, right: 0 } : false}
      dragElastic={isMobile && isHydrated ? 0.7 : false}
      onDragEnd={handleDragEnd}
      dragDirectionLock={isMobile && isHydrated}
      draggable={isMobile && isHydrated}
    >
      <SearchForm
        onSubmit={onSubmit}
        textHelper={t('search.helper.tv')}
        textOnButton={t('search.action')}
        textPlaceHolder={t('search.placeHolder.tv')}
      />
      <MediaList
        currentPage={todayTrending?.page}
        genresMovie={rootData?.genresMovie}
        genresTv={rootData?.genresTv}
        items={todayTrending?.items}
        itemsType="movie-tv"
        listName={t('today-trending')}
        listType="grid"
        showListTypeChangeButton
        totalPages={todayTrending?.totalPages}
      />
    </motion.div>
  );
};

export default SearchRoute;
