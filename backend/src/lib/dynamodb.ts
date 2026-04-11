import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  QueryCommandInput,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "eu-central-1",
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export async function getItem<T>(
  params: GetCommandInput,
): Promise<T | undefined> {
  const result = await docClient.send(new GetCommand(params));
  return result.Item as T | undefined;
}

export async function putItem(params: PutCommandInput): Promise<void> {
  await docClient.send(new PutCommand(params));
}

export async function updateItem(
  params: UpdateCommandInput,
): Promise<Record<string, unknown> | undefined> {
  const result = await docClient.send(new UpdateCommand(params));
  return result.Attributes as Record<string, unknown> | undefined;
}

export async function deleteItem(params: DeleteCommandInput): Promise<void> {
  await docClient.send(new DeleteCommand(params));
}

export async function query<T>(params: QueryCommandInput): Promise<T[]> {
  const result = await docClient.send(new QueryCommand(params));
  return (result.Items ?? []) as T[];
}

export async function scan<T>(params: ScanCommandInput): Promise<T[]> {
  const items: T[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({ ...params, ExclusiveStartKey: lastKey }),
    );
    items.push(...((result.Items ?? []) as T[]));
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return items;
}
