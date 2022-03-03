//https://usecode.pw/%EC%9D%8C%EC%84%B1%EC%9D%B8%EC%8B%9D-api-web-speech-api-%EB%82%98%EB%A7%8C%EC%9D%98-%EC%8B%9C%EB%A6%AC%EB%A5%BC-%EB%A7%8C%EB%93%A4-%EC%88%98-%EC%9E%88%EC%9D%84%EA%B9%8C/
//https://mizzo-dev.tistory.com/entry/SpeechRecognition-WebChrome-%EC%9D%8C%EC%84%B1-%EC%9D%B8%EC%8B%9D
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

window.SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.interimResults = true; //아직 끝나지 않은 상태의 음성을 받을 것인지 아닌지(default: false)
recognition.lang = "ko-KR"; //한국어 인식
const URL = "./sounds/";

const bb = document.querySelector("#but");

function init() {
    let h2 = document.createElement("h2");
    const words = document.querySelector(".words");
    words.appendChild(h2);

    let audio = new Audio(URL + "RequestAnswer.mp3");
    audio.play();
    audio.onended = function () {
        //안내 오디오 끝나면 실행
        recognition.start();

        recognition.onend = function () {
            //음성인식이 끝나면 다시 시작
            recognition.start();
        };
        //onresult: 음성인식 서비스가 결과를 리턴하면 생기는 이벤트
        recognition.onresult = function (e) {
            let texts = Array.from(e.results)
                .map((results) => results[0].transcript)
                .join("");

            words.textContent = texts;

            if (texts === "안녕") {
                console.log("##");
                recognition.abort(); //왜... 안 멈추냐...
            }
        };
    };
}

bb.addEventListener("click", init);
//init();
