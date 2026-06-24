"""Password policy unit tests."""

from app.core.password_policy import PASSWORD_REQUIREMENTS_MSG, validate_password


def test_validate_password_accepts_strong_password():
    assert validate_password("Secret12!") is None


def test_validate_password_rejects_short_password():
    assert validate_password("Ab1!") == "Password must be at least 8 characters."


def test_validate_password_requires_uppercase():
    assert validate_password("secret12!") == "Password must include at least one uppercase letter."


def test_validate_password_requires_lowercase():
    assert validate_password("SECRET12!") == "Password must include at least one lowercase letter."


def test_validate_password_requires_digit():
    assert validate_password("Secret!!!") == "Password must include at least one number."


def test_validate_password_requires_symbol():
    assert validate_password("Secret12") == "Password must include at least one symbol."


def test_password_requirements_message_is_human_readable():
    assert "uppercase" in PASSWORD_REQUIREMENTS_MSG
    assert "symbol" in PASSWORD_REQUIREMENTS_MSG
