const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const result_label = document.getElementById("result_label");
let pose_status = 2;
let keep_time = [0, 0, 0];
let result_message = "";
//webcam을 enable하는 코드
navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function (stream) {
    video.srcObject = stream;
});

//then 안쪽이 function(model){} 이렇게 쓰는거랑 같다 (인자가 하나라 중괄호가 없는 것)
posenet.load().then((model) => {
    // 이곳의 model과 아래 predict의 model은 같아야 한다.
    video.onloadeddata = (e) => {
        //비디오가 load된 다음에 predict하도록. (안하면 콘솔에 에러뜸)
        predict();
        window.parent.postMessage({message: pose_count}, "*"); //0회가 보내져야 하는데...
    };

    function predict() {
        //frame이 들어올 때마다 estimate를 해야하니 함수화 시킴
        model.estimateSinglePose(video).then((pose) => {
            canvas.width = video.width; //캔버스와 비디오의 크기를 일치시킴
            canvas.height = video.height;
            drawKeypoints(pose.keypoints, 0.6, context);
            drawSkeleton(pose.keypoints, 0.6, context);

            check_Pose2(pose);
        });
        requestAnimationFrame(predict); //frame이 들어올 때마다 재귀호출
    }
});

let count_time = setInterval(function () {
    if (pose_count >= 7) {
        clearInterval(count_time);

        result_message = "Success";
        window.parent.postMessage({message: result_message}, "*");
    } else if (keep_time[2] >= 35) {
        //초를 얼마나 있다가 할지 몰라서 대충 35초로 해둠
        clearInterval(count_time);

        result_message = "Fail";
        window.parent.postMessage({message: result_message}, "*");
    }
    keep_time[2]++;
}, 1000);

//Stretch - Stand - HandsUp - Stand: 1회
let pose_count = 0;
let tmp = [0, 0];

function check_Pose2(pose) {
    if (check_Stand(pose)) {
        pose_status = 2;
        if (tmp[0] == 1 && tmp[1] == 1) {
            tmp[0] = tmp[1] = 0;
            pose_count++;
            window.parent.postMessage({message: pose_count}, "*");
        }
    } else if (check_Stretch(pose)) {
        tmp[0] = 1;
        pose_status = 0;
    } else if (check_HandsUp(pose) && tmp[0] == 1) {
        tmp[1] = 1;
        pose_status = 1;
    }
    // if (tmp[0] == 0 && tmp[1] == 0 && tmp[2] == 0 && check_Stretch(pose)) {
    //     tmp[0] = 1;
    // } else if (tmp[0] == 1 && tmp[1] == 0 && tmp[2] == 0 && check_Stand(pose)) {
    //     tmp[1] = 1;
    // } else if (tmp[0] == 1 && tmp[1] == 1 && tmp[2] == 0 && check_HandsUp(pose)) {
    //     tmp[2] = 1;
    // } else if (tmp[0] == 1 && tmp[1] == 1 && tmp[2] == 1 && check_Stand(pose)) {
    //     tmp[0] = tmp[1] = tmp[2] = 0;
    //     pose_count++;
    //     result_label.innerText = pose_count + "회";
    // }
}

function check_HandsUp(pose) {
    head = pose.keypoints[0].position; //머리(코)

    rw = pose.keypoints[10].position; //오른쪽 손목
    re = pose.keypoints[8].position; //오른쪽 팔꿈치
    rs = pose.keypoints[6].position; //오른쪽 어깨

    lw = pose.keypoints[9].position; //왼쪽 손목
    le = pose.keypoints[7].position; //왼쪽 팔꿈치
    ls = pose.keypoints[5].position; //왼쪽 어깨

    //팔꿈치가 어깨보다 높을 것, 양 팔꿈치 사이에 머리가 위치할 것
    if (re.y < rs.y && le.y < ls.y && re.x < head.x && head.x < le.x) {
        //어깨 사이의 거리보다 팔꿈치/어깨 사이의 거리가 짧을 것
        shoulder = ls.x - rs.x;
        if (shoulder > rs.x - re.x && shoulder > le.x - ls.x) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function check_Stretch(pose) {
    head = pose.keypoints[0].position; //머리(코)
    rw = pose.keypoints[10].position; //오른쪽 손목
    re = pose.keypoints[8].position; //오른쪽 팔꿈치
    rs = pose.keypoints[6].position; //오른쪽 어깨
    lw = pose.keypoints[9].position; //왼쪽 손목
    le = pose.keypoints[7].position; //왼쪽 팔꿈치
    ls = pose.keypoints[5].position; //왼쪽 어깨
    rb = pose.keypoints[12].position; //body(오른쪽 골반)
    lb = pose.keypoints[11].position; //body(왼쪽 골반)

    //팔이 머리보단 낮고, 골반보다 높을 것
    if (head.y < re.y && head.y < le.y && re.y < rb.y && le.y < lb.y) {
        //오른쪽 손목 - 오른쪽 팔꿈치 - 오른쪽 어깨 - 머리 - 왼쪽 어깨 - 왼쪽 팔꿈치 - 왼쪽 손목
        //인식률을 위해 조건을 완화하자
        if (re.x < rs.x && rs.x < head.x && head.x < ls.x && ls.x < le.x && (rw.x < re.x || le.x < lw.x)) {
            return true;
        } else {
            return false;
        }
    }
    return false;
}

function check_Stand(pose) {
    head = pose.keypoints[0].position; //머리(코)
    rw = pose.keypoints[10].position; //오른쪽 손목
    re = pose.keypoints[8].position; //오른쪽 팔꿈치
    rs = pose.keypoints[6].position; //오른쪽 어깨
    lw = pose.keypoints[9].position; //왼쪽 손목
    le = pose.keypoints[7].position; //왼쪽 팔꿈치
    ls = pose.keypoints[5].position; //왼쪽 어깨
    rb = pose.keypoints[12].position; //body(오른쪽 골반)
    lb = pose.keypoints[11].position; //body(왼쪽 골반)

    //머리 - 어깨 - 팔꿈치 - 골반 - 손목 (y좌표)
    if (
        head.y < rs.y &&
        head.y < ls.y &&
        rs.y < re.y &&
        ls.y < le.y &&
        re.y < rw.y &&
        le.y < lw.y &&
        (rb.y < rw.y || lb.y < lw.y)
    ) {
        //어깨의 길이보다 손목/골반 사이의 길이가 작을 것
        shoulder = ls.x - rs.x;
        if (shoulder > rb.x - rw.x || shoulder > lw.x - lb.x) {
            return true;
        } else {
            return true;
        }
    } else {
        return false;
    }
}

//tensorflow에서 제공하는 js 파트
const color = "aqua";
const boundingBoxColor = "red";
const lineWidth = 2;
function toTuple({y, x}) {
    return [y, x];
}

function drawPoint(ctx, y, x, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);
    adjacentKeyPoints.forEach((keypoints) => {
        drawSegment(toTuple(keypoints[0].position), toTuple(keypoints[1].position), color, scale, ctx);
    });
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];
        if (keypoint.score < minConfidence) {
            continue;
        }
        const {y, x} = keypoint.position;
        drawPoint(ctx, y * scale, x * scale, 3, color);
    }
}

function drawBoundingBox(keypoints, ctx) {
    const boundingBox = posenet.getBoundingBox(keypoints);
    ctx.rect(
        boundingBox.minX,
        boundingBox.minY,
        boundingBox.maxX - boundingBox.minX,
        boundingBox.maxY - boundingBox.minY
    );
    ctx.strokeStyle = boundingBoxColor;
    ctx.stroke();
}
