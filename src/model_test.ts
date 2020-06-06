import { testDB } from './testutils.ts';
import { Model, FieldType } from './model.ts';
import { assertEquals } from '../testdeps.ts';
import { DateUtils } from './utils/date.ts';

class User extends Model {
  static tableName = 'users';
  static fields = {
    email: { type: FieldType.STRING },
    age: { type: FieldType.NUMBER },
    created_at: { type: FieldType.DATE },
  };

  email!: string;
  age!: number;
  created_at!: Date;
}

testDB('Model: find', async (client) => {
  const date = new Date('5 June, 2020');
  await client.execute(
    `INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '${DateUtils.formatDate(
      date
    )}')`
  );

  client.addModel(User);

  const users = await User.find();
  assertEquals(Array.isArray(users), true);
  assertEquals(users.length, 1);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].email, 'a@b.com');
  assertEquals(users[0].age, 16);
  assertEquals(users[0].created_at, date);
});

testDB('Model: findOne', async (client) => {
  const date = new Date('5 June, 2020');
  await client.execute(
    `INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '${DateUtils.formatDate(
      date
    )}')`
  );

  client.addModel(User);

  const user = await User.findOne(1);
  assertEquals(user instanceof User, true);
  assertEquals(user?.id, 1);
  assertEquals(user?.email, 'a@b.com');
  assertEquals(user?.created_at, date);
  assertEquals(user?.age, 16);
});

testDB('Model: save', async (client) => {
  const date = new Date('5 June, 2020');

  client.addModel(User);

  let users = await User.find();
  assertEquals(users.length, 0);

  const user = new User();
  user.email = 'a@b.com';
  user.age = 16;
  user.created_at = date;
  await user.save();

  assertEquals(user.id, 1);
  assertEquals(user.email, 'a@b.com');
  assertEquals(user.age, 16);
  assertEquals(user.created_at, date);

  users = await User.find();
  assertEquals(users.length, 1);
  assertEquals(users[0] instanceof User, true);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].email, 'a@b.com');
  assertEquals(users[0].age, 16);
  assertEquals(users[0].created_at, date);
});

testDB('Model: insert', async (client) => {
  const date = new Date('5 June, 2020');

  client.addModel(User);

  let users = await User.find();
  assertEquals(users.length, 0);

  const user = await User.insert({
    email: 'a@b.com',
    age: 16,
    created_at: date,
  });
  assertEquals(user instanceof User, true);
  assertEquals(user.id, 1);
  assertEquals(user.email, 'a@b.com');
  assertEquals(user.age, 16);
  assertEquals(user.created_at, date);

  users = await User.find();
  assertEquals(users.length, 1);
  assertEquals(users[0] instanceof User, true);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].email, 'a@b.com');
  assertEquals(users[0].age, 16);
  assertEquals(users[0].created_at, date);
});

testDB('Model: truncate', async (client) => {
  const date = new Date('5 June, 2020');
  await client.execute(
    `INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '${DateUtils.formatDate(
      date
    )}')`
  );
  await client.execute(
    `INSERT INTO users (email, age, created_at) VALUES ('b@c.com', 16, '${DateUtils.formatDate(
      date
    )}')`
  );

  client.addModel(User);

  await User.truncate();

  const users = await User.find();
  assertEquals(users.length, 0);
});
