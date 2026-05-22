import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Favourite } from '@glasto/shared';
import { ddb, keys, tableName } from './dynamodb-client.js';

const stripKeys = (item: Record<string, unknown>): Favourite => {
  const { PK: _PK, SK: _SK, ...rest } = item;
  return rest as Favourite;
};

export const listFavourites = async (userSub: string): Promise<Favourite[]> => {
  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': keys.userPK(userSub),
        ':sk': 'FAV#',
      },
    }),
  );
  return (res.Items ?? []).map((it) => stripKeys(it as Record<string, unknown>));
};

export const putFavourite = async (fav: Favourite): Promise<Favourite> => {
  await ddb
    .send(
      new PutCommand({
        TableName: tableName(),
        Item: { ...fav, PK: keys.userPK(fav.userId), SK: keys.favSK(fav.perfId) },
        ConditionExpression: 'attribute_not_exists(updatedAt) OR updatedAt < :u',
        ExpressionAttributeValues: { ':u': fav.updatedAt },
      }),
    )
    .catch((err: unknown) => {
      const name = (err as { name?: string }).name;
      if (name !== 'ConditionalCheckFailedException') throw err;
    });
  return fav;
};

export const softDeleteFavourite = async (userSub: string, perfId: string): Promise<Favourite> => {
  const tombstone: Favourite = {
    perfId,
    userId: userSub,
    updatedAt: new Date().toISOString(),
    deleted: true,
  };
  await putFavourite(tombstone);
  return tombstone;
};
