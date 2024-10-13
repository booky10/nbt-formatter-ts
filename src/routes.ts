import { Express } from "express";
import { parse, stringify } from "nbt-ts";

const DEFAULT_INDENT = 2;
const MAX_INDENT = 10;

// TODO write own snbt parsing lib
const nanos = (): number => Math.ceil(performance.now() * 1_000_000);
const register = (app: Express) =>
  app.post("/api/v1/format", (req, res, next) => {
    const totalStart = nanos();

    const indent = Math.min(MAX_INDENT, Number(req.query.indent) || DEFAULT_INDENT);
    res.header("Indent", `${indent}`);

    const parseStart = nanos();
    const nbt = parse(req.body);
    const parseDur = nanos() - parseStart;
    res.header("Parsing-Time", `${parseDur}`);

    const stringifyStart = nanos();
    const stringifedNbt = stringify(nbt, { pretty: indent != 0 });
    const stringifyDur = nanos() - stringifyStart;
    res.header("Format-Time", `${stringifyDur}`);

    const totalDur = nanos() - totalStart;
    res.header("Total-Time", `${totalDur}`);

    res.send(stringifedNbt);
  });
export default register;
