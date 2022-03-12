from django.shortcuts import render

from django.views.decorators import gzip
from django.http import StreamingHttpResponse
import cv2
import threading
from pathlib import Path


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

# Create your views here.
def home(request):
    return render(request,"home.html") #home.html을 호출해서 띄워준다.

count=0

def check_HandsUp(points):
    global count
    if points[0] and points[1] and points[4] and points[7]: #머리, 오른쪽 손목, 왼쪽 손목
        head_x,head_y=points[0]
        neck_x,neck_y=points[1]
        r_x,r_y=points[4]
        l_x,l_y =points[7]
        
        if (head_y+neck_y)/2<=r_y and (head_y+neck_y)/2<=l_y:
            print("Hands Up"+str(count))
            count+=1

def check_X(points):
    global count
    if points[3] and points[4] and points[6] and points[7]:
            x11,y11=points[3]
            x12,y12=points[4]
            x21,y21=points[6]
            x22,y22=points[7]
            
            if gradient(x11,y11,x12,y12,x21,y21,x22,y22)=="minus":
                if (x12-x22)**2 <15:
                    print("XXXXXXX"+str(count)) 
                    count+=1
                    
def gradient(x1,y1,x2,y2,x3,y3,x4,y4):
    try:
        f1=(y1-y2)/(x1-x2)
        f2=(y3-y4)/(x3-x4)
        if f1*f2<0:
            return "minus"
        else:
            return "plus"
    except:  # This is bad! replace it with proper handling
        return "None"
    
    
def is_divide(x11,y11,x12,y12,x21,y21,x22,y22):
    f1= (x12-x11)*(y21-y11) - (y12-y11)*(x21-x11)
    f2= (x12-x11)*(y22-y11) - (y12-y11)*(x22-x11)
    if f1*f2 < 0 :
      return True
    else:
      return False

def is_cross(x11,y11,x12,y12,x21,y21,x22,y22):
    b1 = is_divide(x11,y11, x12,y12, x21,y21, x22,y22)
    b2 = is_divide(x21,y21, x22,y22, x11,y11, x12,y12)
    if b1 and b2:
        return True
    else:
        return False

class Openpose(object):
    def __init__(self):
        self.video = cv2.VideoCapture(0) #카메라 정보 받아옴
        (self.grabbed, self.frame) = self.video.read()
        threading.Thread(target=self.update, args=()).start()

    def __del__(self):
        self.video.release()

    def update(self):
        while True:
            (self.grabbed, self.frame) = self.video.read()
    
    def get_frame(self):
        _,frame = self.video.read()
        inputWidth=320;
        inputHeight=240;
        inputScale=1.0/255;
        
        frameWidth = frame.shape[1]
        frameHeight = frame.shape[0]
    
        inpBlob = cv2.dnn.blobFromImage(frame, inputScale, (inputWidth, inputHeight), (0, 0, 0), swapRB=False, crop=False)
    
        imgb=cv2.dnn.imagesFromBlob(inpBlob)
        
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
                
        #check_X(points)
        check_HandsUp(points)
        
        


        # 각 POSE_PAIRS별로 선 그어줌 (머리 - 목, 목 - 왼쪽어깨, ...)
        for pair in POSE_PAIRS:
            partA = pair[0]             # Head
            partA = BODY_PARTS[partA]   # 0
            partB = pair[1]             # Neck
            partB = BODY_PARTS[partB]   # 1

            #print(partA," 와 ", partB, " 연결\n")
            if points[partA] and points[partB]:
                cv2.line(frame, points[partA], points[partB], (0, 255, 0), 2)
                
        
        _, jpeg = cv2.imencode('.jpg', frame)
        return jpeg.tobytes()
            
    

def gen(camera):
    while True:
        frame = camera.get_frame()
        yield(b'--frame\r\n'
              b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

@gzip.gzip_page
def detectme(request):
    try:
        return StreamingHttpResponse(gen(Openpose()), content_type="multipart/x-mixed-replace;boundary=frame")
    except:  # This is bad! replace it with proper handling
        print("에러입니다...")
        pass