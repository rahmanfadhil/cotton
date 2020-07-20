import { ManagedModel } from "./managedmodel.ts";
import { assertEquals, spy } from "../testdeps.ts";

class User extends ManagedModel {}

Deno.test("ManagedModel.find() -> should call Manager.find()", () => {
  const self = { find: spy() };
  const parameter: any = Symbol();

  (User as any).manager = self;
  User.find(parameter);

  assertEquals(self.find.calls, [{ args: [User, parameter], self }]);
});

Deno.test("ManagedModel.findOne() -> should call Manager.findOne()", () => {
  const self = { findOne: spy() };
  const parameter: any = Symbol();

  (User as any).manager = self;
  User.findOne(parameter);

  assertEquals(self.findOne.calls, [{ args: [User, parameter], self }]);
});

Deno.test("ManagedModel.insert() -> should call Manager.insert()", () => {
  const self = { insert: spy() };
  const parameter: any = Symbol();

  (User as any).manager = self;
  User.insert(parameter);

  assertEquals(self.insert.calls, [{ args: [User, parameter], self }]);
});

Deno.test("ManagedModel.save() -> should call Manager.save()", () => {
  const self = { save: spy() };

  (User as any).manager = self;
  const user = new User();
  user.save();

  assertEquals(self.save.calls, [{ args: [user], self }]);
});

Deno.test("ManagedModel.remove() -> should call Manager.remove()", () => {
  const self = { remove: spy() };

  (User as any).manager = self;
  const user = new User();
  user.remove();

  assertEquals(self.remove.calls, [{ args: [user], self }]);
});
