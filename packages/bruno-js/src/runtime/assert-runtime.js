const _ = require('lodash');
const chai = require('chai');  
const Bru = require('../bru');
const BrunoRequest = require('../bruno-request');
const { evaluateJsExpression, createResponseParser } = require('../utils');

const { expect } = chai;

/**
 * Assertion operators
 * 
 * eq          : equal to
 * neq         : not equal to
 * gt          : greater than
 * gte         : greater than or equal to
 * lt          : less than
 * lte         : less than or equal to
 * in          : in
 * notIn       : not in
 * contains    : contains
 * notContains : not contains
 * length      : length
 * matches     : matches
 * notMatches  : not matches
 * startsWith  : starts with
 * endsWith    : ends with
 * between     : between
 * isEmpty     : is empty
 * isNull      : is null
 * isUndefined : is undefined
 * isDefined   : is defined
 * isTruthy    : is truthy
 * isFalsy     : is falsy
 * isJson      : is json
 * isNumber    : is number
 * isString    : is string
 * isBoolean   : is boolean
 */
const parseAssertionOperator = (str = '') => {
  if(!str || typeof str !== 'string' || !str.length) {
    return {
      operator: 'eq',
      value: str
    };
  }

  const operators = [
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn',
    'contains', 'notContains', 'length', 'matches', 'notMatches',
    'startsWith', 'endsWith', 'between', 'isEmpty', 'isNull', 'isUndefined',
    'isDefined', 'isTruthy', 'isFalsy', 'isJson', 'isNumber', 'isString', 'isBoolean'
  ];

  const [operator, ...rest] = str.trim().split(' ');
  const value = rest.join(' ');

  if(operators.includes(operator)) {
    return {
      operator,
      value
    };
  }

  return {
    operator: 'eq',
    value: str
  };
};

class AssertRuntime {
  runAssertions(assertions, request, response, envVariables, collectionVariables, collectionPath) {
    const enabledAssertions = _.filter(assertions, (a) => a.enabled);
    if(!enabledAssertions.length) {
      return [];
    }

    const bru = new Bru(envVariables, collectionVariables);
    const req = new BrunoRequest(request);
    const res = createResponseParser(response);

    const bruContext = {
      bru,
      req,
      res
    };

    const context = {
      ...envVariables,
      ...collectionVariables,
      ...bruContext
    }

    const assertionResults = [];

    // parse assertion operators
    for (const v of enabledAssertions) {
      const lhsExpr = v.name;
      const rhsExpr = v.value;
      const {
        operator,
        value: rhsOperand
      } = parseAssertionOperator(rhsExpr);

      try {
        const lhs = evaluateJsExpression(lhsExpr, context);
        const rhs = evaluateJsExpression(rhsOperand, context);

        switch(operator) {
          case 'eq':
            expect(lhs).to.equal(rhs);
            break;
          case 'neq':
            expect(lhs).to.not.equal(rhs);
            break;
          case 'gt':
            expect(lhs).to.be.greaterThan(rhs);
            break;
          case 'gte':
            expect(lhs).to.be.greaterThanOrEqual(rhs);
            break;
          case 'lt':
            expect(lhs).to.be.lessThan(rhs);
            break;
          case 'lte':
            expect(lhs).to.be.lessThanOrEqual(rhs);
            break;
          case 'in':
            expect(lhs).to.be.oneOf(rhs);
            break;
          case 'notIn':
            expect(lhs).to.not.be.oneOf(rhs);
            break;
          case 'contains':
            expect(lhs).to.include(rhs);
            break;
          case 'notContains':
            expect(lhs).to.not.include(rhs);
            break;
          case 'length':
            expect(lhs).to.have.lengthOf(rhs);
            break;
          case 'matches':
            expect(lhs).to.match(new RegExp(rhs));
            break;
          case 'notMatches':
            expect(lhs).to.not.match(new RegExp(rhs));
            break;
          case 'startsWith':
            expect(lhs).to.startWith(rhs);
            break;
          case 'endsWith':
            expect(lhs).to.endWith(rhs);
            break;
          case 'between':
            const [min, max] = value.split(',');
            expect(lhs).to.be.within(min, max);
            break;
          case 'isEmpty':
            expect(lhs).to.be.empty;
            break;
          case 'isNull':
            expect(lhs).to.be.null;
            break;
          case 'isUndefined':
            expect(lhs).to.be.undefined;
            break;
          case 'isDefined':
            expect(lhs).to.not.be.undefined;
            break;
          case 'isTruthy':
            expect(lhs).to.be.true;
            break;
          case 'isFalsy':
            expect(lhs).to.be.false;
            break;
          case 'isJson':
            expect(lhs).to.be.json;
            break;
          case 'isNumber':
            expect(lhs).to.be.a('number');
            break;
          case 'isString':
            expect(lhs).to.be.a('string');
            break;
          case 'isBoolean':
            expect(lhs).to.be.a('boolean');
            break;
          default:
            expect(lhs).to.equal(rhs);
            break;
        }

        assertionResults.push({
          lhsExpr,
          rhsExpr,
          rhsOperand,
          operator,
          status: 'pass'
        });
      }
      catch (err) {
        assertionResults.push({
          lhsExpr,
          rhsExpr,
          rhsOperand,
          operator,
          status: 'fail',
          error: err.message
        });
      }
    }

    return assertionResults;
  }
}

module.exports = AssertRuntime;