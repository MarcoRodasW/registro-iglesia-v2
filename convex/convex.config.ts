import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(aggregate, { name: "membersByCreation" });
app.use(aggregate, { name: "membersBySector" });
app.use(aggregate, { name: "usersBySectorAndRole" });

export default app;
