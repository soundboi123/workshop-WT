const messageLijst = document.getElementById("messages")
const messageInput = document.getElementById("message-input")
const usernameInput = document.getElementById("username-input")
const inputForm = document.getElementById("input-form")
const sendBtn = document.getElementById("send-btn")
const statusDot = document.getElementById("status-dot")
const statusText = document.getElementById("status-text")
const userListElement = document.getElementById("user-list")
const userCountElement = document.getElementById("user-count")

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function voegMessageToe(text, sender, isOwn = false) {
  const li = document.createElement("li")
  li.className = `message ${isOwn ? "own" : "other"}`
  li.innerHTML = `
    <span class="messageSender">${escapeHtml(sender)}</span>
    ${escapeHtml(text)}
  `
  messageLijst.appendChild(li)
  messageLijst.scrollTop = messageLijst.scrollHeight
}

function voegSysteemMessageToe(text) {
  const li = document.createElement("li")
  li.className = "message system"
  li.textContent = text
  messageLijst.appendChild(li)
  messageLijst.scrollTop = messageLijst.scrollHeight
}

function renderUsers(users) {
  userListElement.innerHTML = ""
  users.forEach(name => {
    const li = document.createElement("li")
    li.className = "userListItem"
    li.innerHTML = `
      <span class="userListDot" aria-hidden="true"></span>
      ${escapeHtml(name)}
    `
    userListElement.appendChild(li)
  })
  const n = users.length
  userCountElement.textContent = `${n} gebruiker${n !== 1 ? "s" : ""}`
}

function setConnected(connected) {
  statusDot.className = `statusDot ${connected ? "online" : "offline"}`
  statusText.textContent = connected ? "connected" : "disconnected"
  messageInput.disabled = !connected
  sendBtn.disabled = !connected
  if (connected) messageInput.focus()
}

function getUsername() {
  return usernameInput.value.trim() || "anon"
}

const ws = new WebSocket(`ws://${location.host}`)

ws.addEventListener("open", () => {
  setConnected(true)
  voegSysteemMessageToe("verbonden met server")
  ws.send(JSON.stringify({ type: "join", sender: getUsername() }))
})

ws.addEventListener("close", () => {
  setConnected(false)
  voegSysteemMessageToe("verbinding verbroken")
  renderUsers([])
})

ws.addEventListener("error", () => {
  voegSysteemMessageToe("error")
})

ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data)

  if (data.type === "message") {
    const isOwn = data.sender === getUsername()
    voegMessageToe(data.text, data.sender, isOwn)
  } else if (data.type === "users") {
    renderUsers(data.users)
  }
})

inputForm.addEventListener("submit", (event) => {
  event.preventDefault()
  const text = messageInput.value.trim()
  if (!text || ws.readyState !== WebSocket.OPEN) return

  ws.send(JSON.stringify({ type: "message", sender: getUsername(), text }))
  messageInput.value = ""
})

usernameInput.addEventListener("change", () => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "join", sender: getUsername() }))
  }
})