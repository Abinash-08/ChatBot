// ---------- DOM Elements ----------
const promptInput   = document.querySelector("#prompt");
const submitButton  = document.querySelector("#submit");
const chatContainer = document.querySelector(".chat-container");
const imageButton   = document.querySelector("#image");
const imageThumb    = document.querySelector("#image img");
const imageInput    = document.querySelector("#image input");
const micButton     = document.querySelector("#mic");

// ---------- Speech Recognition ----------
let SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US"; // Hindi -> "hi-IN"

  micButton.addEventListener("click", () => {
    recognition.start();
    console.log("🎤 Listening...");
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("You said:", transcript);
    promptInput.value = transcript;
    promptInput.focus();
  };

  recognition.onerror = (err) => {
    console.log("Speech recognition error:", err);
  };
} else {
  // Browser does not support speech
  micButton.style.opacity = "0.4";
  micButton.style.cursor = "not-allowed";
}

// ---------- API Config ----------
// ---- Gemini config ----
const API_KEY = "AIzaSyAq3oxAkV8mfaab8-ZQx6e_1uZWm7vepoc"; // (TEMP) test key
const MODEL_NAME = "gemini-2.5-flash";

const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;



let user = {
  message: null,
  file: { mime_type: null, data: null },
};

// ---------- Scroll Helper ----------
function scrollToBottom() {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth",
  });
}

// ---------- Create Chat Bubble ----------
function createChatBox(innerHTML, classes) {
  const div = document.createElement("div");
  div.innerHTML = innerHTML;
  div.classList.add(classes);
  return div;
}

// ---------- Generate AI Response ----------
async function generateResponse(aiChatBox) {
  const text = aiChatBox.querySelector(".ai-chat-area");

  const body = {
    contents: [
      {
        parts: [
          {
            text:
              (user.message || "") +
              "\n(Please keep response short, max 9-10 lines)",
          },
          ...(user.file?.data ? [{ inline_data: user.file }] : []),
        ],
      },
    ],
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("🔍 Raw response:", data);

    // If API returned an error object
    if (!response.ok || data.error) {
      console.error("❌ Gemini API error:", data.error || response.statusText);
      throw new Error(data.error?.message || "Request failed");
    }

    let apiResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No response received from AI.";

    apiResponse = apiResponse.replace(/\*\*(.*?)\*\*/g, "$1").trim();
    if (apiResponse.length > 400) apiResponse = apiResponse.slice(0, 400) + "...";

    text.innerHTML = apiResponse;
  } catch (err) {
    console.error("❌ Fetch error:", err);
    text.innerHTML = "⚠️ Sorry, I couldn't process that request. Try again.";
  } finally {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    imageThumb.src = "img.svg";
    imageThumb.classList.remove("choose");
    user.file = {};
  }
}


// ---------- Handle User Message ----------
function handleChatResponse(rawMessage) {
  const trimmed = rawMessage.trim();
  if (!trimmed && !user.file.data) return;

  user.message = trimmed;

  // 🧑‍💻 User bubble + avatar
  const userHtml = `
    <img src="user.png" alt="User" class="user-icon">
    <div class="user-chat-area">
      ${user.message || ""}
      ${
        user.file.data
          ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />`
          : ""
      }
    </div>
  `;

  promptInput.value = "";
  const userChatBox = createChatBox(userHtml, "user-chat-box");
  chatContainer.appendChild(userChatBox);
  scrollToBottom();

  // AI loading bubble
  setTimeout(() => {
    const aiHtml = `
      <img src="ai.png" alt="AI" class="ai-icon">
      <div class="ai-chat-area">
        <span class="loading-dots show-loading"></span>
      </div>`;
    const aiChatBox = createChatBox(aiHtml, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    scrollToBottom();
    generateResponse(aiChatBox);
  }, 400);
}


// ---------- Events ----------

// Enter to send
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChatResponse(promptInput.value);
  }
});

// Send button
submitButton.addEventListener("click", () => {
  handleChatResponse(promptInput.value);
});

// Image upload
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64String = e.target.result.split(",")[1];
    user.file = { mime_type: file.type, data: base64String };
    imageThumb.src = `data:${user.file.mime_type};base64,${user.file.data}`;
    imageThumb.classList.add("choose");
  };
  reader.readAsDataURL(file);
});

// Click on image button → open file picker
imageButton.addEventListener("click", () => {
  imageButton.querySelector("input").click();
});
