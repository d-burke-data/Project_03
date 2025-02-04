# import dependencies
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func

from flask import Flask, request, jsonify
from flask_cors import CORS

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
CORS(app)

# ----------------------------
# Flask Routes
# ----------------------------

# home page
@app.route('/')
def welcome():
     return ('Welcome to the tornado API')

# query events by year (optional: state or county or scale)
@app.route('/api/v1.0/events', methods=['GET'])
def get_events():
    
    # endpoint example:/api/v1.0/events?start_year=2020&duration=1&state=AL&fip=01234&scale=1
    '''
    Required: 
        ?start_year = YYYY
        ?duration = # (number of years)
    Optional:
        ?state = state abbreviation
        ?fip = county_fip
        ?scale = tor_f_level (or f_scale)
    '''

    # request endpoints
    start_year = request.args.get('start_year', type=int)
    duration = request.args.get('duration', type=int)
    state = request.args.get('state', None, type=str)  #optional
    county = request.args.get('fip', None, type=str)   #optional
    scale = request.args.get('scale', None, type=str)  #optional

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
    if scale:
        query = query.filter(Events.TOR_F_LEVEL == scale)

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
        ?scale = tor_f_level (or f_scale)
    '''
    # -----------------------------------------
    # Base query setup
    # -----------------------------------------

    # request endpoints
    start_year = request.args.get('start_year', type=int)
    duration = request.args.get('duration', type=int)
    state = request.args.get('state', None, type=str)  #optional
    county = request.args.get('fip', None, type=str)   #optional
    scale = request.args.get('scale', None, type=str)  #optional

    # calculate months in duration
    months = duration * 12

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
    if scale:
        base_query = base_query.filter(Events.TOR_F_LEVEL == scale)
    
    # -----------------------------------------
    # Dashboard data aggregation
    # -----------------------------------------

    # event count by county (for map)
    county_counts = (base_query
                     # select fips, county name, and get count
                     .with_entities(Counties.FIPS, Counties.COUNTYNAME, func.count(Events.EVENT_ID), Counties.STATE)
                     # group by fip
                     .group_by(Counties.FIPS)
                     .all()
                     )

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
    
    # duration info (total time of events and avg duration per event)
    duration_info = (base_query
                     .with_entities(
                         # calculate duration in seconds and get hours
                         func.sum((Events.END_TIMESTAMP - Events.BEGIN_TIMESTAMP)/3600.0),
                         func.avg((Events.END_TIMESTAMP - Events.BEGIN_TIMESTAMP)/3600.0)  #avg time each event lasted
                     )
                     .one()
                     )
    # monthly event count
    monthly_counts = (base_query
                      .with_entities(
                          func.strftime('%Y', func.datetime(Events.BEGIN_TIMESTAMP, 'unixepoch')).label('yr'),
                          func.strftime('%m', func.datetime(Events.BEGIN_TIMESTAMP, 'unixepoch')).label('mn'),
                          func.count(Events.EVENT_ID),
                          func.sum(Events.DEATHS),
                          func.sum(Events.INJURIES),
                          func.sum(Events.DAMAGE_PROPERTY),
                          func.sum(Events.DAMAGE_CROPS)
                      )
                      .group_by('yr', 'mn')
                      .order_by('yr', 'mn')  #order data chronologically
                      .all()
                      )

    # close session
    session.close()

    # -----------------------------------------
    # Convert each db result
    # -----------------------------------------

    # events by county count
    county_heatmap = []
    for (fip, name, cnt, state) in county_counts:
        cnt = cnt or 0  #if cnt is None make 0
        county_heatmap.append({
            'fip': fip,
            'name': name,
            'count': cnt,
            'state': state
        })

    # pie chart by EF scale
    scale_pie = []
    for (scale, count) in scale_counts:
        count = count or 0  #if cnt is None make 0
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
    
    total_events            = total_events or 0
    total_damage_property   = total_damage_property or 0
    total_damage_crops      = total_damage_crops or 0
    total_deaths            = total_deaths or 0
    total_injuries          = total_injuries or 0
    
    def avg(val): # define avg function & avoiding dividing by 0
        return round(float(val)/months, 2) if months else 0
    
    summary_table = {
        'events': {
            'total': total_events,
            'avg_per_month': avg(total_events)
        },
        'damaged_property': {
            'total': total_damage_property,
            'avg_per_month': avg(total_damage_property)
        },
        'damaged_crops': {
            'total': total_damage_crops,
            'avg_per_month': avg(total_damage_crops)
        },
        'deaths': {
            'total': total_deaths,
            'avg_per_month': avg(total_deaths)
        },
        'injuries': {
            'total': total_injuries,
            'avg_per_month': avg(total_injuries)
        }
    }

    # duration table
    (total_hours, avg_hours) = duration_info
    total_hours = total_hours or 0.0
    avg_hours = avg_hours or 0.0
    
    duration_table = {
        'total_hrs': round(total_hours, 2),
        'avg_hrs_per_event': round(avg_hours, 2)
    }


    # monthly events count chart
    monthly_events_chart = []
    for (yr, mn, cnt, dth, inj, pdmg, cdmg) in monthly_counts:
        cnt = cnt or 0   #if cnt is None make 0
        monthly_events_chart.append({
            'year': yr,
            'month': mn,
            'count': cnt,
            'deaths': dth,
            'injuries': inj,
            'propdmg': pdmg,
            'cropdmg': cdmg
        })
    
    # -----------------------------------------
    # Setup full response
    # -----------------------------------------
    result = {
        'county_heatmap': county_heatmap,
        'scale_pie': scale_pie,
        'summary_table': summary_table,
        'duration_table': duration_table,
        'monthly_events_chart': monthly_events_chart
    }
    
    # return result
    return jsonify(result)

# query for available dropdown options
@app.route('/api/v1.0/options')
def get_options():

    # ---------------------------
    # Get list of unique options
    # ---------------------------

    # create session to db
    session = Session(engine)

    # get list of years
    years_query = (session
                   .query(func.strftime('%Y', Events.BEGIN_TIMESTAMP, 'unixepoch'))
                   .distinct()
                   .all()
                   )
    
    # get list of states
    states_query = (session
                    .query(Counties.STATE)
                    .distinct()
                    .all()
                    )
    
    # close session
    session.close()

    # ---------------------------
    # Convert each db result
    # ---------------------------
    years = [int(year[0]) for year in years_query]
    states = [state[0] for state in states_query]

    # sort result
    years.sort(reverse=True)
    states.sort()

    # ---------------------------
    # Setup full response
    # ---------------------------
    result = {
        'years': years,
        'states': states
    }

    # return result
    return jsonify(result)

# run local server with the app
if __name__ == '__main__':
    app.run(debug=True)