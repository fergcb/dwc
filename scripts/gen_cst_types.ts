import { generateCstDts } from "npm:chevrotain";
import { productions } from "$lib/parser.ts";

const typeDeclarations = generateCstDts(productions);

Deno.writeTextFileSync(Deno.cwd() + "/lib/cst.d.ts", typeDeclarations);
