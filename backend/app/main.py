"""Flask application entry point — Sustainable Facility Intelligence Dashboard API."""

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from app.routes.dashboard      import dashboard_bp
from app.routes.air_quality    import air_quality_bp
from app.routes.waste          import waste_bp
from app.routes.water          import water_bp
from app.routes.energy         import energy_bp
from app.routes.traffic        import traffic_bp
from app.routes.assets         import assets_bp
from app.routes.emissions      import emissions_bp
from app.routes.safety         import safety_bp
from app.routes.sustainability import sustainability_bp
from app.routes.alerts         import alerts_bp
from app.routes.ml_training    import ml_training_bp
from app.routes.ai_decisions   import ai_decisions_bp
from app.routes.notifications  import notifications_bp
from app.routes.colleges       import colleges_bp


def create_app() -> Flask:
    app = Flask(__name__)

    # CORS
    CORS(app, origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ])

    # Register blueprints
    prefix = "/api"
    app.register_blueprint(dashboard_bp,      url_prefix=prefix)
    app.register_blueprint(air_quality_bp,    url_prefix=prefix)
    app.register_blueprint(waste_bp,          url_prefix=prefix)
    app.register_blueprint(water_bp,          url_prefix=prefix)
    app.register_blueprint(energy_bp,         url_prefix=prefix)
    app.register_blueprint(traffic_bp,        url_prefix=prefix)
    app.register_blueprint(assets_bp,         url_prefix=prefix)
    app.register_blueprint(emissions_bp,      url_prefix=prefix)
    app.register_blueprint(safety_bp,         url_prefix=prefix)
    app.register_blueprint(sustainability_bp, url_prefix=prefix)
    app.register_blueprint(alerts_bp,         url_prefix=prefix)
    app.register_blueprint(ml_training_bp,    url_prefix=prefix)
    app.register_blueprint(ai_decisions_bp,   url_prefix=prefix)
    app.register_blueprint(notifications_bp,  url_prefix=prefix)
    app.register_blueprint(colleges_bp,       url_prefix=prefix)

    @app.get("/health")
    def health():
        return {"status": "ok", "version": "1.0.0"}

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
