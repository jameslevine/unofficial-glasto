import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Poi } from '@glasto/shared';
import { ddb, keys, tableName } from './dynamodb-client.js';

export const getPoisByYear = async (year: number): Promise<Poi[]> => {
  const items: Poi[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName(),
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': keys.poiPK(year),
          ':sk': 'POI#',
        },
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...((res.Items ?? []) as Poi[]));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
};
