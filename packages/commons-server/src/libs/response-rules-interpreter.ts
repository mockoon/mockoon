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
  private targets: {
    [key in
      | Exclude<
          ResponseRuleTargets,
          'header' | 'request_number' | 'cookie' | 'templating'
        >
      | 'bodyRaw']: any;
  };

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

    let value: any;

    const parsedRuleModifier = this.templateParse(rule.modifier ?? '');

    if (rule.target === 'request_number') {
      value = requestNumber;
    } else if (rule.target === 'cookie') {
      if (!parsedRuleModifier) {
        return false;
      }
      value = this.request.cookies?.[parsedRuleModifier];
    } else if (rule.target === 'path') {
      value = this.targets.path;
    } else if (rule.target === 'method') {
      value = this.targets.method;
    } else if (rule.target === 'header') {
      value = this.request.header(parsedRuleModifier);
    } else if (rule.target === 'templating') {
      value = parsedRuleModifier;
    } else {
      if (parsedRuleModifier) {
        value = this.targets.bodyRaw;

        let target = this.targets[rule.target];

        // if a requestMessage is provided, we parse it based on the information
        // in the original request.
        if (requestMessage) {
          target =
            rule.target === 'body'
              ? parseRequestMessage(requestMessage || '', this.request)
              : target;
        }

        value = getValueFromPath(target, parsedRuleModifier, undefined);
      } else if (rule.target === 'body') {
        value = requestMessage || this.targets.bodyRaw;
      }
    }

    // ⬇ "null" and "empty_array" operators need no value
    if (rule.operator === 'null' && parsedRuleModifier) {
      return value === null || value === undefined;
    }

    if (rule.operator === 'empty_array' && parsedRuleModifier) {
      return Array.isArray(value) && value.length < 1;
    }

    // ⬇ all other operators need a value

    if (value === undefined) {
      return false;
    }

    // value may be explicitely null (JSON), this is considered as an empty string
    if (value === null) {
      value = '';
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
        const valid = ajv.compile(schema)(value);

        return valid;
      } catch (_error) {
        return false;
      }
    }

    if (rule.operator === 'array_includes' && rule.modifier) {
      return (
        Array.isArray(value) &&
        value.some((val) => String(val) === parsedRuleValue)
      );
    }

    let regex: RegExp;

    if (rule.operator.includes('regex')) {
      regex = new RegExp(
        parsedRuleValue,
        rule.operator === 'regex_i' ? 'i' : undefined
      );

      return Array.isArray(value)
        ? value.some((arrayValue) => regex.test(arrayValue))
        : regex.test(value);
    }

    // value extracted by JSONPath can be an array, cast its values to string (in line with the equals operator below)
    if (Array.isArray(value)) {
      return value.map((v) => String(v)).includes(parsedRuleValue);
    }

    return String(value) === String(parsedRuleValue);
  };

  /**
   * Extract rules targets from the request (body, headers, etc)
   */
  private extractTargets() {
    const requestContentType = this.request.header('Content-Type');
    let body: ParsedQs | JSON = {};

    if (requestContentType) {
      if (stringIncludesArrayItems(ParsedBodyMimeTypes, requestContentType)) {
        body = this.request.body;
      }
    }

    const dataBucketTargets = {};
    this.processedDatabuckets.forEach((bucket) => {
      dataBucketTargets[bucket.id] = bucket.value;
      dataBucketTargets[bucket.name] = bucket.value;
    });

    this.targets = {
      body,
      query: this.request.query,
      params: this.request.params,
      bodyRaw: this.request.stringBody,
      global_var: this.globalVariables,
      data_bucket: dataBucketTargets,
      method: this.request.method?.toLowerCase(),
      path: this.request.originalRequest.url
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
