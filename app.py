from flask import Flask, render_template, request
from easydonate import GetPayment

app = Flask(__name__)


@app.route('/')
def home_view():
    return render_template('home.html')


@app.route('/api/search', methods=['POST'])
def search():
    body = request.json
    return GetPayment(body["field"], body["data"]).results


if __name__ == '__main__':
    app.run()
