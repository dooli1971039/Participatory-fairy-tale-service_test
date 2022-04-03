//https://usecode.pw/%EC%9D%8C%EC%84%B1%EC%9D%B8%EC%8B%9D-api-web-speech-api-%EB%82%98%EB%A7%8C%EC%9D%98-%EC%8B%9C%EB%A6%AC%EB%A5%BC-%EB%A7%8C%EB%93%A4-%EC%88%98-%EC%9E%88%EC%9D%84%EA%B9%8C/
//https://mizzo-dev.tistory.com/entry/SpeechRecognition-WebChrome-%EC%9D%8C%EC%84%B1-%EC%9D%B8%EC%8B%9D
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

window.SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
//recognition.interimResults = true; //아직 끝나지 않은 상태의 음성을 받을 것인지 아닌지(default: false)
recognition.lang = "ko-KR"; //한국어 인식
const URL = "./sounds/";

const bb = document.querySelector("#but");
let h2 = document.createElement("h2");
const words = document.querySelector(".words");
words.appendChild(h2);

let check_result = "";

function speech() {
    recognition.start();

    //onresult: 음성인식 서비스가 결과를 리턴하면 생기는 이벤트
    recognition.onresult = function (e) {
        let texts = Array.from(e.results)
            .map((results) => results[0].transcript)
            .join("")
            .split(" ")
            .join("");
        texts.replace("대답해주세요", "");
        texts.replace("다시대답해주세요", "");
        console.log(texts);

        if (texts == "빵빵") {
            words.textContent = texts;
            console.log("1번 선택");
            check_result = "END";
        } else if (texts == "콩콩") {
            words.textContent = texts;
            console.log("2번 선택");
            check_result = "END";
        } else if (texts == "나를도와줘") {
            words.textContent = texts;
            console.log("3번 선택");
            check_result = "END";
        } else if (texts == "화이팅") {
            words.textContent = texts;
            console.log("4번 선택");
            check_result = "END";
        } else {
            console.log("stop");
            check_result = "AGAIN";
        }

        if (check_result == "END") {
            recognition.stop();
            console.log("선택 완료");
        } else if (check_result == "AGAIN") {
            console.log("다시");
            let audio = new Audio(URL + "RequestAgainAnswer.mp3");
            audio.play();
            //오디오 끝나면 실행
            setTimeout(() => {
                speech();
            }, 1000);
        }
    };
}

function init() {
    let audio = new Audio(URL + "RequestAnswer.mp3");
    audio.play();
    //안내 오디오 끝나면 실행
    setTimeout(() => {
        speech();
    }, 1000);
}

bb.addEventListener("click", init);
