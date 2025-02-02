# import dependencies
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func

from flask import Flask, request, jsonify

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
     return ('Welcome to the tornado API')

# query events by year (optional: state or county)
@app.route('/api/v1.0/events', methods=['GET'])
def get_events():
    
    # endpoint example:/api/v1.0/events?start_year=2020&duration=1&state=AL&fip=01234
    '''
    Required: 
        ?start_year = YYYY
        ?duration = # (number of years)
    Optional:
        ?state = state abbreviation
        ?fip = county_fip
    '''

    # request endpoints
    start_year = request.args.get('start_year', type=int)
    duration = request.args.get('duration', type=int)
    state = request.args.get('state', None, type=str)  #optional
    county = request.args.get('fip', None, type=str)   #optional

    # create session to db
    session = Session(engine)

    # query for year and get all columns (events + counties tables)
    query = (
        session.query(Events, Counties)
        .join(Counties, Events.FIPS == Counties.FIPS)
        .filter(
            func.strftime('%Y', Events.BEGIN_TIMESTAMP, 'unixepoch') >= str(start_year),
            func.strftime('%Y', Events.BEGIN_TIMESTAMP, 'unixepoch') <= str(start_year + duration - 1)
        )
    )

    # check for location endpoints
    if state:
        query = query.filter(Counties.STATE == state)
    if county:
        query = query.filter(Counties.FIPS == county)

    # execute query
    results = query.all()

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

# query for scales table data
@app.route('/api/v1.0/scales')
def get_scales():
    
    # create session to db
    session = Session(engine)

    # setup query
    results = (session.query(
        Scales.F_SCALE,
        Scales.FUJITA,
        Scales.DAMAGE
    ).all())

    # close session
    session.close()

    # convert result into list of dictionaries
    scales_info = []
    for scale, fujita, damage in results:
        scales_info.append({
            'F_SCALE': scale,
            'FUJITA': fujita,
            'DAMAGE': damage
        })

    # return jsonified data
    return jsonify(scales_info)

# query for counties table data
@app.route('/api/v1.0/counties')
def get_counties():
    
    # create session to db
    session = Session(engine)

    # setup query
    results = (session.query(
        Counties.FIPS,
        Counties.COUNTYNAME,
        Counties.STATE
    ).all())

    # close session
    session.close()

    # convert result into list of dictionaries
    counties_info = []
    for fip, name, state in results:
        counties_info.append({
            'FIPS': fip,
            'COUNTYNAME': name,
            'STATE': state
        })

    # return jsonified data
    return jsonify(counties_info)

# query for dashboard charts/info
@app.route('/api/v1.0/dashboard')
def get_dashboard():
    # endpoint example:/api/v1.0/dashboard?start_year=2020&duration=1&state=AL&fip=01234
    
    '''
    Required: 
        ?start_year = YYYY
        ?duration = # (number of years)
    Optional:
        ?state = state abbreviation
        ?fip = county_fip
    '''
    # -----------------------------------------
    # Base query setup
    # -----------------------------------------

    # request endpoints
    start_year = request.args.get('start_year', type=int)
    duration = request.args.get('duration', type=int)
    state = request.args.get('state', None, type=str)  #optional
    county = request.args.get('fip', None, type=str)   #optional

    # create session to db
    session = Session(engine)

    # build base query
    base_query = session.query(Events).join(Counties, Events.FIPS == Counties.FIPS)

    # required: filter by year range
    base_query = base_query.filter(
        func.strftime('%Y', Events.BEGIN_TIMESTAMP, 'unixepoch') >= str(start_year),
        func.strftime('%Y', Events.BEGIN_TIMESTAMP, 'unixepoch') <= str(start_year + duration - 1)
    )

    # optional: filter for location endpoints
    if state:
        base_query = base_query.filter(Counties.STATE == state)
    if county:
        base_query = base_query.filter(Counties.FIPS == county)
    
    # -----------------------------------------
    # Dashboard data aggregation
    # -----------------------------------------

    # pie chart by EF scale (count of events by scale)
    scale_counts = (base_query
                    # join scales table to reference scales columns
                    .join(Scales, Events.TOR_F_LEVEL == Scales.F_SCALE)
                    # select fujita label and event count
                    .with_entities(Scales.FUJITA, func.count(Events.EVENT_ID))
                    # group by fujita label
                    .group_by(Scales.FUJITA)
                    .all()
                    )
    
    # summary table
    summary_info = (base_query
                     .with_entities(
                         func.count(Events.EVENT_ID),
                         func.sum(Events.DAMAGE_PROPERTY),
                         func.sum(Events.DAMAGE_CROPS),
                         func.sum(Events.DEATHS),
                         func.sum(Events.INJURIES)
                     )
                     .one()
                     )
    
    # close session
    session.close()

    # -----------------------------------------
    # Convert each db result
    # -----------------------------------------

    # pie chart by EF scale
    scale_pie = []
    for (scale, count) in scale_counts:
        scale_pie.append({
            'scale': scale,
            'count': count
        })

    # summary table
    (total_events,
     total_damage_property,
     total_damage_crops,
     total_deaths,
     total_injuries) = summary_info
    
    summary_table = {
        'total_events': total_events,
        'total_damage_property': total_damage_property,
        'total_damage_crops': total_damage_crops,
        'total_deaths': total_deaths,
        'total_injuries': total_injuries
    }
    
    # -----------------------------------------
    # Setup full response
    # -----------------------------------------
    result = {
        'scale_pie': scale_pie,
        'summary_table': summary_table
    }
    
    # return result
    return jsonify(result)

# run local server with the app
if __name__ == '__main__':
    app.run(debug=True)