(function () {
  function createEl(tag, attrs) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === "style") {
        Object.assign(el.style, value);
      } else {
        el[key] = value;
      }
    });
    return el;
  }

  function init(options) {
    const cfg = {
      apiBase: options.apiBase,
      brandName: options.brandName || "Digital Diva",
      welcomeMessage:
        options.welcomeMessage ||
        "Hi. I can help you with SEO, social media marketing, web development, AI automation, and e-commerce.",
      primaryColor: options.primaryColor || "#d9480f"
    };

    if (!cfg.apiBase) {
      console.error("DigitalDivaChatbot: apiBase is required.");
      return;
    }

    let sessionId = "";

    const launcher = createEl("button", {
      innerText: "Chat with us",
      style: {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 99999,
        border: "none",
        borderRadius: "999px",
        padding: "12px 16px",
        background: cfg.primaryColor,
        color: "white",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
      }
    });

    const panel = createEl("div", {
      style: {
        position: "fixed",
        right: "20px",
        bottom: "76px",
        width: "340px",
        maxWidth: "calc(100vw - 24px)",
        height: "470px",
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
        border: "1px solid #e7e5e4",
        display: "none",
        zIndex: 99999,
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif"
      }
    });

    const header = createEl("div", {
      innerText: cfg.brandName + " Assistant",
      style: {
        padding: "12px",
        fontWeight: "700",
        color: "white",
        background: cfg.primaryColor
      }
    });

    const messages = createEl("div", {
      style: {
        height: "360px",
        overflowY: "auto",
        padding: "10px",
        background: "#fafaf9"
      }
    });

    const form = createEl("form", {
      style: {
        display: "flex",
        gap: "8px",
        padding: "10px"
      }
    });

    const input = createEl("input", {
      placeholder: "Type your message",
      style: {
        flex: "1",
        border: "1px solid #d6d3d1",
        borderRadius: "10px",
        padding: "10px"
      }
    });

    const send = createEl("button", {
      innerText: "Send",
      type: "submit",
      style: {
        border: "none",
        borderRadius: "10px",
        background: cfg.primaryColor,
        color: "white",
        padding: "10px 12px",
        cursor: "pointer"
      }
    });

    function pushMsg(text, role) {
      const bubble = createEl("div", {
        innerText: text,
        style: {
          marginBottom: "8px",
          padding: "10px",
          borderRadius: "10px",
          background: role === "user" ? "#fee2e2" : "#e0f2fe",
          marginLeft: role === "user" ? "40px" : "0",
          marginRight: role === "user" ? "0" : "40px",
          lineHeight: "1.4"
        }
      });

      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage(text) {
      pushMsg(text, "user");

      try {
        const response = await fetch(cfg.apiBase.replace(/\/$/, "") + "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            message: text,
            metadata: {
              source: "embedded-widget",
              page: window.location.pathname
            }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Chat failed");
        }

        sessionId = data.sessionId;
        pushMsg(data.reply, "bot");
      } catch (error) {
        pushMsg("I am temporarily unavailable. Please try again shortly.", "bot");
        console.error(error);
      }
    }

    launcher.addEventListener("click", function () {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) {
        return;
      }

      input.value = "";
      await sendMessage(text);
    });

    form.append(input, send);
    panel.append(header, messages, form);
    document.body.append(launcher, panel);

    pushMsg(cfg.welcomeMessage, "bot");
  }

  window.DigitalDivaChatbot = { init: init };
})();
