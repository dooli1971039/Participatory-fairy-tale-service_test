// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
const URL = "./XHandsUp_model/";
let model, webcam, ctx, labelContainer, maxPredictions, result_XHandsUp;

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses(); //클래스 개수 => X,HandsUp,StandUp 3개

    // Convenience function to setup a webcam
    const size = 400;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }

    result_XHandsUp = document.getElementById("result");
}

async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const {pose, posenetOutput} = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    //이 부분이 html의 텍스트 업데이트 하는 부분
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    //결과 출력
    const X_result = parseFloat(labelContainer.childNodes[0].innerHTML.split(":")[1]);
    const HandsUp_result = parseFloat(labelContainer.childNodes[1].innerHTML.split(":")[1]);
    const StandUp_result = parseFloat(labelContainer.childNodes[2].innerHTML.split(":")[1]);
    if (StandUp_result > X_result || StandUp_result > HandsUp_result) {
        //그냥 서 있음 (대기)
        result_XHandsUp.innerText = "Make any Motion";
    } else {
        if (X_result >= HandsUp_result) {
            result_XHandsUp.innerText = "You choose X";
        } else {
            result_XHandsUp.innerText = "You choose HandsUp";
        }
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
