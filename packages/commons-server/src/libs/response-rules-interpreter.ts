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
   * If no rule has been fulfilled get the first route response.
   */
  public chooseResponse(requestNumber: number): RouteResponse {
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
              this.isValid(rule, requestNumber)
            )
          : routeResponse.rules.some((rule) =>
              this.isValid(rule, requestNumber)
            );
      });

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
  private isValid(rule: ResponseRule, requestNumber: number) {
    let isValid = this.isValidRule(rule, requestNumber);

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
    requestNumber: number
  ): boolean => {
    if (!rule.target) {
      return false;
    }

    let value: any;

    if (rule.target === 'request_number') {
      value = requestNumber;
    }

    if (rule.target === 'cookie') {
      if (!rule.modifier) {
        return false;
      }
      value = this.request.cookies && this.request.cookies[rule.modifier];
    } else if (rule.target === 'header') {
      value = this.request.header(rule.modifier);
    } else {
      if (rule.modifier) {
        let path: string | string[] = rule.modifier;

        if (typeof path === 'string') {
          path = convertPathToArray(path);
        }

        value = objectPathGet(this.targets[rule.target], path);
      } else if (!rule.modifier && rule.target === 'body') {
        value = this.targets.bodyRaw;
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

    // value may be explicitely null (JSON), this is considered as an empty string
    if (value === null) {
      value = '';
    }

    // rule value may be explicitely null (is shouldn't anymore), this is considered as an empty string too
    if (rule.value === null) {
      rule.value = '';
    }

    let regex: RegExp;

    if (rule.operator.includes('regex')) {
      regex = new RegExp(
        rule.value,
        rule.operator === 'regex_i' ? 'i' : undefined
      );

      return Array.isArray(value)
        ? value.some((arrayValue) => regex.test(arrayValue))
        : regex.test(value);
    }

    if (Array.isArray(value)) {
      return value.includes(rule.value);
    }

    return String(value) === String(rule.value);
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
