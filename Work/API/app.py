# import dependencies
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func

from flask import Flask, jsonify

import datetime as dt

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

