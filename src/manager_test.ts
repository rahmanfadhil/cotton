import { testDB } from "./testutils.ts";
import {
  Model,
  Column,
  PrimaryColumn,
  Relation,
  RelationType,
} from "./model.ts";
import { Manager } from "./manager.ts";
import { assert, assertEquals, assertThrowsAsync } from "../testdeps.ts";

@Model("users")
class User {
  @PrimaryColumn()
  id!: number;

  @Column({ name: "first_name", isNullable: false })
  firstName!: string;

  @Column({ name: "last_name", isNullable: false })
  lastName!: string;

  @Column()
  age!: number;

  @Column({ name: "created_at", default: () => new Date() })
  createdAt!: Date;

  @Column({ name: "is_active", default: false })
  isActive!: boolean;

  @Relation(RelationType.HasMany, () => Product, "user_id")
  products!: Product[];
}

@Model("products")
class Product {
  @PrimaryColumn()
  id!: number;

  @Column({ isNullable: false })
  title!: string;

  @Relation(RelationType.BelongsTo, () => User, "user_id")
  user!: User;
}

testDB(
  "Manager.save() -> should save a new record to the database and update it if something changed",
  async (client) => {
    let result = await client.query("SELECT id FROM users;");
    assertEquals(result.length, 0);

    const manager = new Manager(client);
    const user = new User();
    user.firstName = "John";
    user.lastName = "Doe";
    user.age = 16;
    await manager.save(user);

    assertEquals(user.isActive, false);
    assert(user.createdAt instanceof Date);

    result = await client.query("SELECT id, first_name FROM users;");
    assertEquals(result.length, 1);
    assertEquals(result[0].id, user.id);
    assertEquals(result[0].first_name, "John");

    user.firstName = "Jane";
    await manager.save(user);

    result = await client.query("SELECT id, first_name FROM users;");
    assertEquals(result.length, 1);
    assertEquals(result[0].id, user.id);
    assertEquals(result[0].first_name, "Jane");
  },
);

testDB(
  "Manager.save() -> throw an error if the object is not a validmodel",
  async (client) => {
    const manager = new Manager(client);
    class Article {}
    const article = new Article();
    await assertThrowsAsync(
      async () => {
        await manager.save(article);
      },
      Error,
      "Class 'Article' must be wrapped with @Model decorator!",
    );
  },
);

// testDB(
//   "Manager.save() -> should save the relations",
//   () => {
//   },
// );
