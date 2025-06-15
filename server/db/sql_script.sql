-- 1. Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create ENUMs (only once)

-- User Roles
DO $$
	CREATE TYPE user_role AS ENUM ('staff','manager','admin');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;


-- Log Status
DO $$
BEGIN
	CREATE TYPE exit_log_status AS ENUM ('active','archived');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

-- Customer Mood
DO $$
	CREATE TYPE customer_mood AS ENUM ('good','neutral','bad');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

-- Customer Age Range
DO $$
	CREATE TYPE customer_age_range AS ENUM ('child','teen','adult','senior');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;


-- Vision Condition
DO $$
BEGIN
	CREATE TYPE customer_vision_condition AS ENUM ('short','long','none');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create Tables

-- User Table
CREATE TABLE users(
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	username TEXT UNIQUE NOT NULL,
	password TEXT NOT NULL,
	email TEXT UNIQUE NOT NULL,
	role user_role NOT NULL DEFAULT 'staff',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Session Table
CREATE TABLE sessions(
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL,
	refresh_token TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL,
	expired_at TIMESTAMP NOT NULL,
	revoked BOOLEAN NOT NULL
	
	,CONSTRAINT fk_user
		FOREIGN KEY (user_id)
		REFERENCES users(id)
		ON DELETE CASCADE
);


-- Log Table
CREATE TABLE exit_log(
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	title TEXT NOT NULL,
	content TEXT NOT NULL,
	status exit_log_status NOT NULL DEFAULT 'active',
	created_by UUID,
	deleted_by UUID,
	deleted_at TIMESTAMP,
	reviewed_by UUID,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT fk_created_by
		FOREIGN KEY (created_by)
		REFERENCES users(id)
		ON DELETE SET NULL,
		
	CONSTRAINT fk_deleted_by
		FOREIGN KEY (deleted_by)
		REFERENCES users(id)
		ON DELETE SET NULL,
		
	CONSTRAINT fk_reviewed_by
		FOREIGN KEY (reviewed_by)
		REFERENCES users(id)
		ON DELETE SET NULL
);


-- Customer Table
CREATE TABLE customer(
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	age_range customer_age_range,
	mood customer_mood NOT NULL DEFAULT 'neutral',
	vision_condition customer_vision_condition,
	interests TEXT[] DEFAULT {},
	intent_style_only BOOLEAN,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);