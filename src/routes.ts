import {Express} from "express";
import {parseTag} from "./parser.js";
import {Tag} from "./tags.js";

const DEFAULT_INDENT = 2;
const MIN_INDENT = 0;
const MAX_INDENT = 10;
const DEFAULT_RESOLVE = "false";

const nanos = (): number => Math.ceil(performance.now() * 1_000_000);
const register = (app: Express) =>
    app.post("/api/v1/format", (req, res) => {
      const totalStart = nanos();

      const suppliedIndent = Number(req.query.indent || DEFAULT_INDENT);
      const indent = Math.min(MAX_INDENT, Math.max(MIN_INDENT, suppliedIndent));
      res.header("Indent", `${indent}`);
      const resolveTags = (req.query.resolve ?? DEFAULT_RESOLVE) === "true";

      const parseStart = nanos();
      let nbt: Tag<any> | undefined = undefined;
      let nbtError: string | undefined = undefined;
      try {
        nbt = parseTag(req.body, resolveTags);
      } catch (error) {
        nbtError = `Nbt: ${error.toString()}`;
      }
      const parseDur = nanos() - parseStart;
      res.header("Parsing-Time", `${parseDur}`);

      const stringifyStart = nanos();
      const stringifedNbt = nbt?.asString(indent);
      const stringifyDur = nanos() - stringifyStart;
      res.header("Format-Time", `${stringifyDur}`);

      const totalDur = nanos() - totalStart;
      res.header("Total-Time", `${totalDur}`);

      if (nbtError) {
        res.status(400).send(nbtError);
      } else if (stringifedNbt) {
        res.send(stringifedNbt);
      }
    });
export default register;
