import { assert, assertEquals } from "../testdeps.ts";
import { QueryExpression, Q, QueryOperator } from "./q.ts";

Deno.test("QueryOperator -> should be a valid SQL syntax", () => {
  assertEquals(QueryOperator.In, "IN");
  assertEquals(QueryOperator.NotIn, "NOT IN");
  assertEquals(QueryOperator.Between, "BETWEEN");
  assertEquals(QueryOperator.NotBetween, "NOT BETWEEN");
  assertEquals(QueryOperator.Like, "LIKE");
  assertEquals(QueryOperator.NotLike, "NOT LIKE");
  assertEquals(QueryOperator.Ilike, "ILIKE");
  assertEquals(QueryOperator.NotIlike, "ILIKE");
  assertEquals(QueryOperator.Equal, "=");
  assertEquals(QueryOperator.NotEqual, "!=");
  assertEquals(QueryOperator.GreaterThan, ">");
  assertEquals(QueryOperator.GreaterThanEqual, ">=");
  assertEquals(QueryOperator.LowerThan, "<");
  assertEquals(QueryOperator.LowerThanEqual, "<=");
  assertEquals(QueryOperator.Null, "IS NULL");
  assertEquals(QueryOperator.NotNull, "IS NOT NULL");
});

Deno.test("Q.in() -> should return a QueryExpression", () => {
  const q = Q.in([1, 2, 3]);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.In);
});

Deno.test("Q.notIn() -> should return a QueryExpression", () => {
  const q = Q.notIn([1, 2, 3]);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.NotIn);
});

Deno.test("Q.between() -> should return a QueryExpression", () => {
  const q = Q.between(1, 5);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.Between);
});

Deno.test("Q.notBetween() -> should return a QueryExpression", () => {
  const q = Q.notBetween(1, 5);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.NotBetween);
});

Deno.test("Q.like() -> should return a QueryExpression", () => {
  const q = Q.like("%john%");
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.Like);
});

Deno.test("Q.notLike() -> should return a QueryExpression", () => {
  const q = Q.notLike("%john%");
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.NotLike);
});

Deno.test("Q.ilike() -> should return a QueryExpression", () => {
  const q = Q.ilike("%john%");
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.Ilike);
});

Deno.test("Q.notIlike() -> should return a QueryExpression", () => {
  const q = Q.notIlike("%john%");
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.NotIlike);
});

Deno.test("Q.eq() -> should return a QueryExpression", () => {
  const q = Q.eq(7);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.Equal);
});

Deno.test("Q.neq() -> should return a QueryExpression", () => {
  const q = Q.neq(7);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.NotEqual);
});

Deno.test("Q.gt() -> should return a QueryExpression", () => {
  const q = Q.gt(7);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.GreaterThan);
});

Deno.test("Q.gte() -> should return a QueryExpression", () => {
  const q = Q.gte(7);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.GreaterThanEqual);
});

Deno.test("Q.lt() -> should return a QueryExpression", () => {
  const q = Q.lt(7);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.LowerThan);
});

Deno.test("Q.lte() -> should return a QueryExpression", () => {
  const q = Q.lte(7);
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.LowerThanEqual);
});

Deno.test("Q.null() -> should return a QueryExpression", () => {
  const q = Q.null();
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.Null);
});

Deno.test("Q.notNull() -> should return a QueryExpression", () => {
  const q = Q.notNull();
  assert(q instanceof QueryExpression);
  assertEquals(q.operator, QueryOperator.NotNull);
});
