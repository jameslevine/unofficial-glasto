import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { buildGoogleCalendarUrl, buildIcs } from '@glasto/shared';
import type { Performance } from '@glasto/shared';

const writeAndShare = async (filename: string, ics: string, dialogTitle: string) => {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error('Cache directory unavailable');
  const uri = `${cacheDir}${filename}`;
  await FileSystem.writeAsStringAsync(uri, ics, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/calendar',
      UTI: 'com.apple.ical.ics',
      dialogTitle,
    });
  }
};

export const shareSchedule = async (performances: Performance[]): Promise<void> => {
  if (performances.length === 0) return;
  const ics = buildIcs(performances.map((performance) => ({ performance })));
  await writeAndShare('glastonbury-schedule.ics', ics, 'Export schedule');
};

export const sharePerformance = async (performance: Performance): Promise<void> => {
  const ics = buildIcs([{ performance }]);
  const slug = performance.artistSlug ?? performance.id;
  await writeAndShare(`${slug}.ics`, ics, 'Add to calendar');
};

export const openInGoogleCalendar = (performance: Performance): Promise<void> =>
  Linking.openURL(buildGoogleCalendarUrl({ performance }));
