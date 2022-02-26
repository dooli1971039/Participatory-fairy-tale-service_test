import cv2

capture = cv2.VideoCapture(0) #카메라 정보 받아옴
capture.set(cv2.CAP_PROP_FRAME_WIDTH, 640) #카메라 속성 설정
capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 480) # width:너비, height: 높이

#반복문을 통해 카메라에서 프레임을 지속적으로 받아옴
while cv2.waitKey(33) < 0:  
    ret, frame = capture.read()  #카메라 상태 및 프레임 받아옴
    cv2.imshow("VideoFrame", frame) #윈도우 창에 이미지 띄움

capture.release()  #카메라 장치에서 받아온 메모리 해제
cv2.destroyAllWindows() #모든 윈도우 창 닫음