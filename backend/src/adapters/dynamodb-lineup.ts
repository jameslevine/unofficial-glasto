import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Performance } from '@glasto/shared';
import { ddb, keys, tableName } from './dynamodb-client.js';

export const getLineupByYear = async (year: number): Promise<Performance[]> => {
  const items: Performance[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName(),
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': keys.perfPK(year),
          ':sk': 'PERF#',
        },
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...((res.Items ?? []) as Performance[]));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
};
