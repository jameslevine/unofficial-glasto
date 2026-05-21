import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { Performance } from '@glasto/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const tableName = (): string => {
  const name = process.env.TABLE_NAME;
  if (!name) throw new Error('TABLE_NAME env var is required');
  return name;
};

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export const upsertPerformances = async (performances: Performance[]): Promise<number> => {
  let written = 0;
  for (const batch of chunk(performances, 25)) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName()]: batch.map((p) => ({
            PutRequest: {
              Item: {
                ...p,
                PK: `YEAR#${p.year}`,
                SK: `PERF#${p.id}`,
                GSI1PK: `STAGE#${p.stage}#YEAR#${p.year}`,
                GSI1SK: `START#${p.startsAt}`,
              },
            },
          })),
        },
      }),
    );
    written += batch.length;
  }
  return written;
};
