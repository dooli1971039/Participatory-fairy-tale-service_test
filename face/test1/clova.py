#https://hive.blog/kr/@anpigon/openapi-naver-vision-face
#https://developers.naver.com/docs/clova/api/CFR/API_Guide.md#FaceAPI
import os
import sys
import requests
import json

client_id = "uv4f6Ou5HfqfM6eDviIa"
client_secret = "awq3a0NlNt"
url = "https://openapi.naver.com/v1/vision/face" # 얼굴감지
#url = "https://openapi.naver.com/v1/vision/celebrity" # 유명인 얼굴인식
files = {'image': open('face/test1/img/angry2.jpg', 'rb')}
headers = {'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
response = requests.post(url,  files=files, headers=headers)
rescode = response.status_code
if(rescode==200):
    #print (response.text)
    json_data=json.loads(response.text)
    emotion,emotion_confidence=json_data['faces'][0]['emotion'].values()
    print("%s (%s)"%(emotion,emotion_confidence))
else:
    print("Error Code:" + rescode)