from functools import wraps

from flask import Flask, render_template, request, current_app, abort

from easydonate import GetPayment

app = Flask(__name__)


def debug_only(f):
    @wraps(f)
    def wrapped(**kwargs):
        if not current_app.debug:
            abort(403)

        return f(**kwargs)

    return wrapped


@app.route('/')
def home_view():
    return render_template('home.html')


@app.route('/api/search', methods=['POST'])
def search():
    body = request.json
    return GetPayment(field=body["field"], data=body["data"]).results


@app.route('/api/sum', methods=['POST'])
def sum_enrolled():
    return GetPayment().sum_enrolled(request.json["interval"])


@app.route('/api/coupons', methods=['GET'])
@debug_only
def coupons():
    return GetPayment("coupons").coupons


@app.route('/api/raw', methods=['GET'])
@debug_only
def raw():
    return GetPayment().raw


if __name__ == '__main__':
    app.run(port=9914)
