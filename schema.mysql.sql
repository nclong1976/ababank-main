-- SQL Schema for MySQL (Hostinger Compatibility)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    pin VARCHAR(10) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_locked TINYINT DEFAULT 0,
    is_topup_locked TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'USD',
    balance DECIMAL(20, 2) DEFAULT 0.00,
    account_no VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id, currency)
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    amount DECIMAL(20, 2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    balance_before DECIMAL(20, 2) NOT NULL,
    balance_after DECIMAL(20, 2) NOT NULL,
    admin_id VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'USD',
    party_name VARCHAR(255),
    party_account_no VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
