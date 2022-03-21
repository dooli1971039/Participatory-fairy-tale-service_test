from http.client import HTTPResponse
from cv2 import VideoCapture
from django.shortcuts import render,HttpResponse,redirect

from django.views.decorators import gzip
from django.http import StreamingHttpResponse
import cv2
#import threading
from pathlib import Path
#from httpx import head

#from imutils.video import VideoStream, FPS
#import time

# MPII에서 각 파트 번호, 선으로 연결될 POSE_PAIRS
BODY_PARTS = { "Head": 0, "Neck": 1, "RShoulder": 2, "RElbow": 3, "RWrist": 4,
                "LShoulder": 5, "LElbow": 6, "LWrist": 7, "RHip": 8, "RKnee": 9,
                "RAnkle": 10, "LHip": 11, "LKnee": 12, "LAnkle": 13, "Chest": 14,
                "Background": 15 }

POSE_PAIRS = [ ["Head", "Neck"], ["Neck", "RShoulder"], ["RShoulder", "RElbow"],
                ["RElbow", "RWrist"], ["Neck", "LShoulder"], ["LShoulder", "LElbow"],
                ["LElbow", "LWrist"], ["Neck", "Chest"], ["Chest", "RHip"], ["RHip", "RKnee"],
                ["RKnee", "RAnkle"], ["Chest", "LHip"], ["LHip", "LKnee"], ["LKnee", "LAnkle"] ]

# 각 파일 path
BASE_DIR = Path(__file__).resolve().parent
protoFile = str(BASE_DIR)+"/file/pose_deploy_linevec_faster_4_stages.prototxt"
weightsFile = str(BASE_DIR)+"/file/pose_iter_160000.caffemodel"
# 위의 path에 있는 network 모델 불러오기
net = cv2.dnn.readNetFromCaffe(protoFile, weightsFile)


#openCV의 좌표계는 좌측위가 (0,0)이다...
#아래/오른쪽으로 갈수록 증가한다
def check_HandsUp(points):
     #머리, 오른쪽 손목, 왼쪽 손목
    if points[0] and points[4] and points[7]:
        head_x,head_y=points[0]
        r_x,r_y=points[4]
        l_x,l_y =points[7]
        
        #머리보다 양 손목의 위치가 높아야 한다.
        #양 손목 중간에 머리가 위치해야 한다.
        if l_x>head_x and head_x>r_x and head_y>=r_y and head_y>=l_y:  
            return True
        else:
            return False

def check_O(points):
    #머리, 오른쪽 팔꿈치, 오른쪽 손목, 왼쪽 팔꿈치, 왼쪽 손목
    if points[0] and points[3] and points[4] and points[6] and points[7]:
        head_x,head_y=points[0]
        re_x,re_y=points[3]
        rw_x,rw_y=points[4]
        le_x,le_y=points[6]
        lw_x,lw_y=points[7]
        
        #기본적으로 만세 조건을 만족시킬것 chek_HandsUP()
        #양 손목이 팔꿈치보다 안쪽에 위치할 것
        #양 손목이 팔꿈치보다 위쪽에 위치할 것
        if check_HandsUp(points) and re_x<rw_x and le_x>lw_x and re_y>rw_y and le_y>lw_y:
            return True
        else:
            return False
    
def check_X(points):
    #머리, 오른쪽 어깨, 오른쪽 팔꿈치, 오른쪽 손목, 왼쪽 어깨, 왼쪽 팔꿈치, 왼쪽 손목, 몸통(가슴)
    if points[0] and points[2] and points[3] and points[4] and points[5] and points[6] and points[7] and points[14]:
        head_x,head_y=points[0]
        rs_x,rs_y=points[2]
        re_x,re_y=points[3]
        rw_x,rw_y=points[4]
        ls_x,ls_y=points[5]
        le_x,le_y=points[6]
        lw_x,lw_y=points[7]
        b_x,b_y=points[14]
        
        #몸(가슴)에 점찍히는 부분보다 팔꿈치가 위쪽에 위치 (가슴 말고 골반으로 해야하나...)
        #팔꿈치보다 손목이 위쪽에 위치
        #손목보다 머리가 위쪽에 위치
        #양 팔꿈치 사이에 몸이 위치
        #어깨 안쪽으로 손목이 위치
        if (b_y>le_y and b_y>re_y) and (le_y>lw_y and re_y >rw_y) and(lw_y>head_y and rw_y>head_y):
            if (re_x<b_x and b_x<le_x) and (rs_x<rw_x and lw_x<ls_x):
                r_gradient=l_gradient=0
                if rw_x-re_x !=0:
                    r_gradient= (rw_y-re_y)/(rw_x-re_x)
                if lw_x-le_x !=0:
                    l_gradient= (lw_y-le_y)/(lw_x-le_x)

                if r_gradient<0 or l_gradient>0:
                    return True
                else:
                    return False           

def show_result(pose_type,status): #END/Again
    ##결과를 보여주고
    ##소리도 재생시켜야 한다.
    ##그리고 끝낸다.(여기서 제발 카메라 좀 꺼보자ㅠㅠㅠ)
    if status==2: #status 2
        print("자세를 취해주세요.")
        return "Again"
        
    elif status==1: #status 1
        print("X를 선택하셨습니다.")
        return "END"
        
    else: #status 0
        if pose_type=="OX":
            print("O를 선택하셨습니다.")
            
        elif pose_type=="XHandsUp":
            print("만세를 선택하셨습니다.")
            
        return "END"
            

check=0;
def count_time(status,keep_time,pose_type):
    #대충 1초에 3번 정도 불리는 듯
    global check
    #print(elapsed,"####") 
    if check==3:
        if keep_time[0]==5 or keep_time[1]==5 or keep_time[2]==8:
            result=show_result(pose_type,status) #END / Again
            if result=="END":
                return result
            elif result=="Again":
                 keep_time[0]=keep_time[1]=keep_time[2]=0 #시간 초기화
        
        elif keep_time[status]==0:
            #다른 모션에서 바뀌어 들어옴
            keep_time[0]=keep_time[1]=keep_time[2]=0
            keep_time[status]+=1

    
        elif keep_time[status]!=0:
            keep_time[status]+=1
        
        
        check=0
    else:
        check+=1
        

    
class Openpose(object):
    def __init__(self):
        self.video = cv2.VideoCapture(0,cv2.CAP_DSHOW)
        #self.start=time.time() #시간
        #self.video=VideoStream(src=0).start()
        #self.fps = FPS().start()

    def __del__(self):
        self.video.release()
        cv2.destroyAllWindows()

    
    def get_frame(self,pose_type,status,keep_time):
        _,frame = self.video.read()
        #frame = self.video.read()
        inputWidth=320;
        inputHeight=240;
        inputScale=1.0/255;
        
        frameWidth = frame.shape[1]
        frameHeight = frame.shape[0]
    
        inpBlob = cv2.dnn.blobFromImage(frame, inputScale, (inputWidth, inputHeight), (0, 0, 0), swapRB=False, crop=False)
        #imgb=cv2.dnn.imagesFromBlob(inpBlob)
        
        # network에 넣어주기
        net.setInput(inpBlob)

        # 결과 받아오기
        output = net.forward() #추론을 진행할때 이용하는 함수
        
        # 키포인트 검출시 이미지에 그려줌
        points = []
        for i in range(0,15):
            # 해당 신체부위 신뢰도 얻음.
            probMap = output[0, i, :, :]

            # global 최대값 찾기
            minVal, prob, minLoc, point = cv2.minMaxLoc(probMap)

            # 원래 이미지에 맞게 점 위치 변경
            x = (frameWidth * point[0]) / output.shape[3]
            y = (frameHeight * point[1]) / output.shape[2]

            # 키포인트 검출한 결과가 0.1보다 크면(검출한곳이 위 BODY_PARTS랑 맞는 부위면) points에 추가, 검출했는데 부위가 없으면 None으로    
            if prob > 0.1 :    
                cv2.circle(frame, (int(x), int(y)), 3, (0, 255, 255), thickness=-1, lineType=cv2.FILLED) # circle(그릴곳, 원의 중심, 반지름, 색)
                cv2.putText(frame, "{}".format(i), (int(x), int(y)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, lineType=cv2.LINE_AA)
                points.append((int(x), int(y)))
            else :
                points.append(None)
             
        #OX일때   
        if pose_type=="OX":
            if check_O(points):
                status=0
            elif check_X(points):
                status=1
            else:
                status=2
        
        #XHandsUp일때   
        elif pose_type=="XHandsUp":       
            if check_HandsUp(points):
                status=0
            elif check_X(points):
                status=1
            else:
                status=2
        
        #시간   
        # elapsed=time.time()-self.start

        check_end=count_time(status,keep_time,pose_type)
        if check_end=="END":
            return "END"
                
        

        # 각 POSE_PAIRS별로 선 그어줌 (머리 - 목, 목 - 왼쪽어깨, ...)
        for pair in POSE_PAIRS:
            partA = pair[0]             # Head
            partA = BODY_PARTS[partA]   # 0
            partB = pair[1]             # Neck
            partB = BODY_PARTS[partB]   # 1

            #print(partA," 와 ", partB, " 연결\n")
            if points[partA] and points[partB]:
                cv2.line(frame, points[partA], points[partB], (0, 255, 0), 2)
                
        #self.fps.update()
        _, jpeg = cv2.imencode('.jpg', frame)
        return jpeg.tobytes()
            
    

def gen(camera,pose_type):
    status=2
    keep_time=[0,0,0]
    #여기에 소리도 추가하자
    while True:
        frame = camera.get_frame(pose_type,status,keep_time)
        if frame=="END":
            del camera
            break
        else:
            yield(b'--frame\r\n'
                 b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')


@gzip.gzip_page
def detectme_OX(request):
    try:
        return StreamingHttpResponse(gen(Openpose(),"OX"), content_type="multipart/x-mixed-replace;boundary=frame")
    except:  # This is bad! replace it with proper handling
        print("에러입니다...")
        pass
    
@gzip.gzip_page
def detectme_XHandsUp(request):
    try:
        return StreamingHttpResponse(gen(Openpose(),"XHandsUp"), content_type="multipart/x-mixed-replace;boundary=frame")
    except:  # This is bad! replace it with proper handling
        print("에러입니다...")
        pass



# Create your views here.
def home(request):
    return render(request,"home.html") #home.html을 호출해서 띄워준다.
 
def HTMLTemplate(pose_type): 
    return f'''<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Title</title>
    </head>
    <body>
        <h1>{pose_type}-Pose</h1>
        <table>
            <tr>
                <td>
                    <img
                        src="http://127.0.0.1:8000/detectme_{pose_type}"
                        style="width: 320px; height: 240px"
                    />
                </td>
                <td><h2><a href="/">돌아가기</a></h2></td>
            </tr>
        </table>
    </body>
</html>
'''

def OX(request):
    pose_type="OX"
    return HttpResponse(HTMLTemplate(pose_type))

def XHandsUp(request):
    pose_type="XHandsUp"
    return HttpResponse(HTMLTemplate(pose_type))