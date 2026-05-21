import { useLocalSearchParams, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DayOfFestival, Performance } from '@glasto/shared';
import { useLineup } from '@glasto/shared';
import { Chip } from '../../src/components/Chip';
import { PerformanceCard } from '../../src/components/PerformanceCard';
import { api } from '../../src/lib/api';
import { DAY_ORDER, formatDay, groupByDay } from '../../src/lib/format';
import { colors, radii, spacing } from '../../src/lib/theme';

const VALID_YEARS = new Set([2022, 2023, 2024, 2025]);

export default function LineupScreen() {
  const { year } = useLocalSearchParams<{ year: string }>();
  const yearNum = Number(year);
  const valid = VALID_YEARS.has(yearNum);

  const { data, isLoading, error } = useLineup(api, valid ? yearNum : 0);

  const [search, setSearch] = useState('');
  const [day, setDay] = useState<DayOfFestival | 'ALL'>('ALL');
  const [area, setArea] = useState<string | 'ALL'>('ALL');

  const areas = useMemo(() => {
    if (!data) return [] as string[];
    const set = new Set<string>();
    for (const p of data) set.add(p.area);
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo<Performance[]>(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((p) => {
      if (day !== 'ALL' && p.day !== day) return false;
      if (area !== 'ALL' && p.area !== area) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.stage.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [data, search, day, area]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  if (!valid) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unknown year &ldquo;{year}&rdquo;.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Glastonbury ${yearNum}` }} />
      <ScrollView contentContainerStyle={styles.scroll} stickyHeaderIndices={[0]}>
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
        </View>

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
        {!isLoading && !error && filtered.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.muted}>No performances match your filters.</Text>
          </View>
        )}

        {grouped.map(([d, items]) => (
          <View key={d} style={styles.daySection}>
            <Text style={styles.dayHeading}>{formatDay(d)}</Text>
            <View style={styles.dayCard}>
              {items.map((p) => (
                <PerformanceCard key={p.id} performance={p} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
  daySection: { marginTop: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.sm },
  dayHeading: { color: colors.fg, fontSize: 18, fontWeight: '600' },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  center: { padding: spacing.xl, alignItems: 'center' },
  errorText: { color: colors.accent, fontSize: 14 },
  muted: { color: colors.muted, fontSize: 14 },
});
