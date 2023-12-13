import { parse } from "$lib/parser.ts";
import { visitor } from "$lib/visitor.ts";
import { generate } from "$lib/codegen.ts";

const decoder = new TextDecoder("utf-8");
const source = decoder.decode(Deno.readFileSync("./in.dwc"));
const res = parse(source);
const dwAst = visitor.visit(res.cst, { sourceName: "in.dwc" });
const jsAst = dwAst.transpile();
const js = generate(jsAst);

console.log(js);
