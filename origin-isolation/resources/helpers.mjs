export function insertIframe(hostname, header) {
  const url = new URL("send-origin-isolation-header.py", import.meta.url);
  url.hostname = hostname;

  if (header !== undefined) {
    url.searchParams.set("header", header);
  }

  const iframe = document.createElement("iframe");
  iframe.src = url.href;

  return new Promise((resolve, reject) => {
    iframe.onload = () => resolve(iframe.contentWindow);
    iframe.onerror = () => reject(new Error(`Could not load ${iframe.src}`));
    document.body.append(iframe);
  });
}

// This function is coupled to ./send-origin-isolation-header.py, which ensures
// that sending such a message will result in a message back.
export async function sendWasmModule(frameWindow) {
  frameWindow.postMessage(await createWasmModule(), "*");
  return waitForMessage();
}

// This function is coupled to ./send-origin-isolation-header.py, which ensures
// that sending such a message will result in a message back.
export async function setBothDocumentDomains(frameWindow) {
  document.domain = document.domain;

  frameWindow.postMessage({ command: "set document.domain", newDocumentDomain: document.domain }, "*");
  const whatHappened = await waitForMessage();
  assert_equals(whatHappened, "document.domain is set");
}

function waitForMessage() {
  return new Promise(resolve => {
    window.addEventListener("message", e => resolve(e.data), { once: true });
  });
}

async function createWasmModule() {
  const response = await fetch("/wasm/serialization/module/resources/incrementer.wasm");
  const ab = await response.arrayBuffer();
  return WebAssembly.compile(ab);
}
