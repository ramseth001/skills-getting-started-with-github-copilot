import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module
from src.app import app, activities

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Restore the global activities dict before each test.

    Arrange step for every test: start with a fresh copy of the initial
    in-memory database, then restore it afterward so tests are isolated.
    """
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_root_redirect():
    # Arrange: client already configured
    # Act
    response = client.get("/", follow_redirects=False)
    # Assert
    assert response.status_code == 307
    assert response.headers["location"].endswith("/static/index.html")


def test_get_activities():
    # Arrange
    # Act
    response = client.get("/activities")
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_success():
    # Arrange
    email = "newstudent@mergington.edu"
    activity_name = "Chess Club"
    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    # Assert
    assert response.status_code == 200
    assert email in activities[activity_name]["participants"]


def test_signup_already_signed():
    # Arrange
    email = activities["Chess Club"]["participants"][0]
    activity_name = "Chess Club"
    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_activity_not_found():
    # Arrange
    email = "foo@bar.com"
    activity_name = "Nonexistent"
    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_remove_participant_success():
    # Arrange
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]
    # Act
    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email})
    # Assert
    assert response.status_code == 200
    assert email not in activities[activity_name]["participants"]


def test_remove_participant_not_signed():
    # Arrange
    activity_name = "Chess Club"
    email = "absent@mergington.edu"
    # Act
    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email})
    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student not signed up for this activity"


def test_remove_activity_not_found():
    # Arrange
    email = "foo@bar.com"
    activity_name = "Nope"
    # Act
    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email})
    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
