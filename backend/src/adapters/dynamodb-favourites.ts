import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Favourite } from '@glasto/shared';
import { ddb, keys, tableName } from './dynamodb-client.js';

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
  return (res.Items ?? []) as Favourite[];
};

export const putFavourite = async (fav: Favourite): Promise<Favourite> => {
  await ddb.send(
    new PutCommand({
      TableName: tableName(),
      Item: { ...fav, PK: keys.userPK(fav.userId), SK: keys.favSK(fav.perfId) },
    }),
  );
  return fav;
};

export const deleteFavourite = async (userSub: string, perfId: string): Promise<void> => {
  await ddb.send(
    new DeleteCommand({
      TableName: tableName(),
      Key: { PK: keys.userPK(userSub), SK: keys.favSK(perfId) },
    }),
  );
};
