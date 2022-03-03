window.SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.interimResults = true;
recognition.lang = "ko-KR";

let h1 = document.createElement("h1");
const words = document.querySelector(".words");
words.appendChild(h1);

recognition.addEventListener("result", (e) => {
    const transcript = Array.from(e.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");

    h1.textContent = transcript;

    if (e.results[0].isFinal) {
        h1 = document.createElement("h1");
        words.appendChild(h1);
    }
});

recognition.addEventListener("end", recognition.start);

recognition.start();
