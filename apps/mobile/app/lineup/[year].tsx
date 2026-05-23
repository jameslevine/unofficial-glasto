import { useLocalSearchParams, Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { DayOfFestival, Performance } from '@glasto/shared';
import { topGenres, useArtistSummary, useLineup } from '@glasto/shared';
import { Chip } from '../../src/components/Chip';
import { PerformanceCard } from '../../src/components/PerformanceCard';
import { api } from '../../src/lib/api';
import { DAY_ORDER, formatDay, groupByDay } from '../../src/lib/format';
import { colors, radii, spacing } from '../../src/lib/theme';

const VALID_YEARS = new Set([2022, 2023, 2024, 2025]);

interface DaySection {
  title: DayOfFestival;
  data: Performance[];
}

export default function LineupScreen() {
  const { year } = useLocalSearchParams<{ year: string }>();
  const yearNum = Number(year);
  const valid = VALID_YEARS.has(yearNum);

  const { data, isLoading, error } = useLineup(api, valid ? yearNum : 0);
  const { data: summary } = useArtistSummary(api, valid ? yearNum : 0);

  const [search, setSearch] = useState('');
  const [day, setDay] = useState<DayOfFestival | 'ALL'>('ALL');
  const [area, setArea] = useState<string | 'ALL'>('ALL');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = useCallback((g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }, []);

  const genreList = useMemo(() => topGenres(summary ?? [], 30), [summary]);

  const slugGenres = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of summary ?? []) map.set(a.slug, a.genres);
    return map;
  }, [summary]);

  const slugPreview = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const a of summary ?? []) map.set(a.slug, a.previewUrl);
    return map;
  }, [summary]);

  const areas = useMemo(() => {
    if (!data) return [] as string[];
    const set = new Set<string>();
    for (const p of data) set.add(p.area);
    return Array.from(set).sort();
  }, [data]);

  const sections = useMemo<DaySection[]>(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const genreSet = new Set(selectedGenres);
    const filtered = data.filter((p) => {
      if (day !== 'ALL' && p.day !== day) return false;
      if (area !== 'ALL' && p.area !== area) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.stage.toLowerCase().includes(q)) {
        return false;
      }
      if (genreSet.size > 0) {
        const gs = p.artistSlug ? slugGenres.get(p.artistSlug) : undefined;
        if (!gs || !gs.some((g) => genreSet.has(g))) return false;
      }
      return true;
    });
    return groupByDay(filtered).map(([title, items]) => ({ title, data: items }));
  }, [data, search, day, area, selectedGenres, slugGenres]);

  const renderItem = useCallback(
    ({ item }: { item: Performance }) => (
      <PerformanceCard
        performance={item}
        previewUrl={item.artistSlug ? (slugPreview.get(item.artistSlug) ?? null) : null}
      />
    ),
    [slugPreview],
  );
  const renderSectionHeader = useCallback(
    ({ section }: { section: DaySection }) => (
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.dayHeading}>{formatDay(section.title)}</Text>
      </View>
    ),
    [],
  );
  const keyExtractor = useCallback((p: Performance) => p.id, []);

  if (!valid) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unknown year &ldquo;{year}&rdquo;.</Text>
      </View>
    );
  }

  const header = (
    <View style={styles.controls}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search artists or stages"
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Chip label="All days" active={day === 'ALL'} onPress={() => setDay('ALL')} />
        {DAY_ORDER.map((d) => (
          <Chip key={d} label={formatDay(d)} active={day === d} onPress={() => setDay(d)} />
        ))}
      </ScrollView>
      {areas.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          <Chip label="All areas" active={area === 'ALL'} onPress={() => setArea('ALL')} />
          {areas.map((a) => (
            <Chip key={a} label={a} active={area === a} onPress={() => setArea(a)} />
          ))}
        </ScrollView>
      )}
      {genreList.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          <Chip
            label="All genres"
            active={selectedGenres.length === 0}
            onPress={() => setSelectedGenres([])}
          />
          {genreList.map((g) => (
            <Chip
              key={g}
              label={g}
              active={selectedGenres.includes(g)}
              onPress={() => toggleGenre(g)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );

  const empty = (
    <>
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Couldn&rsquo;t load the lineup.</Text>
        </View>
      )}
      {!isLoading && !error && (
        <View style={styles.center}>
          <Text style={styles.muted}>No performances match your filters.</Text>
        </View>
      )}
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: `Glastonbury ${yearNum}` }} />
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        stickySectionHeadersEnabled
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={9}
        removeClippedSubviews
        contentContainerStyle={styles.scroll}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  controls: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.fg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  row: { gap: spacing.sm, paddingRight: spacing.lg },
  sectionHeaderWrap: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  dayHeading: { color: colors.fg, fontSize: 18, fontWeight: '600' },
  center: { padding: spacing.xl, alignItems: 'center' },
  errorText: { color: colors.accent, fontSize: 14 },
  muted: { color: colors.muted, fontSize: 14 },
});
