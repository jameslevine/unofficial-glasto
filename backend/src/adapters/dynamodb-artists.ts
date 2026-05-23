import { BatchGetCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { Artist } from '@glasto/shared';
import { ddb, keys, tableName } from './dynamodb-client.js';

const cleanArtist = (raw: Record<string, unknown>): Artist => {
  const { PK, SK, GSI1PK, GSI1SK, ...artist } = raw;
  void PK;
  void SK;
  void GSI1PK;
  void GSI1SK;
  return {
    ...(artist as Artist),
    genres: ((artist as Artist).genres ?? []) as string[],
    topTracks: ((artist as Artist).topTracks ?? []) as Artist['topTracks'],
  };
};

export const getArtistBySlug = async (slug: string): Promise<Artist | null> => {
  const res = await ddb.send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: keys.artistPK(slug), SK: keys.artistPK(slug) },
    }),
  );
  if (!res.Item) return null;
  return cleanArtist(res.Item as Record<string, unknown>);
};

export const getArtistsBySlugs = async (slugs: string[]): Promise<Artist[]> => {
  const unique = Array.from(new Set(slugs));
  if (unique.length === 0) return [];

  const out: Artist[] = [];
  // BatchGetItem caps at 100 keys per request
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    let unprocessed: Array<Record<string, unknown>> | undefined = chunk.map((slug) => ({
      PK: keys.artistPK(slug),
      SK: keys.artistPK(slug),
    }));
    while (unprocessed && unprocessed.length > 0) {
      const res = await ddb.send(
        new BatchGetCommand({
          RequestItems: {
            [tableName()]: { Keys: unprocessed },
          },
        }),
      );
      const items = (res.Responses?.[tableName()] ?? []) as Record<string, unknown>[];
      for (const item of items) out.push(cleanArtist(item));
      unprocessed = res.UnprocessedKeys?.[tableName()]?.Keys as
        | Array<Record<string, unknown>>
        | undefined;
    }
  }
  return out;
};

export const putArtist = async (artist: Artist): Promise<void> => {
  await ddb.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...artist,
        PK: keys.artistPK(artist.slug),
        SK: keys.artistPK(artist.slug),
        ...(artist.spotifyId
          ? { GSI1PK: `SPOTIFY#${artist.spotifyId}`, GSI1SK: `ARTIST#${artist.slug}` }
          : {}),
      },
    }),
  );
};
