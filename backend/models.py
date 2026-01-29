from sqlalchemy import Column, Integer, String, Boolean, Date, Table, ForeignKey, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from db import Base


# association tables
event_participant = Table(
    'event_participant', Base.metadata,
    Column('event_id', Integer, ForeignKey('events.id')),
    Column('participant_id', Integer, ForeignKey('participants.id'))
)

event_speaker = Table(
    'event_speaker', Base.metadata,
    Column('event_id', Integer, ForeignKey('events.id')),
    Column('speaker_id', Integer, ForeignKey('speakers.id'))
)


class Participant(Base):
    __tablename__ = 'participants'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    normalized_name = Column(String)
    ktaname = Column(String)
    note = Column(String)
    is_plusone = Column(Boolean)
    picture_file = Column(String)


class Event(Base):
    __tablename__ = 'events'
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True)
    title = Column(String)
    date = Column(Date)
    story = Column(Text)
    notes = Column(Text)
    script_files = Column(ARRAY(String))
    speaker = relationship("Speaker", secondary=event_speaker)
    participants = relationship("Participant", secondary=event_participant)


class Speaker(Base):
    __tablename__ = 'speakers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    ktaname = Column(String)
    labo = Column(String)
    picture_file = Column(String)


class Prospect(Base):
    __tablename__ = "prospects"
    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)
    approached = Column(String)
    response = Column(String)
    domain = Column(String)
    suggested_by = Column(String)
    remarks = Column(Text)