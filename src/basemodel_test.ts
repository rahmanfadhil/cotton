import { BaseModel } from "./basemodel.ts";
import { assertEquals, stub } from "../testdeps.ts";
import { Manager } from "./manager.ts";

class User extends BaseModel {}

Deno.test("BaseModel.find() -> should call Manager.find()", () => {
  const returned: any = Symbol();
  const parameter: any = Symbol();

  const manager = new Manager({} as any);
  const managerStub = stub(manager, "find", [returned]);

  (User as any).manager = manager;

  assertEquals(User.find(parameter), returned);
  assertEquals(managerStub.calls, [{
    args: [User, parameter],
    self: manager,
    returned,
  }]);
});

Deno.test("BaseModel.findOne() -> should call Manager.findOne()", () => {
  const returned: any = Symbol();
  const parameter: any = Symbol();

  const manager = new Manager({} as any);
  const managerStub = stub(manager, "findOne", [returned]);

  (User as any).manager = manager;

  assertEquals(User.findOne(parameter), returned);
  assertEquals(managerStub.calls, [{
    args: [User, parameter],
    self: manager,
    returned,
  }]);
});

Deno.test("BaseModel.insert() -> should call Manager.insert()", () => {
  const returned: any = Symbol();
  const parameter: any = Symbol();

  const manager = new Manager({} as any);
  const managerStub = stub(manager, "insert", [returned]);

  (User as any).manager = manager;

  assertEquals(User.insert(parameter), returned);
  assertEquals(managerStub.calls, [{
    args: [User, parameter],
    self: manager,
    returned,
  }]);
});

Deno.test("BaseModel.save() -> should call Manager.save()", () => {
  const returned: any = Symbol();

  const manager = new Manager({} as any);
  const managerStub = stub(manager, "save", [returned]);

  (User as any).manager = manager;

  const user = new User();

  assertEquals(user.save(), returned);
  assertEquals(managerStub.calls, [{ args: [user], self: manager, returned }]);
});

Deno.test("BaseModel.remove() -> should call Manager.remove()", () => {
  const returned: any = Symbol();

  const manager = new Manager({} as any);
  const managerStub = stub(manager, "remove", [returned]);

  (User as any).manager = manager;

  const user = new User();

  assertEquals(user.remove(), returned);
  assertEquals(managerStub.calls, [{ args: [user], self: manager, returned }]);
});