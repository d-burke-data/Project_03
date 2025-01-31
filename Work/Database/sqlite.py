# --------------------------
# dependencies
# --------------------------
import sqlite3
import pandas as pd
import os

# --------------------------
# setup database
# --------------------------

# define .sqlite file
db_file = 'us_tornadoes.sqlite'

# remove preexisting db
if os.path.exists(db_file):
    os.remove(db_file)

# create/connect to the db
conn = sqlite3.connect(db_file)

# enable foreign key constraints
conn.execute('PRAGMA foreign_keys = ON;')

# --------------------------
# create tables
# --------------------------

create_counties_table = '''
CREATE TABLE counties (
    FIPS        TEXT PRIMARY KEY,
    COUNTYNAME  TEXT NOT NULL,
    STATE       INTEGER NOT NULL
);
'''

create_scales_table = '''
CREATE TABLE IF NOT EXISTS scales (
    F_SCALE     TEXT PRIMARY KEY,
    FUJITA      TEXT NOT NULL,
    DAMAGE      DAMAGE NOT NULL 
);
'''

create_events_table = '''
CREATE TABLE IF NOT EXISTS events (
    EVENT_ID            INTEGER PRIMARY KEY,
    -- TORNADO_ID          INTEGER NOT NULL,
    BEGIN_TIME          DATE NOT NULL,
    END_TIME            DATE NOT NULL,
    CZ_FIPS             TEXT NOT NULL,
    WFO                 TEXT NOT NULL,
    INJURIES            INTEGER NOT NULL,
    DEATHS              INTEGER NOT NULL,
    DAMAGE_PROPERTY     INTEGER NOT NULL,
    DAMAGE_CROPS        INTEGER NOT NULL,
    TOR_F_SCALE         TEXT NOT NULL,
    TOR_LENGTH          NUMERIC NOT NULL,
    TOR_WIDTH           INTEGER NOT NULL,
    TOR_OTHER_WFO       TEXT,
    TOR_OTHER_CZ_FIPS   TEXT,
    
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
    FOREIGN KEY(CZ_FIPS) REFERENCES counties(FIPS),
    FOREIGN KEY(TOR_F_SCALE) REFERENCES scales(tor_f_scale),
    FOREIGN KEY(TOR_OTHER_CZ_FIPS) REFERENCES counties(FIPS)
);
'''

# execute create statements
# conn.execute(create_states_table)
conn.execute(create_counties_table)
conn.execute(create_scales_table)
conn.execute(create_events_table)


# --------------------------
# add csv data to tables
# --------------------------

# read csv data
#states_df = pd.read_csv('../../Data/state_table.csv')
counties_df = pd.read_csv('../../Data/fips_data.csv', dtype={'FIPS': str})  #force fips to be read as string
scales_df = pd.read_csv('../../Data/f_scales.csv')
#events_df = pd.read_csv('', dtype={'CZ_FIPS': str, 'TOR_OTHER_CZ_FIPS': str})

# append data to existing tables
#states_df.to_sql('states', conn, if_exists='append', index=False)
counties_df.to_sql('counties', conn, if_exists='append', index=False)
scales_df.to_sql('scales', conn, if_exists='append', index=False)
#events_df.to_sql('events', conn, if_exists='append', index=False)

# --------------------------
# close connection
# --------------------------
conn.close()