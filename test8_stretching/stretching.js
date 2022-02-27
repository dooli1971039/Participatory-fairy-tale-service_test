//https://teachablemachine.withgoogle.com/models/TF_v3z2Gg/
//https://github.com/googlecreativelab/teachablemachine-community/blob/master/libraries/pose/README.md

/*
0,1번은 제대로된 자세
2번은 그냥 서있는 정상 자세
3은 서있으면서 팔만
4,5번은 자세를 잘 취하다가 풀린 자세...
*/

const URL = "./my_model/";
let model, webcam, ctx, labelContainer, maxPredictions;

let status = 1; //0:정상, 1:stand or fail
let keep_time = [0, 0]; //각각의 지속 시간

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // 웹캠 시작
    const size = 400;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const note = document.getElementById("note");
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }

    let audio = new Audio(URL + "motion.mp3");
    audio.play();
    note.innerHTML = "10초간 자세를 유지하세요";
    audio.onended = function () {
        //맨 처음 안내하는 오디오 끝나면 실행
        note.innerHTML = "준비";
        setTimeout(() => {
            note.innerHTML = "시작";
        }, 500);

        let check_time = setInterval(() => {
            if (keep_time[status] == 0) {
                //다른 모션에서 바뀌어 들어옴
                keep_time[0] = keep_time[1] = 0;
                keep_time[status]++;
            } else {
                if (status == 0)
                    note.innerHTML = `정확한 자세를 ${keep_time[status]}초 유지하셨습니다.`;
                else if (status == 1)
                    note.innerHTML = `정확한 자세가 아닙니다: ${keep_time[status]}초`;

                if (status == 0 && keep_time[status] == 10) {
                    new Audio(URL + "OK.mp3").play();
                    note.innerHTML = `정확한 자세입니다.`;
                    clearInterval(check_time);
                    webcam.stop();
                    //이러고 다음 페이지로 넘어가면 될듯
                } else if (status == 1 && keep_time[status] == 10) {
                    new Audio(URL + "Fail.mp3").play();
                    note.innerHTML = `자세 유지에 실패하셨습니다.`;
                    clearInterval(check_time);
                    webcam.stop();
                    //이러고 다음 페이지로 넘어가면 될듯
                }
                keep_time[status]++;
            }
        }, 1000);
    };
}

// teachable machine 기본 코드는 start버튼을 눌렀을 때 시작하게 되어있으나
// 우리 코드에서는 그냥 바로 실행하도록 한다.
init();

async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const {pose, posenetOutput} = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    if (
        prediction[0].probability.toFixed(2) >= 0.9 ||
        prediction[1].probability.toFixed(2) >= 0.9
    ) {
        //정상
        keep_time[1] = 0;
        status = 0;
    } else {
        //stand 또는 fail
        keep_time[0] = 0;
        status = 1;
    }

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className +
            ": " +
            prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    // finally draw the poses
    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
