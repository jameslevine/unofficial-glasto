import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAME_ENV } from '../constants/index.js';

const base = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(base, {
  marshallOptions: { removeUndefinedValues: true },
});

export const tableName = (): string => {
  const name = process.env[TABLE_NAME_ENV];
  if (!name) throw new Error(`${TABLE_NAME_ENV} env var is required`);
  return name;
};

export const keys = {
  perfPK: (year: number) => `YEAR#${year}`,
  perfSK: (perfId: string) => `PERF#${perfId}`,
  stagePK: (slug: string) => `STAGE#${slug}`,
  artistPK: (slug: string) => `ARTIST#${slug}`,
  userPK: (sub: string) => `USER#${sub}`,
  favSK: (perfId: string) => `FAV#${perfId}`,
  poiPK: (year: number) => `POI#${year}`,
};
