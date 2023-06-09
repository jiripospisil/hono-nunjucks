import type { MiddlewareHandler } from "hono";
import nunjucks, { ILoader, Loader, LoaderSource } from "nunjucks";

interface Templates {
  [key: string]: any;
}

interface Globals {
  [key: string]: any;
}

interface Filters {
  [key: string]: (...args: any[]) => any;
}

interface Options {
  templates: Templates;
  filters?: Filters;
  globals?: Globals;
}

// An implementation of a Loader which doesn't probe the file system and compile
// on demand (which wouldn't fly on Cloudflare Workers etc.) but rather does
// just a lookup into a static dictionary.
class PrecompiledLoader extends Loader implements ILoader {
  precompiled: any;

  constructor(compiledTemplates: Templates) {
    super();
    this.precompiled = compiledTemplates;
  }

  getSource(name: string): LoaderSource {
    if (this.precompiled[name]) {
      return {
        src: {
          type: "code",
          obj: this.precompiled[name],
        } as any, // trust bro
        noCache: true,
        path: name,
      };
    }

    throw new Error(`Template "${name}" not found. Make sure to run the precompiler first!`);
  }
}

// This is the object you get from c.get("t").
class NunjucksTemplates {
  env: nunjucks.Environment;

  constructor(templates: Templates = {}, filters: Filters = {}, globals: Globals = {}) {
    this.env = new nunjucks.Environment(new PrecompiledLoader(templates));

    for (const [name, fn] of Object.entries(filters)) {
      this.env.addFilter(name, fn);
    }

    for (const [name, value] of Object.entries(globals)) {
      this.env.addGlobal(name, value);
    }
  }

  render(template: string, params: any): string {
    return this.env.render(template, params);
  }
}

// This is the entry point for a Hono application. Use the "static" version of
// the import mechanism to have the output automatically bundled within the app.
//
// import templates from "./templates/compiled.mjs";
//
// app.use(
//   "*",
//   installNunjucks({
//     templates,
//     filters: {},
//     globals: {},
//   })
// );
export function installNunjucks(opts: Options): MiddlewareHandler {
  const nunjucksTemplates = new NunjucksTemplates(opts.templates, opts.filters, opts.globals);

  return async (ctx, next) => {
    ctx.set("t", nunjucksTemplates);
    await next();
  };
}

// Hook the "t" variable into Hono's Context such that you get auto complete
// in c.get.
declare module "hono" {
  interface ContextVariableMap {
    t: NunjucksTemplates;
  }
}
