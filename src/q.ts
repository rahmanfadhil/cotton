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

/** Query expression builder */
export class Q {
  constructor(
    public operator: QueryOperator,
    public value: DatabaseValues | DatabaseValues[],
  ) {}

  // --------------------------------------------------------------------------------
  // GENERIC
  // --------------------------------------------------------------------------------

  /** The value is one of the given values */
  public static in(values: DatabaseValues[]): Q {
    return new Q(QueryOperator.In, values);
  }

  /** The value is not one of the given values */
  public static notIn(values: DatabaseValues[]): Q {
    return new Q(QueryOperator.NotIn, values);
  }

  /** The value (number) is between these numbers */
  public static between(value1: DatabaseValues, value2: DatabaseValues): Q {
    return new Q(QueryOperator.Between, [value1, value2]);
  }

  /** The value (number) is between these numbers */
  public static notBetween(value1: DatabaseValues, value2: DatabaseValues): Q {
    return new Q(QueryOperator.NotBetween, [value1, value2]);
  }

  /** LIKE operator */
  public static like(value: string): Q {
    return new Q(QueryOperator.Like, value);
  }

  /** NOT LIKE operator */
  public static notLike(value: string): Q {
    return new Q(QueryOperator.NotLike, value);
  }

  /** ILIKE (case-insensitive) operator */
  public static ilike(value: string): Q {
    return new Q(QueryOperator.Ilike, value);
  }

  /** NOT ILIKE (case-insensitive) operator */
  public static notIlike(value: string): Q {
    return new Q(QueryOperator.NotIlike, value);
  }
  // --------------------------------------------------------------------------------
  // NUMERIC
  // --------------------------------------------------------------------------------

  /** Is equal to (=) */
  public static eq(value: DatabaseValues): Q {
    return new Q(QueryOperator.Equal, value);
  }

  /** Is not equal to (!=) */
  public static neq(value: DatabaseValues): Q {
    return new Q(QueryOperator.NotEqual, value);
  }

  /** Greater than (>) */
  public static gt(value: DatabaseValues): Q {
    return new Q(QueryOperator.GreaterThan, value);
  }

  /** Greater than equal (>=) */
  public static gte(value: DatabaseValues): Q {
    return new Q(QueryOperator.GreaterThanEqual, value);
  }

  /** Lower than (<) */
  public static lt(value: DatabaseValues): Q {
    return new Q(QueryOperator.LowerThan, value);
  }

  /** Lower than equal (<=) */
  public static lte(value: DatabaseValues): Q {
    return new Q(QueryOperator.LowerThanEqual, value);
  }

  // --------------------------------------------------------------------------------
  // NULL
  // --------------------------------------------------------------------------------

  /** The value is null */
  public static null(): Q {
    return new Q(QueryOperator.Null, null);
  }

  /** The value is not null */
  public static notNull(): Q {
    return new Q(QueryOperator.NotNull, null);
  }
}
