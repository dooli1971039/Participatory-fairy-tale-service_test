//https://usecode.pw/%EC%9D%8C%EC%84%B1%EC%9D%B8%EC%8B%9D-api-web-speech-api-%EB%82%98%EB%A7%8C%EC%9D%98-%EC%8B%9C%EB%A6%AC%EB%A5%BC-%EB%A7%8C%EB%93%A4-%EC%88%98-%EC%9E%88%EC%9D%84%EA%B9%8C/
//https://mizzo-dev.tistory.com/entry/SpeechRecognition-WebChrome-%EC%9D%8C%EC%84%B1-%EC%9D%B8%EC%8B%9D
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

window.SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.interimResults = true; //아직 끝나지 않은 상태의 음성을 받을 것인지 아닌지(default: false)
recognition.lang = "ko-KR"; //한국어 인식

const words = document.querySelector(".words");
let h1 = document.createElement("h1");
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
