import { DataBucket } from '@mockoon/commons';

export type DatabucketProperties = { [T in keyof DataBucket]?: DataBucket[T] };
