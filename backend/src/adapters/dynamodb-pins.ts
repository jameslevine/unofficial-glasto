import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Pin } from '@glasto/shared';
import { ddb, keys, tableName } from './dynamodb-client.js';

const stripKeys = (item: Record<string, unknown>): Pin => {
  const { PK: _PK, SK: _SK, ...rest } = item;
  return rest as Pin;
};

export const listPins = async (userSub: string): Promise<Pin[]> => {
  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': keys.userPK(userSub),
        ':sk': 'PIN#',
      },
    }),
  );
  return (res.Items ?? []).map((it) => stripKeys(it as Record<string, unknown>));
};

export const putPin = async (pin: Pin): Promise<Pin> => {
  await ddb
    .send(
      new PutCommand({
        TableName: tableName(),
        Item: { ...pin, PK: keys.userPK(pin.userId), SK: keys.pinSK(pin.id) },
        ConditionExpression: 'attribute_not_exists(updatedAt) OR updatedAt < :u',
        ExpressionAttributeValues: { ':u': pin.updatedAt },
      }),
    )
    .catch((err: unknown) => {
      const name = (err as { name?: string }).name;
      if (name !== 'ConditionalCheckFailedException') throw err;
    });
  return pin;
};
