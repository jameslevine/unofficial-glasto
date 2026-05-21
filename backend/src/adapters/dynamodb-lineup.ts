import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Performance } from '@glasto/shared';
import { ddb, keys, tableName } from './dynamodb-client.js';

export const getLineupByYear = async (year: number): Promise<Performance[]> => {
  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': keys.perfPK(year),
        ':sk': 'PERF#',
      },
    }),
  );
  return (res.Items ?? []) as Performance[];
};
