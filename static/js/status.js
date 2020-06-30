const COLORS = {
    "completed": "bg-success",
    "failed": "bg-danger",
    "active": "bg-info"
};

const setProgress = (progress) => {
    const element = document.querySelector("#job-progress");
    element.setAttribute("aria-valuenow", progress);
    element.style.width = progress + "%";
    if (progress < 100)
        setState("active");
};

const setState = (state) => {
    const color = (state in COLORS) ? COLORS[state] : "bg-warning";
    const element = document.querySelector("#job-progress");
    element.className = "progress-bar " + color;
    if (["completed", "failed"].includes(state))
        setProgress(100);
    document.querySelector("#job-state").innerHTML = state;
};

const setOutput = (output) => {
    const element = document.querySelector("#output").innerHTML = `Output: <div><code>${output}</code></div>`;
};

const setError = (error) => {
    const element = document.querySelector("#error").innerHTML = `Error: <div><code>${error}</code></div>`;
};

const socket = io();

socket.on("connect", () => {
    socket.emit("identify", window.location.pathname);
});

socket.on("progress", setProgress);

socket.on("state", setState);

socket.on("completed", (output) => {
    setState("completed");
    if (output)
        setOutput(output);
});

socket.on("failed", (error) => {
    setState("failed");
    if (error)
        setError(error);
});
