import {parseTag} from "./parser.js";
import {nanos} from "./common/util.js";

const REFORMAT_BUTTON_INDENTION = 2;
const MINIFY_BUTTON_INDENTION = 0;

const input = document.getElementById("input") as HTMLTextAreaElement;
const status = document.getElementById("status");
const message = document.getElementById("message");

const resolveCheckbox = document.getElementById("resolve") as HTMLInputElement;
const copyButton = document.getElementById("copy");
const reformatButton = document.getElementById("reformat");
const minifyButton = document.getElementById("minify");

const reformat = (indent: number) => {
  status.innerText = "Formatting...";
  message.innerText = "";

  const totalStart = nanos();
  let success = true;
  let parseMillis = (0).toFixed(2);
  let formatMillis = (0).toFixed(2);
  try {
    const parseStart = nanos();
    const tag = parseTag(input.value, resolveCheckbox.checked);
    parseMillis = ((nanos() - parseStart) / 1_000_000).toFixed(2);

    const formatStart = nanos();
    input.value = tag.asString(indent);
    formatMillis = ((nanos() - formatStart) / 1_000_000).toFixed(2);
  } catch (error) {
    success = false;
    message.innerText = error.toString();
  }

  const totalMillis = ((nanos() - totalStart) / 1_000_000).toFixed(2);
  status.innerText = success
      ? `Reformatting took ${totalMillis}ms (${parseMillis}ms parsing, ${formatMillis}ms formatting)`
      : `Error while reformatting (took ${totalMillis}ms)`;
};

copyButton.onclick = async () => {
  input.focus();
  input.select();
  await navigator.clipboard.writeText(input.value);
};

reformatButton.onclick = () => reformat(REFORMAT_BUTTON_INDENTION);
minifyButton.onclick = () => reformat(MINIFY_BUTTON_INDENTION);

