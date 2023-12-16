import { parse } from "$lib/parser.ts";
import { visitor } from "$lib/visitor.ts";
import { generate } from "$lib/codegen.ts";

const decoder = new TextDecoder("utf-8");
const source = decoder.decode(Deno.readFileSync("./examples/in.dw"));
const res = parse(source);
res.lexErrors.forEach((err) => console.error(err));
res.parseErrors.forEach((err) => console.error(err));
const dwAst = visitor.visit(res.cst, { sourceName: "in.dw" });
const jsAst = dwAst.transpile();
const js = generate(jsAst);

console.log(js);
