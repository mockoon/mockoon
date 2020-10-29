import { Request } from 'express';
import { get as objectPathGet } from 'object-path';
import { parse as qsParse, ParsedUrlQuery } from 'querystring';
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
    private request: Request,
    private enableRandomStatusCode: Boolean
  ) {
    this.extractTargets();
  }

  /**
   * Choose the route response depending on the first fulfilled rule.
   * If no rule has been fulfilled get the first route response.
   */
  public chooseResponse(): RouteResponse {
    if (this.enableRandomStatusCode) {
      const randomStatus = Math.floor(Math.random() * this.routeResponses.length) + 1;
      let response = this.routeResponses[randomStatus];


      if (response === undefined) {
        response = this.routeResponses[0];
      }

      return response;
    } else {
      let response = this.routeResponses.find((routeResponse) =>
        routeResponse.rulesOperator === 'AND'
          ? !!routeResponse.rules.every(this.isValidRule)
          : !!routeResponse.rules.find(this.isValidRule)
      );

      if (response === undefined) {
        response = this.routeResponses[0];
      }

      return response;
    }
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
      value = objectPathGet(this.targets[rule.target], rule.modifier);
    }

    if (value === undefined) {
      return false;
    }

    let regex: RegExp;
    if (rule.isRegex) {
      regex = new RegExp(rule.value);

      return Array.isArray(value)
        ? value.some((arrayValue) => regex.test(arrayValue))
        : regex.test(value);
    }

    if (Array.isArray(value)) {
      return value.includes(rule.value);
    }

    return value.toString() === rule.value.toString();
  };

  /**
   * Extract rules targets from the request (body, headers, etc)
   */
  private extractTargets() {
    const requestContentType = this.request.header('Content-Type');
    let body: ParsedUrlQuery | JSON = {};

    try {
      if (requestContentType.includes('application/x-www-form-urlencoded')) {
        body = qsParse(this.request.body);
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
