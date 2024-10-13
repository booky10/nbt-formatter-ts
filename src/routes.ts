import { Express } from "express";
import { parseTag } from "./parser.js";

const DEFAULT_INDENT = 2;
const MIN_INDENT = 0;
const MAX_INDENT = 10;

const nanos = (): number => Math.ceil(performance.now() * 1_000_000);
const register = (app: Express) =>
  app.post("/api/v1/format", (req, res, next) => {
    const totalStart = nanos();

    const suppliedIndent = Number(req.query.indent) || DEFAULT_INDENT;
    const indent = Math.min(MAX_INDENT, Math.max(MIN_INDENT, suppliedIndent));
    res.header("Indent", `${indent}`);

    const parseStart = nanos();
    const nbt = parseTag(req.body);
    const parseDur = nanos() - parseStart;
    res.header("Parsing-Time", `${parseDur}`);

    const stringifyStart = nanos();
    const stringifedNbt = nbt.asString(indent);
    const stringifyDur = nanos() - stringifyStart;
    res.header("Format-Time", `${stringifyDur}`);

    const totalDur = nanos() - totalStart;
    res.header("Total-Time", `${totalDur}`);

    res.send(stringifedNbt);
  });
export default register;
