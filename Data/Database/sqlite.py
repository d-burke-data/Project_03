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
CREATE TABLE scales (
    F_SCALE     TEXT PRIMARY KEY,
    FUJITA      TEXT NOT NULL,
    DAMAGE      TEXT NOT NULL 
);
'''

create_events_table = '''
CREATE TABLE events (
    EVENT_ID            INTEGER PRIMARY KEY,
    FIPS                TEXT NOT NULL,
    BEGIN_TIMESTAMP     TEXT NOT NULL,
    END_TIMESTAMP       TEXT NOT NULL,
    -- WFO                 TEXT NOT NULL,
    DEATHS              INTEGER NOT NULL,
    INJURIES            INTEGER NOT NULL,
    DAMAGE_PROPERTY     INTEGER NOT NULL,
    DAMAGE_CROPS        INTEGER NOT NULL,
    TOR_F_SCALE         TEXT NOT NULL,
    TOR_F_LEVEL         TEXT NOT NULL,
    TOR_LENGTH          NUMERIC,
    TOR_WIDTH           INTEGER,
    -- TOR_OTHER_WFO       TEXT,
    -- TOR_OTHER_CZ_FIPS   TEXT,
    
    -- may remove/update
    BEGIN_RANGE         INTEGER,
    BEGIN_AZIMUTH       TEXT,
    BEGIN_LOCATION      TEXT,
    END_RANGE           INTEGER,
    END_AZIMUTH         TEXT,
    END_LOCATION        TEXT,

    BEGIN_LAT           NUMERIC,
    BEGIN_LON           NUMERIC,
    END_LAT             NUMERIC,
    END_LON             NUMERIC,
    EVENT_NARRATIVE     TEXT,

    -- to be removed
    -- TORNADO_ID          INTEGER NOT NULL,

    -- foreign keys
    FOREIGN KEY(FIPS) REFERENCES counties(FIPS),
    FOREIGN KEY(TOR_F_LEVEL) REFERENCES scales(F_SCALE)
);
'''

# execute create statements
conn.execute(create_counties_table)
conn.execute(create_scales_table)
conn.execute(create_events_table)


# --------------------------
# add csv data to tables
# --------------------------

# read csv data
counties_df = pd.read_csv('../../Data/fips_data.csv', dtype={'FIPS': str})  #force fips to be read as string
scales_df = pd.read_csv('../../Data/f_scales.csv')
events_df = pd.read_csv('../../Data/Tornadoes_1950_2024.csv', dtype={'FIPS': str})  #force fips to be read as string

# append data to existing tables
counties_df.to_sql('counties', conn, if_exists='append', index=False)
scales_df.to_sql('scales', conn, if_exists='append', index=False)
events_df.to_sql('events', conn, if_exists='append', index=False)

# --------------------------
# close connection
# --------------------------
conn.close()