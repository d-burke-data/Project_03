# --------------------------
# dependencies
# --------------------------
import sqlite3
import pandas as pd

# --------------------------
# setup database
# --------------------------

# define .sqlite file
db_file = 'us_tornadoes.sqlite'

# create/connect to the db
conn = sqlite3.connect(db_file)

# enable foreign key constraints
conn.execute('PRAGMA foreign_keys = ON;')

# --------------------------
# create tables
# --------------------------
create_states_table = '''
CREATE TABLE IF NOT EXISTS states (
    STATEFP     INTEGER PRIMARY KEY,
    STATE       TEXT NOT NULL
);
'''

create_counties_table = '''
CREATE TABLE IF NOT EXISTS counties (
    COUNTYFP    INTEGER PRIMARY KEY,
    COUNTYNAME  TEXT NOT NULL,
    STATEFP     INTEGER NOT NULL,

    -- foreign key
    FOREIGN KEY(STATEFP) REFERENCES states(STATEFP)
);
'''

create_scales_table = '''
CREATE TABLE IF NOT EXISTS scales (
    TOR_F_SCALE         TEXT PRIMARY KEY,
    TOR_F_DESCRIPTION   TEXT NOT NULL
);
'''

create_events_table = '''
CREATE TABLE IF NOT EXISTS events (
    EVENT_ID            INTEGER PRIMARY KEY,
    TORNADO_ID          INTEGER NOT NULL,
    BEGIN_TIME          DATE NOT NULL,
    END_TIME            DATE NOT NULL,
    CZ_FIPS             INTEGER NOT NULL,
    WFO                 TEXT NOT NULL,
    INJURIES            INTEGER NOT NULL,
    DEATHS              INTEGER NOT NULL,
    DAMAGE_PROPERTY     INTEGER NOT NULL,
    DAMAGE_CROPS        INTEGER NOT NULL,
    TOR_F_SCALE         TEXT NOT NULL,
    TOR_LENGTH          NUMERIC NOT NULL,
    TOR_WIDTH           INTEGER NOT NULL,
    TOR_OTHER_WFO       TEXT,
    TOR_OTHER_CZ_FIPS   INTEGER,
    
    -- may remove/update
    BEGIN_RANGE         INTEGER,
    BEGIN_AZIMUTH       TEXT,
    BEGIN_LOCATION      TEXT,
    END_RANGE           INTEGER,
    END_AZIMUTH         TEXT,
    END_LOCATION        TEXT,

    BEGIN_LAT           NUMERIC NOT NULL,
    BEGIN_LON           NUMERIC NOT NULL,
    END_LAT             NUMERIC NOT NULL,
    END_LON             NUMERIC NOT NULL,
    EVENT_NARRATIVE     TEXT NOT NULL,

    -- foreign keys
    FOREIGN KEY(CZ_FIPS) REFERENCES counties(COUNTYFP),
    FOREIGN KEY(TOR_F_SCALE) REFERENCES scales(tor_f_scale),
    FOREIGN KEY(TOR_OTHER_CZ_FIPS) REFERENCES counties(COUNTYFP)
);
'''


