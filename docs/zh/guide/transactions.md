# Transactions

You can perform transactions directly from your connection instance.

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

If an error is thrown within the transaction callback, the transaction will automatically be rolled back. If the callback executes successfully, the transaction will automatically be committed. That way, you don't need to worry about manually rolling back or committing those transactions.
