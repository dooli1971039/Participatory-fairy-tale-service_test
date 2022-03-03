//https://usecode.pw/%EC%9D%8C%EC%84%B1%EC%9D%B8%EC%8B%9D-api-web-speech-api-%EB%82%98%EB%A7%8C%EC%9D%98-%EC%8B%9C%EB%A6%AC%EB%A5%BC-%EB%A7%8C%EB%93%A4-%EC%88%98-%EC%9E%88%EC%9D%84%EA%B9%8C/
//https://mizzo-dev.tistory.com/entry/SpeechRecognition-WebChrome-%EC%9D%8C%EC%84%B1-%EC%9D%B8%EC%8B%9D
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

window.SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.interimResults = true; //아직 끝나지 않은 상태의 음성을 받을 것인지 아닌지(default: false)
recognition.lang = "ko-KR"; //한국어 인식
const URL = "./sounds/";

async function init() {
    let h2 = document.createElement("h2");
    const words = document.querySelector(".words");
    words.appendChild(h2);

    let audio = new Audio(URL + "RequestAnswer.mp3");
    audio.play();
    audio.onended = function () {
        //안내 오디오 끝나면 실행
        recognition.start();
        recognition.onstart = function () {
            makeNewTextContent(); // 음성 인식 시작시마다 새로운 문단을 추가한다.
        };
        recognition.onend = function () {
            //음성인식이 끝나면 다시 시작
            recognition.start();
        };
        recognition.onresult = function (e) {
            let texts = Array.from(e.results)
                .map((results) => results[0].transcript)
                .join("");

            p.textContent = texts;
        };
    };
}

init();

function makeNewTextContent() {
    p = document.createElement("p");
    document.querySelector(".words").appendChild(p);
}
