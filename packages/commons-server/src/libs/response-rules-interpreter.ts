import {
  ResponseMode,
  ResponseRule,
  ResponseRuleTargets,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { Request } from 'express';
import { get as objectPathGet } from 'object-path';
import { ParsedQs } from 'qs';
import { ParsedBodyMimeTypes } from '../constants/common.constants';
import { convertPathToArray, stringIncludesArrayItems } from './utils';

/**
 * Interpreter for the route response rules.
 * Extract the rules targets from the request (body, headers, etc).
 * Get the first route response for which at least one rule is fulfilled.
 */
export class ResponseRulesInterpreter {
  private targets: {
    [key in
      | Exclude<ResponseRuleTargets, 'header' | 'request_number' | 'cookie'>
      | 'bodyRaw']: any;
  };

  constructor(
    private routeResponses: RouteResponse[],
    private request: Request,
    private responseMode: Route['responseMode']
  ) {
    this.extractTargets();
  }

  /**
   * Choose the route response depending on the first fulfilled rule.
   * If no rule has been fulfilled get the default or first route response.
   *
   * @param requestNumbers cache of request numbers per endpoint and mock resource that is updated by this function
   */
  public chooseResponse(requestNumbers: object): RouteResponse {
    // if no rules were fulfilled find the default one, or first one if no default
    const defaultResponse =
      this.routeResponses.find((routeResponse) => routeResponse.default) ||
      this.routeResponses[0];

    if (this.responseMode === ResponseMode.RANDOM) {
      const randomStatus = Math.floor(
        Math.random() * this.routeResponses.length
      );

      return this.routeResponses[randomStatus];
    } else if (this.responseMode === ResponseMode.SEQUENTIAL) {
      return this.routeResponses[
        (requestNumbers['endpoint'] - 1) % this.routeResponses.length
      ];
    } else if (this.responseMode === ResponseMode.DISABLE_RULES) {
      return defaultResponse;
    } else {
      let response = this.routeResponses.find((routeResponse) => {
        if (routeResponse.rules.length === 0) {
          return false;
        }

        let mockResourceKey;
        try {
          mockResourceKey = this.identifyMockResource(routeResponse);
        } catch (error: any) {
          // nop
        }

        const resourceKey = mockResourceKey || 'endpoint';
        const requestNumber = requestNumbers[resourceKey] || 1;

        const isSelected =
          routeResponse.rulesOperator === 'AND'
            ? routeResponse.rules.every((rule) =>
                this.isValid(rule, requestNumber)
              )
            : routeResponse.rules.some((rule) =>
                this.isValid(rule, requestNumber)
              );

        if (isSelected && mockResourceKey) {
          requestNumbers[mockResourceKey] = requestNumber + 1;
        }

        return isSelected;
      });

      if (response === undefined) {
        response = defaultResponse;
      }

      return response;
    }
  }

  /**
   * Identify a "mock resource" based on the rules associated with a response and the corresponding resolved target
   * values of a request.  The request may or may not match the rules.  A mock resource is identified only when the
   * following constraints are satisfied:
   *
   *  - A conjunction of simple rules is made using AND as the join operator,
   *  - All the simple rules are based on positive, rather than inverted, matching,
   *  - At least one of the simple rules has a 'request_number' target, and
   *  - At least one of the simple rules has a 'query', 'params', or 'body' target.
   *
   * If all these conditions are met, then for each simple rule with a 'query', 'params', or 'body' target, a simple
   * key is formed by combining the target value with the resolved target value.  The simple keys are combined to form
   * an identifier of a would-be (ie, mock) resource.  For the purpose of identifying a mock resource, rules with a
   * 'header' or 'cookie' target are ignored.  If a mock resource is not identified, we return undefined.
   *
   * @param routeResponse
   * @returns
   */
  private identifyMockResource(routeResponse: RouteResponse): string {
    let key;

    const attributeRules = routeResponse.rules.filter((rule) =>
      ['query', 'params', 'body'].some((x) => rule.target === x)
    );
    const requestNumberRules = routeResponse.rules.filter(
      (rule) => rule.target === 'request_number'
    );
    const allRulesQualify = attributeRules
      .concat(requestNumberRules)
      .every((rule) => !rule.invert);
    const atLeastOneOfEach =
      attributeRules.length > 0 && requestNumberRules.length > 0;

    if (
      allRulesQualify &&
      routeResponse.rulesOperator === 'AND' &&
      atLeastOneOfEach
    ) {
      key = attributeRules
        .map((rule) => this.mockResourceAttribute(rule))
        .join('|');
    }

    return key;
  }

  /**
   * Encode a potential mock resource attribute based on the target value and the resolved target value.
   *
   * @param rule
   * @returns
   */
  private mockResourceAttribute(rule: ResponseRule): string {
    return [rule.target, rule.modifier, this.resolveTargetValue(rule)].join(
      ':'
    );
  }

  /**
   * Resolve the target value of a rule, throwing an Error in case there is no target, the target is 'cookie' and the
   * rule has no modifier, or the target is 'request_number'.
   *
   * @param rule
   * @returns
   */
  private resolveTargetValue(rule: ResponseRule): any {
    let value: any;

    if (!rule.target) {
      throw Error('Cannot resolve target value for rule with no target');
    } else if (rule.target === 'request_number') {
      throw Error("Cannot resolve target value for 'request_number' target");
    } else if (rule.target === 'cookie') {
      if (rule.modifier) {
        value = this.request.cookies && this.request.cookies[rule.modifier];
      } else {
        throw Error(
          "Cannot resolve target value for rule with unspecified 'cookie' target"
        );
      }
    } else if (rule.target === 'header') {
      value = this.request.header(rule.modifier);
    } else if (rule.modifier) {
      let path: string | string[] = rule.modifier;

      if (typeof path === 'string') {
        path = convertPathToArray(path);
      }

      value = objectPathGet(this.targets[rule.target], path);
    } else if (rule.target === 'body') {
      value = this.targets.bodyRaw;
    }

    return value;
  }

  /**
   * Check a rule validity and invert it if invert is at true
   *
   * @param rule
   * @param requestNumber
   * @returns
   */
  private isValid(rule: ResponseRule, requestNumber: number) {
    let isValid = this.isValidRule(rule, requestNumber);

    if (rule.invert) {
      isValid = !isValid;
    }

    return isValid;
  }

  /**
   * Check if a rule is valid by comparing the resolved target value with the target value
   */
  private isValidRule = (
    rule: ResponseRule,
    requestNumber: number
  ): boolean => {
    let value: any;

    if (rule.target === 'request_number') {
      value = requestNumber;
    } else {
      try {
        value = this.resolveTargetValue(rule);
      } catch (error: any) {
        return false;
      }
    }

    if (rule.operator === 'null' && rule.modifier) {
      return value === null || value === undefined;
    }

    if (rule.operator === 'empty_array' && rule.modifier) {
      return Array.isArray(value) && value.length < 1;
    }

    if (value === undefined) {
      return false;
    }

    // value may be explicitly null (JSON), this is considered as an empty string
    if (value === null) {
      value = '';
    }

    // rule value may be explicitly null (is shouldn't anymore), this is considered as an empty string too
    if (rule.value === null) {
      rule.value = '';
    }

    let regex: RegExp;
    let isMatch;

    if (rule.operator === 'regex') {
      regex = new RegExp(rule.value);

      isMatch = Array.isArray(value)
        ? value.some((arrayValue) => regex.test(arrayValue))
        : regex.test(value);
    } else if (Array.isArray(value)) {
      isMatch = value.includes(rule.value);
    } else {
      isMatch = String(value) === String(rule.value);
    }

    return isMatch;
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

    this.targets = {
      body,
      query: this.request.query,
      params: this.request.params,
      bodyRaw: this.request.stringBody
    };
  }
}
