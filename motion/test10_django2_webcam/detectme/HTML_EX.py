from django.http import HttpResponse
from django.shortcuts import render,HttpResponse,redirect
from django.views.decorators.csrf import csrf_exempt
from httpx import request

def HTMLTemplate(articleTag,id=None):  #id값이 없는 경우 None이 기본값
    return f'''<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Title</title>
    </head>
    <body>
        <h1>Video...</h1>

        <table>
            <tr>
                <td>
                    <img
                        src="http://127.0.0.1:8000/detectme"
                        style="width: 320px; height: 240px"
                    />
                </td>

                <td>{articleTag}</td>
            </tr>
        </table>
    </body>
</html>
'''

def OX(request):
    article='''
    <h2>OX-Pose</h2>
    '''
    return HttpResponse(HTMLTemplate(article))

def XHandsUp(request):
    article='''
    <h2>XHandsUp-Pose</h2>
    '''
    return HttpResponse(HTMLTemplate(article))