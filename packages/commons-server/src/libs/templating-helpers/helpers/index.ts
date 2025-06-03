/**
 * Handlebars may insert its own `options` object as the last argument.
 * Be careful when retrieving `defaultValue` or any other last param.
 *
 * use:
 * if (typeof defaultValue === 'object') {
 *   defaultValue = '';
 * }
 *
 * or:
 * args[args.length - 1]
 */

import add from './add';
import array from './array';
import base64 from './base64';
import base64Decode from './base64Decode';
import boolean from './boolean';
import caseFunc from './case';
import ceil from './ceil';
import city from './city';
import color from './color';
import company from './company';
import concat from './concat';
import country from './country';
import countryCode from './countryCode';
import date from './date';
import dateFormat from './dateFormat';
import dateTimeShift from './dateTimeShift';
import defaultFunc from './default';
import divide from './divide';
import domain from './domain';
import email from './email';
import eq from './eq';
import filter from './filter';
import find from './find';
import firstName from './firstName';
import float from './float';
import floor from './floor';
import getVar from './getVar';
import gt from './gt';
import gte from './gte';
import helperMissing from './helperMissing';
import hexColor from './hexColor';
import includes from './includes';
import indexOf from './indexOf';
import int from './int';
import ipv4 from './ipv4';
import ipv6 from './ipv6';
import isValidDate from './isValidDate';
import jmesPath from './jmes-path';
import join from './join';
import jsonParse from './json-parse';
import jsonPath from './json-path';
import { jwtHeader, jwtPayload } from './jwt';
import lastName from './lastName';
import lat from './lat';
import len from './len';
import long from './long';
import lorem from './lorem';
import lowercase from './lowercase';
import lt from './lt';
import lte from './lte';
import modulo from './modulo';
import multiply from './multiply';
import newline from './newline';
import now from './now';
import object from './object';
import objectPath from './object-path';
import objectId from './objectId';
import objectMerge from './objectMerge';
import oneOf from './oneOf';
import padEnd from './padEnd';
import padStart from './padStart';
import parseInt from './parseInt';
import phone from './phone';
import postcode from './postcode';
import repeat from './repeat';
import reverse from './reverse';
import round from './round';
import setVar from './setVar';
import slice from './slice';
import someOf from './someOf';
import sort from './sort';
import sortBy from './sortBy';
import split from './split';
import street from './street';
import stringify from './stringify';
import substr from './substr';
import subtract from './subtract';
import switchFunc from './switch';
import time from './time';
import title from './title';
import tld from './tld';
import toFixed from './toFixed';
import uppercase from './uppercase';
import { guid, uuid } from './uuid';
import zipcode from './zipcode';

export const Helpers = {
  add,
  array,
  base64,
  base64Decode,
  boolean,
  case: caseFunc,
  ceil,
  city,
  color,
  company,
  concat,
  country,
  countryCode,
  date,
  dateFormat,
  isValidDate,
  dateTimeShift,
  default: defaultFunc,
  divide,
  domain,
  email,
  eq,
  filter,
  find,
  firstName,
  float,
  floor,
  getVar,
  gt,
  gte,
  guid,
  uuid,
  helperMissing,
  hexColor,
  includes,
  indexOf,
  int,
  ipv4,
  ipv6,
  jmesPath,
  join,
  jsonParse,
  jsonPath,
  jwtHeader,
  jwtPayload,
  lastName,
  lat,
  len,
  long,
  lorem,
  lowercase,
  lt,
  lte,
  modulo,
  multiply,
  newline,
  now,
  object,
  objectId,
  objectMerge,
  objectPath,
  oneOf,
  padEnd,
  padStart,
  parseInt,
  phone,
  postcode,
  repeat,
  reverse,
  round,
  setVar,
  slice,
  someOf,
  sort,
  sortBy,
  split,
  street,
  stringify,
  substr,
  subtract,
  switch: switchFunc,
  time,
  title,
  tld,
  toFixed,
  uppercase,
  zipcode
};
