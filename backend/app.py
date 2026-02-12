from flask import Flask, jsonify
from config import Config
from extensions import limiter
from routes.review import review_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    app.config["RATELIMIT_DEFAULT"] = Config.RATE_LIMIT_DEFAULT
    limiter.init_app(app)

    app.register_blueprint(review_bp)

    @app.get("/health")
    def health_check():
        return jsonify({"status": "ok"}), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=Config.DEBUG)
