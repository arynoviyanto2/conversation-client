import robotIcon from './assets/robot-white.svg';
import humanIcon from './assets/human-white.svg';

// const serverAddress = 'http://localhost:8012';
const serverAddress = 'https://bulbul-chatter.onrender.com';
const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat-container');
const maxRequests = 5;

let numOfActiveRequests = 0;

attachWelcomeHTML();

// function getLoadingStringReplaceAt(str, index, replacement) {
//   return str.substring(0, index) + replacement + str.substring(index + replacement.length);
// }

// function attachLoadingMessage(elementId) {
//   const element = document.getElementById(elementId);
//   const loadingStringFull = '..........';
//   const prefix = `I'm thinking you know `;
//   let i = 0;
//   let direction = 1;
//   let showPrefix = false;

//   const loadInterval = setInterval(() => {
//     let loadingString = loadingStringFull;
//     const sign = direction === -1 ? '{' : '}';
//     loadingString = getLoadingStringReplaceAt(loadingString, i, sign);
//     element.textContent = (showPrefix ? prefix : '') + loadingString;
//     if (i === (loadingStringFull.length - 1)) {
//       direction = -1;
//       showPrefix = true || showPrefix;
//     }
//     if (i === 0) { direction = 1; }
//     i = i + 1 * direction;

//   }, 500);

//   return loadInterval;
// }

function attachWelcomeHTML() {
  chatContainer.innerHTML = getWelcomeHTML();
}

function removeWelcomeHTML() {
  const divs = document.querySelectorAll('.welcome');
  divs.forEach(div => div.remove());
}

function attachLoadingMessage(elementId) {
  const element = document.getElementById(elementId);
  const numDots = 8;
  let i = 0;
  let showPrefix = false;
  let loadingString = '';

  const loadInterval = setInterval(() => {
    if (i < numDots) {
      showPrefix = true || showPrefix;
      loadingString += '.';
    } else {
      loadingString = '';
      i = 0;
    }

    element.textContent = loadingString;
    i++;

  }, 500);

  return loadInterval;
}

function typeMessage(elementId, message) {
  numOfActiveRequests--;

  const element = document.getElementById(elementId);
  element.innerHTML = "";

  const userLogoElement = document.getElementById(`user-${elementId}`);
  userLogoElement.classList.remove('blinking');

  let index = 0;

  let interval = setInterval(_ => {
    if (index < message.length) {
      element.innerHTML += message.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 50);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const hexadecimalString = timestamp.toString(16);

  return hexadecimalString;
}

function getChatItemHTML(isBot, value, uniqueId) {
  const userIdString = uniqueId ? `id="user-${uniqueId}"` : '';
  const messageIdString = uniqueId ? `id="${uniqueId}"` : ''
  return (
    `
      <div class="wrapper">
        <div class="chat">
          <div ${userIdString}
            class="profile ${isBot ? 'robot-profile blinking' : 'human-profile'}">
            <img src="${isBot ? robotIcon : humanIcon}" alt="${isBot ? 'Robot' : 'Human'}" />
          </div>

          <div ${messageIdString}
            class="message text ${isBot ? 'robot' : 'human'}">${value}</div>
        </div>
      </div>
    `
  )
}

function getWelcomeHTML() {
  return (
    `
      <div class="welcome">
        <div class="logo"><img src="${robotIcon}" alt="Robot" /></div>
        <div><span class="text">Hi, ask something ...</span></div>
      </div>
    `
  )
}

const processAskingQuestion = async (question) => {
  numOfActiveRequests++;

  chatContainer.innerHTML += getChatItemHTML(false, question);

  form.reset();

  // Bot's chatstripe
  const uniqueId = generateUniqueId();

  chatContainer.innerHTML += getChatItemHTML(true, " ", uniqueId);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const loadInterval = attachLoadingMessage(uniqueId);

  // Fetch data from server - bot's responses

  const errorMessage = "Something went wrong! try again ...";

  fetch(serverAddress, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: question
    })
  })
    .then(response => {
      clearInterval(loadInterval);
      if (response.ok) {
        return response.json();
      } else {
        const error = response.text();
        console.error(error);
        typeMessage(uniqueId, errorMessage);
        return null;
      }
    })
    .then(data => {
      if (data == null) { return; }
      const parsedData = data.answer.trim();

      typeMessage(uniqueId, parsedData);
    })
    .catch(error => {
      clearInterval(loadInterval);
      console.error(error);
      typeMessage(uniqueId, errorMessage);
    });
}

form.addEventListener('submit', processAskingQuestion);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    e.preventDefault();
    if (numOfActiveRequests < maxRequests) {
      const data = new FormData(form);

      // User's chat srtipe
      let question = data.get('question');
      question = question.replace(/\r?\n|\r/g, "");
      question = question.trim();

      if (question != '') {
        removeWelcomeHTML();
        processAskingQuestion(question);
      }
    } else {
      form.reset();
    }
  }
});