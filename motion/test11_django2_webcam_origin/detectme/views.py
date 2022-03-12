from django.shortcuts import render

from django.views.decorators import gzip
from django.http import StreamingHttpResponse
import cv2
import threading

# Create your views here.
def home(request):
    return render(request,"home.html") #home.html을 호출해서 띄워준다.


class VideoCamera(object):
    def __init__(self):
        self.video = cv2.VideoCapture(0) #카메라 정보 받아옴
        (self.grabbed, self.frame) = self.video.read()
        threading.Thread(target=self.update, args=()).start()

    def __del__(self):
        self.video.release()

    def get_frame(self):
        image = self.frame
        _, jpeg = cv2.imencode('.jpg', image)
        return jpeg.tobytes()

    def update(self):
        while True:
            (self.grabbed, self.frame) = self.video.read()


def gen(camera):
    while True:
        frame = camera.get_frame()
        yield(b'--frame\r\n'
              b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')


@gzip.gzip_page
def detectme(request):
    try:
        cam = VideoCamera() #웹캠 호출
        return StreamingHttpResponse(gen(cam), content_type="multipart/x-mixed-replace;boundary=frame")
    except:  # This is bad! replace it with proper handling
        print("에러입니다...")
        pass