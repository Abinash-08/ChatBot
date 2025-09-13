let prompt = document.querySelector("#prompt");
let submitbutton = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
let imagebutton = document.querySelector("#image");
let image = document.querySelector("#image img");
let imageinput = document.querySelector("#image input");

const API_KEY = "AIzaSyA7qqJUGYNX91hfE1ql_s7jxBlQOt03GcE"; // apna key yaha
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
};

// ✅ API se AI response lana
async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");

    let RequestOption = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                {
                    "parts": [
                        {
                            "text": user.message + "\n(Please give response in short, max 9-10 lines)"
                        },
                        ...(user.file.data ? [{ "inline_data": user.file }] : [])
                    ]
                }
            ],
        }),
    };

    try {
        let response = await fetch(API_URL, RequestOption);
        let data = await response.json();

        let apiResponse = data.candidates[0].content.parts[0].text
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .trim();

        // ✅ Agar text bohot bada hai toh cut kardo
        if (apiResponse.length > 400) {
            apiResponse = apiResponse.substring(0, 400) + "...";
        }

        text.innerHTML = apiResponse;
    } catch (error) {
        console.log("Error:", error);
        text.innerHTML = "⚠️ Sorry, I couldn't process that request. Try again.";
    } finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
        image.src = `img.svg`;
        image.classList.remove("choose");
        user.file = {};
    }
}

// ✅ Chat box create karna
function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

// ✅ User message handle karna
function handlechatResponse(userMessage) {
    if (!userMessage.trim() && !user.file.data) return; // empty input ignore

    user.message = userMessage;

    let html = `<img src="user.png" alt="" id="userImage" width="7%">
      <div class="user-chat-area">
      ${user.message}
      ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
      </div>`;

    prompt.value = "";

    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);

    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });

    // Loading ke baad AI ka reply
    setTimeout(() => {
        let html = `<img src="ai.png" alt="" id="aiImage" width="10%">
        <div class="ai-chat-area">
          <img src="load-32.gif" alt="" class="load" width="50px">
        </div>`;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        generateResponse(aiChatBox);
    }, 600);
}

// ✅ Enter key press listener
prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handlechatResponse(prompt.value);
    }
});

submitbutton.addEventListener("click", () => {
    handlechatResponse(prompt.value);
});

imageinput.addEventListener("change", () => {
    const file = imageinput.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = (e) => {
        let base64String = e.target.result.split(',')[1];
        user.file = {
            mime_type: file.type,
            data: base64String
        };
        image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        image.classList.add("choose");
    };
    reader.readAsDataURL(file);
});

imagebutton.addEventListener("click", () => {
    imagebutton.querySelector("input").click();
});
