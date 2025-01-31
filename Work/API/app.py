# import dependencies
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func

from flask import Flask, request, jsonify

import datetime as dt
import numpy as np

# ----------------------------
# Database Setup
# ----------------------------

# create engine to database
engine = create_engine('sqlite:///../Database/us_tornadoes.sqlite')

# reflect existing database into new model
Base = automap_base()
Base.prepare(autoload_with=engine)

# save references to the tables
Counties = Base.classes.counties
Scales = Base.classes.scales
Events = Base.classes.events

# ----------------------------
# Flask Setup
# ----------------------------
app = Flask(__name__)

# ----------------------------
# Flask Routes
# ----------------------------

# home page
@app.route('/')
def welcome():
    return('Welcome to Tornadoes API')

# query events by year
@app.route('/api/v1.0/tornadoes', methods=['GET'])
def get_events():

    # endpoint example /api/v1.0/tornadoes?start_year=2020&duration=1
    start_year = request.args.get('start_year', type=int)
    duration = request.args.get('duration', type=int)
    
    # create session to db
    session = Session(engine)

    # query for year and get all columns (events + counties tables)
    results = (
        session.query(Events, Counties)
        .join(Counties, Events.FIPS == Counties.FIPS)
        .filter(
            func.strftime('%Y', Events.BEGIN_TIMESTAMP, 'unixepoch') >= str(start_year),
            func.strftime('%Y', Events.BEGIN_TIMESTAMP, 'unixepoch') <= str(start_year + duration - 1)
        )
        .all()
    )

    # close session
    session.close()

    # convert results into list of dictionaries
    events_info = []

    for ev_obj, ct_obj in results:
        combined = {}
        # grab events columns
        for col in ev_obj.__table__.columns.keys():
            combined[col] = getattr(ev_obj, col)
        # grab counties columns
        for col in ct_obj.__table__.columns.keys():
            combined[col] = getattr(ct_obj, col)
        # add to list
        events_info.append(combined)

    # return jsonify
    return jsonify(events_info)




# run local server with the app
if __name__ == '__main__':
    app.run(debug=True)