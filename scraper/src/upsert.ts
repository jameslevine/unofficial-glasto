import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { Artist, Performance, Stage } from '@glasto/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const tableName = (): string => {
  const name = process.env.TABLE_NAME;
  if (!name) throw new Error('TABLE_NAME env var is required');
  return name;
};

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

interface PutItem {
  PutRequest: { Item: Record<string, unknown> };
}

const flushBatches = async (items: PutItem[]): Promise<void> => {
  for (const batch of chunk(items, 25)) {
    await ddb.send(new BatchWriteCommand({ RequestItems: { [tableName()]: batch } }));
  }
};

export const upsertPerformances = async (performances: Performance[]): Promise<number> => {
  const items: PutItem[] = performances.map((p) => ({
    PutRequest: {
      Item: {
        ...p,
        PK: `YEAR#${p.year}`,
        SK: `PERF#${p.id}`,
        GSI1PK: `STAGE#${p.stage}#YEAR#${p.year}`,
        GSI1SK: `START#${p.startsAt}`,
      },
    },
  }));
  await flushBatches(items);
  return performances.length;
};

export const upsertStages = async (stages: Stage[]): Promise<number> => {
  const items: PutItem[] = stages.map((s) => ({
    PutRequest: {
      Item: {
        ...s,
        PK: `STAGE#${s.slug}`,
        SK: `STAGE#${s.slug}`,
      },
    },
  }));
  await flushBatches(items);
  return stages.length;
};

export const upsertArtists = async (artists: Artist[]): Promise<number> => {
  const items: PutItem[] = artists.map((a) => ({
    PutRequest: {
      Item: {
        ...a,
        PK: `ARTIST#${a.slug}`,
        SK: `ARTIST#${a.slug}`,
        ...(a.spotifyId ? { GSI1PK: `SPOTIFY#${a.spotifyId}`, GSI1SK: `ARTIST#${a.slug}` } : {}),
      },
    },
  }));
  await flushBatches(items);
  return artists.length;
};
