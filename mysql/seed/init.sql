CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    candidates TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    idcard VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE campaign_user (
    campaign_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    PRIMARY KEY (campaign_id, user_id)
);


INSERT INTO campaigns (title, candidates, start_date, end_date) 
VALUES ('Who’s the best NBA player', '[{"id": 1, "name": "Michael Jordan"}, {"id": 2, "name": "Kobe Bryant"}]', '2019-05-17 00:00:00', '2020-05-17 00:00:00');

INSERT INTO campaigns (title, candidates, start_date, end_date) 
VALUES ('Which HK CEO candidate you are preferred.', '[{"id": 1, "name": "Carrie Lam"}, {"id": 2, "name": "John Tsang"}]', '2019-05-17 00:00:00', '2020-05-17 00:00:00');