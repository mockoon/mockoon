import {
  DataBucket,
  Environment,
  Header,
  ProcessedDatabucket,
  Route,
  RouteResponse,
  ServerOptions
} from '@mockoon/commons';
import { Request } from 'express';
import { fromExpressRequest } from '../requests';
import { TemplateParser } from '../template-parser';
import { requestHelperNames } from '../templating-helpers/request-helpers';

/**
 * Generate a databucket with parsed value if it does not contain request helpers
 *
 * @param databucket
 * @param environment
 * @param processedDatabuckets
 * @param globalVariables
 * @param options
 * @returns
 */
const generateDatabucket = (
  databucket: DataBucket,
  environment: Environment,
  processedDatabuckets: ProcessedDatabucket[],
  globalVariables: Record<string, any>,
  options: ServerOptions
) => {
  let newProcessedDatabucket: ProcessedDatabucket;

  if (
    new RegExp(
      `{{2,3}[#(~\\s\\w ]*((?<![\\w])${requestHelperNames.join('|')})[)} ~]+`
    ).exec(databucket.value)
  ) {
    // a request helper was found
    newProcessedDatabucket = {
      uuid: databucket.uuid,
      id: databucket.id,
      name: databucket.name,
      value: databucket.value,
      parsed: false,
      validJson: false
    };
  } else {
    let templateParsedContent;

    try {
      templateParsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: databucket.value,
        environment,
        processedDatabuckets: processedDatabuckets,
        globalVariables: globalVariables,
        envVarsPrefix: options.envVarsPrefix,
        publicBaseUrl: options.publicBaseUrl
      });

      const JSONParsedContent = JSON.parse(templateParsedContent);

      newProcessedDatabucket = {
        uuid: databucket.uuid,
        id: databucket.id,
        name: databucket.name,
        value: JSONParsedContent,
        parsed: true,
        validJson: true
      };
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        newProcessedDatabucket = {
          uuid: databucket.uuid,
          id: databucket.id,
          name: databucket.name,
          value: templateParsedContent,
          parsed: true,
          validJson: false
        };
      } else {
        newProcessedDatabucket = {
          uuid: databucket.uuid,
          id: databucket.id,
          name: databucket.name,
          value: error.message,
          parsed: true,
          validJson: false
        };
      }
    }
  }

  return newProcessedDatabucket;
};

/**
 * Parse all databuckets in the environment and set their parsed value to true except if they contain request helpers
 * @param environment
 */
export const generateDatabuckets = (
  environment: Environment,
  processedDatabuckets: ProcessedDatabucket[],
  globalVariables: Record<string, any>,
  options: ServerOptions,
  emitProcessedDatabuckets: () => void
) => {
  if (environment.data.length > 0) {
    environment.data.forEach((databucket) => {
      processedDatabuckets.push(
        generateDatabucket(
          databucket,
          environment,
          processedDatabuckets,
          globalVariables,
          options
        )
      );
    });

    emitProcessedDatabuckets();
  }
};

/**
 * Returns list of matched databucket ids in the given text.
 *
 * @param data text to be searched for possible databucket ids
 */
const extractDatabucketIdsFromString = (text?: string): string[] => {
  const matches = text?.matchAll(
    new RegExp('data(?:Raw)? +[\'|"]{1}([^(\'|")]*)', 'g')
  );

  return [...(matches ?? [])].map((mtc) => mtc[1]);
};

/**
 * Find data buckets referenced in the provided headers
 *
 * @param headers
 */
const findDatabucketIdsInHeaders = (headers: Header[]): string[] => {
  return headers.reduce<string[]>(
    (acc, header) => [...acc, ...extractDatabucketIdsFromString(header.value)],
    []
  );
};

/**
 * Find and returns all unique databucket ids specified in callbacks
 * of the given response.
 * To achieve null safety, this will always return an empty set if no callbacks
 * have been defined.
 *
 * @param response
 * @param environment
 */
const findDatabucketIdsInCallbacks = (
  response: RouteResponse,
  environment: Environment
): string[] => {
  let dataBucketIds: string[] = [];

  if (response.callbacks && response.callbacks.length > 0) {
    for (const invocation of response.callbacks) {
      const callback = environment.callbacks.find(
        (envCallback) => envCallback.uuid === invocation.uuid
      );

      if (!callback) {
        continue;
      }

      dataBucketIds = [
        ...dataBucketIds,
        ...extractDatabucketIdsFromString(callback.uri),
        ...extractDatabucketIdsFromString(callback.body),
        ...extractDatabucketIdsFromString(callback.filePath),
        ...findDatabucketIdsInHeaders(callback.headers)
      ];

      if (callback.databucketID) {
        dataBucketIds.push(callback.databucketID);
      }
    }
  }

  return dataBucketIds;
};

/**
 * Find databucket ids in the rules target and value of the given response
 *
 * @param response
 */
const findDatabucketIdsInRules = (response: RouteResponse): string[] => {
  let dataBucketIds: string[] = [];

  response.rules.forEach((rule) => {
    const splitRules = rule.modifier.split('.');
    if (rule.target === 'data_bucket') {
      dataBucketIds = [
        ...dataBucketIds,
        // split by dots, take first section, or second if first is a dollar
        splitRules[0].startsWith('$') ? splitRules[1] : splitRules[0],
        ...extractDatabucketIdsFromString(rule.value)
      ];
    }
  });

  return dataBucketIds;
};

/**
 * Generate the databuckets that were not parsed at the server start
 *
 * @param route
 * @param environment
 * @param request
 */
export const generateRequestDatabuckets = (
  route: Route,
  environment: Environment,
  request: Request,
  processedDatabuckets: ProcessedDatabucket[],
  globalVariables: Record<string, any>,
  options: ServerOptions,
  emitProcessedDatabuckets: () => void
) => {
  // do not continue if all the buckets were previously parsed
  if (
    !processedDatabuckets.some(
      (processedDatabucket) => !processedDatabucket.parsed
    )
  ) {
    return;
  }

  let databucketIdsToParse = new Set<string>();

  // find databucket ids in environment headers
  findDatabucketIdsInHeaders(environment.headers).forEach((dataBucketId) =>
    databucketIdsToParse.add(dataBucketId)
  );

  route.responses.forEach((response) => {
    // capture databucket ids in body and relevant callback definitions
    [
      ...findDatabucketIdsInHeaders(response.headers),
      ...extractDatabucketIdsFromString(response.body),
      ...extractDatabucketIdsFromString(response.filePath),
      ...findDatabucketIdsInCallbacks(response, environment),
      ...findDatabucketIdsInRules(response)
    ].forEach((dataBucketId) => databucketIdsToParse.add(dataBucketId));

    if (response.databucketID) {
      databucketIdsToParse.add(response.databucketID);
    }
  });

  // capture databucket ids in found databuckets to allow for nested databucket parsing
  let nestedDatabucketIds: string[] = [];

  environment.data.forEach((databucket) => {
    if (
      databucketIdsToParse.has(databucket.id) ||
      [...databucketIdsToParse.keys()].some((id) =>
        databucket.name.toLowerCase().includes(id.toLowerCase())
      )
    ) {
      nestedDatabucketIds = [
        ...extractDatabucketIdsFromString(databucket.value)
      ];
    }
  });

  // add nested databucket ids at the beginning of the set to ensure they are parsed first
  databucketIdsToParse = new Set([
    ...nestedDatabucketIds,
    ...databucketIdsToParse
  ]);

  if (databucketIdsToParse.size > 0) {
    let targetDatabucket: ProcessedDatabucket | undefined;

    for (const databucketIdToParse of databucketIdsToParse) {
      targetDatabucket = processedDatabuckets.find(
        (databucket) =>
          databucket.id === databucketIdToParse ||
          databucket.name
            .toLowerCase()
            .includes(databucketIdToParse.toLowerCase())
      );

      if (targetDatabucket && !targetDatabucket?.parsed) {
        let content = targetDatabucket.value;

        try {
          content = TemplateParser({
            shouldOmitDataHelper: false,
            content: targetDatabucket.value,
            environment,
            processedDatabuckets: processedDatabuckets,
            globalVariables: globalVariables,
            request: fromExpressRequest(request),
            envVarsPrefix: options.envVarsPrefix,
            publicBaseUrl: options.publicBaseUrl
          });

          const JSONParsedcontent = JSON.parse(content);

          targetDatabucket.value = JSONParsedcontent;
          targetDatabucket.parsed = true;
          targetDatabucket.validJson = true;
        } catch (error: any) {
          if (error instanceof SyntaxError) {
            targetDatabucket.value = content;
          } else {
            targetDatabucket.value = error.message;
          }

          targetDatabucket.parsed = true;
          targetDatabucket.validJson = false;
        }
      }
    }

    emitProcessedDatabuckets();
  }
};

export const regenerateDatabuckets = (
  previousDataBuckets: DataBucket[],
  newDataBuckets: DataBucket[],
  processedDatabuckets: ProcessedDatabucket[],
  environment: Environment,
  globalVariables: Record<string, any>,
  options: ServerOptions,
  emitProcessedDatabuckets: () => void
) => {
  const databucketsToGenerate: DataBucket[] = [];

  const deletedDatabuckets = previousDataBuckets.filter(
    (previousDataBucket) =>
      !newDataBuckets.some(
        (newDataBucket) => newDataBucket.uuid === previousDataBucket.uuid
      )
  );

  deletedDatabuckets.forEach((deletedDatabucket) => {
    const processedDatabucketIndex = processedDatabuckets.findIndex(
      (processedDatabucket) =>
        processedDatabucket.uuid === deletedDatabucket.uuid
    );

    if (processedDatabucketIndex !== -1) {
      processedDatabuckets.splice(processedDatabucketIndex, 1);
    }
  });

  newDataBuckets.forEach((newDataBucket) => {
    const previousDataBucket = previousDataBuckets.find(
      (databucket) => databucket.uuid === newDataBucket.uuid
    );

    if (!previousDataBucket) {
      // new databucket, add to the list to regenerate
      databucketsToGenerate.push(newDataBucket);
    } else if (
      previousDataBucket.value !== newDataBucket.value ||
      previousDataBucket.name !== newDataBucket.name ||
      previousDataBucket.id !== newDataBucket.id
    ) {
      // existing databucket with changed value, add to the list to regenerate
      databucketsToGenerate.push(newDataBucket);
    }
  });

  if (databucketsToGenerate.length > 0) {
    databucketsToGenerate.forEach((databucket) => {
      const processedDatabucketIndex = processedDatabuckets.findIndex(
        (processedDatabucket) => processedDatabucket.uuid === databucket.uuid
      );

      const newProcessedDatabucket = generateDatabucket(
        databucket,
        environment,
        processedDatabuckets,
        globalVariables,
        options
      );

      if (processedDatabucketIndex !== -1) {
        // replace existing processed databucket with the new one
        processedDatabuckets[processedDatabucketIndex] = newProcessedDatabucket;
      } else {
        // add new processed databucket to the list
        processedDatabuckets.push(newProcessedDatabucket);
      }
    });

    emitProcessedDatabuckets();
  }
};
