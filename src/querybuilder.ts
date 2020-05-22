enum QueryStackType {
  Where,
  AndWhere,
  NotWhere,
  Limit,
  OrderBy,
}

interface QueryStack {
  type: QueryStackType;
  data: any;
  fieldName?: string;
}

export class QueryBuilder {
  private stacks: QueryStack[] = [];
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private whereStack(filter: string, value: any): QueryStack {
    switch (typeof value) {
      case "string":
        // TODO: clean value to prevent SQL injection
        value = `'${value}'`;
        break;

      case "boolean":
        value = value ? "1" : "0";

      case "number":
        value = value.toString();

      default:
        break;
    }

    return {
      type: QueryStackType.Where,
      data: filter.replace("?", value),
    };
  }

  public where(filter: string, value?: any): QueryBuilder {
    const stack = this.whereStack(filter, value);
    this.stacks.push(stack);
    return this;
  }

  public andWhere(filter: string, value?: any): QueryBuilder {
    const stack = this.whereStack(filter, value);
    this.stacks.push({ ...stack, type: QueryStackType.AndWhere });
    return this;
  }

  public notWhere(filter: string, value?: any): QueryBuilder {
    const stack = this.whereStack(filter, value);
    this.stacks.push({ ...stack, type: QueryStackType.NotWhere });
    return this;
  }

  /**
   * Sort a column
   * 
   * @param fieldName Table field that you want to sort
   * @param order ASC or DESC
   */
  public orderBy(fieldName: string, order: "ASC" | "DESC"): QueryBuilder {
    this.stacks.push({
      type: QueryStackType.OrderBy,
      fieldName,
      data: order,
    });
    return this;
  }

  /**
   * Limit query result
   * 
   * @param limit Limit number
   */
  public limit(limit: number): QueryBuilder {
    this.stacks.push({
      type: QueryStackType.Limit,
      data: limit,
    });
    return this;
  }

  public first(): QueryBuilder {
    return this.limit(1);
  }

  public getSQL(): string {
    let queryString = `SELECT * FROM ${this.tableName} `;

    for (let index = 0; index < this.stacks.length; index++) {
      const stack = this.stacks[index];

      switch (stack.type) {
        case QueryStackType.Where:
          queryString += `WHERE ${stack.data} `;
          break;

        case QueryStackType.AndWhere:
          queryString += `AND ${stack.data} `;
          break;

        case QueryStackType.OrderBy:
          queryString += `ORDER BY ${stack.fieldName} ${stack.data}`;
          break;

        case QueryStackType.NotWhere:
          const isWhereExist = this.stacks.find(
            (item) => item.type == QueryStackType.Where,
          );
          queryString += isWhereExist
            ? `NOT ${stack.data} `
            : `WHERE NOT ${stack.data}`;
          break;

        case QueryStackType.Limit:
          queryString += `LIMIT ${stack.data} `;
          break;

        default:
          break;
      }
    }

    return queryString.trim() + ";";
  }
}

