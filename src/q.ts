import type { DatabaseValues } from "./adapters/adapter.ts";

export enum QueryOperator {
  In = "IN",
  NotIn = "NOT IN",
  Between = "BETWEEN",
  NotBetween = "NOT BETWEEN",
  Like = "LIKE",
  NotLike = "NOT LIKE",
  Ilike = "ILIKE",
  NotIlike = "ILIKE",
  Equal = "=",
  NotEqual = "!=",
  GreaterThan = ">",
  GreaterThanEqual = ">=",
  LowerThan = "<",
  LowerThanEqual = "<=",
  Null = "IS NULL",
  NotNull = "IS NOT NULL",
}

export class QueryExpression {
  constructor(
    public operator: QueryOperator,
    public value: DatabaseValues | DatabaseValues[],
  ) {}
}

/** Query expression builder */
export const Q = {
  // --------------------------------------------------------------------------------
  // GENERIC
  // --------------------------------------------------------------------------------

  /** The value is one of the given values */
  in(values: DatabaseValues[]): QueryExpression {
    return new QueryExpression(QueryOperator.In, values);
  },

  /** The value is not one of the given values */
  notIn(values: DatabaseValues[]): QueryExpression {
    return new QueryExpression(QueryOperator.NotIn, values);
  },

  /** The value (number) is between these numbers */
  between(value1: DatabaseValues, value2: DatabaseValues): QueryExpression {
    return new QueryExpression(QueryOperator.Between, [value1, value2]);
  },

  /** The value (number) is between these numbers */
  notBetween(
    value1: DatabaseValues,
    value2: DatabaseValues,
  ): QueryExpression {
    return new QueryExpression(QueryOperator.NotBetween, [value1, value2]);
  },

  /** LIKE operator */
  like(value: string): QueryExpression {
    return new QueryExpression(QueryOperator.Like, value);
  },

  /** NOT LIKE operator */
  notLike(value: string): QueryExpression {
    return new QueryExpression(QueryOperator.NotLike, value);
  },

  /** ILIKE (case-insensitive) operator */
  ilike(value: string): QueryExpression {
    return new QueryExpression(QueryOperator.Ilike, value);
  },

  /** NOT ILIKE (case-insensitive) operator */
  notIlike(value: string): QueryExpression {
    return new QueryExpression(QueryOperator.NotIlike, value);
  },
  // --------------------------------------------------------------------------------
  // NUMERIC
  // --------------------------------------------------------------------------------

  /** Is equal to (=) */
  eq(value: DatabaseValues): QueryExpression {
    return new QueryExpression(QueryOperator.Equal, value);
  },

  /** Is not equal to (!=) */
  neq(value: DatabaseValues): QueryExpression {
    return new QueryExpression(QueryOperator.NotEqual, value);
  },

  /** Greater than (>) */
  gt(value: DatabaseValues): QueryExpression {
    return new QueryExpression(QueryOperator.GreaterThan, value);
  },

  /** Greater than equal (>=) */
  gte(value: DatabaseValues): QueryExpression {
    return new QueryExpression(QueryOperator.GreaterThanEqual, value);
  },

  /** Lower than (<) */
  lt(value: DatabaseValues): QueryExpression {
    return new QueryExpression(QueryOperator.LowerThan, value);
  },

  /** Lower than equal (<=) */
  lte(value: DatabaseValues): QueryExpression {
    return new QueryExpression(QueryOperator.LowerThanEqual, value);
  },

  // --------------------------------------------------------------------------------
  // NULL
  // --------------------------------------------------------------------------------

  /** The value is null */
  null(): QueryExpression {
    return new QueryExpression(QueryOperator.Null, null);
  },

  /** The value is null */
  notNull(): QueryExpression {
    return new QueryExpression(QueryOperator.NotNull, null);
  },
};
