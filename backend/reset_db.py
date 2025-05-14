from sqlalchemy import text

from db import Base, engine
from models import Event, Speaker

# Speaker.__table__.drop(bind=engine)
# Event.__table__.drop(bind=engine)
# Base.metadata.create_all(bind=engine)

# Base.metadata.drop_all(bind=engine)
# Base.metadata.create_all(bind=engine)

with engine.connect() as conn:
    conn.execute(text("DROP TABLE events CASCADE"))
    conn.commit()
