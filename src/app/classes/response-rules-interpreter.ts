import { Request } from 'express';
import * as objectPath from 'object-path';
import * as queryString from 'querystring';
import {
  ResponseRule,
  ResponseRuleTargets,
  RouteResponse
} from 'src/app/types/route.type';

/**
 * Interpretor for the route response rules.
 * Extract the rules targets from the request (body, headers, etc).
 * Get the first route response for which at least one rule is fulfilled.
 */
export class ResponseRulesInterpreter {
  private targets: { [key in Exclude<ResponseRuleTargets, 'header'>]: any };

  constructor(
    private routeResponses: RouteResponse[],
    private request: Request
  ) {
    this.extractTargets();
  }

  /**
   * Choose the route response depending on the first fulfilled rule.
   * If no rule has been fulfilled get the first route response.
   */
  public chooseResponse(): RouteResponse {
    return (
      this.routeResponses.find(routeResponse => {
        return !!routeResponse.rules.find(this.isValidRule);
      }) || this.routeResponses[0]
    );
  }

  /**
   * Check if a rule is valid by comparing the value extracted from the target to the rule value
   */
  private isValidRule = (rule: ResponseRule): boolean => {
    if (!rule.modifier || !rule.target) {
      return false;
    }

    let value;

    if (rule.target === 'header') {
      value = this.request.header(rule.modifier);
    } else {
      value = objectPath.get(this.targets[rule.target], rule.modifier);
    }

    if (value === undefined) {
      return false;
    }

    let regex: RegExp;
    if (rule.isRegex) {
      regex = new RegExp(rule.value);

      return Array.isArray(value)
        ? value.some(arrayValue => regex.test(arrayValue))
        : regex.test(value);
    }

    if (Array.isArray(value)) {
      return value.includes(rule.value);
    }

    return value === rule.value;
  };

  /**
   * Extract rules targets from the request (body, headers, etc)
   */
  private extractTargets() {
    const requestContentType = this.request.header('Content-Type');
    let body: queryString.ParsedUrlQuery | JSON = {};

    try {
      if (requestContentType.includes('application/x-www-form-urlencoded')) {
        body = queryString.parse(this.request.body);
      } else if (requestContentType.includes('application/json')) {
        body = JSON.parse(this.request.body);
      }
    } catch (e) {
      body = {};
    }

    this.targets = {
      body,
      query: this.request.query,
      params: this.request.params
    };
  }
}
