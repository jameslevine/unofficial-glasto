import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { Stage } from '@glasto/shared';
import { ddb, tableName } from './dynamodb-client.js';

export const listStages = async (): Promise<Stage[]> => {
  const items: Stage[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: tableName(),
        FilterExpression: 'begins_with(PK, :prefix) AND PK = SK',
        ExpressionAttributeValues: { ':prefix': 'STAGE#' },
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...((res.Items ?? []) as Stage[]));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
};
