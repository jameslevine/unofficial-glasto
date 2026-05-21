import { GetCommand } from '@aws-sdk/lib-dynamodb';
import type { Artist } from '@glasto/shared';
import { ddb, keys, tableName } from './dynamodb-client.js';

export const getArtistBySlug = async (slug: string): Promise<Artist | null> => {
  const res = await ddb.send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: keys.artistPK(slug), SK: keys.artistPK(slug) },
    }),
  );
  return (res.Item as Artist | undefined) ?? null;
};
