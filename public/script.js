const input = document.getElementById("input");
const status = document.getElementById("status");
const message = document.getElementById("message");

const copyButton = document.getElementById("copy");
const reformatButton = document.getElementById("reformat");
const minifyButton = document.getElementById("minify");

function reformat(indent) {
    input.disabled = true;
    status.innerText = "Formatting...";
    message.innerText = "";

    copyButton.disabled = true;
    reformatButton.disabled = true;
    minifyButton.disabled = true;

    const req = new XMLHttpRequest();
    req.open("POST", `${location.href}api/v1/format?indent=${indent}`, true);
    req.onreadystatechange = () => {
        if (req.readyState != 4) {
            return;
        }

        input.disabled = false;
        copyButton.disabled = false;
        reformatButton.disabled = false;
        minifyButton.disabled = false;

        const totalTime = (req.getResponseHeader("Total-Time") / 1000000).toFixed(2);

        if (req.status != 200) {
            status.innerText = `Error ${req.status} while reformatting${totalTime > 0 ? ` (took ${totalTime}ms)` : ""}:`;
            message.innerText = req.responseText;
            return;
        }

        const parsingTime = (req.getResponseHeader("Parsing-Time") / 1000000).toFixed(2);
        const formatTime = (req.getResponseHeader("Format-Time") / 1000000).toFixed(2);

        status.innerText = `Reformatting took ${totalTime}ms (${parsingTime}ms parsing, ${formatTime}ms formatting)`;
        input.value = req.responseText;
    };

    req.setRequestHeader("Content-Type", "text/plain");
    req.setRequestHeader("Accept", "text/plain");
    req.send(input.value);
}

copyButton.onclick = () => {
    input.focus();
    input.select();

    if (navigator.clipboard) {
        navigator.clipboard.writeText(input.value);
    } else {
        // fallback
        document.execCommand("copy");
    }
};

reformatButton.onclick = (event) => reformat(2);
minifyButton.onclick = (event) => reformat(0);
