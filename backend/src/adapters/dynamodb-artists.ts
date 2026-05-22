import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { Artist } from '@glasto/shared';
import { ddb, keys, tableName } from './dynamodb-client.js';

export const getArtistBySlug = async (slug: string): Promise<Artist | null> => {
  const res = await ddb.send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: keys.artistPK(slug), SK: keys.artistPK(slug) },
    }),
  );
  if (!res.Item) return null;
  const { PK, SK, GSI1PK, GSI1SK, ...artist } = res.Item as Record<string, unknown>;
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
