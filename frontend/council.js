let activeSource = null;
let chatHistory = [];
let expertBuffers = {};

function getModels() {
  return {
    "expert1": document.getElementById("model-expert1").value,
    "expert2": document.getElementById("model-expert2").value,
    "expert3": document.getElementById("model-expert3").value,
    "expert4": document.getElementById("model-expert4").value,
  };
}

function getJudgeModel() {
  return document.getElementById("model-judge").value;
}

function renderChatHistory() {
  // Chat history rendering removed to keep UI minimal.
  // The chatHistory array is still maintained and sent to the backend.
}

function startCouncil() {
  const prompt = document.getElementById("prompt-input").value.trim();
  if (!prompt) return;

  chatHistory.push({role: "user", content: prompt});
  // Keep the prompt visible in the input box so the user remembers what they asked.
  // We won't clear the input box until they ask a new question.
  // document.getElementById("prompt-input").value = "";

  const models = getModels();
  const judgeModel = getJudgeModel();
  
  resetUI(models);

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;

  document.getElementById("status-bar").classList.remove("hidden");
  document.getElementById("status-text").textContent = "Asking the council...";

  fetch(`${window.BACKEND_URL}/council/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: chatHistory, models: models, judge_model: judgeModel }),
  })
  .then(response => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          btn.disabled = false;
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();

        parts.forEach(part => {
          const line = part.trim();
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              handleEvent(event);
            } catch (e) {
              console.error("Failed to parse SSE event:", line, e);
            }
          }
        });

        read();
      });
    }
    read();
  })
  .catch(err => {
    console.error("Connection error:", err);
    document.getElementById("status-text").textContent = "Connection failed.";
    btn.disabled = false;
  });
}

function handleEvent(event) {
  switch (event.type) {
    case "token":
      appendToken(event.expert, event.token);
      setCardStatus(event.expert, "running");
      break;

    case "error":
      setCardStatus(event.expert, "error");
      appendToken(event.expert, `\n[Error: ${event.error}]`);
      break;

    case "done":
      setCardStatus(event.expert, event.error ? "error" : "done");
      if (event.error) {
        appendToken(event.expert, `\n[Error: ${event.error}]`);
      }
      break;
      
    case "judge_token":
      document.getElementById("status-text").textContent = "Judge is formulating consensus...";
      appendToken("judge", event.token);
      setCardStatus("judge", "running");
      break;
      
    case "judge_done":
      setCardStatus("judge", "done");
      document.getElementById("status-text").textContent = "Council has spoken.";
      chatHistory.push({role: "assistant", content: event.full_response});
      break;
      
    case "judge_error":
      setCardStatus("judge", "error");
      appendToken("judge", `\n[Error: ${event.error}]`);
      document.getElementById("status-text").textContent = "Council hit an error.";
      break;

    case "vote_result":
      if (event.scores) {
        Object.keys(event.scores).forEach(expert => {
          const badge = document.getElementById(`badge-${expert}`);
          if (badge) {
            badge.textContent = `${(event.scores[expert] * 100).toFixed(1)}% agree`;
            badge.classList.remove("hidden");
            if (event.winner === expert) {
              badge.classList.add("top-score");
            }
          }
        });
      }
      break;

    case "stream_end":
      break;
  }
}

function appendToken(expert, token) {
  if (!expertBuffers[expert]) expertBuffers[expert] = "";
  expertBuffers[expert] += token;
  const el = document.getElementById(`response-${expert}`);
  if (el) {
    el.innerHTML = DOMPurify.sanitize(marked.parse(expertBuffers[expert]));
  }
}

function setCardStatus(expert, state) {
  const el = document.getElementById(`status-${expert}`);
  if (!el) return;
  el.className = `card-status ${state}`;
  const labels = { running: "Thinking...", done: "", error: "Error" };
  el.textContent = labels[state] || "";
  
  const dot = document.getElementById(`dot-${expert}`);
  if (dot) dot.className = `dot ${state}`;
}

function resetUI(models) {
  expertBuffers = {};
  
  Object.keys(models).forEach(name => {
    const el = document.getElementById(`response-${name}`);
    if(el) el.innerHTML = "";
    setCardStatus(name, "");
    
    const badge = document.getElementById(`badge-${name}`);
    if (badge) {
      badge.classList.add("hidden");
      badge.classList.remove("top-score");
      badge.textContent = "";
    }
  });
  
  expertBuffers["judge"] = "";
  const jel = document.getElementById("response-judge");
  if(jel) jel.innerHTML = "";
  setCardStatus("judge", "");
}

function copyText(expert) {
  const text = expertBuffers[expert] || "";
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard!");
  });
}

document.getElementById("prompt-input").addEventListener("keydown", function(e) {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    startCouncil();
  }
});
