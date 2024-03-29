import path from "path";
import { fileURLToPath } from "url";
import Fastify from "fastify";
import view from "@fastify/view";
import fastifyStatic from "@fastify/static";
import { Liquid } from "liquidjs";
import fastifyVite from "./plugins/fastify-vite.js";
import { PROD } from "./constants/index.js";
import { getTemplatePath } from "./decorators/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


// plugins (from the Fastify ecosystem)
fastify.register(view, {
  engine: {
    liquid: new Liquid({
      root: getTemplatePath(),
      extname: ".html",
    }),
  },
});

if (PROD) {
  // TODO: add helmet, env vars, etag, compression
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, "dist/client"),
    prefixAvoidTrailingSlash: true,
  });
} else {
  // TODO: add documentation for this
  fastify.register(import("@fastify/middie"));
}

// your plugins (your custom plugins)
fastify.register(fastifyVite);

// decorators
fastify.decorateReply(getTemplatePath.name, getTemplatePath);

// hooks

// your services
fastify.get("/", async (request, reply) => {
  const initialState = [{ id: "counter", props: { count: 24 } }];

  try {
    let template: string | undefined = await fastify.view(
      reply.getTemplatePath("index.html"),
      { initialState }
    );

    template = await reply.render({
      url: request.url,
      template,
      initialState,
    });

    reply.status(200).header("Content-Type", "text/html").send(template);
  } catch (e) {
    console.error(e);
  }
});
fastify.decorate(getTemplatePath.name, getTemplatePath);

try {
  await fastify.listen({ port: 3000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
