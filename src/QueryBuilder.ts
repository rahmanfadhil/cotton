enum QueryStackType {
  Where,
  AndWhere,
  NotWhere,
  Limit,
}

interface QueryStack {
  type: QueryStackType;
  data: string | number;
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

  public where(filter: string, value?: string | number): QueryBuilder {
    const stack = this.whereStack(filter, value);
    this.stacks.push(stack);
    return this;
  }

  public andWhere(filter: string, value?: string | number): QueryBuilder {
    const stack = this.whereStack(filter, value);
    this.stacks.push({ ...stack, type: QueryStackType.AndWhere });
    return this;
  }

  public notWhere(filter: string, value?: string | number): QueryBuilder {
    const stack = this.whereStack(filter, value);
    this.stacks.push({ ...stack, type: QueryStackType.NotWhere });
    return this;
  }

  public limit(limit: number): QueryBuilder {
    const stack: QueryStack = {
      type: QueryStackType.Limit,
      data: limit,
    };
    this.stacks.push(stack);
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
