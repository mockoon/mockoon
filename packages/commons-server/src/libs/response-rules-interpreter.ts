import {
  Environment,
  ParsedBodyMimeTypes,
  ProcessedDatabucket,
  ResponseMode,
  ResponseRule,
  ResponseRuleTargets,
  Route,
  RouteResponse,
  stringIncludesArrayItems
} from '@mockoon/commons';
import Ajv from 'ajv';
import addAjvFormats from 'ajv-formats';
import { get as objectGet } from 'object-path';
import { ParsedQs } from 'qs';
import { ServerRequest, fromServerRequest } from './requests';
import { TemplateParser } from './template-parser';
import {
  convertPathToArray,
  getValueFromPath,
  parseRequestMessage
} from './utils';

/**
 * Interpretor for the route response rules.
 * Extract the rules targets from the request (body, headers, etc).
 * Get the first route response for which at least one rule is fulfilled.
 *
 * For CRUD routes:
 * - default response is the one linked to CRUD operations
 * - SEQUENTIAL, RANDOM and DISABLE_RULES modes are still working
 * - default response shouldn't have rules
 */
export class ResponseRulesInterpreter {
  private targets: Record<
    | Exclude<
        ResponseRuleTargets,
        'header' | 'request_number' | 'cookie' | 'templating'
      >
    | 'stringBody',
    any
  >;
  constructor(
    private routeResponses: RouteResponse[],
    private request: ServerRequest,
    private responseMode: Route['responseMode'],
    private environment: Environment,
    private processedDatabuckets: ProcessedDatabucket[],
    private globalVariables: Record<string, any>,
    private envVarsPrefix: string
  ) {
    this.extractTargets();
  }

  /**
   * Choose the route response depending on the first fulfilled rule.
   * If no rule has been fulfilled get the first route response.
   */
  public chooseResponse(
    requestNumber: number,
    requestMessage?: string
  ): RouteResponse | null {
    // if no rules were fulfilled find the default one, or first one if no default
    const defaultResponse =
      this.routeResponses.find((routeResponse) => routeResponse.default) ??
      this.routeResponses[0];

    if (this.responseMode === ResponseMode.RANDOM) {
      const randomStatus = Math.floor(
        Math.random() * this.routeResponses.length
      );

      return this.routeResponses[randomStatus];
    } else if (this.responseMode === ResponseMode.SEQUENTIAL) {
      return this.routeResponses[
        (requestNumber - 1) % this.routeResponses.length
      ];
    } else if (this.responseMode === ResponseMode.DISABLE_RULES) {
      return defaultResponse;
    } else {
      let response = this.routeResponses.find((routeResponse) => {
        if (routeResponse.rules.length === 0) {
          return false;
        }

        return routeResponse.rulesOperator === 'AND'
          ? routeResponse.rules.every((rule) =>
              this.isValid(rule, requestNumber, requestMessage)
            )
          : routeResponse.rules.some((rule) =>
              this.isValid(rule, requestNumber, requestMessage)
            );
      });

      if (
        response === undefined &&
        this.responseMode === ResponseMode.FALLBACK
      ) {
        return null;
      }

      if (response === undefined) {
        response = defaultResponse;
      }

      return response;
    }
  }

  /**
   * Check a rule validity and invert it if invert is at true
   *
   * @param rule
   * @param requestNumber
   * @returns
   */
  private isValid(
    rule: ResponseRule,
    requestNumber: number,
    requestMessage?: string
  ) {
    let isValid = this.isValidRule(rule, requestNumber, requestMessage);

    if (rule.invert) {
      isValid = !isValid;
    }

    return isValid;
  }

  /**
   * Check if a rule is valid by comparing the value extracted from the target to the rule value
   */
  private isValidRule = (
    rule: ResponseRule,
    requestNumber: number,
    requestMessage?: string
  ): boolean => {
    if (!rule.target) {
      return false;
    }

    let targetValue: any;

    const parsedRuleModifier = this.templateParse(rule.modifier ?? '');

    // get the value for each rule type
    if (rule.target === 'request_number') {
      targetValue = requestNumber;
    } else if (rule.target === 'cookie') {
      if (!parsedRuleModifier) {
        return false;
      }
      targetValue = this.request.cookies?.[parsedRuleModifier];
    } else if (rule.target === 'path') {
      targetValue = this.targets.path;
    } else if (rule.target === 'method') {
      targetValue = this.targets.method;
    } else if (rule.target === 'header') {
      targetValue = !parsedRuleModifier
        ? ''
        : this.request.header(parsedRuleModifier);
    } else if (rule.target === 'templating') {
      targetValue = parsedRuleModifier;
    } else {
      /**
       * Get the value for targets that can store complex data (body, query, params (route params), global_var, data_bucket)
       * Note: global_var, data_bucket and params need at least their name to be provided as part of the modifier. An empty modifier is not allowed, and will therefore fail below as value will be undefined.
       */
      if (parsedRuleModifier) {
        let target = this.targets[rule.target];

        // if a requestMessage (websocket) is provided, we parse it based on the information
        // in the original request.
        if (requestMessage) {
          target =
            rule.target === 'body'
              ? parseRequestMessage(requestMessage || '', this.request)
              : target;
        }

        targetValue = getValueFromPath(target, parsedRuleModifier, undefined);
      } else {
        /**
         * Body and query targets can be used without a modifier, in which case the whole parsed body or query is used.
         * For body, when operator is equals, regex or regex_i, the stringBody is used instead of the parsed body to allow for string comparison.
         */
        if (rule.target === 'body') {
          targetValue =
            requestMessage ||
            (rule.operator === 'equals' ||
            rule.operator === 'regex' ||
            rule.operator === 'regex_i'
              ? this.targets.stringBody
              : this.targets.body);
        } else if (rule.target === 'query') {
          targetValue = this.targets.query;
        }
      }
    }

    // ⬇ "null" and "empty_array" operators need no rule value
    if (rule.operator === 'null') {
      return (
        targetValue === null || targetValue === undefined || targetValue === ''
      );
    }

    if (rule.operator === 'empty_array') {
      return Array.isArray(targetValue) && targetValue.length < 1;
    }

    // ⬇ all other operators need a value

    if (targetValue === undefined) {
      return false;
    }

    // value may be explicitely null (JSON), this is considered as an empty string
    if (targetValue === null) {
      targetValue = '';
    }

    // rule value may be explicitely null (is shouldn't anymore), this is considered as an empty string too
    if (rule.value === null) {
      rule.value = '';
    }

    const parsedRuleValue = this.templateParse(rule.value, requestMessage);

    if (rule.operator === 'valid_json_schema') {
      const schema = objectGet(
        this.targets.data_bucket,
        convertPathToArray(rule.value)
      );

      if (!schema) {
        return false;
      }

      try {
        const ajv = new Ajv();
        addAjvFormats(ajv);

        const valid = ajv.compile(schema)(targetValue);

        return valid;
      } catch (_error) {
        return false;
      }
    }

    if (rule.operator === 'array_includes' && rule.modifier) {
      return (
        Array.isArray(targetValue) &&
        targetValue.some((val) => String(val) === parsedRuleValue)
      );
    }

    let regex: RegExp;

    if (rule.operator.includes('regex')) {
      regex = new RegExp(
        parsedRuleValue,
        rule.operator === 'regex_i' ? 'i' : undefined
      );

      return Array.isArray(targetValue)
        ? targetValue.some((arrayValue) => regex.test(arrayValue))
        : regex.test(targetValue);
    }

    // value extracted by JSONPath can be an array, cast its values to string (in line with the equals operator below)
    if (Array.isArray(targetValue)) {
      return targetValue.map((v) => String(v)).includes(parsedRuleValue);
    }

    return String(targetValue) === String(parsedRuleValue);
  };

  /**
   * Extract rules targets from the request (body, headers, etc)
   */
  private extractTargets() {
    const requestContentType = this.request.header('Content-Type') as string;
    let body: ParsedQs | JSON | string = this.request.stringBody;

    if (
      requestContentType &&
      stringIncludesArrayItems(ParsedBodyMimeTypes, requestContentType) &&
      this.request.body !== undefined
    ) {
      body = this.request.body;
    }

    const dataBucketTargets = {};

    this.processedDatabuckets.forEach((bucket) => {
      dataBucketTargets[bucket.id] = bucket.value;
      dataBucketTargets[bucket.name] = bucket.value;
    });

    this.targets = {
      stringBody: this.request.stringBody,
      body,
      query: this.request.query,
      params: this.request.params,
      global_var: this.globalVariables,
      data_bucket: dataBucketTargets,
      method: this.request.method?.toLowerCase(),
      path: [this.request.originalRequest.url, this.request.originalPath]
    };
  }

  /**
   * Parse the value using the template parser allowing data helpers.
   *
   * @param value the value to parse
   * @param requestMessage the message sent by client. Only defined for websockets. For http requests, this is undefined.
   * @returns the parsed value or the unparsed input value if parsing fails
   */
  private templateParse(value: string, requestMessage?: string): string {
    let parsedValue: string;

    try {
      parsedValue = TemplateParser({
        shouldOmitDataHelper: false,
        content: value,
        environment: this.environment,
        processedDatabuckets: this.processedDatabuckets,
        globalVariables: this.globalVariables,
        request: requestMessage
          ? fromServerRequest(this.request, requestMessage)
          : this.request,
        envVarsPrefix: this.envVarsPrefix
      });
    } catch (_error) {
      return value;
    }

    return parsedValue;
  }
}
