const video = document.getElementById('video');
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const result_label=document.getElementById("result_label")
let pose_status=2;
let keep_time=[0,0,0];

//webcam을 enable하는 코드
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function (stream) {
        video.srcObject = stream;
    });

//then 안쪽이 function(model){} 이렇게 쓰는거랑 같다 (인자가 하나라 중괄호가 없는 것)
posenet.load().then(model => { // 이곳의 model과 아래 predict의 model은 같아야 한다.
    video.onloadeddata = (e) => { //비디오가 load된 다음에 predict하도록. (안하면 콘솔에 에러뜸)
        predict();
    }

    function predict() { //frame이 들어올 때마다 estimate를 해야하니 함수화 시킴
        model.estimateSinglePose(video).then(pose => {
            canvas.width = video.width; //캔버스와 비디오의 크기를 일치시킴
            canvas.height = video.height;
            drawKeypoints(pose.keypoints, 0.6, context);
            drawSkeleton(pose.keypoints, 0.6, context);
            
            check_Pose(pose);
        });
        requestAnimationFrame(predict); //frame이 들어올 때마다 재귀호출
    };
})

let count_time = setInterval(function(){
    if(keep_time[pose_status]==0){
        //다른 모션에서 바뀌어 들어옴
        keep_time[0] = keep_time[2] = 0;
        keep_time[pose_status]++;
    }else {
        if (pose_status == 0)
            result_label.innerText = `자세를 ${keep_time[pose_status]}초 유지하셨습니다.`;
        else if (pose_status == 2)
            result_label.innerText = `포즈를 취해주세요.`;

        if (keep_time[0]==10 || keep_time[2]==8) {
            if (pose_status == 0) {
                //new Audio(URL + "O_choose.mp3").play();
                result_label.innerText = `자세 유지에 성공하셨습니다.`;
            } else {
                //new Audio(URL + "X_choose.mp3").play();
                result_label.innerText = `자세 유지에 실패하셨습니다.`;
            }
            clearInterval(count_time);
            
            //이러고 2초 정도 있다가 다음 페이지로 넘어가면 될듯
            setTimeout(function(){window.location.href = 'home.html';},2000);
        }
        keep_time[pose_status]++; //시간은 항상 세고 있다.
    }
},1000);

function check_Pose(pose){
    if(!check_Stretching(pose)){
        pose_status=2;
    }else{
        pose_status=0;
    }
}

function check_HandsUp(pose){
    head = pose.keypoints[0].position //머리(코)

    rw = pose.keypoints[10].position; //오른쪽 손목
    re = pose.keypoints[8].position; //오른쪽 팔꿈치
    rs = pose.keypoints[6].position //오른쪽 어깨

    lw = pose.keypoints[9].position; //왼쪽 손목
    le = pose.keypoints[7].position; //왼쪽 팔꿈치
    ls = pose.keypoints[5].position; //왼쪽 어깨


    //팔꿈치가 어깨보다 높을 것, 양 팔꿈치 사이에 머리가 위치할 것
    if(re.y<rs.y && le.y<ls.y && re.x<head.x && head.x<le.x){
        //양쪽 손목 중, 어느 하나라도 머리보다는 위에 위치할 것
        if(rw.y<head.y || lw.y<head.y){
            return true;
        }else{
            return false;
        }
    }else{
        return false;
    }
}

function check_O(pose){
    rw = pose.keypoints[10].position; //오른쪽 손목
    re = pose.keypoints[8].position; //오른쪽 팔꿈치
    lw = pose.keypoints[9].position; //왼쪽 손목
    le = pose.keypoints[7].position; //왼쪽 팔꿈치
    if(check_HandsUp(pose) && ((re.x<rw.x && rw.y<re.y) || (le.x>lw.x && le.y>lw.y))){
        return true;
    }else{
        return false;
    }
}

function check_Stretching(pose){
    rh=pose.keypoints[12].position; //오른쪽 골반
    rk=pose.keypoints[14].position; //오른쪽 무릎
    ra=pose.keypoints[16].position; //오른쪽 발목

    lh=pose.keypoints[11].position; //왼쪽 골반
    lk=pose.keypoints[13].position; //왼쪽 무릎
    la=pose.keypoints[15].position; //왼쪽 발목

    //기본적으로 O 조건을 만족시킬 것
    if(check_O(pose)){
        //오른쪽을 구부리거나
        if(rk.x<rh.x && rk.x<ra.x && ra.y<la.y){
            return true;
        }
        //왼쪽을 구부리거나
        else if(lk.x>lh.x && lk.x>la.x && la.y<ra.y){
            return true;
        }
        else{
            return false;
        }
    }else{
        return false
    }
}


//tensorflow에서 제공하는 js 파트
const color = 'aqua';
const boundingBoxColor = 'red';
const lineWidth = 2;
function toTuple({ y, x }) {
    return [y, x];
}
function drawPoint(ctx, y, x, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}
/**
 * Draws a line on a canvas, i.e. a joint
 */
function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
}
/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
    const adjacentKeyPoints =
        posenet.getAdjacentKeyPoints(keypoints, minConfidence);
    adjacentKeyPoints.forEach((keypoints) => {
        drawSegment(
            toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,
            scale, ctx);
    });
}
/**
 * Draw pose keypoints onto a canvas
 */
function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];
        if (keypoint.score < minConfidence) {
            continue;
        }
        const { y, x } = keypoint.position;
        drawPoint(ctx, y * scale, x * scale, 3, color);
    }
}
/**
 * Draw the bounding box of a pose. For example, for a whole person standing
 * in an image, the bounding box will begin at the nose and extend to one of
 * ankles
 */
function drawBoundingBox(keypoints, ctx) {
    const boundingBox = posenet.getBoundingBox(keypoints);
    ctx.rect(
        boundingBox.minX, boundingBox.minY, boundingBox.maxX - boundingBox.minX,
        boundingBox.maxY - boundingBox.minY);
    ctx.strokeStyle = boundingBoxColor;
    ctx.stroke();
}