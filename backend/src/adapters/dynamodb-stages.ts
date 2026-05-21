import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { Stage } from '@glasto/shared';
import { ddb, tableName } from './dynamodb-client.js';

export const listStages = async (): Promise<Stage[]> => {
  const res = await ddb.send(
    new ScanCommand({
      TableName: tableName(),
      FilterExpression: 'begins_with(PK, :prefix)',
      ExpressionAttributeValues: { ':prefix': 'STAGE#' },
    }),
  );
  return (res.Items ?? []) as Stage[];
};
