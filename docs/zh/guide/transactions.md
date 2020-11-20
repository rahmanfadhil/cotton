# 事务

你可以直接在你的连接实例上使用事务。

```ts
const db = await connect({
  type: "sqlite",
  // other configs...
});

await db.transaction(async () => {
  await db.table("users").insert({ email: "a@b.com" }).execute();
  // other queries...
});
```

如果事务中出现任何问题，你的事务将会自动回滚。如果回滚执行成功，事务将会被自动提交。这样，你就不用担心手动回滚和提交事务了。
