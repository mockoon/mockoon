import { fromSafeString } from '../../utils';

const filter = function (...args) {
  const parameters = args.slice(0, -1);

  if (parameters.length === 0) {
    return '';
  }

  const [arr, ...filters] = parameters;

  if (!(arr instanceof Array)) {
    return '';
  }
  if (!arr.length || !filters.length) {
    return arr;
  }

  const validate = (payload, condition) => {
    if (
      condition !== null &&
      typeof condition === 'object' &&
      !Array.isArray(condition)
    ) {
      if (typeof payload === 'object') {
        const keys = Object.keys(condition);

        return keys.every((k) =>
          validate(payload[k], fromSafeString(condition[k]))
        );
      }

      return false;
    }

    return payload === condition;
  };

  const and = (item, conditions, { or }) =>
    conditions.every((subConditions) => {
      if (Array.isArray(subConditions)) {
        return or(item, subConditions);
      }

      return validate(item, subConditions);
    });
  const or = (item, conditions) =>
    conditions.some((subConditions) => {
      if (Array.isArray(subConditions)) {
        return and(item, subConditions, { or });
      }

      return validate(item, subConditions);
    });

  return arr.filter((item) => or(item, filters));
};

export default filter;
