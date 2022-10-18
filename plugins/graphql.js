import fp from "fastify-plugin";
import mercurius from "mercurius";
import mercuriusCache from "mercurius-cache";
import { schema, resolvers } from "../graphql/index.js";
import { prismaForGraphQL } from "./prisma.js";
import IORedis from "ioredis";

const redis = new IORedis({
  host: "127.0.0.1",
  port: 55000,
  username: "default",
  password: "redispw",
});

async function graphqPlugin(fastify, opts) {
  fastify.register(mercurius, {
    schema,
    resolvers,
    context: (request, reply) => {
      return { prismaForGraphQL };
    },
    graphiql: eval(process.env.GRAPHQLCLIENT),
  });

  // ===========  Cache for GRAPHQL  ===========

  fastify.register(mercuriusCache, {
    ttl: 10,
    policy: {
      Query: {
        shipwrecks: true,
      },
    },
    storage: {
      type: "redis",
      options: {
        client: redis,
        invalidation: {
          referencesTTL: 60,
        },
      },
    },
    onDedupe: function (type, fieldName) {
      fastify.log.info({ msg: "deduping", type, fieldName });
    },
    onHit: function (type, fieldName) {
      fastify.log.info({ msg: "hit from cache", type, fieldName });
    },
    onMiss: function (type, fieldName) {
      fastify.log.info({ msg: "miss from cache", type, fieldName });
    },
    onSkip: function (type, fieldName) {
      fastify.log.info({ msg: "skip cache", type, fieldName });
    },
    logInterval: 3600,
    // caching stats
    logReport: (report) => {
      fastify.log.info({ msg: "cache stats" });
      console.table(report);
    },
  });
}

export default fp(graphqPlugin, {
  name: "graphqPlugin",
});