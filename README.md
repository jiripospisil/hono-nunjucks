# Nunjucks for Hono

Adds support for the [Nunjucks](https://mozilla.github.io/nunjucks/) templating 
engine to Hono. Traditional templating engines do not work on serverless
runtimes such as Cloudflare Workers because they rely on file system APIs and
dynamic code evaluation.

Nunjacks is a templating engine with a neat feature which allows it to
precompile templates to plain JavaScript. This code can then be loaded as a
regular module and passed into the engine. This library just contains a little bit
of glue to make working with it more pleasant.

```bash
npm add hono-nunjucks
```

## Usage

1. Create a Nunjucks template within your project. Say "src/templates/hello.html".

```html
<strong>Hello {{ username }}!</strong>
```

2. Compile the template into JavaScript.

```bash
npx hono-nunjucks-precompile src/templates src/precompiled.mjs
```

If you're using Wrangler, you can add a custom build step to watch the "src/template" directory 
and automatically precompile & restart on any changes.

```toml
[build]
command = "npx hono-nunjucks-precompile src/templates src/precompiled.mjs"
cwd = "."
watch_dir = "src/templates"
```

3. Import the "src/compiled.mjs" file and pass it to the middleware.

```typescript
import { installNunjucks } from "hono-nunjucks";
import templates from "./src/precompiled.mjs";

app.use(
  "*",
  installNunjucks({
    templates
  })
);
```

Doing it like this ensures that the server is automatically restarted on changes
and also that the precompiled templates are included in the resulting bundle
(again assuming Cloudflare Workers).

4. Use the template in your code. Note that the extension is automatically
stripped from the name (you reference "hello.html" as "hello" in the render method).

```typescript
async function home(c: Context) {
  const t = c.get("t");
  return c.html(t.render("hello", { username: "rumburak" }));
}
```

5. Have a look at the [documentation](https://mozilla.github.io/nunjucks/templating.html) to 
see all of the available goodies.

## License

ICS
