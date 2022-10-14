import Fastify from "fastify";
import routes from "./routes/index.js";
import mercurius from "mercurius";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/authentication.js";
import { schema, resolvers } from "./graphql/index.js";
import { prismaForGraphQL } from "./plugins/prisma.js";
import fjwt from "@fastify/jwt";

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        singleLine: true,
      },
    },
    production: true,
    test: false,
  },
};

const fastify = Fastify({
  logger: envToLogger[process.env.environment] ?? true,
});

fastify.register(fjwt, { secret: process.env.JWT_SECRET });
fastify.register(mercurius, {
  schema,
  resolvers,
  context: (request, reply) => {
    return { prismaForGraphQL };
  },
  graphiql: eval(process.env.GRAPHQLCLIENT),
});
fastify.register(prismaPlugin);
fastify.register(authPlugin);
fastify.register(routes);

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
